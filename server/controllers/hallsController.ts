import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { Request, Response } from 'express';
import { dataRepository } from '../repositories/dataRepository.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { getClientIp, sanitizeText } from '../middleware/security.ts';

const UPLOAD_DIR = path.resolve(process.cwd(), '.data', 'uploads');

export const hallsController = {
  async listPublic(_req: Request, res: Response): Promise<void> {
    try {
      const halls = await dataRepository.listHalls(false);
      res.json({ halls });
    } catch (err) {
      console.error('List halls error:', err);
      res.status(500).json({ error: 'Failed to load halls.' });
    }
  },

  async getPublicDetails(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'Invalid hall ID.' });
        return;
      }
      const hall = await dataRepository.getHallById(id);
      if (!hall) {
        res.status(404).json({ error: 'Hall not found.' });
        return;
      }
      const bookedSlots = await dataRepository.getHallBookedSlots(id);
      res.json({ hall, bookedSlots });
    } catch (err) {
      console.error('Hall details error:', err);
      res.status(500).json({ error: 'Failed to load hall details.' });
    }
  },

  async listAdmin(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const halls = await dataRepository.listHalls(true);
      res.json({ halls });
    } catch (err) {
      console.error('Admin list halls error:', err);
      res.status(500).json({ error: 'Failed to load halls.' });
    }
  },

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const name = sanitizeText(req.body.name, 160);
      const description = sanitizeText(req.body.description, 2000);
      const capacity = Number(req.body.capacity);
      const price = Number(req.body.price);
      const image_url = sanitizeText(req.body.image_url, 500) || '/src/assets/images/hall_royal_ballroom_1794825122864.jpg';
      const amenities = sanitizeText(req.body.amenities, 600);
      const status = req.body.status === 'maintenance' ? 'maintenance' : 'active';
      const gallery = Array.isArray(req.body.gallery)
        ? req.body.gallery.map((g: unknown) => sanitizeText(g, 500)).filter(Boolean)
        : [];

      if (name.length < 3 || description.length < 10) {
        res.status(400).json({ error: 'Hall name and description are required.' });
        return;
      }
      if (!Number.isFinite(capacity) || capacity < 10 || !Number.isFinite(price) || price <= 0) {
        res.status(400).json({ error: 'Valid capacity and price are required.' });
        return;
      }

      const hall = await dataRepository.createHall({
        name,
        description,
        capacity: Math.round(capacity),
        price: Number(price.toFixed(2)),
        image_url,
        amenities,
        status,
        gallery,
      });

      await dataRepository.logAdminAction(req.user?.id || null, `Created hall: ${hall.name}`, getClientIp(req));
      res.status(201).json({ hall });
    } catch (err) {
      console.error('Create hall error:', err);
      res.status(500).json({ error: 'Failed to create hall.' });
    }
  },

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'Invalid hall ID.' });
        return;
      }

      const updates: Record<string, unknown> = {};
      if (req.body.name !== undefined) updates.name = sanitizeText(req.body.name, 160);
      if (req.body.description !== undefined) updates.description = sanitizeText(req.body.description, 2000);
      if (req.body.capacity !== undefined) updates.capacity = Math.max(10, Math.round(Number(req.body.capacity)));
      if (req.body.price !== undefined) updates.price = Number(Number(req.body.price).toFixed(2));
      if (req.body.image_url !== undefined) updates.image_url = sanitizeText(req.body.image_url, 500);
      if (req.body.amenities !== undefined) updates.amenities = sanitizeText(req.body.amenities, 600);
      if (req.body.status !== undefined) updates.status = req.body.status === 'maintenance' ? 'maintenance' : 'active';
      if (Array.isArray(req.body.gallery)) {
        updates.gallery = req.body.gallery.map((g: unknown) => sanitizeText(g, 500)).filter(Boolean);
      }

      const updated = await dataRepository.updateHall(id, updates);
      if (!updated) {
        res.status(404).json({ error: 'Hall not found.' });
        return;
      }

      await dataRepository.logAdminAction(req.user?.id || null, `Updated hall #${id}: ${updated.name}`, getClientIp(req));
      res.json({ hall: updated });
    } catch (err) {
      console.error('Update hall error:', err);
      res.status(500).json({ error: 'Failed to update hall.' });
    }
  },

  async remove(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'Invalid hall ID.' });
        return;
      }
      const result = await dataRepository.deleteHall(id);
      if (!result.deleted) {
        res.status(409).json({ error: result.reason || 'Cannot delete hall.' });
        return;
      }
      await dataRepository.logAdminAction(req.user?.id || null, `Deleted hall #${id}`, getClientIp(req));
      res.json({ ok: true });
    } catch (err) {
      console.error('Delete hall error:', err);
      res.status(500).json({ error: 'Failed to delete hall.' });
    }
  },

  async uploadImage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const dataUrl = typeof req.body.dataUrl === 'string' ? req.body.dataUrl : '';
      const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/);
      if (!match) {
        res.status(400).json({ error: 'Please upload a valid PNG, JPG, or WebP image.' });
        return;
      }
      const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
      const buffer = Buffer.from(match[2], 'base64');
      if (buffer.length > 5 * 1024 * 1024) {
        res.status(400).json({ error: 'Image must be smaller than 5MB.' });
        return;
      }
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }
      const filename = `hall_${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${ext}`;
      fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);
      const imageUrl = `/uploads/${filename}`;

      if (req.body.hallId) {
        const hallId = Number(req.body.hallId);
        if (Number.isInteger(hallId) && hallId > 0) {
          await dataRepository.addHallImage(hallId, imageUrl);
        }
      }

      await dataRepository.logAdminAction(req.user?.id || null, `Uploaded hall image: ${filename}`, getClientIp(req));
      res.status(201).json({ imageUrl });
    } catch (err) {
      console.error('Upload image error:', err);
      res.status(500).json({ error: 'Failed to save uploaded image.' });
    }
  },
};
