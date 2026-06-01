# Arsenal Supporters Club Ghana — v1.6.0

Official website for Arsenal Supporters Club Ghana (ASC Ghana). Built with Next.js 14, TypeScript, MySQL/MariaDB, and a fully route-and-database-driven admin panel.

---

## What's New in v1.6.0

| Area | Change |
|------|--------|
| **Settings Persistence** | Settings, uploads config, and auth settings now survive page refresh via `localStorage` fallback layer — works even when DB is temporarily unavailable |
| **Theme Flash Fixed** | Light/dark theme is read from `localStorage` instantly on mount, then reconciled with DB — no more white flash on dark mode |
| **Auth Settings** | Added `useEffect` sync so auth page populates correctly after async DB load |
| **Storage Settings** | Added `useEffect` sync so Cloudinary/S3/ImgBB fields repopulate after async DB load |
| **member_id Out-of-Range** | Fixed `INT` overflow — `members.id` and all `member_id` FK columns changed to `BIGINT`. Member IDs now use sequential integer (not `Date.now()` 13-digit timestamp) |
| **Button Color** | `btn-arsenal` updated to exact `#e30613` (Arsenal official) with chamfer `clip-path` matching arsenal.com style |
| **Light Theme Text** | Comprehensive CSS fixes for text visibility in light mode — inputs, cards, sections all readable |
| **Dark Theme Text** | Explicit `color-scheme: dark` on admin scope, all text uses CSS variables correctly |

---

## Requirements

- Node.js 18+
- MySQL 8.0+ or MariaDB 10.6+
- npm or yarn

---

## Fresh Install

```bash
# 1. Clone and install
cd ascghana
npm install

# 2. Database — import schema
mysql -u root -p ascghana < database/schema.sql

# 3. Environment
cp .env.example .env.local
# Edit .env.local — set DATABASE_URL, NEXTAUTH_SECRET, etc.

# 4. Run
npm run dev        # development
npm run build && npm start  # production
```

---

## Upgrading

### From v1.5.0 → v1.6.0
```bash
# Back up your database first!
mysqldump -u root -p ascghana > backup-before-v1.6.sql

# Run upgrade script (includes v1.5.0 + v1.6.0 changes)
mysql -u root -p ascghana < database/upgrade-v1.5.0.sql

# Replace source files, then rebuild
npm install && npm run build && npm start
```

### From v1.4.x → v1.6.0
Run schema.sql on a fresh DB, or run both upgrade scripts in order.

---

## Environment Variables

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/ascghana

# Auth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://yourdomain.com

# Cloudinary (or configure in Admin → Storage & Uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email (or configure in Admin → Authentication)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@arsenalghana.com

# SMS/Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

---

## Admin Panel — Settings Reference

| Setting | URL | Persists? |
|---------|-----|-----------|
| Homepage Sections + Backgrounds | `/admin/settings/homepage` | ✅ DB + localStorage |
| Logo & Branding | `/admin/settings/branding` | ✅ DB + localStorage |
| Typography / Fonts | `/admin/settings/fonts` | ✅ DB + localStorage |
| Button Styles (CRUD + clips) | `/admin/settings/buttons` | ✅ DB + localStorage |
| Menu & Navigation (CRUD) | `/admin/settings/menu` | ✅ DB + localStorage |
| Storage & Uploads (Cloudinary) | `/admin/settings/uploads` | ✅ DB + localStorage |
| Social Media | `/admin/settings/social` | ✅ DB + localStorage |
| Contact Page | `/admin/settings/contact` | ✅ DB + localStorage |
| **Authentication + Email/SMS** | `/admin/settings/authentication` | ✅ DB + localStorage |
| Maintenance & Security | `/admin/settings/security` | ✅ DB + localStorage |
| Backup & Database | `/admin/settings/database` | ✅ DB |

---

## Known Architecture Notes

- **Storage fallback:** All settings write to `localStorage` immediately + async to DB. On page load, `localStorage` is read first (instant), then DB value overwrites it (after ~50–200ms). This means settings always show even if DB is down.
- **Theme:** Same two-layer approach — no flash on load.
- **Member IDs:** Must always be sequential integers ≤ 9,223,372,036,854,775,807 (BIGINT max). Never use `Date.now()` (13-digit, overflows INT).
- **Admin panel:** Always dark mode regardless of public site theme.
- **Button clip-path:** Uses `polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)` — chamfer corners matching arsenal.com editorial style.

---

## Database Tables (v1.6.0)

All from v1.5.0 plus:
- `members.id` → `BIGINT`
- All `member_id` FK columns → `BIGINT`
- `system_upgrade_log` entry for v1.6.0

---

## License

Private — Arsenal Supporters Club Ghana. All rights reserved.

Developed by Eighty7 Tech — https://eighty7tech.com
