-- ============================================================================
-- Aurelia Grand Hall — MySQL 8.0+ Database Schema
-- Charset: utf8mb4 / Collation: utf8mb4_unicode_ci
-- ============================================================================

CREATE DATABASE IF NOT EXISTS shadhall_booking
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE shadhall_booking;

-- 1. Users table (Customers & Admins)
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(30) NOT NULL DEFAULT '',
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  totp_secret VARCHAR(128) NULL DEFAULT NULL,
  totp_enabled TINYINT(1) NOT NULL DEFAULT 0,
  failed_attempts INT UNSIGNED NOT NULL DEFAULT 0,
  locked_until DATETIME NULL DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Halls table
CREATE TABLE IF NOT EXISTS halls (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  capacity INT UNSIGNED NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  amenities TEXT NULL,
  status ENUM('active', 'maintenance') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_halls_status (status),
  KEY idx_halls_capacity (capacity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Hall Gallery Images table
CREATE TABLE IF NOT EXISTS hall_images (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  hall_id INT UNSIGNED NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_hall_images_hall_id (hall_id),
  CONSTRAINT fk_hall_images_hall
    FOREIGN KEY (hall_id) REFERENCES halls(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Extra Services table
CREATE TABLE IF NOT EXISTS services (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(140) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  icon VARCHAR(60) NOT NULL DEFAULT 'sparkles',
  category VARCHAR(60) NOT NULL DEFAULT 'catering',
  PRIMARY KEY (id),
  KEY idx_services_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  hall_id INT UNSIGNED NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  guests INT UNSIGNED NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled') NOT NULL DEFAULT 'pending',
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bookings_user_id (user_id),
  KEY idx_bookings_hall_date (hall_id, event_date),
  KEY idx_bookings_status (status),
  CONSTRAINT fk_bookings_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_bookings_hall
    FOREIGN KEY (hall_id) REFERENCES halls(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT chk_bookings_time_order CHECK (start_time < end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Booking-Services Pivot table
CREATE TABLE IF NOT EXISTS booking_services (
  booking_id INT UNSIGNED NOT NULL,
  service_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (booking_id, service_id),
  KEY idx_booking_services_service_id (service_id),
  CONSTRAINT fk_bs_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_bs_service
    FOREIGN KEY (service_id) REFERENCES services(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Contact Messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_contact_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Admin Activity Logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_id INT UNSIGNED NULL,
  action VARCHAR(255) NOT NULL,
  ip_address VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_activity_admin_id (admin_id),
  KEY idx_activity_created_at (created_at),
  CONSTRAINT fk_activity_admin
    FOREIGN KEY (admin_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Database-level trigger to prevent overlapping active bookings on the same hall & date
DELIMITER $$
CREATE TRIGGER trg_prevent_double_booking_insert
BEFORE INSERT ON bookings
FOR EACH ROW
BEGIN
  IF NEW.status <> 'cancelled' THEN
    IF EXISTS (
      SELECT 1 FROM bookings
      WHERE hall_id = NEW.hall_id
        AND event_date = NEW.event_date
        AND status <> 'cancelled'
        AND start_time < NEW.end_time
        AND end_time > NEW.start_time
    ) THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Time slot conflict: This hall is already booked during the requested hours.';
    END IF;
  END IF;
END$$

CREATE TRIGGER trg_prevent_double_booking_update
BEFORE UPDATE ON bookings
FOR EACH ROW
BEGIN
  IF NEW.status <> 'cancelled' THEN
    IF EXISTS (
      SELECT 1 FROM bookings
      WHERE hall_id = NEW.hall_id
        AND event_date = NEW.event_date
        AND id <> NEW.id
        AND status <> 'cancelled'
        AND start_time < NEW.end_time
        AND end_time > NEW.start_time
    ) THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Time slot conflict: This hall is already booked during the requested hours.';
    END IF;
  END IF;
END$$
DELIMITER ;
