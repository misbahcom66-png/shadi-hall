import fs from 'fs';
import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { env } from './server/config/env.ts';
import { initDatabase } from './server/config/db.ts';
import {
  apiRateLimiter,
  corsMiddleware,
  enforceHttpsInProduction,
  helmetMiddleware,
  issueCsrfCookie,
} from './server/middleware/security.ts';
import authRoutes from './server/routes/authRoutes.ts';
import publicRoutes from './server/routes/publicRoutes.ts';
import bookingRoutes from './server/routes/bookingRoutes.ts';
import adminRoutes from './server/routes/adminRoutes.ts';

async function startServer() {
  await initDatabase();

  const app = express();
  app.set('trust proxy', 1);

  app.use(enforceHttpsInProduction);
  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(cookieParser());
  app.use(express.json({ limit: '8mb' }));
  app.use(express.urlencoded({ extended: true, limit: '8mb' }));

  // Serve uploaded hall images
  const uploadDir = path.resolve(process.cwd(), '.data', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadDir));

  // Issue CSRF token cookie for client fetch requests
  app.get('/api/csrf-token', (req, res) => {
    const token = issueCsrfCookie(req, res);
    res.json({ csrfToken: token });
  });

  // Apply general rate limiter to API routes
  app.use('/api', apiRateLimiter);
  app.use('/api/auth', authRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', publicRoutes);

  if (env.nodeEnv !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(env.port, '0.0.0.0', () => {
    console.log(`[SERVER] Aurelia Grand Hall running at http://0.0.0.0:${env.port} (${env.nodeEnv})`);
  });
}

startServer().catch((err) => {
  console.error('[SERVER] Fatal startup error:', err);
  process.exit(1);
});
