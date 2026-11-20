import type { Request, Response } from 'express';
import { dataRepository } from '../repositories/dataRepository.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { getClientIp, isValidEmail, sanitizeEmail, sanitizeText } from '../middleware/security.ts';

export const contactController = {
  async submit(req: Request, res: Response): Promise<void> {
    try {
      const name = sanitizeText(req.body.name, 120);
      const email = sanitizeEmail(req.body.email);
      const message = sanitizeText(req.body.message, 2000);

      if (name.length < 2) {
        res.status(400).json({ error: 'Please enter your name.' });
        return;
      }
      if (!isValidEmail(email)) {
        res.status(400).json({ error: 'Please enter a valid email address.' });
        return;
      }
      if (message.length < 10) {
        res.status(400).json({ error: 'Please include a message of at least 10 characters.' });
        return;
      }

      const saved = await dataRepository.createContactMessage({ name, email, message });
      res.status(201).json({ message: saved });
    } catch (err) {
      console.error('Contact submit error:', err);
      res.status(500).json({ error: 'Unable to send message right now.' });
    }
  },

  async listAdmin(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const messages = await dataRepository.listContactMessages();
      res.json({ messages });
    } catch (err) {
      console.error('List messages error:', err);
      res.status(500).json({ error: 'Failed to load messages.' });
    }
  },

  async markReadAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const isRead = Boolean(req.body.is_read);
      await dataRepository.markContactMessageRead(id, isRead);
      await dataRepository.logAdminAction(
        req.user?.id || null,
        `Marked message #${id} as ${isRead ? 'read' : 'unread'}`,
        getClientIp(req)
      );
      res.json({ ok: true });
    } catch (err) {
      console.error('Mark message read error:', err);
      res.status(500).json({ error: 'Failed to update message status.' });
    }
  },

  async deleteAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      await dataRepository.deleteContactMessage(id);
      await dataRepository.logAdminAction(req.user?.id || null, `Deleted contact message #${id}`, getClientIp(req));
      res.json({ ok: true });
    } catch (err) {
      console.error('Delete message error:', err);
      res.status(500).json({ error: 'Failed to delete message.' });
    }
  },
};
