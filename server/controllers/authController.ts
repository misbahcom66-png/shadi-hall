import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateSecret, generateURI, verify as verifyTotpToken } from 'otplib';
import QRCode from 'qrcode';
import { env } from '../config/env.ts';
import { dataRepository } from '../repositories/dataRepository.ts';
import {
  clearAuthCookies,
  setAuthCookies,
  type AuthenticatedRequest,
} from '../middleware/auth.ts';
import {
  getClientIp,
  isValidEmail,
  sanitizeEmail,
  sanitizeText,
} from '../middleware/security.ts';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const name = sanitizeText(req.body.name, 120);
      const email = sanitizeEmail(req.body.email);
      const phone = sanitizeText(req.body.phone, 30);
      const password = typeof req.body.password === 'string' ? req.body.password : '';

      if (name.length < 2) {
        res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
        return;
      }
      if (!isValidEmail(email)) {
        res.status(400).json({ error: 'Please enter a valid email address.' });
        return;
      }
      if (password.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters long.' });
        return;
      }

      const existing = await dataRepository.findUserByEmail(email);
      if (existing) {
        res.status(409).json({ error: 'An account with this email already exists.' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
      const user = await dataRepository.createUser({
        name,
        email,
        phone,
        password_hash: passwordHash,
        role: 'user',
      });

      setAuthCookies(res, { userId: user.id, role: user.role, email: user.email });
      res.status(201).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          totp_enabled: user.totp_enabled,
        },
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Unable to create account right now.' });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const email = sanitizeEmail(req.body.email);
      const password = typeof req.body.password === 'string' ? req.body.password : '';
      const adminOnly = Boolean(req.body.adminOnly);

      if (!isValidEmail(email) || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }

      const user = await dataRepository.findUserByEmail(email);
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      if (adminOnly && user.role !== 'admin') {
        res.status(403).json({ error: 'Administrator access is required for this portal.' });
        return;
      }

      // Check lockout window
      if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
        const remainingMinutes = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
        res.status(423).json({
          error: `Account temporarily locked due to repeated failed attempts. Try again in ${remainingMinutes} minute(s).`,
        });
        return;
      }

      const matches = await bcrypt.compare(password, user.password_hash);
      if (!matches) {
        const nextAttempts = user.failed_attempts + 1;
        const lockUntil =
          nextAttempts >= MAX_FAILED_ATTEMPTS
            ? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString()
            : null;
        await dataRepository.updateUserLoginFailures(user.id, nextAttempts, lockUntil);

        if (user.role === 'admin') {
          await dataRepository.logAdminAction(
            user.id,
            `Failed admin login attempt (${nextAttempts}/${MAX_FAILED_ATTEMPTS})`,
            getClientIp(req)
          );
        }

        if (lockUntil) {
          res.status(423).json({
            error: 'Too many failed attempts. Account locked for 15 minutes.',
          });
          return;
        }
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      await dataRepository.updateUserLoginFailures(user.id, 0, null);

      // If admin has 2FA enabled, issue a short-lived pre-auth token instead of full session cookies
      if (user.role === 'admin' && user.totp_enabled && user.totp_secret) {
        const preAuthToken = jwt.sign(
          { userId: user.id, stage: '2fa_pending' },
          env.jwtSecret,
          { expiresIn: '5m' }
        );
        res.json({
          requires2FA: true,
          preAuthToken,
        });
        return;
      }

      setAuthCookies(res, { userId: user.id, role: user.role, email: user.email });
      if (user.role === 'admin') {
        await dataRepository.logAdminAction(user.id, 'Admin logged in', getClientIp(req));
      }

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          totp_enabled: user.totp_enabled,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Authentication failed.' });
    }
  },

  async verify2FA(req: Request, res: Response): Promise<void> {
    try {
      const preAuthToken = typeof req.body.preAuthToken === 'string' ? req.body.preAuthToken : '';
      const code = sanitizeText(req.body.code, 10).replace(/\s+/g, '');

      if (!preAuthToken || !/^\d{6}$/.test(code)) {
        res.status(400).json({ error: 'Please provide a valid 6-digit authentication code.' });
        return;
      }

      let decoded: { userId: number; stage: string };
      try {
        decoded = jwt.verify(preAuthToken, env.jwtSecret) as { userId: number; stage: string };
      } catch {
        res.status(401).json({ error: '2FA verification window expired. Please sign in again.' });
        return;
      }

      if (decoded.stage !== '2fa_pending') {
        res.status(401).json({ error: 'Invalid verification token.' });
        return;
      }

      const user = await dataRepository.findUserById(decoded.userId);
      if (!user || !user.totp_secret || !user.totp_enabled) {
        res.status(401).json({ error: '2FA is not configured for this account.' });
        return;
      }

      const verification = await verifyTotpToken({ secret: user.totp_secret, token: code });
      if (!verification.valid) {
        await dataRepository.logAdminAction(user.id, 'Failed 2FA verification', getClientIp(req));
        res.status(401).json({ error: 'Incorrect 6-digit verification code.' });
        return;
      }

      setAuthCookies(res, { userId: user.id, role: user.role, email: user.email });
      await dataRepository.logAdminAction(user.id, 'Admin logged in with 2FA', getClientIp(req));

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          totp_enabled: user.totp_enabled,
        },
      });
    } catch (err) {
      console.error('2FA verify error:', err);
      res.status(500).json({ error: 'Could not verify 2FA code.' });
    }
  },

  async setup2FA(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const secret = generateSecret();
      await dataRepository.updateUserTotp(req.user.id, secret, false);
      const otpauthUri = generateURI({
        issuer: 'Aurelia Grand Hall',
        label: req.user.email,
        secret,
      });
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri);
      res.json({ secret, qrCodeDataUrl });
    } catch (err) {
      console.error('2FA setup error:', err);
      res.status(500).json({ error: 'Unable to generate 2FA secret.' });
    }
  },

  async enable2FA(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const code = sanitizeText(req.body.code, 10).replace(/\s+/g, '');
      const user = await dataRepository.findUserById(req.user.id);
      if (!user || !user.totp_secret) {
        res.status(400).json({ error: 'Generate a 2FA QR code first.' });
        return;
      }

      const verification = await verifyTotpToken({ secret: user.totp_secret, token: code });
      if (!verification.valid) {
        res.status(400).json({ error: 'Invalid 6-digit code. Check your authenticator app.' });
        return;
      }

      await dataRepository.updateUserTotp(user.id, user.totp_secret, true);
      await dataRepository.logAdminAction(user.id, 'Enabled TOTP Two-Factor Authentication', getClientIp(req));
      res.json({ totp_enabled: true });
    } catch (err) {
      console.error('2FA enable error:', err);
      res.status(500).json({ error: 'Failed to enable 2FA.' });
    }
  },

  async disable2FA(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      await dataRepository.updateUserTotp(req.user.id, null, false);
      await dataRepository.logAdminAction(req.user.id, 'Disabled TOTP Two-Factor Authentication', getClientIp(req));
      res.json({ totp_enabled: false });
    } catch (err) {
      console.error('2FA disable error:', err);
      res.status(500).json({ error: 'Failed to disable 2FA.' });
    }
  },

  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (req.user?.role === 'admin') {
      await dataRepository.logAdminAction(req.user.id, 'Admin logged out', getClientIp(req));
    }
    clearAuthCookies(res);
    res.json({ ok: true });
  },

  async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    res.json({ user: req.user });
  },
};
