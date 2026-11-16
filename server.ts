import 'reflect-metadata';
import { createApp } from './server/app.ts';
import { initDatabaseSchema } from './server/dataSource.ts';
import { ensureSuperAdminSeed, runGlobalDailyCreditReplenishmentSweep } from './server/auth.ts';

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize Real MySQL Schema & Root Superadmin
  try {
    await initDatabaseSchema();
    await ensureSuperAdminSeed();
    await runGlobalDailyCreditReplenishmentSweep();
    // Schedule sweep every 15 minutes (900,000 ms)
    setInterval(() => {
      runGlobalDailyCreditReplenishmentSweep().catch((e: any) => console.error('[Daily Credit Sweep Error]:', e.message));
    }, 15 * 60 * 1000);
    console.log('MySQL B2B_database initialized, Superadmin account secured, and 24h Daily Credit replenishment job active.');
  } catch (err: any) {
    console.error('Failed to initialize MySQL:', err.message);
  }

  const app = await createApp();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LeadsArrow B2B Intelligence Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
