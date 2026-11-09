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
  requireSuperAdminMiddleware
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

  app.use(express.json({ limit: '10mb' }));
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
      const { leads, source } = req.body || {};
      const result = await batchInsertLeads(
        (leads || []).map((l: any) => ({ ...l, source: source || 'superadmin_import' }))
      );
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- B2B LEADS DATABASE & FACETED SEARCH API ---
  app.get('/api/leads/taxonomy', (_req, res) => {
    res.json(FILTER_TAXONOMY);
  });

  app.get('/api/leads', antiScraperProtectionMiddleware, async (req, res) => {
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

  app.post('/api/leads/custom', async (req: any, res) => {
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

  app.delete('/api/leads/custom/:id', async (req, res) => {
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
  app.get('/api/lists', (_req, res) => {
    res.json({ lists: [] });
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
