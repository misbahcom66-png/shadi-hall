# Aurelia Grand Hall — Setup & Deployment Guide

This guide covers setting up the application locally with **MySQL 8+**, configuring security secrets, and running the production server behind HTTPS.

---

## 1. Prerequisites
- **Node.js** 20+ and **npm**
- **MySQL** 8.0+ (optional for quick local preview: when `DB_HOST` is left blank in `.env`, the backend automatically runs an embedded transactional store persisted to `.data/db.json` with identical validation, bcrypt hashing, and conflict checks)

---

## 2. Database Setup (MySQL)
1. Log in to your MySQL server:
   ```bash
   mysql -u root -p
   ```
2. Run the schema and seed scripts:
   ```bash
   mysql -u root -p < database/schema.sql
   mysql -u root -p < database/seed.sql
   ```
   This creates the `shadhall_booking` database (`utf8mb4`), all 8 tables, foreign keys, indexes, and the double-booking prevention triggers (`trg_prevent_double_booking_insert` and `trg_prevent_double_booking_update`).

---

## 3. Environment Configuration
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

Generate strong cryptographic secrets for JWT and CSRF:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Configure `.env`:
```env
PORT=3000
NODE_ENV=production
APP_URL="https://yourdomain.com"

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=shadhall_user
DB_PASSWORD="your_strong_mysql_password"
DB_NAME=shadhall_booking

JWT_SECRET="your_generated_64_char_secret_1"
JWT_REFRESH_SECRET="your_generated_64_char_secret_2"
CSRF_SECRET="your_generated_64_char_secret_3"
```

---

## 4. Install Dependencies & Run
```bash
npm install
npm run dev
```
The Express + Vite server runs on `http://localhost:3000`.

For production:
```bash
npm run build
npm start
```

---

## 5. Default Accounts & Admin 2FA
- **Public Customer Demo**: `customer@example.com` / `Customer123!`
- **Admin Dashboard Login** (`/admin/login` — not linked in public navbar):
  - Email: `admin@aureliahall.com`
  - Password: `AdminSecure123!`
- **Enable Two-Factor Authentication (TOTP)**:
  1. Sign in at `/admin/login`.
  2. Open **Settings** in the left sidebar.
  3. Click **Generate 2FA QR Code**, scan it with Google Authenticator or Authy, and enter the 6-digit code to activate TOTP protection.

---

## 6. Security Checklist for Production
- Serve behind a TLS-terminating reverse proxy (Nginx / Cloudflare / Cloud Run) with `x-forwarded-proto: https`. The Express server automatically redirects plain HTTP requests to HTTPS when `NODE_ENV=production`.
- Rotate `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `ADMIN_SEED_PASSWORD` immediately after initial setup.
- Restrict MySQL user permissions to `SELECT, INSERT, UPDATE, DELETE` on `shadhall_booking.*` only.
