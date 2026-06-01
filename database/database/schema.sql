-- Arsenal Supporters Club Ghana — Universal Database Schema
-- Version: 6.0.0
-- Engine: MySQL 8.0+
-- Updated: 2026-05-03
-- Compatible with MySQL 8.0+, MariaDB 10.6+, and PostgreSQL 14+ (with minor syntax adjustments).
-- Use this schema when migrating to MySQL/PostgreSQL.

-- ══════════════════════════════════════════════════════════════════
-- IMPORTANT: Create your database first, then run this schema.
-- Replace YOUR_DATABASE_NAME with your actual database name.
-- Example: CREATE DATABASE YOUR_DATABASE_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--          USE YOUR_DATABASE_NAME;
-- The database name is set in your .env.local → DATABASE_URL
-- ══════════════════════════════════════════════════════════════════

-- Members
CREATE TABLE IF NOT EXISTS members (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  membership_number VARCHAR(20) NOT NULL UNIQUE,
  first_name      VARCHAR(80) NOT NULL,
  last_name       VARCHAR(80),
  name            VARCHAR(160) NOT NULL,
  email           VARCHAR(160) NOT NULL UNIQUE,
  phone           VARCHAR(30),
  whatsapp        VARCHAR(30),
  date_of_birth   DATE,
  address         TEXT,
  post_gps        VARCHAR(30),
  branch          VARCHAR(80) NOT NULL DEFAULT 'Accra',
  tier            ENUM('Bronze','Silver','Gold','Platinum','Abusua') NOT NULL DEFAULT 'Bronze',
  status          ENUM('Active','Inactive','Frozen','Expired','Pending Renewal') NOT NULL DEFAULT 'Active',
  role            ENUM('member','admin','superadmin','editor','moderator','membership_officer','event_coordinator','ticket_manager','events_moderator') NOT NULL DEFAULT 'member',
  password_hash   VARCHAR(255),
  photo           VARCHAR(500),
  joined          VARCHAR(40),
  renewal_due     VARCHAR(40),
  facebook        VARCHAR(255),
  instagram       VARCHAR(255),
  twitter         VARCHAR(255),
  notif_email     BOOLEAN DEFAULT TRUE,
  notif_sms       BOOLEAN DEFAULT TRUE,
  notif_events    BOOLEAN DEFAULT TRUE,
  notif_tickets   BOOLEAN DEFAULT TRUE,
  notif_renewals  BOOLEAN DEFAULT TRUE,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tier (tier),
  INDEX idx_status (status),
  INDEX idx_branch (branch)
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  date            DATE NOT NULL,
  time            VARCHAR(10),
  venue           VARCHAR(255),
  capacity        INT DEFAULT 100,
  booked          INT DEFAULT 0,
  status          ENUM('Published','Draft','Cancelled') DEFAULT 'Draft',
  category        VARCHAR(80),
  description     TEXT,
  image           VARCHAR(500),
  member_discount BOOLEAN DEFAULT FALSE,
  member_discount_pct INT DEFAULT 0,
  non_member_price DECIMAL(10,2) DEFAULT 0,
  member_price    DECIMAL(10,2),
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Blog posts
CREATE TABLE IF NOT EXISTS posts (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  slug        VARCHAR(255) NOT NULL UNIQUE,
  excerpt     TEXT,
  content     LONGTEXT,
  category    VARCHAR(80),
  author      VARCHAR(160),
  date        VARCHAR(40),
  status      ENUM('Published','Draft') DEFAULT 'Draft',
  views       INT DEFAULT 0,
  featured    BOOLEAN DEFAULT FALSE,
  image       VARCHAR(500),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Membership tiers
CREATE TABLE IF NOT EXISTS tiers (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(40) NOT NULL,
  slug          VARCHAR(40) NOT NULL UNIQUE,
  color         VARCHAR(20),
  icon          VARCHAR(80),
  price         DECIMAL(10,2) NOT NULL,
  renewal_price DECIMAL(10,2) NOT NULL,
  benefits      JSON,
  popular       BOOLEAN DEFAULT FALSE,
  is_family     BOOLEAN DEFAULT FALSE,
  family_members INT DEFAULT 0,
  description   TEXT
);

-- Ticket requests
CREATE TABLE IF NOT EXISTS ticket_requests (
  id                VARCHAR(30) PRIMARY KEY,
  member_id         INT NOT NULL,
  member            VARCHAR(160),
  membership_number VARCHAR(20),
  tier              VARCHAR(40),
  match_name        VARCHAR(255),
  category          ENUM('Category A','Category B','Category C'),
  match_date        VARCHAR(40),
  qty               INT DEFAULT 1,
  section           VARCHAR(80),
  passport          VARCHAR(80),
  status            ENUM('Pending','Approved','Partially Approved','Declined') DEFAULT 'Pending',
  submitted         VARCHAR(40),
  special_request   TEXT,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Match tickets (admin-created windows)
CREATE TABLE IF NOT EXISTS match_tickets (
  id                VARCHAR(30) PRIMARY KEY,
  match_name        VARCHAR(255) NOT NULL,
  competition       VARCHAR(100),
  match_date        VARCHAR(40),
  deadline          VARCHAR(40),
  category          ENUM('A','B','C') DEFAULT 'A',
  tickets_available INT DEFAULT 0,
  ticket_price      DECIMAL(10,2),
  booking_fee       DECIMAL(10,2) DEFAULT 0,
  paystack_charge_pct DECIMAL(5,2) DEFAULT 4,
  status            ENUM('Active','Sold Out','Closed','Hidden') DEFAULT 'Active',
  image             VARCHAR(500),
  notes             TEXT,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Exco / leadership
CREATE TABLE IF NOT EXISTS exco (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(160) NOT NULL,
  position  VARCHAR(120),
  years     VARCHAR(40),
  bio       TEXT,
  initials  VARCHAR(5),
  color     VARCHAR(20),
  type      ENUM('exco','serving') DEFAULT 'exco',
  photo     VARCHAR(500),
  facebook  VARCHAR(255),
  instagram VARCHAR(255),
  twitter   VARCHAR(255),
  sort_order INT DEFAULT 0
);

-- Donations
CREATE TABLE IF NOT EXISTS donations (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(160) NOT NULL,
  description TEXT,
  goal        DECIMAL(12,2),
  raised      DECIMAL(12,2) DEFAULT 0,
  active      BOOLEAN DEFAULT TRUE,
  icon        VARCHAR(80),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Donation transactions
CREATE TABLE IF NOT EXISTS donation_transactions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  donation_id INT NOT NULL,
  member_id   INT,
  amount      DECIMAL(10,2) NOT NULL,
  gateway     VARCHAR(40),
  ref         VARCHAR(100),
  status      ENUM('Pending','Success','Failed') DEFAULT 'Pending',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (donation_id) REFERENCES donations(id)
);

-- Products / shop
CREATE TABLE IF NOT EXISTS products (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  category        VARCHAR(80),
  price           DECIMAL(10,2) NOT NULL,
  stock           INT DEFAULT 0,
  sizes           JSON,
  badge           VARCHAR(40),
  in_stock        BOOLEAN DEFAULT TRUE,
  description     TEXT,
  color           VARCHAR(80),
  icon            VARCHAR(80),
  member_discount BOOLEAN DEFAULT TRUE,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Suggestions
CREATE TABLE IF NOT EXISTS suggestions (
  id          VARCHAR(30) PRIMARY KEY,
  member_id   INT,
  member_name VARCHAR(160),
  member_number VARCHAR(20),
  tier        VARCHAR(40),
  subject     VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  status      ENUM('New','Under Review','Implemented','Dismissed') DEFAULT 'New',
  admin_reply TEXT,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
);

-- Contact messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id         VARCHAR(30) PRIMARY KEY,
  name       VARCHAR(160),
  email      VARCHAR(160),
  subject    VARCHAR(255),
  message    TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_read    BOOLEAN DEFAULT FALSE,
  replied    BOOLEAN DEFAULT FALSE
);

-- Gallery albums
CREATE TABLE IF NOT EXISTS gallery_albums (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(160) NOT NULL,
  description TEXT,
  category    VARCHAR(80),
  cover_color VARCHAR(40),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Gallery images
CREATE TABLE IF NOT EXISTS gallery_images (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  album_id   INT NOT NULL,
  filename   VARCHAR(255),
  url        VARCHAR(500),
  size       VARCHAR(20),
  title      VARCHAR(255),
  is_webp    BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (album_id) REFERENCES gallery_albums(id) ON DELETE CASCADE
);

-- Site settings (single row)
CREATE TABLE IF NOT EXISTS site_settings (
  id         INT PRIMARY KEY DEFAULT 1,
  data       JSON NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Admin notifications
CREATE TABLE IF NOT EXISTS admin_notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  title      VARCHAR(255),
  message    TEXT,
  type       VARCHAR(40) DEFAULT 'info',
  is_read    BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── PRODUCT VARIANTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_variants (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  product_id  INT NOT NULL,
  color       VARCHAR(50),
  size        VARCHAR(20),
  stock       INT NOT NULL DEFAULT 0,
  sku         VARCHAR(100),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ── MEMBER SPOTLIGHT ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS member_spotlight (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  member_id   INT,
  type        ENUM('week','month','quarter') DEFAULT 'week',
  quote       TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  set_by      VARCHAR(100),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at  DATETIME,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
);

-- ── BULLETIN BOARD ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bulletin_board (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  title       VARCHAR(300) NOT NULL,
  body        TEXT,
  type        ENUM('announcement','job','ad','event','news') DEFAULT 'announcement',
  image_url   VARCHAR(500),
  link_url    VARCHAR(500),
  link_label  VARCHAR(100),
  is_active   BOOLEAN DEFAULT TRUE,
  priority    INT DEFAULT 0,
  expires_at  DATETIME,
  created_by  VARCHAR(100),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── ACTIVITY LOG ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_log (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  admin_id    INT,
  action      VARCHAR(200) NOT NULL,
  entity_type VARCHAR(100),
  entity_id   INT,
  details     TEXT,
  ip_address  VARCHAR(45),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── SITE SETTINGS (key-value, survives upgrades) ──────────────────────────
-- The gbpToGhsRate, ticketCurrencyMode, momoNumber etc. persist here
-- These supplement the existing site_settings rows already in the schema

-- ── PAYMENT SETTINGS TABLE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_settings (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  gateway_id      VARCHAR(50) NOT NULL UNIQUE,   -- paystack, mtn, hubtel, bank, cash
  gateway_name    VARCHAR(100) NOT NULL,
  is_active       BOOLEAN DEFAULT FALSE,
  is_enabled      BOOLEAN DEFAULT TRUE,
  public_key      TEXT,
  secret_key      TEXT,                          -- store encrypted in production
  extra_fields    JSON,                          -- any gateway-specific fields
  environment     ENUM('test','live') DEFAULT 'live',
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── CURRENCY RATES TABLE ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS currency_rates (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  from_currency   CHAR(3) NOT NULL DEFAULT 'GBP',
  to_currency     CHAR(3) NOT NULL DEFAULT 'GHS',
  rate            DECIMAL(10,4) NOT NULL DEFAULT 650.0000,
  display_mode    ENUM('GBP','GHS','both') NOT NULL DEFAULT 'both',
  source          VARCHAR(100) DEFAULT 'manual',
  updated_by      VARCHAR(100),
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_pair (from_currency, to_currency)
);

INSERT IGNORE INTO currency_rates (from_currency, to_currency, rate, display_mode, source)
  VALUES ('GBP', 'GHS', 650.0000, 'both', 'manual');

-- ── PAYMENT ACCOUNT DETAILS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_accounts (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  method          ENUM('momo_mtn','momo_telecel','momo_at','hubtel','bank','cash','paystack','flutterwave') NOT NULL UNIQUE,
  account_name    VARCHAR(200),
  account_number  VARCHAR(100),
  bank_name       VARCHAR(200),
  branch          VARCHAR(200),
  instructions    TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO payment_accounts (method, account_name, instructions) VALUES
  ('momo_mtn',     'Arsenal SC Ghana', 'Send to our MTN MoMo number and enter the transaction ID'),
  ('momo_telecel',  'Arsenal SC Ghana', 'Send to our Telecel Cash number'),
  ('momo_at',       'Arsenal SC Ghana', 'Send to our AT Cash number'),
  ('bank',          'Arsenal Supporters Club Ghana', 'Bank transfer — get reference from treasurer'),
  ('cash',          'Arsenal SC Ghana', 'Pay in person at a club event or office');

-- ── SYSTEM UPGRADE LOG ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_upgrades (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  version         VARCHAR(20) NOT NULL,
  description     TEXT,
  sql_applied     TEXT,
  status          ENUM('pending','running','success','failed') DEFAULT 'pending',
  applied_by      VARCHAR(100),
  applied_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at    DATETIME
);

-- ── MEMBER COVER PHOTOS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS member_cover_photos (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  member_id       INT NOT NULL UNIQUE,
  image_data      LONGTEXT NOT NULL,    -- base64 or CDN URL
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- ── VOTING POLLS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS voting_polls (
  id                INT PRIMARY KEY AUTO_INCREMENT,
  title             VARCHAR(300) NOT NULL,
  description       TEXT,
  type              ENUM('motw','motm','motq','best_player','custom') DEFAULT 'motw',
  starts_at         DATETIME NOT NULL,
  ends_at           DATETIME NOT NULL,
  is_active         BOOLEAN DEFAULT TRUE,
  allow_non_members BOOLEAN DEFAULT FALSE,
  show_results      BOOLEAN DEFAULT TRUE,
  result_type       ENUM('public','admin_only') DEFAULT 'public',
  created_by        VARCHAR(100),
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── VOTING OPTIONS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS voting_options (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  poll_id     INT NOT NULL,
  member_id   INT,
  name        VARCHAR(200) NOT NULL,
  photo_url   VARCHAR(500),
  tier        VARCHAR(50),
  branch      VARCHAR(100),
  description TEXT,
  votes       INT DEFAULT 0,
  sort_order  INT DEFAULT 0,
  FOREIGN KEY (poll_id)   REFERENCES voting_polls(id)  ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id)        ON DELETE SET NULL
);

-- ── VOTES CAST ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS votes_cast (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  poll_id     INT NOT NULL,
  option_id   INT NOT NULL,
  voter_id    INT,
  voter_ip    VARCHAR(45),
  casted_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY one_vote_per_member (poll_id, voter_id),
  FOREIGN KEY (poll_id)   REFERENCES voting_polls(id)   ON DELETE CASCADE,
  FOREIGN KEY (option_id) REFERENCES voting_options(id) ON DELETE CASCADE,
  FOREIGN KEY (voter_id)  REFERENCES members(id)        ON DELETE SET NULL
);

-- ── MEMBER SPOTLIGHTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS member_spotlights (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  member_id    INT,
  type         ENUM('week','month','quarter') DEFAULT 'week',
  name         VARCHAR(200) NOT NULL,
  photo_url    VARCHAR(500),
  tier         VARCHAR(50),
  branch       VARCHAR(100),
  quote        TEXT,
  achievement  VARCHAR(300),
  is_active    BOOLEAN DEFAULT TRUE,
  start_date   DATE NOT NULL,
  end_date     DATE,
  set_by       VARCHAR(100),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
);

-- ── BULLETIN BOARD ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bulletin_board (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  title       VARCHAR(300) NOT NULL,
  body        TEXT,
  type        ENUM('announcement','job','ad','news','event') DEFAULT 'announcement',
  emoji       VARCHAR(10) DEFAULT '📢',
  image_url   VARCHAR(500),
  link_url    VARCHAR(500),
  link_label  VARCHAR(100),
  is_active   BOOLEAN DEFAULT TRUE,
  priority    INT DEFAULT 5,
  expires_at  DATETIME,
  created_by  VARCHAR(100),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── CLUB STATS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS club_stats (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  label      VARCHAR(100) NOT NULL,
  value      VARCHAR(50) NOT NULL DEFAULT 'dynamic',
  icon       VARCHAR(100) DEFAULT 'fa-solid fa-star',
  color      VARCHAR(20)  DEFAULT '#EF0107',
  is_visible BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO club_stats (label, value, icon, color, is_visible, sort_order) VALUES
  ('Active Members', 'dynamic',  'fa-solid fa-users',          '#EF0107', TRUE, 1),
  ('Year Founded',   '2003',     'fa-solid fa-calendar-star',  '#C6A84B', TRUE, 2),
  ('Arsenal Approved','2008',    'fa-solid fa-shield-halved',  '#3B82F6', TRUE, 3),
  ('Regions Covered','10',       'fa-solid fa-map-location-dot','#10B981',TRUE, 4);

-- ── SHOP CATEGORIES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_categories (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url   VARCHAR(500),
  parent_id   INT,
  sort_order  INT DEFAULT 1,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES shop_categories(id) ON DELETE SET NULL
);

INSERT IGNORE INTO shop_categories (name, slug, sort_order) VALUES
  ('Jerseys',      'jerseys',     1),
  ('Training',     'training',    2),
  ('Accessories',  'accessories', 3),
  ('Kids',         'kids',        4),
  ('Collectibles', 'collectibles',5),
  ('Casual',       'casual',      6);

-- ── SHOP SETTINGS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_settings (
  id                      INT PRIMARY KEY AUTO_INCREMENT,
  allow_guest_checkout    BOOLEAN DEFAULT TRUE,
  member_discount_pct     DECIMAL(5,2) DEFAULT 10.00,
  currency                CHAR(3) DEFAULT 'GHS',
  currency_symbol         VARCHAR(5) DEFAULT 'GH₵',
  shipping_enabled        BOOLEAN DEFAULT TRUE,
  shipping_flat_rate      DECIMAL(10,2) DEFAULT 30.00,
  shipping_free_threshold DECIMAL(10,2) DEFAULT 500.00,
  shipping_note           TEXT,
  tax_enabled             BOOLEAN DEFAULT FALSE,
  tax_rate                DECIMAL(5,2) DEFAULT 0.00,
  tax_label               VARCHAR(20) DEFAULT 'VAT',
  inventory_tracking      BOOLEAN DEFAULT TRUE,
  low_stock_threshold     INT DEFAULT 5,
  show_out_of_stock       BOOLEAN DEFAULT TRUE,
  allow_backorders        BOOLEAN DEFAULT FALSE,
  checkout_note           TEXT,
  return_policy           TEXT,
  hero_title              VARCHAR(200) DEFAULT 'OFFICIAL MERCHANDISE',
  hero_subtitle           VARCHAR(300) DEFAULT 'Gear up for Arsenal Ghana',
  featured_section        BOOLEAN DEFAULT TRUE,
  reviews_enabled         BOOLEAN DEFAULT FALSE,
  payment_gateways        JSON,
  updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO shop_settings (id, allow_guest_checkout, member_discount_pct, currency, currency_symbol)
  VALUES (1, TRUE, 10.00, 'GHS', 'GH₵');

-- ── PRODUCT REVIEWS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_reviews (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  product_id  INT NOT NULL,
  member_id   INT,
  rating      TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title       VARCHAR(200),
  body        TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id)  REFERENCES members(id)  ON DELETE SET NULL
);
