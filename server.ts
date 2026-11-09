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

  app.post('/api/admin/leads/upload-stream', requireSuperAdminMiddleware, async (req: any, res) => {
    try {
      const { fileName, fileBase64, createList, listName } = req.body || {};
      if (!fileBase64) {
        return res.status(400).json({ error: 'No file data received' });
      }

      console.log(`[FILE STREAM INGESTION] Processing: ${fileName || 'spreadsheet'}...`);
      const buffer = Buffer.from(fileBase64, 'base64');
      const isExcel = String(fileName || '').endsWith('.xlsx') || String(fileName || '').endsWith('.xls');

      const leadsToInsert: any[] = [];
      const clean = (val: any) => String(val ?? '').trim().replace(/^["']|["']$/g, '');

      if (isExcel) {
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const company = clean(row.company || row.companyname || row['company name'] || row.organization || row.business || row.account || `Enterprise Co #${i + 1}`);
          const domain = clean(row.domain || row.website || row.url || `${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`);
          const industry = clean(row.industry || row.sector || row.category || 'Enterprise Software & SaaS');
          const contactName = clean(row.name || row.contact || row.contactname || row['contact name'] || row.executive || row['decision maker'] || 'Executive Decision Maker');
          const contactTitle = clean(row.title || row.jobtitle || row['job title'] || row.role || 'Director of Operations');
          const contactEmail = clean(row.email || row.workemail || row['contact email'] || row['work email'] || `contact_${i + 1}@${domain}`);
          const contactPhone = clean(row.phone || row.mobile || row.directphone || row['direct phone'] || row.telephone || '+1 (555) 019-3829');

          leadsToInsert.push({
            companyName: company,
            domain,
            industry,
            contactName,
            contactTitle,
            contactEmail,
            contactPhone,
            country: clean(row.country || row.nation || 'United States'),
            city: clean(row.city || row.location || 'San Francisco, CA'),
            employeeRange: clean(row.employees || row.employeerange || row['employee range'] || row.headcount || '51-200'),
            employeeCount: Number(clean(row.employeecount || row['employee count'] || row.size)) || 150,
            revenueRange: clean(row.revenue || row.revenuerange || row['revenue range'] || '$10M - $50M'),
            annualRevenueUsd: Number(clean(row.annualrevenue || row['annual revenue'])) || 25000000,
            fundingStage: clean(row.funding || row.fundingstage || row['funding stage'] || 'Series B'),
            buyingIntentScore: Number(clean(row.intent || row.intentscore || row['intent score'])) || Math.floor(Math.random() * 20 + 80),
            techStack: clean(row.tech || row.techstack || row['tech stack'] || row.technologies || 'AWS, Salesforce').split(/[,;|]/).map((s: string) => s.trim()).filter(Boolean)
          });
        }
      } else {
        // Plain text CSV / TSV streaming parser
        const textContent = buffer.toString('utf8');
        const lines = textContent.split(/\r?\n/).filter(Boolean);
        if (lines.length > 1) {
          const delimiter = lines[0].includes('\t') ? '\t' : ',';
          const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

          for (let i = 1; i < lines.length; i++) {
            const rawCols = lines[i].split(delimiter);
            const row: any = {};
            headers.forEach((h, idx) => {
              row[h] = (rawCols[idx] || '').trim().replace(/^["']|["']$/g, '');
            });

            const company = clean(row.company || row.companyname || row['company name'] || row.organization || `Enterprise Co #${i}`);
            const domain = clean(row.domain || row.website || row.url || 'company.io');
            leadsToInsert.push({
              companyName: company,
              domain,
              industry: clean(row.industry || row.sector || 'Enterprise Software & SaaS'),
              contactName: clean(row.name || row.contact || row.contactname || 'Executive Decision Maker'),
              contactTitle: clean(row.title || row.jobtitle || 'Director of Operations'),
              contactEmail: clean(row.email || row.workemail || `contact_${i}@${domain}`),
              contactPhone: clean(row.phone || row.mobile || '+1 (555) 019-3829'),
              country: clean(row.country || 'United States'),
              city: clean(row.city || 'San Francisco, CA'),
              employeeRange: clean(row.employees || row.employeerange || '51-200'),
              revenueRange: clean(row.revenue || row.revenuerange || '$10M - $50M'),
              fundingStage: clean(row.funding || 'Series B'),
              buyingIntentScore: Number(row.intent) || 88,
              techStack: ['AWS', 'Salesforce']
            });
          }
        }
      }

      console.log(`[FILE STREAM INGESTION] Ingesting ${leadsToInsert.length.toLocaleString()} leads to MySQL...`);
      const result = await batchInsertLeads(
        leadsToInsert.map((l) => ({ ...l, source: fileName || 'server_stream_upload' }))
      );

      let savedList = null;
      if (createList || listName) {
        try {
          const ds = await (await import('./server/dataSource.ts')).getDataSource();
          const listRepo = ds.getRepository((await import('./server/entities/SavedList.ts')).SavedList);
          const name = String(listName || fileName?.replace(/\.[^/.]+$/, '') || `Imported List (${new Date().toLocaleDateString()})`).trim();
          const targetIds = leadsToInsert.map((l) => l.id).filter(Boolean);

          const newList = listRepo.create({
            id: `list_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            userId: req.user?.id ? String(req.user.id) : null,
            name,
            description: `Imported from ${fileName || 'spreadsheet'} (${result.insertedCount.toLocaleString()} leads)`,
            leadIds: targetIds,
            filterSummary: `${result.insertedCount.toLocaleString()} Leads from ${fileName || 'File'}`,
            leadCount: result.insertedCount
          });
          savedList = await listRepo.save(newList);
        } catch (listErr) {
          console.warn('Could not auto-create list for imported leads:', listErr);
        }
      }

      res.status(201).json({
        success: true,
        insertedCount: result.insertedCount,
        totalRecords: result.totalRecords,
        list: savedList
      });
    } catch (err: any) {
      console.error('File stream ingestion error:', err);
      res.status(500).json({ error: err.message || 'Server failed to process high-capacity file upload' });
    }
  });

  // --- B2B LEADS DATABASE & FACETED SEARCH API ---
  app.get('/api/leads/taxonomy', (_req, res) => {
    res.json(FILTER_TAXONOMY);
  });

  app.get('/api/leads', async (req, res) => {
    const tStart = Date.now();
    try {
      const result = await queryLeadsDatabase(req.query);
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

  app.post('/api/leads/custom', requireSuperAdminMiddleware, async (req: any, res) => {
    try {
      const body = req.body || {};
      const result = await batchInsertLeads([{
        id: body.id || `custom_${Date.now()}`,
        companyName: String(body.companyName || 'Untitled Business').trim(),
        domain: String(body.domain || 'company.io').trim(),
        industry: String(body.industry || 'Enterprise Software & SaaS').trim(),
        employeeRange: String(body.employeeRange || '51-200').trim(),
        employeeCount: Number(body.employeeCount) || 120,
        revenueRange: String(body.revenueRange || '$10M - $50M').trim(),
        annualRevenueUsd: Number(body.annualRevenueUsd) || 24000000,
        country: String(body.country || 'United States').trim(),
        city: String(body.city || 'San Francisco, CA').trim(),
        contactName: String(body.contactName || 'Executive Contact').trim(),
        contactTitle: String(body.contactTitle || 'VP of Operations').trim(),
        seniority: String(body.seniority || 'VP').trim(),
        department: String(body.department || 'Operations & Supply Chain').trim(),
        contactEmail: String(body.contactEmail || 'contact@company.io').trim(),
        contactPhone: String(body.contactPhone || '+1 (415) 555-0142').trim(),
        verificationStatus: body.verificationStatus || 'Verified',
        fundingStage: body.fundingStage || 'Series B',
        techStack: Array.isArray(body.techStack)
          ? body.techStack
          : String(body.techStack || 'AWS, Salesforce')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
        buyingIntentScore: Number(body.buyingIntentScore) || 88,
        foundedYear: Number(body.foundedYear) || 2021,
        hasDirectPhone: true,
        isCustom: true,
        source: 'manual_lead_entry',
        createdAt: new Date().toISOString()
      }]);
      res.status(201).json({ success: true, result });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Could not add custom lead' });
    }
  });

  app.delete('/api/leads/custom/:id', requireSuperAdminMiddleware, async (req, res) => {
    try {
      const ds = await (await import('./server/dataSource.ts')).getDataSource();
      const leadRepo = ds.getRepository((await import('./server/entities/Lead.ts')).Lead);
      await leadRepo.delete(req.params.id);
      res.json({ deleted: true, id: req.params.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- SAVED LEAD LISTS API ---
  app.get('/api/lists', async (req: any, res) => {
    try {
      const ds = await (await import('./server/dataSource.ts')).getDataSource();
      const listRepo = ds.getRepository((await import('./server/entities/SavedList.ts')).SavedList);
      const userId = req.user?.id ? String(req.user.id) : null;
      
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
          leadIds: Array.isArray(l.leadIds) ? l.leadIds : [],
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
      const userId = req.user?.id ? String(req.user.id) : null;

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
