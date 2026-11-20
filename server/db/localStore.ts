import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.ts';

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: 'user' | 'admin';
  totp_secret: string | null;
  totp_enabled: boolean;
  failed_attempts: number;
  locked_until: string | null;
  created_at: string;
}

export interface HallRecord {
  id: number;
  name: string;
  description: string;
  capacity: number;
  price: number;
  image_url: string;
  amenities: string;
  status: 'active' | 'maintenance';
  created_at: string;
}

export interface HallImageRecord {
  id: number;
  hall_id: number;
  image_url: string;
}

export interface ServiceRecord {
  id: number;
  name: string;
  description: string;
  price: number;
  icon: string;
  category: string;
}

export interface BookingRecord {
  id: number;
  user_id: number;
  hall_id: number;
  event_type: string;
  event_date: string;
  start_time: string;
  end_time: string;
  guests: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes: string;
  created_at: string;
}

export interface BookingServiceRecord {
  booking_id: number;
  service_id: number;
}

export interface ContactMessageRecord {
  id: number;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ActivityLogRecord {
  id: number;
  admin_id: number | null;
  action: string;
  ip_address: string;
  created_at: string;
}

export interface BusinessSettings {
  businessName: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  openingHours: string;
}

export interface LocalDbSchema {
  users: UserRecord[];
  halls: HallRecord[];
  hall_images: HallImageRecord[];
  services: ServiceRecord[];
  bookings: BookingRecord[];
  booking_services: BookingServiceRecord[];
  contact_messages: ContactMessageRecord[];
  activity_logs: ActivityLogRecord[];
  settings: BusinessSettings;
  counters: Record<string, number>;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function futureDateISO(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

function createInitialData(): LocalDbSchema {
  const now = new Date().toISOString();
  const adminHash = bcrypt.hashSync(env.adminSeedPassword, env.bcryptRounds);
  const customerHash = bcrypt.hashSync('Customer123!', env.bcryptRounds);

  return {
    users: [
      {
        id: 1,
        name: 'Site Administrator',
        email: env.adminSeedEmail,
        phone: '+1 (555) 200-1000',
        password_hash: adminHash,
        role: 'admin',
        totp_secret: null,
        totp_enabled: false,
        failed_attempts: 0,
        locked_until: null,
        created_at: now,
      },
      {
        id: 2,
        name: 'Claire Bennett',
        email: 'customer@example.com',
        phone: '+1 (555) 314-7890',
        password_hash: customerHash,
        role: 'user',
        totp_secret: null,
        totp_enabled: false,
        failed_attempts: 0,
        locked_until: null,
        created_at: now,
      },
      {
        id: 3,
        name: 'Daniel Harrison',
        email: 'daniel.harrison@example.com',
        phone: '+1 (555) 482-3310',
        password_hash: customerHash,
        role: 'user',
        totp_secret: null,
        totp_enabled: false,
        failed_attempts: 0,
        locked_until: null,
        created_at: now,
      },
    ],
    halls: [
      {
        id: 1,
        name: 'The Royal Grand Ballroom',
        description:
          'Our flagship wedding and gala ballroom featuring soaring vaulted ceilings, hand-cut crystal chandeliers, polished marble floors, and a dedicated private bridal suite.',
        capacity: 800,
        price: 4500,
        image_url: '/src/assets/images/hall_royal_ballroom_1794825122864.jpg',
        amenities: 'Crystal Chandeliers, Bridal Suite, Acoustic Sound System, Stage Platform, Dedicated Valet Entrance, Climate Control',
        status: 'active',
        created_at: now,
      },
      {
        id: 2,
        name: 'The Sapphire Glass Pavilion',
        description:
          'Contemporary architectural venue wrapped in floor-to-ceiling glass overlooking illuminated botanical gardens. Ideal for modern receptions and evening banquets.',
        capacity: 450,
        price: 3200,
        image_url: '/src/assets/images/hall_emerald_pavilion_1794825122560.jpg',
        amenities: 'Garden Terrace Access, LED Uplighting, Private Bar Lounge, Coat Check, High-Speed Wi-Fi, Prep Kitchen',
        status: 'active',
        created_at: now,
      },
      {
        id: 3,
        name: 'The Garden Conservatory',
        description:
          'Sunlit glasshouse sanctuary framed by manicured greenery and limestone walkways. Designed for intimate daytime ceremonies, cultural rituals, and floral receptions.',
        capacity: 220,
        price: 2400,
        image_url: '/src/assets/images/hall_garden_courtyard_1794825123834.jpg',
        amenities: 'Natural Daylight Roof, Ceremony Arch Anchor, Chiavari Seating, Climate-Controlled Glasshouse, Patio Lounge',
        status: 'active',
        created_at: now,
      },
      {
        id: 4,
        name: 'The Imperial Heritage Suite',
        description:
          'Refined dining hall with classic ivory paneling, recessed warm lighting, and bespoke banquet seating tailored for family dinners, engagements, and milestone celebrations.',
        capacity: 160,
        price: 1850,
        image_url: '/src/assets/images/hall_imperial_suite_1794825124776.jpg',
        amenities: 'Private Dining Layout, Taper Candle Settings, Integrated AV Projection, Dedicated Hospitality Captain',
        status: 'active',
        created_at: now,
      },
    ],
    hall_images: [
      { id: 1, hall_id: 1, image_url: '/src/assets/images/hall_royal_ballroom_1794825122864.jpg' },
      { id: 2, hall_id: 1, image_url: '/src/assets/images/service_floral_decor_1794825125083.jpg' },
      { id: 3, hall_id: 1, image_url: '/src/assets/images/service_catering_banquet_1794825124313.jpg' },
      { id: 4, hall_id: 2, image_url: '/src/assets/images/hall_emerald_pavilion_1794825122560.jpg' },
      { id: 5, hall_id: 2, image_url: '/src/assets/images/service_catering_banquet_1794825124313.jpg' },
      { id: 6, hall_id: 3, image_url: '/src/assets/images/hall_garden_courtyard_1794825123834.jpg' },
      { id: 7, hall_id: 3, image_url: '/src/assets/images/service_floral_decor_1794825125083.jpg' },
      { id: 8, hall_id: 4, image_url: '/src/assets/images/hall_imperial_suite_1794825124776.jpg' },
      { id: 9, hall_id: 4, image_url: '/src/assets/images/service_catering_banquet_1794825124313.jpg' },
    ],
    services: [
      {
        id: 1,
        name: 'Signature Banquet Catering',
        description:
          'Full-course plated or buffet dining crafted by our executive culinary team with customized regional and international menus.',
        price: 1200,
        icon: 'utensils',
        category: 'catering',
      },
      {
        id: 2,
        name: 'Floral & Stage Decoration',
        description:
          'Custom floral archways, ivory drapery, centerpiece arrangements, and stage styling tailored to your ceremony palette.',
        price: 850,
        icon: 'flower',
        category: 'decoration',
      },
      {
        id: 3,
        name: 'Valet Parking & Security',
        description:
          'Dedicated uniformed security officers, traffic marshals, and complimentary valet parking for up to 250 guest vehicles.',
        price: 450,
        icon: 'shield',
        category: 'parking',
      },
      {
        id: 4,
        name: 'Concert Sound & Lighting',
        description:
          'Line-array acoustic audio, wireless microphones, intelligent ambient uplighting, and dedicated technical engineer on-site.',
        price: 650,
        icon: 'music',
        category: 'sound-lighting',
      },
    ],
    bookings: [
      {
        id: 1,
        user_id: 2,
        hall_id: 1,
        event_type: 'Wedding Reception',
        event_date: futureDateISO(6),
        start_time: '17:00',
        end_time: '23:00',
        guests: 520,
        total_price: 6550,
        status: 'confirmed',
        notes: 'Ivory and navy floral theme requested.',
        created_at: now,
      },
      {
        id: 2,
        user_id: 3,
        hall_id: 2,
        event_type: 'Engagement Gala',
        event_date: futureDateISO(12),
        start_time: '18:00',
        end_time: '22:30',
        guests: 260,
        total_price: 4050,
        status: 'pending',
        notes: 'Vegetarian tasting menu for 40 guests.',
        created_at: now,
      },
      {
        id: 3,
        user_id: 2,
        hall_id: 3,
        event_type: 'Daytime Ceremony',
        event_date: futureDateISO(18),
        start_time: '11:00',
        end_time: '15:00',
        guests: 140,
        total_price: 3250,
        status: 'confirmed',
        notes: 'Garden aisle runner and acoustic string trio.',
        created_at: now,
      },
      {
        id: 4,
        user_id: 3,
        hall_id: 1,
        event_type: 'Corporate Annual Dinner',
        event_date: futureDateISO(25),
        start_time: '19:00',
        end_time: '23:00',
        guests: 410,
        total_price: 5700,
        status: 'confirmed',
        notes: 'Podium microphone and projection screen needed.',
        created_at: now,
      },
    ],
    booking_services: [
      { booking_id: 1, service_id: 1 },
      { booking_id: 1, service_id: 2 },
      { booking_id: 2, service_id: 2 },
      { booking_id: 3, service_id: 2 },
      { booking_id: 4, service_id: 1 },
    ],
    contact_messages: [
      {
        id: 1,
        name: 'Sophia Alvarez',
        email: 'sophia.alvarez@example.com',
        message: 'We are planning an autumn wedding for 380 guests and would love to tour The Sapphire Glass Pavilion next week.',
        is_read: false,
        created_at: now,
      },
      {
        id: 2,
        name: 'Marcus Grant',
        email: 'm.grant@example.com',
        message: 'Can we schedule a private tasting session for our corporate annual awards gala in December?',
        is_read: true,
        created_at: now,
      },
    ],
    activity_logs: [
      {
        id: 1,
        admin_id: 1,
        action: 'System initialized with seed data',
        ip_address: '127.0.0.1',
        created_at: now,
      },
    ],
    settings: {
      businessName: 'Aurelia Grand Hall',
      tagline: 'Timeless Spaces for Unforgettable Celebrations',
      email: 'concierge@aureliahall.com',
      phone: '+1 (555) 234-8900',
      address: '450 Grand Boulevard, Suite 100, Metropolis, NY 10018',
      openingHours: 'Mon - Sun: 9:00 AM - 10:00 PM',
    },
    counters: {
      users: 3,
      halls: 4,
      hall_images: 9,
      services: 4,
      bookings: 4,
      contact_messages: 2,
      activity_logs: 1,
    },
  };
}

let cachedDb: LocalDbSchema | null = null;

export function getLocalDb(): LocalDbSchema {
  if (cachedDb) return cachedDb;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      cachedDb = JSON.parse(raw) as LocalDbSchema;
      return cachedDb;
    } catch {
      cachedDb = createInitialData();
      saveLocalDb(cachedDb);
      return cachedDb;
    }
  }
  cachedDb = createInitialData();
  saveLocalDb(cachedDb);
  return cachedDb;
}

export function saveLocalDb(db: LocalDbSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  cachedDb = db;
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

export function nextId(db: LocalDbSchema, table: string): number {
  const current = db.counters[table] || 0;
  const next = current + 1;
  db.counters[table] = next;
  return next;
}
