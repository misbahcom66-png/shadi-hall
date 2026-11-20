import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.ts';

export const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // Allows Vite module scripts & inline Google Fonts while enforcing all other Helmet headers
  crossOriginEmbedderPolicy: false,
});

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = [env.appUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'];
    if (allowed.some((url) => origin.startsWith(url)) || origin.endsWith('.run.app')) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS policy'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Authorization'],
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please wait 15 minutes and try again.' },
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Please slow down your requests.' },
});

export function enforceHttpsInProduction(req: Request, res: Response, next: NextFunction): void {
  if (env.isProduction) {
    const proto = req.headers['x-forwarded-proto'];
    if (proto && proto !== 'https') {
      res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
      return;
    }
  }
  next();
}

export function issueCsrfCookie(req: Request, res: Response): string {
  const existing = req.cookies?.csrf_token;
  if (existing && typeof existing === 'string' && existing.length >= 32) {
    return existing;
  }
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('csrf_token', token, {
    httpOnly: false, // Must be readable by client JS to send in X-CSRF-Token header
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  });
  return token;
}

export function verifyCsrfToken(req: Request, res: Response, next: NextFunction): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }
  const cookieToken = req.cookies?.csrf_token;
  const headerToken = req.headers['x-csrf-token'];
  if (!cookieToken || !headerToken || typeof headerToken !== 'string' || cookieToken !== headerToken) {
    res.status(403).json({ error: 'Invalid or missing CSRF security token. Please refresh the page.' });
    return;
  }
  next();
}

// XSS sanitization helpers (strips HTML tags and dangerous script characters)
export function sanitizeText(value: unknown, maxLen = 500): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>?/gm, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLen);
}

export function sanitizeEmail(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase().slice(0, 190);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getClientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') return fwd.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'unknown';
}
