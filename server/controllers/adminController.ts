import type { Response } from 'express';
import { dataRepository } from '../repositories/dataRepository.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { getClientIp, sanitizeEmail, sanitizeText } from '../middleware/security.ts';

export const adminController = {
  async overview(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const [bookings, halls, messages, logs] = await Promise.all([
        dataRepository.listBookingsDetailed(),
        dataRepository.listHalls(true),
        dataRepository.listContactMessages(),
        dataRepository.listActivityLogs(20),
      ]);

      const totalBookings = bookings.length;
      const pendingBookings = bookings.filter((b) => b.status === 'pending').length;
      const confirmedRevenue = bookings
        .filter((b) => b.status === 'confirmed')
        .reduce((sum, b) => sum + Number(b.total_price), 0);
      const totalHalls = halls.length;
      const unreadMessages = messages.filter((m) => !m.is_read).length;

      // Aggregate monthly booking counts & revenue for chart
      const monthMap = new Map<string, { month: string; bookings: number; revenue: number }>();
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-US', { month: 'short' });
        monthMap.set(key, { month: label, bookings: 0, revenue: 0 });
      }

      for (const b of bookings) {
        const key = b.event_date.slice(0, 7);
        const entry = monthMap.get(key);
        if (entry) {
          entry.bookings += 1;
          if (b.status !== 'cancelled') {
            entry.revenue += Number(b.total_price);
          }
        } else {
          // Include upcoming months so chart always reflects future event bookings
          const [y, m] = key.split('-').map(Number);
          if (y && m) {
            const label = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short' });
            monthMap.set(key, {
              month: label,
              bookings: 1,
              revenue: b.status !== 'cancelled' ? Number(b.total_price) : 0,
            });
          }
        }
      }

      res.json({
        stats: {
          totalBookings,
          pendingBookings,
          confirmedRevenue,
          totalHalls,
          unreadMessages,
        },
        chartData: Array.from(monthMap.values()).slice(-6),
        recentBookings: bookings.slice(0, 5),
        recentLogs: logs.slice(0, 8),
      });
    } catch (err) {
      console.error('Admin overview error:', err);
      res.status(500).json({ error: 'Failed to load dashboard overview.' });
    }
  },

  async customers(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const customers = await dataRepository.listCustomers();
      res.json({ customers });
    } catch (err) {
      console.error('Admin customers error:', err);
      res.status(500).json({ error: 'Failed to load customers.' });
    }
  },

  async activityLogs(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const logs = await dataRepository.listActivityLogs(50);
      res.json({ logs });
    } catch (err) {
      console.error('Activity logs error:', err);
      res.status(500).json({ error: 'Failed to load activity logs.' });
    }
  },

  async getSettings(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const settings = await dataRepository.getSettings();
      res.json({ settings });
    } catch (err) {
      console.error('Get settings error:', err);
      res.status(500).json({ error: 'Failed to load settings.' });
    }
  },

  async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const updates = {
        businessName: sanitizeText(req.body.businessName, 120),
        tagline: sanitizeText(req.body.tagline, 200),
        email: sanitizeEmail(req.body.email),
        phone: sanitizeText(req.body.phone, 40),
        address: sanitizeText(req.body.address, 250),
        openingHours: sanitizeText(req.body.openingHours, 120),
      };
      const settings = await dataRepository.updateSettings(updates);
      await dataRepository.logAdminAction(req.user?.id || null, 'Updated business settings', getClientIp(req));
      res.json({ settings });
    } catch (err) {
      console.error('Update settings error:', err);
      res.status(500).json({ error: 'Failed to save settings.' });
    }
  },
};
