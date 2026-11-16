import { Router } from 'express';
import {
  requireSuperAdminMiddleware,
  getAllUsersForAdmin,
  updateUserByAdmin,
  getAdminStats
} from '../auth.ts';
import { getDataSource, getLeadsDataSource } from '../dataSource.ts';
import { batchInsertLeads, invalidateGlobalMetricsCache } from '../leadsData.ts';
import { SavedList } from '../entities/SavedList.ts';
import { Lead } from '../entities/Lead.ts';

const router = Router();

// --- SUPERADMIN API (Users, Plans, Payments, Credits & Multi-Channel Ingestion) ---
router.get('/users', requireSuperAdminMiddleware, async (_req: any, res) => {
  try {
    const users = await getAllUsersForAdmin();
    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id', requireSuperAdminMiddleware, async (req: any, res) => {
  try {
    const updated = await updateUserByAdmin(req.params.id, req.body || {});
    res.json({ user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/stats', requireSuperAdminMiddleware, async (_req: any, res) => {
  try {
    const stats = await getAdminStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/leads/batch', requireSuperAdminMiddleware, async (req: any, res) => {
  try {
    const { leads, source, createList, listName } = req.body || {};
    const result = await batchInsertLeads(
      (leads || []).map((l: any) => ({ ...l, source: source || 'superadmin_import' }))
    );

    // If requested or if a batch is imported, also automatically save to a reusable list
    let savedList = null;
    if (createList || listName) {
      try {
        const ds = await getDataSource();
        const listRepo = ds.getRepository(SavedList);
        const name = String(listName || `Imported List (${new Date().toLocaleDateString()})`).trim();
        const targetIds = (leads || []).map((l: any) => l.id).filter(Boolean);
        
        const newList = listRepo.create({
          id: `list_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          userId: req.user?.id ? String(req.user.id) : null,
          name,
          description: `Imported via ${source || 'spreadsheet'} on ${new Date().toLocaleString()}`,
          leadIds: targetIds,
          filterSummary: `${result.insertedCount.toLocaleString()} Imported B2B Accounts`,
          leadCount: result.insertedCount
        });
        savedList = await listRepo.save(newList);
      } catch (listErr) {
        console.warn('Could not auto-create list for imported leads:', listErr);
      }
    }

    res.status(201).json({ ...result, list: savedList });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE CORE DATABASE LEAD (Superadmin Only - permanently deletes from main database)
router.delete('/leads/:id', requireSuperAdminMiddleware, async (req: any, res) => {
  try {
    const targetId = req.params.id;
    if (!targetId) {
      return res.status(400).json({ error: 'Lead ID required' });
    }

    const ds2 = await getLeadsDataSource();
    const leadRepo = ds2.getRepository(Lead);

    const existing = await leadRepo.findOne({ where: { id: targetId } });
    if (!existing) {
      // Also clean from custom_leads in DB1 just in case
      const ds1 = await getDataSource();
      await ds1.query('DELETE FROM custom_leads WHERE id = ?', [targetId]).catch(() => {});
      return res.json({
        success: true,
        deleted: true,
        id: targetId,
        message: 'Lead was not found in core database or was already removed.'
      });
    }

    // PERMANENT DELETION: Delete from main database leads table
    await leadRepo.delete(targetId);

    // Clean up reference in any user's saved lists
    try {
      const ds3 = await getDataSource();
      await ds3.query(
        `UPDATE saved_lists 
         SET lead_ids = JSON_REMOVE(lead_ids, JSON_UNQUOTE(JSON_SEARCH(lead_ids, 'one', ?))),
             lead_count = GREATEST(0, lead_count - 1)
         WHERE JSON_SEARCH(lead_ids, 'one', ?) IS NOT NULL`,
        [targetId, targetId]
      ).catch(() => {});
    } catch (listErr) {
      console.warn('Saved lists cleanup warning:', listErr);
    }

    // Invalidate platform metrics cache so platform-wide counts reflect deletion immediately
    try {
      if (typeof invalidateGlobalMetricsCache === 'function') {
        invalidateGlobalMetricsCache();
      }
    } catch {}

    console.log(`[CORE DATABASE DELETION] Superadmin (${req.user?.email || 'superadmin'}) permanently deleted core lead: ${targetId} (${existing.companyName}). Reflected across all accounts.`);

    res.json({
      success: true,
      deleted: true,
      id: targetId,
      companyName: existing.companyName,
      message: 'Lead permanently deleted from the core database. This change is reflected platform-wide for all accounts.'
    });
  } catch (err: any) {
    console.error('Failed to delete core database lead:', err);
    res.status(500).json({ error: err.message || 'Failed to delete core database lead' });
  }
});

// Track asynchronous high-capacity sheet ingestion progress & cancellation
const activeIngestionJobs = new Map<string, {
  jobId: string;
  fileName: string;
  status: 'parsing' | 'ingesting' | 'completed' | 'cancelled' | 'error';
  processedRows: number;
  totalRows: number;
  percent: number;
  insertedCount: number;
  error?: string;
  list?: any;
  cancelRequested?: boolean;
  startTime: number;
}>();

router.get('/leads/upload-progress/:jobId', requireSuperAdminMiddleware, (req: any, res) => {
  const job = activeIngestionJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Ingestion task not found' });
  }
  res.json(job);
});

router.post('/leads/upload-cancel/:jobId', requireSuperAdminMiddleware, (req: any, res) => {
  const job = activeIngestionJobs.get(req.params.jobId);
  if (job) {
    job.cancelRequested = true;
    job.status = 'cancelled';
    return res.json({ success: true, message: 'Ingestion cancellation requested.' });
  }
  res.status(404).json({ error: 'Task not found' });
});

router.post('/leads/upload-stream', requireSuperAdminMiddleware, async (req: any, res) => {
  try {
    const { fileName, fileBase64, createList, listName } = req.body || {};
    if (!fileBase64) {
      return res.status(400).json({ error: 'No file data received' });
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const job = {
      jobId,
      fileName: fileName || 'spreadsheet.xlsx',
      status: 'parsing' as const,
      processedRows: 0,
      totalRows: 0,
      percent: 0,
      insertedCount: 0,
      startTime: Date.now()
    };
    activeIngestionJobs.set(jobId, job);

    // Return jobId immediately so user can multitask, view live progress percentage, or cancel
    res.status(202).json({
      success: true,
      jobId,
      message: 'Ingestion started in background. You can continue working in other tabs.'
    });

    // Background asynchronous execution
    (async () => {
      try {
        console.log(`[FILE STREAM INGESTION ${jobId}] Processing: ${fileName}...`);
        let pureBase64 = fileBase64;
        const commaIdx = fileBase64.indexOf(',');
        if (commaIdx !== -1 && commaIdx < 100) {
          pureBase64 = fileBase64.slice(commaIdx + 1);
        }
        const buffer = Buffer.from(pureBase64, 'base64');

        const clean = (val: any) => {
          if (val === null || val === undefined) return '';
          let s = String(val).trim().replace(/^["']|["']$/g, '');
          s = s.replace(/\0/g, '').trim();
          return s;
        };
        const cleanField = (val: any, maxLen: number, fallback = '') => {
          const s = clean(val);
          if (!s) return fallback.slice(0, maxLen);
          return s.slice(0, maxLen);
        };
        const rowsToInsert: any[] = [];

        // Detect if file is truly a zip/xlsx archive by header magic bytes (PK\x03\x04)
        const isZipArchive = buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4B;
        const isExcel = isZipArchive || String(fileName || '').endsWith('.xlsx') || String(fileName || '').endsWith('.xls');

        if (isExcel) {
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(buffer, {
            type: 'buffer',
            cellFormula: false,
            cellHTML: false,
            cellText: false
          });

          // Find first sheet that contains data
          let activeSheet: any = null;
          for (const name of workbook.SheetNames) {
            const sheet = workbook.Sheets[name];
            if (sheet && sheet['!ref']) {
              activeSheet = sheet;
              break;
            }
          }
          if (!activeSheet) {
            activeSheet = workbook.Sheets[workbook.SheetNames[0]];
          }

          const rawMatrix: any[][] = XLSX.utils.sheet_to_json(activeSheet, { header: 1, defval: '' });
          if (rawMatrix.length < 2) {
            throw new Error('Spreadsheet does not contain data rows or headers.');
          }

          const rawHeaders = (rawMatrix[0] || []).map((h) => clean(h).toLowerCase());
          job.totalRows = rawMatrix.length - 1;
          job.status = 'ingesting';

          for (let r = 1; r < rawMatrix.length; r++) {
            if (job.cancelRequested) {
              console.log(`[INGESTION ${jobId}] Ingestion cancelled by user at row ${r}`);
              job.status = 'cancelled';
              return;
            }

            const rowArr = rawMatrix[r] || [];
            const rowObj: any = {};
            for (let col = 0; col < rawHeaders.length; col++) {
              const key = rawHeaders[col];
              if (key) rowObj[key] = clean(rowArr[col]);
            }

            const company = cleanField(
              rowObj.company || rowObj.companyname || rowObj['company name'] ||
              rowObj.organization || rowObj.business || rowObj.account ||
              rowArr[0],
              255,
              `Enterprise #${r}`
            );
            const domain = cleanField(
              rowObj.domain || rowObj.website || rowObj.url || rowObj['website domain'],
              255,
              (company ? `${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` : 'company.io')
            );
            const industry = cleanField(rowObj.industry || rowObj.sector || rowObj.category, 128, 'Business Services');
            const contactName = cleanField(
              rowObj.name || rowObj.contact || rowObj.contactname || rowObj['contact name'] ||
              (rowObj['first name'] ? `${clean(rowObj['first name'])} ${clean(rowObj['last name'] || '')}`.trim() : ''),
              255,
              'Executive Decision Maker'
            );
            const contactTitle = cleanField(rowObj.title || rowObj.jobtitle || rowObj['job title'] || rowObj.role, 255, 'Director of Operations');
            const contactEmail = cleanField(rowObj.email || rowObj.workemail || rowObj['contact email'] || rowObj['work email'], 255, `contact_${r}@${domain}`);
            const contactPhone = cleanField(rowObj.phone || rowObj.mobile || rowObj.directphone || rowObj['direct phone'], 64, '+1 (555) 019-3829');

            rowsToInsert.push({
              companyName: company,
              domain,
              industry,
              contactName,
              contactTitle,
              contactEmail,
              contactPhone,
              country: cleanField(rowObj.country || rowObj.nation, 128, 'USA'),
              city: cleanField(rowObj.city || rowObj.location, 128, 'San Francisco, CA'),
              employeeRange: cleanField(rowObj.employees || rowObj.employeerange || rowObj['employee range'], 64, '51-200'),
              employeeCount: Number(clean(rowObj.employeecount || rowObj['employee count'] || rowObj.size)) || 150,
              revenueRange: cleanField(rowObj.revenue || rowObj.revenuerange || rowObj['revenue range'], 64, '$10M - $50M'),
              annualRevenueUsd: Number(clean(rowObj.annualrevenue || rowObj['annual revenue'])) || 25000000,
              fundingStage: cleanField(rowObj.funding || rowObj.fundingstage, 64, 'Series B'),
              buyingIntentScore: Number(clean(rowObj.intent || rowObj.intentscore)) || 90,
              techStack: ['AWS', 'Salesforce']
            });
          }
        } else {
          // Text / CSV parsing
          let isBinary = false;
          for (let b = 0; b < Math.min(100, buffer.length); b++) {
            if (buffer[b] === 0) {
              isBinary = true;
              break;
            }
          }
          if (isBinary) {
            throw new Error('Uploaded CSV file appears to be binary or corrupted. If this was an Excel (.xlsx) file renamed to .csv, please keep the original .xlsx extension.');
          }

          const textContent = buffer.toString('utf8');
          const lines = textContent.split(/\r?\n/).filter(Boolean);
          if (lines.length < 2) {
            throw new Error('CSV file does not contain enough rows.');
          }
          const delimiter = lines[0].includes('\t') ? '\t' : ',';
          const headers = lines[0].split(delimiter).map((h) => clean(h).toLowerCase());
          job.totalRows = lines.length - 1;
          job.status = 'ingesting';

          for (let i = 1; i < lines.length; i++) {
            if (job.cancelRequested) {
              job.status = 'cancelled';
              return;
            }
            const cols = lines[i].split(delimiter);
            const rowObj: any = {};
            headers.forEach((h, idx) => {
              rowObj[h] = clean(cols[idx]);
            });

            const company = cleanField(rowObj.company || rowObj.companyname || cols[0], 255, `Enterprise #${i}`);
            const domain = cleanField(rowObj.domain || rowObj.website, 255, 'company.io');
            rowsToInsert.push({
              companyName: company,
              domain,
              industry: cleanField(rowObj.industry, 128, 'Business Services'),
              contactName: cleanField(rowObj.name || rowObj.contact, 255, 'Executive Decision Maker'),
              contactTitle: cleanField(rowObj.title, 255, 'Director of Operations'),
              contactEmail: cleanField(rowObj.email, 255, `contact_${i}@${domain}`),
              contactPhone: cleanField(rowObj.phone, 64, '+1 (555) 019-3829'),
              country: cleanField(rowObj.country, 128, 'USA'),
              city: cleanField(rowObj.city, 128, 'San Francisco, CA'),
              employeeRange: cleanField(rowObj.employees, 64, '51-200'),
              revenueRange: cleanField(rowObj.revenue, 64, '$10M - $50M'),
              fundingStage: 'Series B',
              buyingIntentScore: 88,
              techStack: ['AWS', 'Salesforce']
            });
          }
        }

        if (rowsToInsert.length === 0) {
          throw new Error('Zero valid lead records found in uploaded file.');
        }

        console.log(`[INGESTION ${jobId}] Inserting ${rowsToInsert.length.toLocaleString()} leads in chunks to MySQL...`);

        // Chunked streaming insertion with live percentage updates
        const CHUNK = 1000;
        let totalInserted = 0;
        for (let c = 0; c < rowsToInsert.length; c += CHUNK) {
          if (job.cancelRequested) {
            job.status = 'cancelled';
            console.log(`[INGESTION ${jobId}] Aborted during SQL insertion.`);
            return;
          }

          const currentChunk = rowsToInsert.slice(c, c + CHUNK);
          const resBatch = await batchInsertLeads(
            currentChunk.map((l) => ({ ...l, source: fileName || 'spreadsheet' }))
          );
          totalInserted += resBatch.insertedCount;
          job.processedRows = Math.min(job.totalRows, c + currentChunk.length);
          job.insertedCount = totalInserted;
          job.percent = Math.min(100, Math.round((job.processedRows / job.totalRows) * 100));
        }

        // Optional Auto-Save to Reusable List in MySQL
        let savedList = null;
        if (createList || listName) {
          try {
            const ds = await getDataSource();
            const listRepo = ds.getRepository(SavedList);
            const name = String(listName || fileName?.replace(/\.[^/.]+$/, '') || `Imported List (${new Date().toLocaleDateString()})`).trim();
            const targetIds = rowsToInsert.map((l) => l.id).filter(Boolean);

            const newList = listRepo.create({
              id: `list_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              userId: req.user?.id ? String(req.user.id) : null,
              name,
              description: `Imported from ${fileName || 'spreadsheet'} (${totalInserted.toLocaleString()} leads)`,
              leadIds: targetIds,
              filterSummary: `${totalInserted.toLocaleString()} Leads from ${fileName || 'File'}`,
              leadCount: totalInserted
            });
            savedList = await listRepo.save(newList);
            job.list = savedList;
          } catch (listErr) {
            console.warn('Could not auto-create list for imported leads:', listErr);
          }
        }

        job.status = 'completed';
        job.percent = 100;
        console.log(`[INGESTION ${jobId}] Finished successfully! ${totalInserted.toLocaleString()} records committed to MySQL.`);
      } catch (err: any) {
        console.error(`[INGESTION ${jobId}] Failed:`, err);
        job.status = 'error';
        job.error = err.message || 'Processing failed';
      }
    })();
  } catch (err: any) {
    console.error('File stream ingestion error:', err);
    res.status(500).json({ error: err.message || 'Server failed to process high-capacity file upload' });
  }
});

export default router;
