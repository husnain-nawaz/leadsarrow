import 'reflect-metadata';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { initDatabaseSchema } from './server/dataSource.ts';
import {
  FILTER_TAXONOMY,
  queryLeadsDatabase,
  batchInsertLeads,
  fetchLeadsByIds
} from './server/leadsData.ts';
import {
  ensureSuperAdminSeed,
  registerJwtUser,
  loginJwtUser,
  loginOrSyncGoogleUser,
  upgradeUserPlan,
  updateSelfProfile,
  getAllUsersForAdmin,
  updateUserByAdmin,
  getAdminStats,
  optionalAuthMiddleware,
  requireJwtMiddleware,
  requireSuperAdminMiddleware,
  decrementUserCreditsInDb
} from './server/auth.ts';
import { antiScraperProtectionMiddleware } from './server/antiScraper.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Real MySQL Schema & Root Superadmin
  try {
    await initDatabaseSchema();
    await ensureSuperAdminSeed();
    console.log('MySQL B2B_database initialized and Superadmin account secured.');
  } catch (err: any) {
    console.error('Failed to initialize MySQL:', err.message);
  }

  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ limit: '500mb', extended: true }));
  app.use(optionalAuthMiddleware);

  // --- AUTHENTICATION API (JWT + Google One-Click Exchange with MySQL) ---
  app.post('/api/auth/register', async (req, res) => {
    try {
      const result = await registerJwtUser(req.body || {}, req);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const result = await loginJwtUser(req.body || {}, req);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message || 'Invalid credentials' });
    }
  });

  app.post('/api/auth/google', async (req, res) => {
    try {
      const result = await loginOrSyncGoogleUser(req.body || {}, req);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Google authentication sync failed' });
    }
  });

  app.get('/api/auth/me', requireJwtMiddleware, (req: any, res) => {
    res.json({ user: req.user });
  });

  app.put('/api/auth/profile', requireJwtMiddleware, async (req: any, res) => {
    try {
      const result = await updateSelfProfile(req.user.id, req.body || {});
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Profile update failed' });
    }
  });

  app.post('/api/auth/upgrade-plan', requireJwtMiddleware, async (req: any, res) => {
    try {
      const { planId } = req.body || {};
      const result = await upgradeUserPlan(req.user.id || req.user.email, planId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Plan upgrade failed' });
    }
  });

  app.post('/api/auth/decrement-credits', requireJwtMiddleware, async (req: any, res) => {
    try {
      const amount = Number(req.body?.amount) || 1;
      const updatedUser = await decrementUserCreditsInDb(req.user.id, amount);
      res.json({ success: true, user: updatedUser });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to decrement credits' });
    }
  });

  // --- REVEALED LEADS PERSISTENCE (Per User Account in DB3) ---
  app.get('/api/leads/revealed', requireJwtMiddleware, async (req: any, res) => {
    try {
      const ds = await (await import('./server/dataSource.ts')).getDataSource();
      const rows = await ds.query(
        'SELECT lead_id FROM user_revealed_leads WHERE user_id = ?',
        [req.user.id]
      );
      const leadIds = (rows || []).map((r: any) => String(r.lead_id));
      res.json({ success: true, leadIds });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch revealed leads' });
    }
  });

  app.post('/api/leads/reveal', requireJwtMiddleware, async (req: any, res) => {
    try {
      const leadId = String(req.body?.leadId || '').trim();
      if (!leadId) {
        return res.status(400).json({ error: 'leadId is required' });
      }

      const ds = await (await import('./server/dataSource.ts')).getDataSource();

      // Check if already revealed by this user
      const existing = await ds.query(
        'SELECT lead_id FROM user_revealed_leads WHERE user_id = ? AND lead_id = ?',
        [req.user.id, leadId]
      );

      let user = req.user;
      const isAlreadyRevealed = existing && existing.length > 0;

      if (!isAlreadyRevealed) {
        // Decrement credit only if first time revealing
        const isUnlimited = user?.planId === 'unlimited' || user?.role === 'superadmin' || user?.isSuperAdmin;
        if (!isUnlimited && (user.creditsRemaining ?? 100) <= 0) {
          return res.status(403).json({ error: 'Insufficient credits remaining. Please upgrade plan.' });
        }

        user = await decrementUserCreditsInDb(req.user.id, 1);
        await ds.query(
          'INSERT IGNORE INTO user_revealed_leads (user_id, lead_id) VALUES (?, ?)',
          [req.user.id, leadId]
        );
      }

      res.json({
        success: true,
        leadId,
        alreadyRevealed: isAlreadyRevealed,
        user
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to reveal lead' });
    }
  });

  // --- SUPERADMIN API (Users, Plans, Payments, Credits & Multi-Channel Ingestion) ---
  app.get('/api/admin/users', requireSuperAdminMiddleware, async (_req: any, res) => {
    try {
      const users = await getAllUsersForAdmin();
      res.json({ users });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/admin/users/:id', requireSuperAdminMiddleware, async (req: any, res) => {
    try {
      const updated = await updateUserByAdmin(req.params.id, req.body || {});
      res.json({ user: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/admin/stats', requireSuperAdminMiddleware, async (_req: any, res) => {
    try {
      const stats = await getAdminStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/leads/batch', requireSuperAdminMiddleware, async (req: any, res) => {
    try {
      const { leads, source, createList, listName } = req.body || {};
      const result = await batchInsertLeads(
        (leads || []).map((l: any) => ({ ...l, source: source || 'superadmin_import' }))
      );

      // If requested or if a batch is imported, also automatically save to a reusable list
      let savedList = null;
      if (createList || listName) {
        try {
          const ds = await (await import('./server/dataSource.ts')).getDataSource();
          const listRepo = ds.getRepository((await import('./server/entities/SavedList.ts')).SavedList);
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

  app.get('/api/admin/leads/upload-progress/:jobId', requireSuperAdminMiddleware, (req: any, res) => {
    const job = activeIngestionJobs.get(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: 'Ingestion task not found' });
    }
    res.json(job);
  });

  app.post('/api/admin/leads/upload-cancel/:jobId', requireSuperAdminMiddleware, (req: any, res) => {
    const job = activeIngestionJobs.get(req.params.jobId);
    if (job) {
      job.cancelRequested = true;
      job.status = 'cancelled';
      return res.json({ success: true, message: 'Ingestion cancellation requested.' });
    }
    res.status(404).json({ error: 'Task not found' });
  });

  app.post('/api/admin/leads/upload-stream', requireSuperAdminMiddleware, async (req: any, res) => {
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
            // Strip any null bytes or unprintable control codes
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
            // Check if buffer contains null bytes (binary corruption)
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
              const ds = await (await import('./server/dataSource.ts')).getDataSource();
              const listRepo = ds.getRepository((await import('./server/entities/SavedList.ts')).SavedList);
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

  // --- B2B LEADS DATABASE & FACETED SEARCH API ---
  app.get('/api/leads/taxonomy', (_req, res) => {
    res.json(FILTER_TAXONOMY);
  });

  // Cached random preview for landing page (rotates every 30 minutes, keyed per client IP, limit 20)
  const landingPreviewCache = new Map<string, { timestamp: number; leads: any[] }>();

  app.get('/api/leads/landing-preview', async (req, res) => {
    try {
      const clientIp = String(
        req.headers['x-forwarded-for'] ||
        req.headers['x-real-ip'] ||
        req.socket.remoteAddress ||
        'unknown'
      ).split(',')[0].trim();

      const now = Date.now();
      const THIRTY_MINUTES_MS = 30 * 60 * 1000;
      const cached = landingPreviewCache.get(clientIp);

      if (cached && (now - cached.timestamp < THIRTY_MINUTES_MS)) {
        return res.json({
          leads: cached.leads,
          clientIp,
          nextRotationInMs: THIRTY_MINUTES_MS - (now - cached.timestamp)
        });
      }

      // Pick a random offset within 4,000,000 records from one of the active sharded databases
      const randOffset = Math.floor(Math.random() * 3000000);
      const ds = await (await import('./server/dataSource.ts')).getTertiaryDataSource();
      const rawLeads: any[] = await ds.query(
        `SELECT id, company_name, domain, industry, employee_range,
                annual_revenue_usd, revenue_range, country, city,
                contact_name, contact_title, contact_email, contact_phone,
                buying_intent_score, verification_status
         FROM leads 
         WHERE contact_email IS NOT NULL AND company_name IS NOT NULL
         LIMIT 20 OFFSET ?`,
        [randOffset]
      );

      const formatted = (rawLeads || []).map((l: any) => ({
        id: l.id,
        companyName: l.company_name,
        domain: l.domain,
        industry: l.industry || 'Business Services',
        employeeRange: l.employee_range || '51-200',
        contactName: l.contact_name || 'Executive Contact',
        contactTitle: l.contact_title || 'Director of Operations',
        contactEmail: l.contact_email,
        contactPhone: l.contact_phone,
        buyingIntentScore: Number(l.buying_intent_score) || 88,
        verificationStatus: l.verification_status || 'Verified'
      }));

      landingPreviewCache.set(clientIp, {
        timestamp: now,
        leads: formatted
      });

      // Periodic garbage collection to keep cache lean
      if (landingPreviewCache.size > 10000) {
        for (const [ip, entry] of landingPreviewCache.entries()) {
          if (now - entry.timestamp > THIRTY_MINUTES_MS) {
            landingPreviewCache.delete(ip);
          }
        }
      }

      res.json({
        leads: formatted,
        clientIp,
        nextRotationInMs: THIRTY_MINUTES_MS
      });
    } catch (err: any) {
      console.error('Landing preview error:', err.message);
      res.status(500).json({ error: 'Failed to fetch preview leads' });
    }
  });

  app.get('/api/leads', async (req: any, res) => {
    const tStart = Date.now();
    try {
      const userId = req.user?.id ? String(req.user.id) : null;
      const result = await queryLeadsDatabase(req.query, userId);
      const elapsed = Date.now() - tStart;
      console.log(`[QUERY MONITOR] ${elapsed}ms | Filters: ${JSON.stringify(req.query)}`);
      res.json(result);
    } catch (error: any) {
      const elapsed = Date.now() - tStart;
      console.error(`[QUERY MONITOR ERROR] ${elapsed}ms:`, error);
      res.status(500).json({ error: 'Failed to execute B2B database query' });
    }
  });

  app.post('/api/leads/by-ids', antiScraperProtectionMiddleware, async (req, res) => {
    try {
      const { ids } = req.body || {};
      const leads = await fetchLeadsByIds(ids || []);
      res.json({ leads });
    } catch (err: any) {
      console.error('Error fetching leads by IDs:', err);
      res.status(500).json({ error: 'Failed to fetch leads by IDs' });
    }
  });

  // --- USER-PRIVATE CUSTOM LEADS (Stored Isolated in Database 4 - Never touching Core 10.3M Leads) ---
  app.get('/api/leads/custom', requireJwtMiddleware, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required to view your custom leads.' });
      }

      const q = String(req.query.q || '').trim();
      const ds = await (await import('./server/dataSource.ts')).getDataSource();

      let whereClause = 'WHERE user_id = ?';
      const sqlParams: any[] = [userId];

      if (q) {
        whereClause += ' AND (company_name LIKE ? OR contact_name LIKE ? OR domain LIKE ? OR contact_email LIKE ?)';
        sqlParams.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
      }

      const countRows: any = await ds.query(
        `SELECT COUNT(*) as total FROM custom_leads ${whereClause}`,
        sqlParams
      );
      const total = Number(countRows[0]?.total || 0);

      const rawRows: any = await ds.query(
        `SELECT * FROM custom_leads ${whereClause} ORDER BY created_at DESC`,
        sqlParams
      );

      const leads = (rawRows || []).map((row: any) => ({
        id: row.id,
        companyName: row.company_name,
        domain: row.domain,
        industry: row.industry,
        employeeRange: row.employee_range,
        employeeCount: Number(row.employee_count) || 120,
        revenueRange: row.revenue_range,
        annualRevenueUsd: Number(row.annual_revenue_usd) || 24000000,
        country: row.country,
        city: row.city,
        contactName: row.contact_name,
        contactTitle: row.contact_title,
        seniority: row.seniority,
        department: row.department,
        contactEmail: row.contact_email,
        contactPhone: row.contact_phone,
        linkedinUrl: row.linkedin_url || '',
        verificationStatus: row.verification_status || 'Verified',
        fundingStage: row.funding_stage || 'Series B',
        buyingIntentScore: Number(row.buying_intent_score) || 88,
        foundedYear: Number(row.founded_year) || 2021,
        hasDirectPhone: Boolean(row.has_direct_phone),
        isCustom: true,
        source: row.source || 'manual_custom_lead',
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
      }));

      res.json({
        leads,
        total,
        owner: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email
        }
      });
    } catch (err: any) {
      console.error('Failed to fetch private custom leads:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch custom leads' });
    }
  });

  app.post('/api/leads/custom', requireJwtMiddleware, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required to create custom leads.' });
      }
      const body = req.body || {};
      const ds = await (await import('./server/dataSource.ts')).getDataSource();
      
      const customId = body.id || `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const safeTrim = (v: any, maxLen: number, fallback = '') => {
        if (v === null || v === undefined) return fallback.slice(0, maxLen);
        const s = String(v).replace(/\0/g, '').trim();
        return (s || fallback).slice(0, maxLen);
      };

      const techStackJson = JSON.stringify(
        Array.isArray(body.techStack)
          ? body.techStack
          : String(body.techStack || 'AWS, Salesforce').split(/[,;|]/).map((s: string) => s.trim()).filter(Boolean)
      );

      // Isolated write into Database 4 custom_leads table only - core leads are 100% untouched
      await ds.query(
        `INSERT INTO custom_leads (
          id, user_id, company_name, domain, industry, employee_range, employee_count,
          revenue_range, annual_revenue_usd, country, city, contact_name, contact_title,
          seniority, department, contact_email, contact_phone, linkedin_url,
          verification_status, funding_stage, tech_stack, buying_intent_score,
          founded_year, has_direct_phone, source, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          customId,
          userId,
          safeTrim(body.companyName, 255, 'My Custom Business'),
          safeTrim(body.domain, 255, 'business.io'),
          safeTrim(body.industry, 255, 'Enterprise Software & SaaS'),
          safeTrim(body.employeeRange, 100, '51-200'),
          Number(body.employeeCount) || 120,
          safeTrim(body.revenueRange, 100, '$10M - $50M'),
          Number(body.annualRevenueUsd) || 24000000,
          safeTrim(body.country, 100, 'United States'),
          safeTrim(body.city, 255, 'San Francisco, CA'),
          safeTrim(body.contactName, 255, 'Executive Contact'),
          safeTrim(body.contactTitle, 255, 'VP of Operations'),
          safeTrim(body.seniority, 100, 'VP'),
          safeTrim(body.department, 100, 'Operations & Supply Chain'),
          safeTrim(body.contactEmail, 255, 'contact@business.io'),
          safeTrim(body.contactPhone, 100, '+1 (415) 555-0142'),
          safeTrim(body.linkedinUrl, 500, ''),
          safeTrim(body.verificationStatus, 50, 'Verified'),
          safeTrim(body.fundingStage, 100, 'Series B'),
          techStackJson,
          Number(body.buyingIntentScore) || 88,
          Number(body.foundedYear) || 2021,
          body.hasDirectPhone !== undefined ? (body.hasDirectPhone ? 1 : 0) : 1,
          'manual_custom_lead'
        ]
      );

      res.status(201).json({
        success: true,
        lead: {
          id: customId,
          companyName: body.companyName,
          domain: body.domain,
          contactName: body.contactName,
          contactEmail: body.contactEmail,
          isCustom: true
        },
        message: 'Custom lead added to your private workspace.'
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Could not add custom lead' });
    }
  });

  // --- DELETE USER-PRIVATE CUSTOM LEAD (Strictly restricted to own custom leads; Core leads are immune) ---
  app.delete('/api/leads/custom/:id', requireJwtMiddleware, async (req: any, res) => {
    try {
      const targetId = req.params.id;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const ds = await (await import('./server/dataSource.ts')).getDataSource();
      
      // STRICT SECURITY: Only delete from custom_leads WHERE user_id = req.user.id!
      // Core leads table (10,363,423 records) is strictly protected and cannot be deleted or modified!
      const result: any = await ds.query(
        'DELETE FROM custom_leads WHERE id = ? AND user_id = ?',
        [targetId, userId]
      );

      const deleted = (result?.affectedRows || 0) > 0;
      res.json({ deleted, id: targetId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- SAVED LEAD LISTS API (Routed to Database 3 with Full Read/Write Privileges) ---
  app.get('/api/lists', async (req: any, res) => {
    try {
      const ds = await (await import('./server/dataSource.ts')).getDataSource();
      const listRepo = ds.getRepository((await import('./server/entities/SavedList.ts')).SavedList);
      const userId = req.user?.id || req.user?.email ? String(req.user.id || req.user.email) : null;
      
      let lists = [];
      if (userId) {
        lists = await listRepo
          .createQueryBuilder('list')
          .where('list.userId = :userId OR list.userId IS NULL', { userId })
          .orderBy('list.createdAt', 'DESC')
          .getMany();
      } else {
        lists = await listRepo.find({
          order: { createdAt: 'DESC' },
          take: 100
        });
      }

      res.json({
        lists: lists.map((l) => ({
          id: l.id,
          name: l.name,
          description: l.description,
          leadIds: Array.isArray(l.leadIds) ? l.leadIds : (typeof l.leadIds === 'string' ? JSON.parse(l.leadIds || '[]') : []),
          filterSummary: l.filterSummary,
          leadCount: l.leadCount,
          createdAt: l.createdAt,
          updatedAt: l.updatedAt
        }))
      });
    } catch (err: any) {
      console.error('Failed to get saved lists:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch saved lists' });
    }
  });

  app.post('/api/lists', async (req: any, res) => {
    try {
      const body = req.body || {};
      const name = String(body.name || '').trim();
      if (!name) {
        return res.status(400).json({ error: 'List name is required' });
      }

      const ds = await (await import('./server/dataSource.ts')).getDataSource();
      const listRepo = ds.getRepository((await import('./server/entities/SavedList.ts')).SavedList);
      
      const leadIds = Array.isArray(body.leadIds) ? body.leadIds : [];
      const listId = body.id && /^[a-zA-Z0-9_\-]+$/.test(body.id)
        ? body.id
        : `list_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const userId = req.user?.id || req.user?.email ? String(req.user.id || req.user.email) : null;

      const newList = listRepo.create({
        id: listId,
        userId,
        name,
        description: body.description ? String(body.description).trim() : null,
        leadIds,
        filterSummary: body.filterSummary ? String(body.filterSummary).trim() : 'Custom Selected B2B Leads',
        leadCount: leadIds.length || Number(body.leadCount) || 0
      });

      const saved = await listRepo.save(newList);
      res.status(201).json({
        success: true,
        list: {
          id: saved.id,
          name: saved.name,
          description: saved.description,
          leadIds: saved.leadIds || [],
          filterSummary: saved.filterSummary,
          leadCount: saved.leadCount,
          createdAt: saved.createdAt,
          updatedAt: saved.updatedAt
        }
      });
    } catch (err: any) {
      console.error('Failed to save list:', err);
      res.status(500).json({ error: err.message || 'Failed to save list' });
    }
  });

  app.delete('/api/lists/:id', async (req: any, res) => {
    try {
      const ds = await (await import('./server/dataSource.ts')).getDataSource();
      const listRepo = ds.getRepository((await import('./server/entities/SavedList.ts')).SavedList);
      await listRepo.delete(req.params.id);
      res.json({ success: true, deleted: true, id: req.params.id });
    } catch (err: any) {
      console.error('Failed to delete list:', err);
      res.status(500).json({ error: err.message || 'Failed to delete list' });
    }
  });

  // Vite middleware for development or static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LeadsArrow B2B Intelligence Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
