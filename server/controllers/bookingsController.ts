import type { Response } from 'express';
import { dataRepository } from '../repositories/dataRepository.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { getClientIp, sanitizeText } from '../middleware/security.ts';

export const bookingsController = {
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Please login to book a hall.' });
        return;
      }

      const hallId = Number(req.body.hallId);
      const eventType = sanitizeText(req.body.eventType, 100);
      const eventDate = sanitizeText(req.body.eventDate, 20);
      const startTime = sanitizeText(req.body.startTime, 10);
      const endTime = sanitizeText(req.body.endTime, 10);
      const guests = Number(req.body.guests);
      const notes = sanitizeText(req.body.notes, 1000);
      const serviceIds: number[] = Array.isArray(req.body.serviceIds)
        ? Array.from(new Set(req.body.serviceIds.map(Number).filter((n: number) => Number.isInteger(n) && n > 0)))
        : [];

      if (!Number.isInteger(hallId) || hallId <= 0) {
        res.status(400).json({ error: 'Please select a valid hall.' });
        return;
      }
      if (!eventType || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
        res.status(400).json({ error: 'Please provide a valid event type and date.' });
        return;
      }
      const today = new Date().toISOString().slice(0, 10);
      if (eventDate < today) {
        res.status(400).json({ error: 'Event date cannot be in the past.' });
        return;
      }
      if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime) || startTime >= endTime) {
        res.status(400).json({ error: 'End time must be later than start time.' });
        return;
      }

      const hall = await dataRepository.getHallById(hallId);
      if (!hall || hall.status !== 'active') {
        res.status(404).json({ error: 'Selected hall is currently unavailable.' });
        return;
      }
      if (!Number.isFinite(guests) || guests < 10 || guests > hall.capacity) {
        res.status(400).json({ error: `Guest count must be between 10 and ${hall.capacity} for this hall.` });
        return;
      }

      const hasConflict = await dataRepository.hasBookingConflict(hallId, eventDate, startTime, endTime);
      if (hasConflict) {
        res.status(409).json({
          error: 'This hall is already booked during your selected date and time slot. Please choose another time.',
        });
        return;
      }

      // Calculate authoritative price server-side
      const allServices = await dataRepository.listServices();
      const chosenServices = allServices.filter((s) => serviceIds.includes(s.id));
      const servicesTotal = chosenServices.reduce((sum, s) => sum + Number(s.price), 0);
      const totalPrice = Number((Number(hall.price) + servicesTotal).toFixed(2));

      const booking = await dataRepository.createBooking({
        user_id: req.user.id,
        hall_id: hallId,
        event_type: eventType,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        guests: Math.round(guests),
        total_price: totalPrice,
        notes,
        service_ids: chosenServices.map((s) => s.id),
      });

      res.status(201).json({ booking });
    } catch (err) {
      if ((err as Error).message === 'SLOT_CONFLICT') {
        res.status(409).json({
          error: 'Time slot conflict: This hall was just reserved for that period. Please select another slot.',
        });
        return;
      }
      console.error('Create booking error:', err);
      res.status(500).json({ error: 'Unable to submit booking.' });
    }
  },

  async myBookings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const bookings = await dataRepository.listBookingsDetailed(req.user.id);
      res.json({ bookings });
    } catch (err) {
      console.error('My bookings error:', err);
      res.status(500).json({ error: 'Failed to load your bookings.' });
    }
  },

  async cancelMyBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'Invalid booking ID.' });
        return;
      }
      const existing = await dataRepository.getBookingById(id);
      if (!existing || existing.user_id !== req.user.id) {
        res.status(404).json({ error: 'Booking not found.' });
        return;
      }
      if (existing.status === 'cancelled') {
        res.status(400).json({ error: 'This booking is already cancelled.' });
        return;
      }
      const updated = await dataRepository.updateBookingStatus(id, 'cancelled');
      res.json({ booking: updated });
    } catch (err) {
      console.error('Cancel booking error:', err);
      res.status(500).json({ error: 'Failed to cancel booking.' });
    }
  },

  // Admin endpoints
  async listAdmin(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const bookings = await dataRepository.listBookingsDetailed();
      res.json({ bookings });
    } catch (err) {
      console.error('Admin bookings error:', err);
      res.status(500).json({ error: 'Failed to load bookings.' });
    }
  },

  async updateStatusAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const status = req.body.status;
      if (!Number.isInteger(id) || !['pending', 'confirmed', 'cancelled'].includes(status)) {
        res.status(400).json({ error: 'Invalid booking ID or status.' });
        return;
      }
      const updated = await dataRepository.updateBookingStatus(id, status);
      if (!updated) {
        res.status(404).json({ error: 'Booking not found.' });
        return;
      }
      await dataRepository.logAdminAction(
        req.user?.id || null,
        `Updated booking #${id} status to ${status}`,
        getClientIp(req)
      );
      res.json({ booking: updated });
    } catch (err) {
      if ((err as Error).message === 'SLOT_CONFLICT') {
        res.status(409).json({ error: 'Cannot confirm: another active booking overlaps this slot.' });
        return;
      }
      console.error('Admin update status error:', err);
      res.status(500).json({ error: 'Failed to update booking status.' });
    }
  },

  async deleteAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'Invalid booking ID.' });
        return;
      }
      await dataRepository.deleteBooking(id);
      await dataRepository.logAdminAction(req.user?.id || null, `Deleted booking #${id}`, getClientIp(req));
      res.json({ ok: true });
    } catch (err) {
      console.error('Admin delete booking error:', err);
      res.status(500).json({ error: 'Failed to delete booking.' });
    }
  },
};
