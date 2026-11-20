import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.ts';
import { dataRepository } from '../repositories/dataRepository.ts';

export interface AuthPayload {
  userId: number;
  role: 'user' | 'admin';
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: 'user' | 'admin';
    totp_enabled: boolean;
  };
}

export function setAuthCookies(res: Response, payload: AuthPayload): void {
  const accessToken = jwt.sign(payload, env.jwtSecret, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: '7d' });

  const cookieOptions = {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax' as const,
    path: '/',
  };

  res.cookie('access_token', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refresh_token', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.cookie('last_activity', String(Date.now()), { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

export function clearAuthCookies(res: Response): void {
  const cookieOptions = {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax' as const,
    path: '/',
  };
  res.clearCookie('access_token', cookieOptions);
  res.clearCookie('refresh_token', cookieOptions);
  res.clearCookie('last_activity', cookieOptions);
}

export async function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const accessToken = req.cookies?.access_token;
    const refreshToken = req.cookies?.refresh_token;
    const lastActivityRaw = req.cookies?.last_activity;

    if (!accessToken && !refreshToken) {
      res.status(401).json({ error: 'Authentication required. Please log in.' });
      return;
    }

    let decoded: AuthPayload | null = null;

    if (accessToken) {
      try {
        decoded = jwt.verify(accessToken, env.jwtSecret) as AuthPayload;
      } catch {
        decoded = null;
      }
    }

    let needsRefresh = false;
    if (!decoded && refreshToken) {
      try {
        decoded = jwt.verify(refreshToken, env.jwtRefreshSecret) as AuthPayload;
        needsRefresh = true;
      } catch {
        clearAuthCookies(res);
        res.status(401).json({ error: 'Session expired. Please log in again.' });
        return;
      }
    }

    if (!decoded) {
      clearAuthCookies(res);
      res.status(401).json({ error: 'Invalid session. Please log in again.' });
      return;
    }

    // Enforce inactivity auto-logout
    if (lastActivityRaw) {
      const lastActivity = Number(lastActivityRaw);
      const timeoutLimit =
        decoded.role === 'admin' ? env.inactivityTimeoutMs.admin : env.inactivityTimeoutMs.user;
      if (Number.isFinite(lastActivity) && Date.now() - lastActivity > timeoutLimit) {
        clearAuthCookies(res);
        res.status(401).json({ error: 'Session timed out due to inactivity. Please log in again.' });
        return;
      }
    }

    const user = await dataRepository.findUserById(decoded.userId);
    if (!user) {
      clearAuthCookies(res);
      res.status(401).json({ error: 'Account not found.' });
      return;
    }

    if (needsRefresh) {
      setAuthCookies(res, { userId: user.id, role: user.role, email: user.email });
    } else {
      res.cookie('last_activity', String(Date.now()), {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      totp_enabled: user.totp_enabled,
    };

    next();
  } catch {
    res.status(401).json({ error: 'Authentication verification failed.' });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: Administrator privileges required.' });
    return;
  }
  next();
}
