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
