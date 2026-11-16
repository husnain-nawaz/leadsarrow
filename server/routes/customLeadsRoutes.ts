import { Router } from 'express';
import { requireJwtMiddleware } from '../auth.ts';
import { getDataSource } from '../dataSource.ts';

const router = Router();

// --- USER-PRIVATE CUSTOM LEADS (Stored Isolated in Database 4 - Always in a Dedicated Cluster) ---
router.get('/', requireJwtMiddleware, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required to view your custom leads.' });
    }

    const q = String(req.query.q || '').trim();
    const requestedCluster = String(req.query.cluster || '').trim();
    const ds = await getDataSource();

    // 1. Fetch user's registered clusters and compute counts (newest first so newly created cluster is always first)
    const clusterRows: any = await ds.query(
      `SELECT id, name, description, created_at FROM custom_clusters WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );

    const countByCluster: any = await ds.query(
      `SELECT cluster_name, COUNT(*) as cnt FROM custom_leads WHERE user_id = ? AND cluster_name IS NOT NULL AND cluster_name != '' GROUP BY cluster_name`,
      [userId]
    );

    const countMap: Record<string, number> = {};
    (countByCluster || []).forEach((r: any) => {
      if (r.cluster_name) {
        countMap[r.cluster_name] = Number(r.cnt) || 0;
      }
    });

    const seenClusterNames = new Set<string>();
    const clusters = (clusterRows || [])
      .filter((row: any) => row.name && String(row.name).trim())
      .map((row: any) => {
        const trimmedName = String(row.name).trim();
        seenClusterNames.add(trimmedName);
        return {
          id: row.id,
          name: trimmedName,
          description: row.description || '',
          leadCount: countMap[trimmedName] || 0,
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
        };
      });

    // Include any distinct cluster_name from custom_leads not in custom_clusters
    Object.keys(countMap).forEach((name) => {
      const trimmed = String(name || '').trim();
      if (trimmed && !seenClusterNames.has(trimmed)) {
        seenClusterNames.add(trimmed);
        clusters.push({
          id: `cls_${Buffer.from(userId + '_' + trimmed).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)}`,
          name: trimmed,
          description: `${trimmed} cluster`,
          leadCount: countMap[trimmed],
          createdAt: new Date().toISOString()
        });
      }
    });

    // Sort clusters strictly newest first (createdAt DESC) so newest cluster is always index 0
    clusters.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Determine active cluster: leads can be filtered by specific cluster or 'all'
    let activeCluster = requestedCluster && requestedCluster !== 'all' ? requestedCluster : null;
    if (!requestedCluster && clusters.length > 0) {
      activeCluster = clusters[0].name;
    }

    let whereClause = 'WHERE user_id = ?';
    const sqlParams: any[] = [userId];

    if (requestedCluster === 'all') {
      // All custom leads across all clusters
    } else if (activeCluster) {
      whereClause += ' AND cluster_name = ?';
      sqlParams.push(activeCluster);
    } else {
      // No clusters exist yet, return 0 leads
      whereClause += ' AND 1 = 0';
    }

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
      clusterName: row.cluster_name,
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
      clusters,
      activeCluster,
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

// Create a new Custom Cluster / Group (Strict 5-cluster limit for Free Users)
router.post('/clusters', requireJwtMiddleware, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const name = String(req.body?.name || '').trim();
    const description = String(req.body?.description || '').trim();
    if (!name) return res.status(400).json({ error: 'Cluster name is required' });

    const ds = await getDataSource();

    // Tier cluster limits:
    // Free: max 5 clusters lifetime
    // Paid: max 50 clusters daily, max 1,000 clusters lifetime
    const userPlan = (req.user?.planId || req.user?.plan || 'free').toLowerCase();
    const userRole = (req.user?.role || '').toLowerCase();
    const isPaidOrSuperadmin = userRole === 'superadmin' || userPlan.includes('growth') || userPlan.includes('scale') || userPlan.includes('unlimited') || userPlan.includes('pro') || userPlan.includes('starter');

    if (!isPaidOrSuperadmin) {
      const countRes: any = await ds.query(
        'SELECT COUNT(*) as count FROM custom_clusters WHERE user_id = ?',
        [userId]
      );
      const existingCount = Number(countRes[0]?.count || 0);
      if (existingCount >= 5) {
        return res.status(403).json({
          error: 'Free accounts are limited to 5 clusters total. Delete an existing cluster or upgrade your plan to create more.'
        });
      }
    } else {
      const lifetimeRes: any = await ds.query(
        'SELECT COUNT(*) as count FROM custom_clusters WHERE user_id = ?',
        [userId]
      );
      if (Number(lifetimeRes[0]?.count || 0) >= 1000) {
        return res.status(403).json({
          error: 'Lifetime limit reached: You have reached the maximum limit of 1,000 clusters for this account.'
        });
      }
      const dailyRes: any = await ds.query(
        'SELECT COUNT(*) as count FROM custom_clusters WHERE user_id = ? AND created_at >= CURDATE()',
        [userId]
      );
      if (Number(dailyRes[0]?.count || 0) >= 50) {
        return res.status(403).json({
          error: 'Daily limit reached: You can create up to 50 clusters per day on your plan. This resets daily at midnight.'
        });
      }
    }

    const clusterId = `cls_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    await ds.query(
      `INSERT INTO custom_clusters (id, user_id, name, description, created_at)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE description = VALUES(description)`,
      [clusterId, userId, name, description || `${name} lead cluster`]
    );

    res.status(201).json({
      success: true,
      cluster: {
        id: clusterId,
        name,
        description,
        leadCount: 0
      }
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Could not create cluster' });
  }
});

// Delete a Custom Cluster / Group
router.delete('/clusters/:name', requireJwtMiddleware, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const clusterName = decodeURIComponent(req.params.name);
    const ds = await getDataSource();

    // Delete leads in this cluster
    await ds.query(
      'DELETE FROM custom_leads WHERE user_id = ? AND cluster_name = ?',
      [userId, clusterName]
    );

    // Delete cluster definition
    await ds.query(
      'DELETE FROM custom_clusters WHERE user_id = ? AND name = ?',
      [userId, clusterName]
    );

    res.json({ success: true, deletedCluster: clusterName });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Could not delete cluster' });
  }
});

// Rename or Edit a Custom Cluster / Group (Strictly restricted to own profile clusters)
router.put('/clusters/:name', requireJwtMiddleware, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const oldName = decodeURIComponent(req.params.name).trim();
    const newName = String(req.body?.name || '').trim();
    const description = String(req.body?.description || '').trim();

    if (!newName) {
      return res.status(400).json({ error: 'New cluster name is required' });
    }

    const ds = await getDataSource();

    // Check if cluster exists for this user in custom_clusters
    const checkRows: any = await ds.query(
      'SELECT id, name FROM custom_clusters WHERE user_id = ? AND name = ?',
      [userId, oldName]
    );

    if (checkRows && checkRows.length > 0) {
      await ds.query(
        'UPDATE custom_clusters SET name = ?, description = ? WHERE user_id = ? AND name = ?',
        [newName, description || `${newName} lead cluster`, userId, oldName]
      );
    } else {
      const clusterId = `cls_${Buffer.from(userId + '_' + newName).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)}`;
      await ds.query(
        'INSERT INTO custom_clusters (id, user_id, name, description, created_at) VALUES (?, ?, ?, ?, NOW())',
        [clusterId, userId, newName, description || `${newName} lead cluster`]
      ).catch(() => {});
    }

    // Update all custom leads belonging to oldName cluster for this user only
    await ds.query(
      'UPDATE custom_leads SET cluster_name = ? WHERE user_id = ? AND cluster_name = ?',
      [newName, userId, oldName]
    );

    res.json({
      success: true,
      oldName,
      cluster: {
        name: newName,
        description: description || `${newName} lead cluster`
      },
      message: `Cluster renamed from "${oldName}" to "${newName}".`
    });
  } catch (err: any) {
    console.error('Failed to rename custom cluster:', err);
    res.status(500).json({ error: err.message || 'Could not rename cluster' });
  }
});

router.post('/', requireJwtMiddleware, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required to create custom leads.' });
    }
    const body = req.body || {};
    const ds = await getDataSource();
    
    const customId = body.id || `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const safeTrim = (v: any, maxLen: number, fallback = '') => {
      if (v === null || v === undefined) return fallback.slice(0, maxLen);
      const s = String(v).replace(/\0/g, '').trim();
      return (s || fallback).slice(0, maxLen);
    };

    const clusterName = safeTrim(body.clusterName || body.cluster, 128, '');
    if (!clusterName) {
      return res.status(400).json({ error: 'A valid cluster name is required. Every custom lead must belong to a cluster.' });
    }

    // Duplicate prevention: A user cannot add duplicate custom leads
    const userParam = String(userId);
    const emailParam = req.user?.email ? String(req.user.email) : userParam;
    const targetEmail = safeTrim(body.contactEmail, 255, '').toLowerCase();
    const targetCompany = safeTrim(body.companyName, 255, '').toLowerCase();
    const targetContact = safeTrim(body.contactName, 255, '').toLowerCase();

    if (targetEmail) {
      const existingByEmail: any = await ds.query(
        `SELECT id, company_name, contact_name, cluster_name FROM custom_leads 
         WHERE (user_id = ? OR user_id = ?) AND LOWER(contact_email) = ? LIMIT 1`,
        [userParam, emailParam, targetEmail]
      );
      if (existingByEmail && existingByEmail.length > 0) {
        return res.status(409).json({
          error: `Duplicate lead prevented: A custom lead with email "${targetEmail}" (${existingByEmail[0].company_name || 'Business'}) already exists in your cluster "${existingByEmail[0].cluster_name}".`
        });
      }
    }

    if (targetCompany && targetContact) {
      const existingByName: any = await ds.query(
        `SELECT id, cluster_name FROM custom_leads 
         WHERE (user_id = ? OR user_id = ?) AND LOWER(company_name) = ? AND LOWER(contact_name) = ? LIMIT 1`,
        [userParam, emailParam, targetCompany, targetContact]
      );
      if (existingByName && existingByName.length > 0) {
        return res.status(409).json({
          error: `Duplicate lead prevented: "${body.contactName}" at "${body.companyName}" already exists in your cluster "${existingByName[0].cluster_name}".`
        });
      }
    }

    // Lead limit per cluster: Free = 1,000 max, Paid = 5,000 max
    const userPlan = (req.user?.planId || req.user?.plan || 'free').toLowerCase();
    const userRole = (req.user?.role || '').toLowerCase();
    const isPaidOrSuperadmin = userRole === 'superadmin' || userPlan.includes('growth') || userPlan.includes('scale') || userPlan.includes('unlimited') || userPlan.includes('pro') || userPlan.includes('starter');

    const clusterLeadCountRes: any = await ds.query(
      'SELECT COUNT(*) as count FROM custom_leads WHERE (user_id = ? OR user_id = ?) AND cluster_name = ?',
      [userParam, emailParam, clusterName]
    );
    const currentClusterCount = Number(clusterLeadCountRes[0]?.count || 0);
    const maxLeadsPerCluster = isPaidOrSuperadmin ? 5000 : 1000;
    if (currentClusterCount >= maxLeadsPerCluster) {
      return res.status(403).json({
        error: isPaidOrSuperadmin
          ? `Cluster limit reached: Each cluster can hold a maximum of 5,000 custom leads.`
          : `Free plan limit: A cluster can contain a maximum of 1,000 custom leads. Upgrade to a paid plan to store up to 5,000 leads per cluster.`
      });
    }

    const techStackJson = JSON.stringify(
      Array.isArray(body.techStack)
        ? body.techStack
        : String(body.techStack || 'AWS, Salesforce').split(/[,;|]/).map((s: string) => s.trim()).filter(Boolean)
    );

    const intentScore = body.buyingIntentScore !== undefined && body.buyingIntentScore !== null && !isNaN(Number(body.buyingIntentScore))
      ? Math.max(0, Math.min(100, Math.round(Number(body.buyingIntentScore))))
      : 88;

    // Isolated write into Database 4 custom_leads table only - core leads are 100% untouched
    await ds.query(
      `INSERT INTO custom_leads (
        id, user_id, cluster_name, company_name, domain, industry, employee_range, employee_count,
        revenue_range, annual_revenue_usd, country, city, contact_name, contact_title,
        seniority, department, contact_email, contact_phone, linkedin_url,
        verification_status, funding_stage, tech_stack, buying_intent_score,
        founded_year, has_direct_phone, source, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        customId,
        userId,
        clusterName,
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
        intentScore,
        Number(body.foundedYear) || 2021,
        body.hasDirectPhone !== undefined ? (body.hasDirectPhone ? 1 : 0) : 1,
        'manual_custom_lead'
      ]
    );

    // Also ensure cluster is registered in custom_clusters
    const clusterId = `cls_${Buffer.from(userId + '_' + clusterName).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)}`;
    await ds.query(
      `INSERT IGNORE INTO custom_clusters (id, user_id, name, description, created_at) VALUES (?, ?, ?, ?, NOW())`,
      [clusterId, userId, clusterName, `${clusterName} lead cluster`]
    ).catch(() => {});

    res.status(201).json({
      success: true,
      lead: {
        id: customId,
        clusterName,
        companyName: safeTrim(body.companyName, 255, 'My Custom Business'),
        domain: safeTrim(body.domain, 255, 'business.io'),
        industry: safeTrim(body.industry, 255, 'Enterprise Software & SaaS'),
        employeeRange: safeTrim(body.employeeRange, 100, '51-200'),
        employeeCount: Number(body.employeeCount) || 120,
        revenueRange: safeTrim(body.revenueRange, 100, '$10M - $50M'),
        annualRevenueUsd: Number(body.annualRevenueUsd) || 24000000,
        country: safeTrim(body.country, 100, 'United States'),
        city: safeTrim(body.city, 255, 'San Francisco, CA'),
        contactName: safeTrim(body.contactName, 255, 'Executive Contact'),
        contactTitle: safeTrim(body.contactTitle, 255, 'VP of Operations'),
        seniority: safeTrim(body.seniority, 100, 'VP'),
        department: safeTrim(body.department, 100, 'Operations & Supply Chain'),
        contactEmail: safeTrim(body.contactEmail, 255, 'contact@business.io'),
        contactPhone: safeTrim(body.contactPhone, 100, '+1 (415) 555-0142'),
        verificationStatus: safeTrim(body.verificationStatus, 50, 'Verified'),
        fundingStage: safeTrim(body.fundingStage, 100, 'Series B'),
        buyingIntentScore: Number(body.buyingIntentScore) || 88,
        isCustom: true,
        createdAt: new Date().toISOString()
      },
      message: `Custom lead added to cluster "${clusterName}".`
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Could not add custom lead' });
  }
});

// --- DELETE USER-PRIVATE CUSTOM LEAD (Strictly restricted to own custom leads; Core leads are immune) ---
router.delete('/:id', requireJwtMiddleware, async (req: any, res) => {
  try {
    const targetId = req.params.id;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const ds = await getDataSource();
    
    const userParam = String(userId);
    const emailParam = req.user?.email ? String(req.user.email) : userParam;
    const result: any = await ds.query(
      'DELETE FROM custom_leads WHERE id = ? AND (user_id = ? OR user_id = ?)',
      [targetId, userParam, emailParam]
    );

    const deleted = (result?.affectedRows || 0) > 0;
    res.json({ deleted, id: targetId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- UPDATE USER-PRIVATE CUSTOM LEAD (Strictly restricted to own profile; Core database is 100% immune) ---
router.put('/:id', requireJwtMiddleware, async (req: any, res) => {
  try {
    const targetId = req.params.id;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const body = req.body || {};
    const ds = await getDataSource();

    const safeTrim = (v: any, maxLen: number, fallback = '') => {
      if (v === null || v === undefined) return fallback.slice(0, maxLen);
      const s = String(v).replace(/\0/g, '').trim();
      return (s || fallback).slice(0, maxLen);
    };

    const userParam = String(userId);
    const emailParam = req.user?.email ? String(req.user.email) : userParam;
    const existing: any = await ds.query(
      'SELECT id, cluster_name FROM custom_leads WHERE id = ? AND (user_id = ? OR user_id = ?)',
      [targetId, userParam, emailParam]
    );

    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: 'Custom lead not found or not owned by your profile.' });
    }

    const targetEmail = safeTrim(body.contactEmail, 255, '').toLowerCase();
    if (targetEmail) {
      const existingOther: any = await ds.query(
        `SELECT id, company_name, cluster_name FROM custom_leads 
         WHERE (user_id = ? OR user_id = ?) AND LOWER(contact_email) = ? AND id != ? LIMIT 1`,
        [userParam, emailParam, targetEmail, targetId]
      );
      if (existingOther && existingOther.length > 0) {
        return res.status(409).json({
          error: `Duplicate email: Another custom lead with email "${targetEmail}" already exists in your cluster "${existingOther[0].cluster_name}".`
        });
      }
    }

    const clusterName = safeTrim(body.clusterName || body.cluster, 128, existing[0].cluster_name || 'General');

    // Lead limit per cluster: Free = 1,000 max, Paid = 5,000 max
    const userPlan = (req.user?.planId || req.user?.plan || 'free').toLowerCase();
    const userRole = (req.user?.role || '').toLowerCase();
    const isPaidOrSuperadmin = userRole === 'superadmin' || userPlan.includes('growth') || userPlan.includes('scale') || userPlan.includes('unlimited') || userPlan.includes('pro') || userPlan.includes('starter');

    const clusterLeadCountRes: any = await ds.query(
      'SELECT COUNT(*) as count FROM custom_leads WHERE (user_id = ? OR user_id = ?) AND cluster_name = ?',
      [userParam, emailParam, clusterName]
    );
    const currentClusterCount = Number(clusterLeadCountRes[0]?.count || 0);
    const maxLeadsPerCluster = isPaidOrSuperadmin ? 5000 : 1000;
    if (currentClusterCount >= maxLeadsPerCluster) {
      return res.status(403).json({
        error: isPaidOrSuperadmin
          ? `Cluster limit reached: Each cluster can hold a maximum of 5,000 custom leads.`
          : `Free plan limit: A cluster can contain a maximum of 1,000 custom leads. Upgrade to a paid plan to store up to 5,000 leads per cluster.`
      });
    }

    const techStackJson = JSON.stringify(
      Array.isArray(body.techStack)
        ? body.techStack
        : String(body.techStack || 'AWS, Salesforce').split(/[,;|]/).map((s: string) => s.trim()).filter(Boolean)
    );

    await ds.query(
      `UPDATE custom_leads SET
        cluster_name = ?,
        company_name = ?,
        domain = ?,
        industry = ?,
        employee_range = ?,
        employee_count = ?,
        revenue_range = ?,
        annual_revenue_usd = ?,
        country = ?,
        city = ?,
        contact_name = ?,
        contact_title = ?,
        seniority = ?,
        department = ?,
        contact_email = ?,
        contact_phone = ?,
        linkedin_url = ?,
        verification_status = ?,
        funding_stage = ?,
        tech_stack = ?,
        buying_intent_score = ?,
        founded_year = ?,
        has_direct_phone = ?
      WHERE id = ? AND (user_id = ? OR user_id = ?)`,
      [
        clusterName,
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
        targetId,
        userParam,
        emailParam
      ]
    );

    // If cluster changed, ensure target cluster exists in custom_clusters
    const clusterId = `cls_${Buffer.from(userId + '_' + clusterName).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)}`;
    await ds.query(
      'INSERT IGNORE INTO custom_clusters (id, user_id, name, description, created_at) VALUES (?, ?, ?, ?, NOW())',
      [clusterId, userId, clusterName, `${clusterName} lead cluster`]
    ).catch(() => {});

    res.json({
      success: true,
      lead: {
        id: targetId,
        clusterName,
        companyName: safeTrim(body.companyName, 255, 'My Custom Business'),
        domain: safeTrim(body.domain, 255, 'business.io'),
        industry: safeTrim(body.industry, 255, 'Enterprise Software & SaaS'),
        employeeRange: safeTrim(body.employeeRange, 100, '51-200'),
        employeeCount: Number(body.employeeCount) || 120,
        revenueRange: safeTrim(body.revenueRange, 100, '$10M - $50M'),
        annualRevenueUsd: Number(body.annualRevenueUsd) || 24000000,
        country: safeTrim(body.country, 100, 'United States'),
        city: safeTrim(body.city, 255, 'San Francisco, CA'),
        contactName: safeTrim(body.contactName, 255, 'Executive Contact'),
        contactTitle: safeTrim(body.contactTitle, 255, 'VP of Operations'),
        seniority: safeTrim(body.seniority, 100, 'VP'),
        department: safeTrim(body.department, 100, 'Operations & Supply Chain'),
        contactEmail: safeTrim(body.contactEmail, 255, 'contact@business.io'),
        contactPhone: safeTrim(body.contactPhone, 100, '+1 (415) 555-0142'),
        verificationStatus: safeTrim(body.verificationStatus, 50, 'Verified'),
        fundingStage: safeTrim(body.fundingStage, 100, 'Series B'),
        buyingIntentScore: Number(body.buyingIntentScore) || 88,
        isCustom: true
      },
      message: 'Custom lead updated successfully.'
    });
  } catch (err: any) {
    console.error('Failed to update custom lead:', err);
    res.status(500).json({ error: err.message || 'Could not update custom lead' });
  }
});

export default router;
