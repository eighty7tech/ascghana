# Changelog — Arsenal SC Ghana Member Portal

---

## [1.7.0] — 2026-05-30 — Button System, Icon Settings & UI Fixes

### New Features
- **Icon Settings** — new admin page `/admin/settings/icons` with size slider (10–48px), colour picker with Arsenal presets, FontAwesome style selector (solid/regular/light/thin/duotone/brands), live preview gallery; `iconSettings` persisted to app_state
- **Arsenal Full Button System** — complete CSS button library added to globals.css: `btn-primary`, `btn-glow`, `btn-secondary-a`, `btn-gold-full`, `btn-gold-outline-full`, `btn-hero-full`, plus size modifiers `btn-sm`, `btn-md`, `btn-lg`; uses clip-path chamfer design with `--arsenal-corner` CSS variable
- **Button "Set as Default"** — each button in the Button Styles admin now has a "Set as Global Default" toggle that persists `activeButtonId` to settings; selected button is highlighted with a red indicator
- **Per-Section Button Assignment** — new "Section Assignments" tab in Button Styles admin lets admins choose a specific button for hero, stats, countdown, bulletin, events, membership, shop, and sponsors sections independently
- **`useButtonStyle()` hook** — exported from `AppContext`; resolves the correct button CSS style object for any section (checks `sectionButtonIds[section]` → `activeButtonId` → first defined)
- **New DB Tables** — `section_button_assignments`, `icon_presets`; new columns on `button_styles` (`css_class`, `is_active`, `section_tags`)

### Fixes
- **Button settings not applying to frontend** — root cause was no mechanism to propagate `activeButtonId` to components; fixed via `useButtonStyle` hook and `activeButtonId`/`sectionButtonIds` in settings
- **Admin form padding/margin** — added `.form-group`, `.form-row`, `.form-row-2/3/4`, `.form-label`, `.form-input`, `.form-select`, `.form-textarea`, `.insert-box` CSS utility classes under `.admin-scope` with correct 1.25rem gaps and 10px 14px input padding
- **Members dashboard text — light theme** — `--tw-muted-foreground` value darkened from 47% lightness to 35% (was near-invisible on white background); added `.member-scope` CSS helpers to enforce `var(--text-primary)` / `var(--text-muted)` on member pages
- **Settings page version** — bumped to v1.7.0

### Database
- Run `database/upgrade-v1.7.0.sql` to apply changes to an existing install
- `schema.sql` updated to v1.7.0 for fresh installs

---

## [1.0.0] — 2025-05-21 — First Stable Release

### Overview
Complete ground-up build of the Arsenal Supporters Club Ghana member portal.
Every feature is database-driven, every setting persists to MySQL, and every
form is connected to a real API route with proper error handling.

---

### Authentication & Security
- **Member login** — credentials verified via `/api/auth/precheck` without creating
  a session; session only created after 2FA (if enabled) is confirmed
- **Two-factor authentication** — email OTP via SMTP; sent, verified, cleared via
  dedicated `/api/auth/2fa` routes; dev mode shows code in toast
- **Admin login** — separate session table, locked-out after configurable attempts
- **Forgot password** — sends reset email via SMTP, membership-number based
- **Social login** — Google and Facebook OAuth fields wired to settings
- **Session security** — SHA-256 token hashing, configurable expiry, lockout duration
- **Pre-check API** — `/api/auth/precheck` returns user info without setting cookie

### Payments — Real Integration
- **Paystack** — real redirect via `/api/payment/initiate`, verified via
  `/api/payment/verify`, webhook at `/api/payment/webhook/paystack` (HMAC-verified)
- **Flutterwave** — real redirect, webhook at `/api/payment/webhook/flutterwave`
- **Manual gateways** — MTN MoMo, Telecel Cash, AT Cash, Hubtel, Bank Transfer, Cash;
  instructions shown from settings, user enters transaction reference
- **PaymentStep component** — reusable across registration, event booking, match tickets
- **Active gateway first** — the gateway selected in Settings → Payments appears first
  on every payment form; only configured gateways are shown
- **Webhook settings** — URL displayed in UI, secret hash fields in payments settings
- **Webhooks update DB** — `event_bookings` and `ticket_bookings` marked Paid/Confirmed

### Events & Booking
- **Full event CRUD** — title, category, date/time, venue, image upload, rich text
  description, pricing, capacity, fixture link, organizer, tags
- **Arsenal fixture linking** — each event can be linked to a home/away fixture with
  logos, competition, kick-off time
- **Real event booking API** — `/api/events/bookings` with capacity check, duplicate
  check, email notification to booker and admin on create/confirm
- **Event booking payment** — PaymentStep integrated; free events booked instantly;
  paid events go through payment flow then book
- **Admin booking management** — confirm, cancel, check-in, mark paid from table view
- **Email confirmation** — booking confirmation sent to member email on creation and
  on admin confirm action
- **Event attendance** — check-in per event, admin check-in scanner

### Match Tickets
- **Match ticket listings** — seat counts, pricing, category, status
- **Ticket requests** — member submits request, admin approves/declines
- **Ticket bookings** — advanced booking linked to listings; seat count decrements
  server-side via API (not client-only)
- **Payment on ticket requests** — PaymentStep integrated into match tickets page

### Homepage Sections (all DB-driven, all toggleable)
- **Arsenal Fixtures & Results** — upcoming and results tabs, scorelines, team logos
  (uploaded, not links), watch party info, per-fixture ticket link to events
- **Match Countdown** — shows `Arsenal vs Chelsea` (fixture name), live second-by-second
  countdown, watch party callout, event ticket link (not match tickets)
- **Club Stats Bar** — animated counters, add/delete/edit from admin, `dynamic` value
  shows live active member count
- **Member Spotlight** — week/month/quarter with tier-coloured ring, quote, achievement
- **Community Poll** — live votes stored in `poll_votes` table, deduped by member ID or
  IP, results animate after voting
- **Sponsors Section** — tiered display (title/gold/silver/bronze/partner), logos always
  fully visible (no grayscale, no hover required), Become a Partner CTA
- **Bulletin Board** — filtered by type, priority-sorted, expiry-aware (removed from
  homepage; remains in member dashboard and admin)
- Section order: NewsTicker → Stats → Countdown → Fixtures → Events → Members Update
  → Spotlight → Poll → Tiers → Blog → Sponsors → Gallery → Social → Footer

### Admin Panel — Reorganised
Nav sections:
- **Overview** — Dashboard, Analytics, Announcements
- **Members** — All Members, Add Member, Tiers, Roles, Deletion Requests, Voting
- **Events & Tickets** — Events (with bookings tab), Event Attendance, Ticket Requests,
  Match Tickets, Ticket Bookings
- **Content** — Blog, Gallery, Sponsors, Members Update, Donations, Suggestions,
  Contact Messages, Newsletter, Birthday Emails
- **Shop** — Products, Settings
- **Appearance** — Header, Hero, Footer, Exco, History
- **Settings** — Homepage Sections, Authentication, Admin Login Page, Branding,
  Typography, Payments, Social Media, Social Login, Contact Page, Backup, Security

### Admin Notifications — Real DB Table
- Dedicated `admin_notifications` table (not embedded in settings blob)
- Layout polls `/api/admin/notifications` on mount and every 60 seconds
- `addAdminNotification()` POSTs to DB API (fire-and-forget)
- Mark single read, mark all read, clear all — all persisted to DB

### Settings Persistence Fixes
- **Authentication settings** — all new fields (`twoFaEnabled`, `sessionHours`,
  `memberTwoFaEnabled`, `googleEnabled`, etc.) added to `SiteSettings` interface
  with defaults; `updateSettings()` persists everything to `app_state` DB
- **Admin login page** — saves via `updateSettings()`; login page reads from
  `/api/app-state?key=settings` on load and applies every setting before render
- **Contact page** — fully from admin settings, zero hardcoding
- **Fixtures** — stored in `settings.arsenalFixtures`, saved via `updateSettings()`

### Visual & UX Fixes
- **Light theme** — comprehensive CSS overrides for all content sections; inputs,
  textareas, selects all visible; cards readable; footer always dark
- **Rich Text Editor** — full toolbar (bold/italic/underline/lists/align/headings/link/
  blockquote/clear), works in both dark and light theme, no external library
- **Sponsor logos** — always fully visible (`opacity: 1`, no grayscale); only hover
  adds a scale transform
- **Image upload** — `ImageUploadField` component for all image inputs: drag-and-drop,
  click-to-upload, URL fallback, preview, remove; used across events, branding, fixtures
- **Gallery multi-upload** — uploads in parallel batches of 3, saves state once after
  all files complete (previously saved after each file causing re-render issues)
- **Page headers** — `PageHeader` component with DB-driven background (colour/gradient/
  image), overlay, text colour, breadcrumbs

### New API Routes
`/api/auth/precheck` · `/api/auth/forgot-password` · `/api/payment/initiate`
`/api/payment/verify` · `/api/payment/webhook/paystack`
`/api/payment/webhook/flutterwave` · `/api/events/bookings` · `/api/fixtures`
`/api/votes` · `/api/admin/notifications` · `/api/admin/members/[id]`
`/api/admin/settings/admin-login` · `/api/announcements` · `/api/sponsors`
`/api/attendance` · `/api/member-deletion-requests` · `/api/analytics`

### Database
- **One master schema** — `database/schema.sql` — 34 tables, triggers, default data
- **Safe upgrade script** — `database/upgrade.sql` — `ALTER TABLE … ADD COLUMN IF NOT EXISTS` for all new columns
- Old migration files (`migration-v6-to-v7.sql`, `migration-v7-to-v8.sql`, `schema-v7.sql`) superseded by `schema.sql` v1.0.0

### Components Added
`PaymentStep` · `ImageUploadField` · `ArsenalFixturesSection` · `MatchCountdownSection`
`ClubStatsSection` · `MemberSpotlightSection` · `CommunityPollSection` · `BulletinBoardSection`
`PageHeader` · `AnnouncementsBanner`

---

*Previous development versions (v5–v8.x) were pre-release iterations.*
*Version 1.0.0 is the first production-ready release.*

---

## [1.0.1] — 2025-05-28 — Design Overhaul & New Features

### Design System
- **Light theme as default** — Arsenal.com-inspired light-first design; dark toggle retained
- **No Flash of Unstyled Content** — inline script in `<head>` reads localStorage before first paint
- **Admin panel always dark** — `data-theme="dark"` forced on admin wrapper; never affected by global theme
- **Arsenal.com colour palette** — `#EF0107` red, `#C6A84B` gold, cream `#F5F0E8`, dark `#1A0909`
- **N5 (Northbank) font** — used for all headings, nav labels, and menu items
- **Chapman font** — used for all body text and descriptions
- **Graceful font fallbacks** — Oswald/Barlow used when custom fonts not loaded
- **New CSS design tokens** — `--color-red`, `--color-gold`, `--bg-primary/secondary/card`, `--text-primary/secondary/muted`, `--shadow-sm/md/lg/red/gold`, `--grad-red/gold/hero`, `--topbar-height`, `--nav-height`, `--section-pad`
- **New utility classes** — `.btn-arsenal`, `.btn-arsenal-outline`, `.btn-arsenal-ghost`, `.asc-card`, `.section-label`, `.topbar`, `.site-nav`, `.nav-link`, `.hero-title`, `.page-header`, `.badge-*`, `.sponsor-logo`

### Navbar
- **Full redesign** — Arsenal.com two-tier layout (red top bar + white nav)
- **Top bar** — configurable red strip with social icons, quick links, member login
- **Dropdown menus** — animated hover dropdowns with description text
- **Mobile menu** — full-height slide-down with all links and CTAs
- **CTA button** — configurable label, href, and visibility

### Navbar Settings (Admin → Settings → Navbar)
- Logo upload with drag-and-drop, URL fallback, size control
- Site name and tagline
- Navigation appearance: style (light/dark/transparent), sticky behaviour, background colour
- Top bar: toggle on/off, background colour, unlimited quick links with icon picker
- Navigation links: full CRUD with drag-to-reorder
- Dropdown items: add/remove sub-links with descriptions per nav item
- Live preview showing top bar + nav with real settings applied

### Maintenance, Backup & Security (Admin → Settings → Maintenance & Security)
- **Maintenance mode** — toggle from admin, frontend immediately shows maintenance page
- **Maintenance middleware** — Next.js middleware intercepts all public routes and redirects to `/maintenance`
- **Maintenance page** — branded Arsenal SC Ghana styled page with custom message
- **Backup** — full JSON backup of all app_state data; settings-only backup; download button
- **Backup history** — tracked in `backup_registry` DB table
- **Restore** — upload JSON backup file to restore all settings
- **Security settings** — rate limiting, login lockout, CSRF, IP blocking (ban list)
- **Upgrade tab** — version info, update check, migration check
- **Security log** — view and clear `security_log` DB table entries

### Footer
- **Redesigned** — Arsenal.com dark footer with red accent divider
- **4-column links** — Club, Membership, Media, Legal
- **Contact strip** — email, phone, address from settings
- **Social links** — icon buttons from settings.socialLinks
- **DB-driven** — zero hardcoded content; all from settings

### New API Routes
- `GET/POST/PUT /api/admin/backup` — backup list, create, download, restore
- `GET/POST/DELETE /api/admin/security-log` — security event logging and viewing
