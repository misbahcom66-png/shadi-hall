import type { Request, Response } from 'express';
import { dataRepository } from '../repositories/dataRepository.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { getClientIp, sanitizeText } from '../middleware/security.ts';

export const servicesController = {
  async listPublic(_req: Request, res: Response): Promise<void> {
    try {
      const services = await dataRepository.listServices();
      res.json({ services });
    } catch (err) {
      console.error('List services error:', err);
      res.status(500).json({ error: 'Failed to load services.' });
    }
  },

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const name = sanitizeText(req.body.name, 140);
      const description = sanitizeText(req.body.description, 1000);
      const price = Number(req.body.price);
      const icon = sanitizeText(req.body.icon, 60) || 'utensils';
      const category = sanitizeText(req.body.category, 60) || 'catering';

      if (name.length < 2 || description.length < 5 || !Number.isFinite(price) || price < 0) {
        res.status(400).json({ error: 'Please provide valid service details and price.' });
        return;
      }

      const service = await dataRepository.createService({
        name,
        description,
        price: Number(price.toFixed(2)),
        icon,
        category,
      });
      await dataRepository.logAdminAction(req.user?.id || null, `Created service: ${service.name}`, getClientIp(req));
      res.status(201).json({ service });
    } catch (err) {
      console.error('Create service error:', err);
      res.status(500).json({ error: 'Failed to create service.' });
    }
  },

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'Invalid service ID.' });
        return;
      }
      const updates: Record<string, unknown> = {};
      if (req.body.name !== undefined) updates.name = sanitizeText(req.body.name, 140);
      if (req.body.description !== undefined) updates.description = sanitizeText(req.body.description, 1000);
      if (req.body.price !== undefined) updates.price = Number(Number(req.body.price).toFixed(2));
      if (req.body.icon !== undefined) updates.icon = sanitizeText(req.body.icon, 60);
      if (req.body.category !== undefined) updates.category = sanitizeText(req.body.category, 60);

      const updated = await dataRepository.updateService(id, updates);
      if (!updated) {
        res.status(404).json({ error: 'Service not found.' });
        return;
      }
      await dataRepository.logAdminAction(req.user?.id || null, `Updated service #${id}: ${updated.name}`, getClientIp(req));
      res.json({ service: updated });
    } catch (err) {
      console.error('Update service error:', err);
      res.status(500).json({ error: 'Failed to update service.' });
    }
  },

  async remove(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'Invalid service ID.' });
        return;
      }
      await dataRepository.deleteService(id);
      await dataRepository.logAdminAction(req.user?.id || null, `Deleted service #${id}`, getClientIp(req));
      res.json({ ok: true });
    } catch (err) {
      console.error('Delete service error:', err);
      res.status(500).json({ error: 'Cannot delete a service linked to existing bookings.' });
    }
  },
};
