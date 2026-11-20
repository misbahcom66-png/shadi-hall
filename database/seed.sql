-- ============================================================================
-- Aurelia Grand Hall — Seed Data
-- Note: Demo password hashes below are generated with bcrypt (12 salt rounds).
-- Admin login: admin@aureliahall.com / AdminSecure123!
-- Customer login: customer@example.com / Customer123!
-- ============================================================================

USE shadhall_booking;

INSERT INTO users (id, name, email, phone, password_hash, role) VALUES
  (1, 'Site Administrator', 'admin@aureliahall.com', '+1 (555) 200-1000', '$2b$12$8K6Q2y5uX0xX.w9d6iM7UOvK4N0Q5rX4uD6B6x2gP3H4F7m5yQ2aO', 'admin'),
  (2, 'Claire Bennett', 'customer@example.com', '+1 (555) 314-7890', '$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user'),
  (3, 'Daniel Harrison', 'daniel.harrison@example.com', '+1 (555) 482-3310', '$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO halls (id, name, description, capacity, price, image_url, amenities, status) VALUES
  (
    1,
    'The Royal Grand Ballroom',
    'Our flagship wedding and gala ballroom featuring soaring vaulted ceilings, hand-cut crystal chandeliers, polished marble floors, and a dedicated private bridal suite.',
    800,
    4500.00,
    '/src/assets/images/hall_royal_ballroom_1794825122864.jpg',
    'Crystal Chandeliers, Bridal Suite, Acoustic Sound System, Stage Platform, Dedicated Valet Entrance, Climate Control',
    'active'
  ),
  (
    2,
    'The Sapphire Glass Pavilion',
    'Contemporary architectural venue wrapped in floor-to-ceiling glass overlooking illuminated botanical gardens. Ideal for modern receptions and evening banquets.',
    450,
    3200.00,
    '/src/assets/images/hall_emerald_pavilion_1794825122560.jpg',
    'Garden Terrace Access, LED Uplighting, Private Bar Lounge, Coat Check, High-Speed Wi-Fi, Prep Kitchen',
    'active'
  ),
  (
    3,
    'The Garden Conservatory',
    'Sunlit glasshouse sanctuary framed by manicured greenery and limestone walkways. Designed for intimate daytime ceremonies, nikah gatherings, and floral receptions.',
    220,
    2400.00,
    '/src/assets/images/hall_garden_courtyard_1794825123834.jpg',
    'Natural Daylight Roof, Ceremony Arch Anchor, Chiavari Seating, Climate-Controlled Glasshouse, Patio Lounge',
    'active'
  ),
  (
    4,
    'The Imperial Heritage Suite',
    'Refined dining hall with classic ivory paneling, recessed warm lighting, and bespoke banquet seating tailored for family dinners, engagements, and milestone celebrations.',
    160,
    1850.00,
    '/src/assets/images/hall_imperial_suite_1794825124776.jpg',
    'Private Dining Layout, Taper Candle Settings, Integrated AV Projection, Dedicated Hospitality Captain',
    'active'
  )
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO hall_images (hall_id, image_url) VALUES
  (1, '/src/assets/images/hall_royal_ballroom_1794825122864.jpg'),
  (1, '/src/assets/images/service_floral_decor_1794825125083.jpg'),
  (1, '/src/assets/images/service_catering_banquet_1794825124313.jpg'),
  (2, '/src/assets/images/hall_emerald_pavilion_1794825122560.jpg'),
  (2, '/src/assets/images/service_catering_banquet_1794825124313.jpg'),
  (3, '/src/assets/images/hall_garden_courtyard_1794825123834.jpg'),
  (3, '/src/assets/images/service_floral_decor_1794825125083.jpg'),
  (4, '/src/assets/images/hall_imperial_suite_1794825124776.jpg'),
  (4, '/src/assets/images/service_catering_banquet_1794825124313.jpg');

INSERT INTO services (id, name, description, price, icon, category) VALUES
  (1, 'Signature Banquet Catering', 'Full-course plated or buffet dining crafted by our executive culinary team with customized regional and international menus.', 1200.00, 'utensils', 'catering'),
  (2, 'Floral & Stage Decoration', 'Custom floral archways, ivory drapery, centerpiece arrangements, and stage styling tailored to your ceremony palette.', 850.00, 'flower', 'decoration'),
  (3, 'Valet Parking & Security', 'Dedicated uniformed security officers, traffic marshals, and complimentary valet parking for up to 250 guest vehicles.', 450.00, 'shield', 'parking'),
  (4, 'Concert Sound & Lighting', 'Line-array acoustic audio, wireless microphones, intelligent ambient uplighting, and dedicated technical engineer on-site.', 650.00, 'music', 'sound-lighting')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO bookings (id, user_id, hall_id, event_type, event_date, start_time, end_time, guests, total_price, status, notes) VALUES
  (1, 2, 1, 'Wedding Reception', DATE_ADD(CURDATE(), INTERVAL 14 DAY), '17:00:00', '23:00:00', 520, 6550.00, 'confirmed', 'Ivory and navy floral theme requested.'),
  (2, 3, 2, 'Engagement Gala', DATE_ADD(CURDATE(), INTERVAL 21 DAY), '18:00:00', '22:30:00', 260, 4050.00, 'pending', 'Vegetarian menu option for 40 guests.'),
  (3, 2, 3, 'Daytime Ceremony', DATE_ADD(CURDATE(), INTERVAL 28 DAY), '11:00:00', '15:00:00', 140, 3250.00, 'confirmed', 'Garden aisle runner and acoustic string trio.')
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO booking_services (booking_id, service_id) VALUES
  (1, 1),
  (1, 2),
  (2, 2),
  (3, 2)
ON DUPLICATE KEY UPDATE service_id = VALUES(service_id);

INSERT INTO contact_messages (name, email, message, is_read) VALUES
  ('Sophia Alvarez', 'sophia.alvarez@example.com', 'We are planning an autumn wedding for 380 guests and would love to tour The Sapphire Glass Pavilion next week.', 0),
  ('Marcus Grant', 'm.grant@example.com', 'Can we schedule a private tasting session for our corporate annual awards gala in December?', 1);
