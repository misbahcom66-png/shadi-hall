import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getPool, isMysqlActive } from '../config/db.ts';
import {
  getLocalDb,
  saveLocalDb,
  nextId,
  type UserRecord,
  type HallRecord,
  type HallImageRecord,
  type ServiceRecord,
  type BookingRecord,
  type ContactMessageRecord,
  type ActivityLogRecord,
  type BusinessSettings,
} from '../db/localStore.ts';

export interface HallWithImages extends HallRecord {
  images: string[];
}

export interface BookingDetailed extends BookingRecord {
  hall_name: string;
  hall_image: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  services: ServiceRecord[];
}

function normalizeTime(timeStr: string): string {
  // Ensures HH:MM comparison works seamlessly whether MySQL returns HH:MM:SS or HH:MM
  return timeStr.slice(0, 5);
}

export const dataRepository = {
  // ---------------- USERS ----------------
  async findUserByEmail(email: string): Promise<UserRecord | null> {
    if (isMysqlActive()) {
      const [rows] = await getPool().execute<RowDataPacket[]>(
        'SELECT id, name, email, phone, password_hash, role, totp_secret, totp_enabled, failed_attempts, locked_until, created_at FROM users WHERE email = ? LIMIT 1',
        [email]
      );
      if (rows.length === 0) return null;
      const r = rows[0];
      return {
        ...r,
        totp_enabled: Boolean(r.totp_enabled),
        locked_until: r.locked_until ? new Date(r.locked_until).toISOString() : null,
        created_at: new Date(r.created_at).toISOString(),
      } as UserRecord;
    }
    const db = getLocalDb();
    return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async findUserById(id: number): Promise<UserRecord | null> {
    if (isMysqlActive()) {
      const [rows] = await getPool().execute<RowDataPacket[]>(
        'SELECT id, name, email, phone, password_hash, role, totp_secret, totp_enabled, failed_attempts, locked_until, created_at FROM users WHERE id = ? LIMIT 1',
        [id]
      );
      if (rows.length === 0) return null;
      const r = rows[0];
      return {
        ...r,
        totp_enabled: Boolean(r.totp_enabled),
        locked_until: r.locked_until ? new Date(r.locked_until).toISOString() : null,
        created_at: new Date(r.created_at).toISOString(),
      } as UserRecord;
    }
    const db = getLocalDb();
    return db.users.find((u) => u.id === id) || null;
  },

  async createUser(input: {
    name: string;
    email: string;
    phone: string;
    password_hash: string;
    role?: 'user' | 'admin';
  }): Promise<UserRecord> {
    const role = input.role || 'user';
    if (isMysqlActive()) {
      const [result] = await getPool().execute<ResultSetHeader>(
        'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        [input.name, input.email, input.phone, input.password_hash, role]
      );
      const created = await this.findUserById(result.insertId);
      if (!created) throw new Error('User creation failed');
      return created;
    }
    const db = getLocalDb();
    const user: UserRecord = {
      id: nextId(db, 'users'),
      name: input.name,
      email: input.email,
      phone: input.phone,
      password_hash: input.password_hash,
      role,
      totp_secret: null,
      totp_enabled: false,
      failed_attempts: 0,
      locked_until: null,
      created_at: new Date().toISOString(),
    };
    db.users.push(user);
    saveLocalDb(db);
    return user;
  },

  async updateUserLoginFailures(id: number, failedAttempts: number, lockedUntil: string | null): Promise<void> {
    if (isMysqlActive()) {
      const mysqlDate = lockedUntil ? new Date(lockedUntil).toISOString().slice(0, 19).replace('T', ' ') : null;
      await getPool().execute(
        'UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?',
        [failedAttempts, mysqlDate, id]
      );
      return;
    }
    const db = getLocalDb();
    const user = db.users.find((u) => u.id === id);
    if (user) {
      user.failed_attempts = failedAttempts;
      user.locked_until = lockedUntil;
      saveLocalDb(db);
    }
  },

  async updateUserTotp(id: number, secret: string | null, enabled: boolean): Promise<void> {
    if (isMysqlActive()) {
      await getPool().execute(
        'UPDATE users SET totp_secret = ?, totp_enabled = ? WHERE id = ?',
        [secret, enabled ? 1 : 0, id]
      );
      return;
    }
    const db = getLocalDb();
    const user = db.users.find((u) => u.id === id);
    if (user) {
      user.totp_secret = secret;
      user.totp_enabled = enabled;
      saveLocalDb(db);
    }
  },

  async listCustomers(): Promise<Array<Omit<UserRecord, 'password_hash' | 'totp_secret'> & { booking_count: number }>> {
    if (isMysqlActive()) {
      const [rows] = await getPool().execute<RowDataPacket[]>(
        `SELECT u.id, u.name, u.email, u.phone, u.role, u.totp_enabled, u.failed_attempts, u.locked_until, u.created_at,
                COUNT(b.id) AS booking_count
         FROM users u
         LEFT JOIN bookings b ON b.user_id = u.id
         WHERE u.role = 'user'
         GROUP BY u.id
         ORDER BY u.created_at DESC`
      );
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        role: r.role,
        totp_enabled: Boolean(r.totp_enabled),
        failed_attempts: r.failed_attempts,
        locked_until: r.locked_until ? new Date(r.locked_until).toISOString() : null,
        created_at: new Date(r.created_at).toISOString(),
        booking_count: Number(r.booking_count || 0),
      }));
    }
    const db = getLocalDb();
    return db.users
      .filter((u) => u.role === 'user')
      .map(({ password_hash: _ph, totp_secret: _ts, ...safe }) => ({
        ...safe,
        booking_count: db.bookings.filter((b) => b.user_id === safe.id).length,
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  // ---------------- HALLS ----------------
  async listHalls(includeMaintenance = false): Promise<HallWithImages[]> {
    if (isMysqlActive()) {
      const query = includeMaintenance
        ? 'SELECT * FROM halls ORDER BY id ASC'
        : "SELECT * FROM halls WHERE status = 'active' ORDER BY id ASC";
      const [halls] = await getPool().execute<RowDataPacket[]>(query);
      const [images] = await getPool().execute<RowDataPacket[]>('SELECT hall_id, image_url FROM hall_images ORDER BY id ASC');
      return halls.map((h) => ({
        id: h.id,
        name: h.name,
        description: h.description,
        capacity: Number(h.capacity),
        price: Number(h.price),
        image_url: h.image_url,
        amenities: h.amenities || '',
        status: h.status,
        created_at: new Date(h.created_at).toISOString(),
        images: [
          h.image_url,
          ...images.filter((img) => img.hall_id === h.id && img.image_url !== h.image_url).map((img) => img.image_url),
        ],
      }));
    }
    const db = getLocalDb();
    return db.halls
      .filter((h) => includeMaintenance || h.status === 'active')
      .map((h) => ({
        ...h,
        images: Array.from(
          new Set([
            h.image_url,
            ...db.hall_images.filter((img) => img.hall_id === h.id).map((img) => img.image_url),
          ])
        ),
      }));
  },

  async getHallById(id: number): Promise<HallWithImages | null> {
    const halls = await this.listHalls(true);
    return halls.find((h) => h.id === id) || null;
  },

  async createHall(input: {
    name: string;
    description: string;
    capacity: number;
    price: number;
    image_url: string;
    amenities: string;
    status: 'active' | 'maintenance';
    gallery?: string[];
  }): Promise<HallWithImages> {
    if (isMysqlActive()) {
      const [res] = await getPool().execute<ResultSetHeader>(
        'INSERT INTO halls (name, description, capacity, price, image_url, amenities, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [input.name, input.description, input.capacity, input.price, input.image_url, input.amenities, input.status]
      );
      const hallId = res.insertId;
      const galleryUrls = Array.from(new Set([input.image_url, ...(input.gallery || [])]));
      for (const url of galleryUrls) {
        await getPool().execute('INSERT INTO hall_images (hall_id, image_url) VALUES (?, ?)', [hallId, url]);
      }
      const created = await this.getHallById(hallId);
      if (!created) throw new Error('Failed to load created hall');
      return created;
    }
    const db = getLocalDb();
    const hall: HallRecord = {
      id: nextId(db, 'halls'),
      name: input.name,
      description: input.description,
      capacity: input.capacity,
      price: input.price,
      image_url: input.image_url,
      amenities: input.amenities,
      status: input.status,
      created_at: new Date().toISOString(),
    };
    db.halls.push(hall);
    const galleryUrls = Array.from(new Set([input.image_url, ...(input.gallery || [])]));
    for (const url of galleryUrls) {
      db.hall_images.push({ id: nextId(db, 'hall_images'), hall_id: hall.id, image_url: url });
    }
    saveLocalDb(db);
    return { ...hall, images: galleryUrls };
  },

  async updateHall(
    id: number,
    input: Partial<Omit<HallRecord, 'id' | 'created_at'>> & { gallery?: string[] }
  ): Promise<HallWithImages | null> {
    if (isMysqlActive()) {
      const existing = await this.getHallById(id);
      if (!existing) return null;
      await getPool().execute(
        'UPDATE halls SET name = ?, description = ?, capacity = ?, price = ?, image_url = ?, amenities = ?, status = ? WHERE id = ?',
        [
          input.name ?? existing.name,
          input.description ?? existing.description,
          input.capacity ?? existing.capacity,
          input.price ?? existing.price,
          input.image_url ?? existing.image_url,
          input.amenities ?? existing.amenities,
          input.status ?? existing.status,
          id,
        ]
      );
      if (input.gallery) {
        await getPool().execute('DELETE FROM hall_images WHERE hall_id = ?', [id]);
        const urls = Array.from(new Set([input.image_url ?? existing.image_url, ...input.gallery]));
        for (const url of urls) {
          await getPool().execute('INSERT INTO hall_images (hall_id, image_url) VALUES (?, ?)', [id, url]);
        }
      }
      return this.getHallById(id);
    }
    const db = getLocalDb();
    const hall = db.halls.find((h) => h.id === id);
    if (!hall) return null;
    if (input.name !== undefined) hall.name = input.name;
    if (input.description !== undefined) hall.description = input.description;
    if (input.capacity !== undefined) hall.capacity = input.capacity;
    if (input.price !== undefined) hall.price = input.price;
    if (input.image_url !== undefined) hall.image_url = input.image_url;
    if (input.amenities !== undefined) hall.amenities = input.amenities;
    if (input.status !== undefined) hall.status = input.status;
    if (input.gallery) {
      db.hall_images = db.hall_images.filter((img) => img.hall_id !== id);
      const urls = Array.from(new Set([hall.image_url, ...input.gallery]));
      for (const url of urls) {
        db.hall_images.push({ id: nextId(db, 'hall_images'), hall_id: id, image_url: url });
      }
    }
    saveLocalDb(db);
    return this.getHallById(id);
  },

  async deleteHall(id: number): Promise<{ deleted: boolean; reason?: string }> {
    if (isMysqlActive()) {
      const [bookings] = await getPool().execute<RowDataPacket[]>(
        "SELECT id FROM bookings WHERE hall_id = ? AND status <> 'cancelled' LIMIT 1",
        [id]
      );
      if (bookings.length > 0) {
        return { deleted: false, reason: 'Cannot delete a hall with active bookings.' };
      }
      await getPool().execute('DELETE FROM halls WHERE id = ?', [id]);
      return { deleted: true };
    }
    const db = getLocalDb();
    const hasActiveBookings = db.bookings.some((b) => b.hall_id === id && b.status !== 'cancelled');
    if (hasActiveBookings) {
      return { deleted: false, reason: 'Cannot delete a hall with active bookings.' };
    }
    db.halls = db.halls.filter((h) => h.id !== id);
    db.hall_images = db.hall_images.filter((img) => img.hall_id !== id);
    saveLocalDb(db);
    return { deleted: true };
  },

  async addHallImage(hallId: number, imageUrl: string): Promise<HallImageRecord> {
    if (isMysqlActive()) {
      const [res] = await getPool().execute<ResultSetHeader>(
        'INSERT INTO hall_images (hall_id, image_url) VALUES (?, ?)',
        [hallId, imageUrl]
      );
      return { id: res.insertId, hall_id: hallId, image_url: imageUrl };
    }
    const db = getLocalDb();
    const record: HallImageRecord = { id: nextId(db, 'hall_images'), hall_id: hallId, image_url: imageUrl };
    db.hall_images.push(record);
    saveLocalDb(db);
    return record;
  },

  // ---------------- SERVICES ----------------
  async listServices(): Promise<ServiceRecord[]> {
    if (isMysqlActive()) {
      const [rows] = await getPool().execute<RowDataPacket[]>('SELECT * FROM services ORDER BY id ASC');
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        price: Number(r.price),
        icon: r.icon,
        category: r.category,
      }));
    }
    return [...getLocalDb().services];
  },

  async createService(input: Omit<ServiceRecord, 'id'>): Promise<ServiceRecord> {
    if (isMysqlActive()) {
      const [res] = await getPool().execute<ResultSetHeader>(
        'INSERT INTO services (name, description, price, icon, category) VALUES (?, ?, ?, ?, ?)',
        [input.name, input.description, input.price, input.icon, input.category]
      );
      return { id: res.insertId, ...input };
    }
    const db = getLocalDb();
    const service: ServiceRecord = { id: nextId(db, 'services'), ...input };
    db.services.push(service);
    saveLocalDb(db);
    return service;
  },

  async updateService(id: number, input: Partial<Omit<ServiceRecord, 'id'>>): Promise<ServiceRecord | null> {
    if (isMysqlActive()) {
      const all = await this.listServices();
      const existing = all.find((s) => s.id === id);
      if (!existing) return null;
      await getPool().execute(
        'UPDATE services SET name = ?, description = ?, price = ?, icon = ?, category = ? WHERE id = ?',
        [
          input.name ?? existing.name,
          input.description ?? existing.description,
          input.price ?? existing.price,
          input.icon ?? existing.icon,
          input.category ?? existing.category,
          id,
        ]
      );
      return { ...existing, ...input };
    }
    const db = getLocalDb();
    const svc = db.services.find((s) => s.id === id);
    if (!svc) return null;
    Object.assign(svc, input);
    saveLocalDb(db);
    return svc;
  },

  async deleteService(id: number): Promise<void> {
    if (isMysqlActive()) {
      await getPool().execute('DELETE FROM services WHERE id = ?', [id]);
      return;
    }
    const db = getLocalDb();
    db.services = db.services.filter((s) => s.id !== id);
    saveLocalDb(db);
  },

  // ---------------- BOOKINGS & AVAILABILITY ----------------
  async getHallBookedSlots(hallId: number): Promise<Array<{ event_date: string; start_time: string; end_time: string; status: string }>> {
    if (isMysqlActive()) {
      const [rows] = await getPool().execute<RowDataPacket[]>(
        "SELECT DATE_FORMAT(event_date, '%Y-%m-%d') AS event_date, TIME_FORMAT(start_time, '%H:%i') AS start_time, TIME_FORMAT(end_time, '%H:%i') AS end_time, status FROM bookings WHERE hall_id = ? AND status <> 'cancelled' AND event_date >= CURDATE() ORDER BY event_date ASC, start_time ASC",
        [hallId]
      );
      return rows as Array<{ event_date: string; start_time: string; end_time: string; status: string }>;
    }
    const db = getLocalDb();
    const today = new Date().toISOString().slice(0, 10);
    return db.bookings
      .filter((b) => b.hall_id === hallId && b.status !== 'cancelled' && b.event_date >= today)
      .map((b) => ({
        event_date: b.event_date,
        start_time: normalizeTime(b.start_time),
        end_time: normalizeTime(b.end_time),
        status: b.status,
      }))
      .sort((a, b) => a.event_date.localeCompare(b.event_date));
  },

  async hasBookingConflict(hallId: number, eventDate: string, startTime: string, endTime: string, excludeId?: number): Promise<boolean> {
    const start = normalizeTime(startTime);
    const end = normalizeTime(endTime);
    if (isMysqlActive()) {
      const params: Array<number | string> = [hallId, eventDate, end, start];
      let sql =
        "SELECT id FROM bookings WHERE hall_id = ? AND event_date = ? AND status <> 'cancelled' AND start_time < ? AND end_time > ?";
      if (excludeId !== undefined) {
        sql += ' AND id <> ?';
        params.push(excludeId);
      }
      sql += ' LIMIT 1';
      const [rows] = await getPool().execute<RowDataPacket[]>(sql, params);
      return rows.length > 0;
    }
    const db = getLocalDb();
    return db.bookings.some(
      (b) =>
        b.hall_id === hallId &&
        b.event_date === eventDate &&
        b.status !== 'cancelled' &&
        (excludeId === undefined || b.id !== excludeId) &&
        normalizeTime(b.start_time) < end &&
        normalizeTime(b.end_time) > start
    );
  },

  async createBooking(input: {
    user_id: number;
    hall_id: number;
    event_type: string;
    event_date: string;
    start_time: string;
    end_time: string;
    guests: number;
    total_price: number;
    notes: string;
    service_ids: number[];
  }): Promise<BookingDetailed> {
    if (isMysqlActive()) {
      const conn = await getPool().getConnection();
      try {
        await conn.beginTransaction();
        const [conflicts] = await conn.execute<RowDataPacket[]>(
          "SELECT id FROM bookings WHERE hall_id = ? AND event_date = ? AND status <> 'cancelled' AND start_time < ? AND end_time > ? FOR UPDATE",
          [input.hall_id, input.event_date, input.end_time, input.start_time]
        );
        if (conflicts.length > 0) {
          throw new Error('SLOT_CONFLICT');
        }
        const [res] = await conn.execute<ResultSetHeader>(
          "INSERT INTO bookings (user_id, hall_id, event_type, event_date, start_time, end_time, guests, total_price, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)",
          [
            input.user_id,
            input.hall_id,
            input.event_type,
            input.event_date,
            input.start_time,
            input.end_time,
            input.guests,
            input.total_price,
            input.notes,
          ]
        );
        const bookingId = res.insertId;
        for (const sid of input.service_ids) {
          await conn.execute('INSERT INTO booking_services (booking_id, service_id) VALUES (?, ?)', [bookingId, sid]);
        }
        await conn.commit();
        const created = await this.getBookingById(bookingId);
        if (!created) throw new Error('Failed to load created booking');
        return created;
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    }

    const db = getLocalDb();
    const conflict = await this.hasBookingConflict(input.hall_id, input.event_date, input.start_time, input.end_time);
    if (conflict) {
      throw new Error('SLOT_CONFLICT');
    }
    const booking: BookingRecord = {
      id: nextId(db, 'bookings'),
      user_id: input.user_id,
      hall_id: input.hall_id,
      event_type: input.event_type,
      event_date: input.event_date,
      start_time: normalizeTime(input.start_time),
      end_time: normalizeTime(input.end_time),
      guests: input.guests,
      total_price: input.total_price,
      status: 'pending',
      notes: input.notes,
      created_at: new Date().toISOString(),
    };
    db.bookings.push(booking);
    for (const sid of input.service_ids) {
      db.booking_services.push({ booking_id: booking.id, service_id: sid });
    }
    saveLocalDb(db);
    const created = await this.getBookingById(booking.id);
    if (!created) throw new Error('Failed to load created booking');
    return created;
  },

  async getBookingById(id: number): Promise<BookingDetailed | null> {
    const all = await this.listBookingsDetailed();
    return all.find((b) => b.id === id) || null;
  },

  async listBookingsDetailed(userId?: number): Promise<BookingDetailed[]> {
    if (isMysqlActive()) {
      const params: number[] = [];
      let sql = `
        SELECT b.id, b.user_id, b.hall_id, b.event_type,
               DATE_FORMAT(b.event_date, '%Y-%m-%d') AS event_date,
               TIME_FORMAT(b.start_time, '%H:%i') AS start_time,
               TIME_FORMAT(b.end_time, '%H:%i') AS end_time,
               b.guests, b.total_price, b.status, b.notes, b.created_at,
               h.name AS hall_name, h.image_url AS hall_image,
               u.name AS user_name, u.email AS user_email, u.phone AS user_phone
        FROM bookings b
        JOIN halls h ON h.id = b.hall_id
        JOIN users u ON u.id = b.user_id`;
      if (userId !== undefined) {
        sql += ' WHERE b.user_id = ?';
        params.push(userId);
      }
      sql += ' ORDER BY b.created_at DESC';
      const [rows] = await getPool().execute<RowDataPacket[]>(sql, params);
      const [pivot] = await getPool().execute<RowDataPacket[]>(
        'SELECT bs.booking_id, s.* FROM booking_services bs JOIN services s ON s.id = bs.service_id'
      );
      return rows.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        hall_id: r.hall_id,
        event_type: r.event_type,
        event_date: r.event_date,
        start_time: r.start_time,
        end_time: r.end_time,
        guests: Number(r.guests),
        total_price: Number(r.total_price),
        status: r.status,
        notes: r.notes || '',
        created_at: new Date(r.created_at).toISOString(),
        hall_name: r.hall_name,
        hall_image: r.hall_image,
        user_name: r.user_name,
        user_email: r.user_email,
        user_phone: r.user_phone,
        services: pivot
          .filter((p) => p.booking_id === r.id)
          .map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: Number(p.price),
            icon: p.icon,
            category: p.category,
          })),
      }));
    }

    const db = getLocalDb();
    return db.bookings
      .filter((b) => userId === undefined || b.user_id === userId)
      .map((b) => {
        const hall = db.halls.find((h) => h.id === b.hall_id);
        const user = db.users.find((u) => u.id === b.user_id);
        const svcIds = db.booking_services.filter((bs) => bs.booking_id === b.id).map((bs) => bs.service_id);
        const services = db.services.filter((s) => svcIds.includes(s.id));
        return {
          ...b,
          hall_name: hall?.name || 'Hall',
          hall_image: hall?.image_url || '',
          user_name: user?.name || 'Guest',
          user_email: user?.email || '',
          user_phone: user?.phone || '',
          services,
        };
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async updateBookingStatus(id: number, status: 'pending' | 'confirmed' | 'cancelled'): Promise<BookingDetailed | null> {
    if (isMysqlActive()) {
      await getPool().execute('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
      return this.getBookingById(id);
    }
    const db = getLocalDb();
    const booking = db.bookings.find((b) => b.id === id);
    if (!booking) return null;
    if (status !== 'cancelled') {
      const conflict = await this.hasBookingConflict(
        booking.hall_id,
        booking.event_date,
        booking.start_time,
        booking.end_time,
        booking.id
      );
      if (conflict) throw new Error('SLOT_CONFLICT');
    }
    booking.status = status;
    saveLocalDb(db);
    return this.getBookingById(id);
  },

  async deleteBooking(id: number): Promise<void> {
    if (isMysqlActive()) {
      await getPool().execute('DELETE FROM bookings WHERE id = ?', [id]);
      return;
    }
    const db = getLocalDb();
    db.bookings = db.bookings.filter((b) => b.id !== id);
    db.booking_services = db.booking_services.filter((bs) => bs.booking_id !== id);
    saveLocalDb(db);
  },

  // ---------------- CONTACT MESSAGES ----------------
  async createContactMessage(input: { name: string; email: string; message: string }): Promise<ContactMessageRecord> {
    if (isMysqlActive()) {
      const [res] = await getPool().execute<ResultSetHeader>(
        'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)',
        [input.name, input.email, input.message]
      );
      return {
        id: res.insertId,
        name: input.name,
        email: input.email,
        message: input.message,
        is_read: false,
        created_at: new Date().toISOString(),
      };
    }
    const db = getLocalDb();
    const record: ContactMessageRecord = {
      id: nextId(db, 'contact_messages'),
      name: input.name,
      email: input.email,
      message: input.message,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    db.contact_messages.unshift(record);
    saveLocalDb(db);
    return record;
  },

  async listContactMessages(): Promise<ContactMessageRecord[]> {
    if (isMysqlActive()) {
      const [rows] = await getPool().execute<RowDataPacket[]>(
        'SELECT * FROM contact_messages ORDER BY created_at DESC'
      );
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        message: r.message,
        is_read: Boolean(r.is_read),
        created_at: new Date(r.created_at).toISOString(),
      }));
    }
    return [...getLocalDb().contact_messages];
  },

  async markContactMessageRead(id: number, isRead: boolean): Promise<void> {
    if (isMysqlActive()) {
      await getPool().execute('UPDATE contact_messages SET is_read = ? WHERE id = ?', [isRead ? 1 : 0, id]);
      return;
    }
    const db = getLocalDb();
    const msg = db.contact_messages.find((m) => m.id === id);
    if (msg) {
      msg.is_read = isRead;
      saveLocalDb(db);
    }
  },

  async deleteContactMessage(id: number): Promise<void> {
    if (isMysqlActive()) {
      await getPool().execute('DELETE FROM contact_messages WHERE id = ?', [id]);
      return;
    }
    const db = getLocalDb();
    db.contact_messages = db.contact_messages.filter((m) => m.id !== id);
    saveLocalDb(db);
  },

  // ---------------- ACTIVITY LOGS & SETTINGS ----------------
  async logAdminAction(adminId: number | null, action: string, ipAddress: string): Promise<void> {
    if (isMysqlActive()) {
      await getPool().execute(
        'INSERT INTO activity_logs (admin_id, action, ip_address) VALUES (?, ?, ?)',
        [adminId, action.slice(0, 250), ipAddress.slice(0, 60)]
      );
      return;
    }
    const db = getLocalDb();
    db.activity_logs.unshift({
      id: nextId(db, 'activity_logs'),
      admin_id: adminId,
      action: action.slice(0, 250),
      ip_address: ipAddress.slice(0, 60),
      created_at: new Date().toISOString(),
    });
    if (db.activity_logs.length > 250) {
      db.activity_logs = db.activity_logs.slice(0, 250);
    }
    saveLocalDb(db);
  },

  async listActivityLogs(limit = 50): Promise<Array<ActivityLogRecord & { admin_name: string }>> {
    if (isMysqlActive()) {
      const [rows] = await getPool().execute<RowDataPacket[]>(
        `SELECT a.*, COALESCE(u.name, 'System') AS admin_name
         FROM activity_logs a
         LEFT JOIN users u ON u.id = a.admin_id
         ORDER BY a.created_at DESC
         LIMIT ?`,
        [limit]
      );
      return rows.map((r) => ({
        id: r.id,
        admin_id: r.admin_id,
        action: r.action,
        ip_address: r.ip_address,
        created_at: new Date(r.created_at).toISOString(),
        admin_name: r.admin_name,
      }));
    }
    const db = getLocalDb();
    return db.activity_logs.slice(0, limit).map((l) => {
      const admin = db.users.find((u) => u.id === l.admin_id);
      return { ...l, admin_name: admin?.name || 'System' };
    });
  },

  async getSettings(): Promise<BusinessSettings> {
    return { ...getLocalDb().settings };
  },

  async updateSettings(next: Partial<BusinessSettings>): Promise<BusinessSettings> {
    const db = getLocalDb();
    db.settings = { ...db.settings, ...next };
    saveLocalDb(db);
    return { ...db.settings };
  },
};
