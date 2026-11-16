import { Router } from 'express';
import {
  requireJwtMiddleware,
  optionalAuthMiddleware,
  decrementUserCreditsInDb,
  verifyJwtTokenAsync
} from '../auth.ts';
import { getDataSource, getTertiaryDataSource } from '../dataSource.ts';
import {
  FILTER_TAXONOMY,
  queryLeadsDatabase,
  fetchLeadsByIds
} from '../leadsData.ts';

const router = Router();

// --- REVEALED LEADS PERSISTENCE (Per User Account in DB3) ---
router.get('/revealed', requireJwtMiddleware, async (req: any, res) => {
  try {
    const ds = await getDataSource();
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

router.post('/reveal', requireJwtMiddleware, async (req: any, res) => {
  try {
    const leadId = String(req.body?.leadId || '').trim();
    if (!leadId) {
      return res.status(400).json({ error: 'leadId is required' });
    }

    const ds = await getDataSource();

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

// --- B2B LEADS DATABASE & FACETED SEARCH API ---
router.get('/taxonomy', (_req, res) => {
  res.json(FILTER_TAXONOMY);
});

// Cached random preview for landing page (rotates every 30 minutes, keyed per client IP, limit 20)
const landingPreviewCache = new Map<string, { timestamp: number; leads: any[] }>();

router.get('/landing-preview', async (req, res) => {
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
    const ds = await getTertiaryDataSource();
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

router.get('/', optionalAuthMiddleware, async (req: any, res) => {
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

router.post('/by-ids', async (req: any, res) => {
  try {
    const { ids } = req.body || {};
    let userId = req.user?.id ? String(req.user.id) : null;
    if (!userId && req.headers.authorization?.startsWith('Bearer ')) {
      const token = req.headers.authorization.slice(7);
      try {
        const u = await verifyJwtTokenAsync(token);
        if (u) userId = String(u.id);
      } catch (_) {}
    }
    const leads = await fetchLeadsByIds(ids || [], userId);
    res.json({ leads });
  } catch (err: any) {
    console.error('Error fetching leads by IDs:', err);
    res.status(500).json({ error: 'Failed to fetch leads by IDs' });
  }
});

export default router;
