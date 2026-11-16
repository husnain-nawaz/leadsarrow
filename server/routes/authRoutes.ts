import { Router } from 'express';
import {
  registerJwtUser,
  loginJwtUser,
  loginOrSyncGoogleUser,
  upgradeUserPlan,
  updateSelfProfile,
  optionalAuthMiddleware,
  requireJwtMiddleware,
  decrementUserCreditsInDb
} from '../auth.ts';

const router = Router();

// --- AUTHENTICATION API (JWT + Google One-Click Exchange with MySQL) ---
router.post('/register', async (req, res) => {
  try {
    const result = await registerJwtUser(req.body || {}, req);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const result = await loginJwtUser(req.body || {}, req);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Invalid credentials' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const result = await loginOrSyncGoogleUser(req.body || {}, req);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Google authentication sync failed' });
  }
});

router.get('/me', optionalAuthMiddleware, (req: any, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  res.json({ user: req.user });
});

router.put('/profile', requireJwtMiddleware, async (req: any, res) => {
  try {
    const result = await updateSelfProfile(req.user.id, req.body || {});
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Profile update failed' });
  }
});

router.post('/upgrade-plan', requireJwtMiddleware, async (req: any, res) => {
  try {
    const { planId } = req.body || {};
    const result = await upgradeUserPlan(req.user.id || req.user.email, planId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Plan upgrade failed' });
  }
});

router.post('/decrement-credits', requireJwtMiddleware, async (req: any, res) => {
  try {
    const { amount } = req.body || {};
    const countToDecrement = Math.max(1, Number(amount) || 1);
    const updatedUser = await decrementUserCreditsInDb(req.user.id, countToDecrement);
    res.json({ success: true, user: updatedUser });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to decrement credits' });
  }
});

export default router;
