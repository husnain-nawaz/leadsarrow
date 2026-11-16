import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { optionalAuthMiddleware } from './auth.ts';
import apiRouter from './routes/index.ts';

export async function createApp() {
  const app = express();

  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ limit: '500mb', extended: true }));
  app.use(optionalAuthMiddleware);

  // Mount all modular API routes under /api
  app.use('/api', apiRouter);

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

  return app;
}

export default createApp;
