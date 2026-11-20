import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Ephemeral per-process fallback only for local/preview development when .env secrets are unset.
// Production deployments MUST configure JWT_SECRET, JWT_REFRESH_SECRET, and CSRF_SECRET in environment variables.
const devFallbackJwt = crypto.randomBytes(32).toString('hex');
const devFallbackRefresh = crypto.randomBytes(32).toString('hex');
const devFallbackCsrf = crypto.randomBytes(32).toString('hex');

if (isProduction && (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET)) {
  console.warn('[SECURITY WARNING] JWT_SECRET or JWT_REFRESH_SECRET is not set in production environment.');
}

export const env = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  db: {
    host: process.env.DB_HOST || '',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shadhall_booking',
  },
  jwtSecret: process.env.JWT_SECRET || devFallbackJwt,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || devFallbackRefresh,
  csrfSecret: process.env.CSRF_SECRET || devFallbackCsrf,
  bcryptRounds: 12,
  adminSeedEmail: process.env.ADMIN_SEED_EMAIL || 'admin@aureliahall.com',
  adminSeedPassword: process.env.ADMIN_SEED_PASSWORD || 'AdminSecure123!',
  inactivityTimeoutMs: {
    user: 30 * 60 * 1000, // 30 minutes
    admin: 15 * 60 * 1000, // 15 minutes
  },
};
