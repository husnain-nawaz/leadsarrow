import { Router } from 'express';
import { optionalAuthMiddleware } from '../auth.ts';
import { getDataSource, SecondaryDataSource } from '../dataSource.ts';
import { SavedList } from '../entities/SavedList.ts';

const router = Router();

// --- SAVED LEAD LISTS API (Routed to Database with Full Read/Write Privileges) ---
router.get('/', async (req: any, res) => {
  try {
    const ds = await getDataSource();
    const listRepo = ds.getRepository(SavedList);
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

router.post('/', optionalAuthMiddleware, async (req: any, res) => {
  try {
    const body = req.body || {};
    const name = String(body.name || '').trim();
    if (!name) {
      return res.status(400).json({ error: 'List name is required' });
    }

    const ds = await getDataSource();
    const listRepo = ds.getRepository(SavedList);
    
    const leadIds = Array.isArray(body.leadIds) ? body.leadIds : [];
    const listId = body.id && /^[a-zA-Z0-9_\-]+$/.test(body.id)
      ? body.id
      : `list_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const userId = req.user?.id || req.user?.email ? String(req.user.id || req.user.email) : null;

    // Tier limits enforcement for Saved Lists:
    // Free: max 5 lists total, max 1,000 leads per list
    // Paid: max 50 lists daily, max 1,000 lists lifetime, max 5,000 leads per list
    const userPlan = (req.user?.planId || req.user?.plan || 'free').toLowerCase();
    const userRole = (req.user?.role || '').toLowerCase();
    const isPaidOrSuperadmin = userRole === 'superadmin' || userPlan.includes('growth') || userPlan.includes('scale') || userPlan.includes('unlimited') || userPlan.includes('pro') || userPlan.includes('starter');

    if (userId) {
      if (!isPaidOrSuperadmin) {
        const countRes: any = await ds.query(
          'SELECT COUNT(*) as count FROM saved_lists WHERE user_id = ?',
          [userId]
        );
        if (Number(countRes[0]?.count || 0) >= 5) {
          return res.status(403).json({
            error: 'Free accounts are limited to 5 saved lists total. Delete an existing list or upgrade to a paid plan to create more.'
          });
        }
        if (leadIds.length > 1000) {
          return res.status(403).json({
            error: `Free plan limit: A saved list cannot exceed 1,000 leads (selected ${leadIds.length}). Upgrade to a paid plan for up to 5,000 leads per list.`
          });
        }
      } else {
        const lifetimeRes: any = await ds.query(
          'SELECT COUNT(*) as count FROM saved_lists WHERE user_id = ?',
          [userId]
        );
        if (Number(lifetimeRes[0]?.count || 0) >= 1000) {
          return res.status(403).json({
            error: 'Lifetime limit reached: You have reached the maximum limit of 1,000 saved lists for your account.'
          });
        }
        const dailyRes: any = await ds.query(
          'SELECT COUNT(*) as count FROM saved_lists WHERE user_id = ? AND created_at >= CURDATE()',
          [userId]
        );
        if (Number(dailyRes[0]?.count || 0) >= 50) {
          return res.status(403).json({
            error: 'Daily limit reached: You can create up to 50 saved lists per day on your plan. This resets daily at midnight.'
          });
        }
        if (leadIds.length > 5000) {
          return res.status(403).json({
            error: `List capacity reached: A saved list cannot exceed 5,000 leads (selected ${leadIds.length}).`
          });
        }
      }
    }

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

// --- ADD LEADS TO EXISTING SAVED LIST ---
router.post('/:id/leads', optionalAuthMiddleware, async (req: any, res) => {
  try {
    const listId = req.params.id;
    const body = req.body || {};
    const newLeadIds: string[] = Array.isArray(body.leadIds)
      ? body.leadIds.map((id: any) => String(id))
      : [];

    if (!newLeadIds.length) {
      return res.status(400).json({ error: 'No lead IDs provided to add.' });
    }

    const ds = await getDataSource();
    const listRepo = ds.getRepository(SavedList);

    let list = await listRepo.findOne({ where: { id: listId } });
    if (!list) {
      const rows: any = await ds.query('SELECT * FROM saved_lists WHERE id = ?', [listId]);
      if (rows && rows.length > 0) {
        const row = rows[0];
        list = listRepo.create({
          id: row.id,
          userId: row.user_id,
          name: row.name,
          description: row.description,
          leadIds: typeof row.lead_ids === 'string' ? JSON.parse(row.lead_ids || '[]') : (row.lead_ids || []),
          filterSummary: row.filter_summary,
          leadCount: Number(row.lead_count || 0)
        });
      }
    }

    if (!list) {
      return res.status(404).json({ error: 'Saved list not found' });
    }

    const existingIds: string[] = Array.isArray(list.leadIds)
      ? list.leadIds
      : (typeof list.leadIds === 'string' ? JSON.parse(list.leadIds || '[]') : []);

    const mergedSet = new Set([...existingIds, ...newLeadIds]);
    const mergedArray = Array.from(mergedSet);
    const addedCount = mergedArray.length - existingIds.length;

    // Tier check for leads per saved list: 1,000 max (Free) / 5,000 max (Paid)
    const userPlan = (req.user?.planId || req.user?.plan || 'free').toLowerCase();
    const userRole = (req.user?.role || '').toLowerCase();
    const isPaidOrSuperadmin = userRole === 'superadmin' || userPlan.includes('growth') || userPlan.includes('scale') || userPlan.includes('unlimited') || userPlan.includes('pro') || userPlan.includes('starter');

    const maxLeadsAllowed = isPaidOrSuperadmin ? 5000 : 1000;
    if (mergedArray.length > maxLeadsAllowed) {
      return res.status(403).json({
        error: isPaidOrSuperadmin
          ? `List capacity reached: Adding ${newLeadIds.length} leads would exceed the maximum limit of 5,000 leads per list (currently ${existingIds.length}).`
          : `Free plan limit: Adding ${newLeadIds.length} leads would exceed the 1,000 leads limit for this list (currently ${existingIds.length}). Upgrade to a paid plan for up to 5,000 leads per list.`
      });
    }

    list.leadIds = mergedArray;
    list.leadCount = mergedArray.length;

    const saved = await listRepo.save(list);

    // Direct MySQL Database JSON update
    await ds.query(
      'UPDATE saved_lists SET lead_ids = ?, lead_count = ?, updated_at = NOW() WHERE id = ?',
      [JSON.stringify(mergedArray), mergedArray.length, listId]
    ).catch(() => {});

    res.json({
      success: true,
      addedCount,
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
    console.error('Failed to add leads to list:', err);
    res.status(500).json({ error: err.message || 'Failed to add leads to list' });
  }
});

// --- REMOVE MULTIPLE LEADS IN BATCH FROM A SAVED LIST ---
router.delete('/:id/leads', async (req: any, res) => {
  try {
    const listId = req.params.id;
    const body = req.body || {};
    const leadIdsToRemove: string[] = Array.isArray(body.leadIds)
      ? body.leadIds.map((id: any) => String(id))
      : [];

    if (!leadIdsToRemove.length) {
      return res.status(400).json({ error: 'No lead IDs provided to remove.' });
    }

    const ds = await getDataSource();
    const listRepo = ds.getRepository(SavedList);

    let list = await listRepo.findOne({ where: { id: listId } });
    if (!list) {
      return res.status(404).json({ error: 'Saved list not found' });
    }

    const removeSet = new Set(leadIdsToRemove);
    const existingIds: string[] = Array.isArray(list.leadIds)
      ? list.leadIds
      : (typeof list.leadIds === 'string' ? JSON.parse(list.leadIds || '[]') : []);

    const updatedIds = existingIds.filter((id) => !removeSet.has(String(id)));

    list.leadIds = updatedIds;
    list.leadCount = updatedIds.length;

    const saved = await listRepo.save(list);

    await ds.query(
      'UPDATE saved_lists SET lead_ids = ?, lead_count = ?, updated_at = NOW() WHERE id = ?',
      [JSON.stringify(updatedIds), updatedIds.length, listId]
    ).catch(() => {});

    res.json({
      success: true,
      removedCount: existingIds.length - updatedIds.length,
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
    console.error('Failed to batch remove leads from list:', err);
    res.status(500).json({ error: err.message || 'Failed to remove leads from list' });
  }
});

// --- REMOVE A SINGLE LEAD FROM A SAVED LIST ---
router.delete('/:id/leads/:leadId', async (req: any, res) => {
  try {
    const listId = req.params.id;
    const leadId = req.params.leadId;

    const ds = await getDataSource();
    const listRepo = ds.getRepository(SavedList);

    let list = await listRepo.findOne({ where: { id: listId } });
    if (!list) {
      return res.status(404).json({ error: 'Saved list not found' });
    }

    const existingIds: string[] = Array.isArray(list.leadIds)
      ? list.leadIds
      : (typeof list.leadIds === 'string' ? JSON.parse(list.leadIds || '[]') : []);

    const updatedIds = existingIds.filter((id) => String(id) !== String(leadId));

    list.leadIds = updatedIds;
    list.leadCount = updatedIds.length;

    const saved = await listRepo.save(list);

    await ds.query(
      'UPDATE saved_lists SET lead_ids = ?, lead_count = ?, updated_at = NOW() WHERE id = ?',
      [JSON.stringify(updatedIds), updatedIds.length, listId]
    ).catch(() => {});

    res.json({
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
    console.error('Failed to remove lead from list:', err);
    res.status(500).json({ error: err.message || 'Failed to remove lead from list' });
  }
});

router.delete('/:id', async (req: any, res) => {
  try {
    const targetId = req.params.id;
    const ds = await getDataSource();
    const listRepo = ds.getRepository(SavedList);
    await listRepo.delete(targetId);
    await ds.query('DELETE FROM saved_lists WHERE id = ?', [targetId]).catch(() => {});

    try {
      const ds2 = SecondaryDataSource;
      if (ds2 && ds2.isInitialized) {
        await ds2.query('DELETE FROM saved_lists WHERE id = ?', [targetId]).catch(() => {});
      }
    } catch {}

    res.json({ success: true, deleted: true, id: targetId });
  } catch (err: any) {
    console.error('Failed to delete list from database:', err);
    res.status(500).json({ error: err.message || 'Failed to delete list from database' });
  }
});

// --- RENAME OR UPDATE A SAVED LIST ---
router.put('/:id', async (req: any, res) => {
  try {
    const targetId = req.params.id;
    const { name, description } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'List name cannot be empty.' });
    }

    const ds = await getDataSource();
    const listRepo = ds.getRepository(SavedList);
    const targetList = await listRepo.findOne({ where: { id: targetId } });
    if (!targetList) {
      return res.status(404).json({ error: 'Saved list not found.' });
    }

    targetList.name = String(name).trim();
    if (description !== undefined) {
      targetList.description = String(description).trim();
    }
    targetList.updatedAt = new Date();
    const saved = await listRepo.save(targetList);

    await ds.query(
      'UPDATE saved_lists SET name = ?, description = ?, updated_at = NOW() WHERE id = ?',
      [saved.name, saved.description, targetId]
    ).catch(() => {});

    try {
      const ds2 = SecondaryDataSource;
      if (ds2 && ds2.isInitialized) {
        await ds2.query(
          'UPDATE saved_lists SET name = ?, description = ?, updated_at = NOW() WHERE id = ?',
          [saved.name, saved.description, targetId]
        ).catch(() => {});
      }
    } catch {}

    res.json({
      success: true,
      list: {
        id: saved.id,
        name: saved.name,
        description: saved.description,
        leadIds: Array.isArray(saved.leadIds) ? saved.leadIds : (typeof saved.leadIds === 'string' ? JSON.parse(saved.leadIds || '[]') : []),
        filterSummary: saved.filterSummary,
        leadCount: saved.leadCount,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt
      },
      message: 'Saved list updated successfully.'
    });
  } catch (err: any) {
    console.error('Failed to update saved list:', err);
    res.status(500).json({ error: err.message || 'Failed to update saved list' });
  }
});

export default router;
