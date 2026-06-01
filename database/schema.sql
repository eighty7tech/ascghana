-- ═══════════════════════════════════════════════════════════════════════════════
-- Arsenal Supporters Club Ghana — Master Database Schema v1.5.0
-- Engine: MySQL 8.0+ / MariaDB 10.6+
-- Charset: utf8mb4 / utf8mb4_unicode_ci
-- This is the SINGLE authoritative schema. Run once on a fresh install.
-- For upgrades from an existing install, see database/upgrade.sql
-- ═══════════════════════════════════════════════════════════════════════════════

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ── 0. App State (key-value store for all settings & JSON data) ──────────────
CREATE TABLE IF NOT EXISTS app_state (
  `key`        VARCHAR(120)  NOT NULL PRIMARY KEY,
  `value`      LONGTEXT      NOT NULL,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Generic JSON key-value store — settings, members, events, etc.';

-- ── 1. Members ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
  membership_number  VARCHAR(30)  NOT NULL UNIQUE,
  first_name         VARCHAR(100) NOT NULL,
  last_name          VARCHAR(100) NOT NULL,
  email              VARCHAR(200) NOT NULL UNIQUE,
  phone              VARCHAR(30)  DEFAULT NULL,
  whatsapp           VARCHAR(30)  DEFAULT NULL,
  password           VARCHAR(255) DEFAULT NULL,
  tier               ENUM('Bronze','Silver','Gold','Platinum','Abusua') NOT NULL DEFAULT 'Bronze',
  branch             VARCHAR(60)  DEFAULT 'Accra',
  status             ENUM('Active','Inactive','Frozen','Expired','Pending Renewal') NOT NULL DEFAULT 'Active',
  role               VARCHAR(40)  NOT NULL DEFAULT 'member',
  photo              VARCHAR(500) DEFAULT NULL,
  address            TEXT,
  city               VARCHAR(80)  DEFAULT NULL,
  region             VARCHAR(80)  DEFAULT NULL,
  ghana_card_number  VARCHAR(50)  DEFAULT NULL,
  date_of_birth      DATE         DEFAULT NULL,
  gender             VARCHAR(20)  DEFAULT NULL,
  occupation         VARCHAR(100) DEFAULT NULL,
  nationality        VARCHAR(60)  DEFAULT 'Ghanaian',
  emergency_name     VARCHAR(200) DEFAULT NULL,
  emergency_phone    VARCHAR(30)  DEFAULT NULL,
  joined             VARCHAR(20)  DEFAULT NULL,
  renewal_due        VARCHAR(20)  DEFAULT NULL,
  two_factor_enabled TINYINT(1)  NOT NULL DEFAULT 0,
  two_factor_secret  VARCHAR(64)  DEFAULT NULL,
  last_login         DATETIME     DEFAULT NULL,
  login_attempts     INT          NOT NULL DEFAULT 0,
  locked_until       DATETIME     DEFAULT NULL,
  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email  (email),
  INDEX idx_number (membership_number),
  INDEX idx_status (status),
  INDEX idx_tier   (tier),
  INDEX idx_branch (branch)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 2. Member Sessions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth_sessions (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  token_hash  VARCHAR(64)  NOT NULL UNIQUE,
  member_id   BIGINT       DEFAULT NULL,
  user_json   LONGTEXT     NOT NULL,
  expires_at  DATETIME     NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token     (token_hash),
  INDEX idx_member_id (member_id),
  INDEX idx_expires   (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3. Admin Sessions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_sessions (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  token_hash  VARCHAR(64)  NOT NULL UNIQUE,
  username    VARCHAR(100) NOT NULL,
  session_json LONGTEXT    NOT NULL,
  expires_at  DATETIME     NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token   (token_hash),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 4. Two-Factor Auth Codes ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS two_factor_codes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  member_id   BIGINT       NOT NULL,
  code        VARCHAR(10)  NOT NULL,
  purpose     VARCHAR(40)  NOT NULL DEFAULT 'login',
  expires_at  DATETIME     NOT NULL,
  used        TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_member  (member_id),
  INDEX idx_expires (expires_at),
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 5. Member Activity Log ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS member_activity_log (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  member_id   BIGINT       NOT NULL,
  action      VARCHAR(100) NOT NULL,
  detail      TEXT,
  ip_address  VARCHAR(45)  DEFAULT NULL,
  user_agent  VARCHAR(300) DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_member  (member_id),
  INDEX idx_action  (action),
  INDEX idx_created (created_at DESC),
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 6. Member Deletion Requests ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS member_deletion_requests (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  member_id         BIGINT       NOT NULL,
  member_name       VARCHAR(200) NOT NULL,
  membership_number VARCHAR(30)  NOT NULL,
  reason            TEXT,
  status            ENUM('Pending','Approved','Declined') NOT NULL DEFAULT 'Pending',
  admin_note        TEXT,
  requested_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at      DATETIME     DEFAULT NULL,
  processed_by      VARCHAR(100) DEFAULT NULL,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_member (member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 7. Membership Renewals ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS membership_renewals (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  member_id         BIGINT       NOT NULL,
  membership_number VARCHAR(30)  NOT NULL,
  old_tier          VARCHAR(20),
  new_tier          VARCHAR(20)  NOT NULL,
  amount            DECIMAL(10,2) NOT NULL,
  currency          CHAR(3)      NOT NULL DEFAULT 'GHS',
  payment_method    VARCHAR(40)  DEFAULT NULL,
  payment_ref       VARCHAR(100) DEFAULT NULL,
  status            ENUM('Pending','Paid','Failed','Refunded') NOT NULL DEFAULT 'Pending',
  renewed_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at        DATE         DEFAULT NULL,
  notes             TEXT,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  INDEX idx_member (member_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 8. Events ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  title              VARCHAR(255) NOT NULL,
  slug               VARCHAR(255) UNIQUE,
  description        TEXT,
  short_description  VARCHAR(500) DEFAULT NULL,
  category           VARCHAR(60)  NOT NULL DEFAULT 'Watch Party',
  date               DATE         NOT NULL,
  time               TIME         DEFAULT NULL,
  end_time           TIME         DEFAULT NULL,
  venue              VARCHAR(255) DEFAULT NULL,
  address            TEXT,
  online_link        VARCHAR(500) DEFAULT NULL,
  image              VARCHAR(500) DEFAULT NULL,
  capacity           INT          NOT NULL DEFAULT 0,
  booked             INT          NOT NULL DEFAULT 0,
  status             ENUM('Draft','Published','Cancelled','Completed') NOT NULL DEFAULT 'Draft',
  is_free            TINYINT(1)   NOT NULL DEFAULT 1,
  member_price       DECIMAL(10,2) DEFAULT 0,
  non_member_price   DECIMAL(10,2) DEFAULT 0,
  member_discount    TINYINT(1)   NOT NULL DEFAULT 1,
  member_discount_pct INT         NOT NULL DEFAULT 10,
  -- Arsenal fixture link
  fixture_home_team  VARCHAR(100) DEFAULT NULL,
  fixture_away_team  VARCHAR(100) DEFAULT NULL,
  fixture_home_logo  VARCHAR(500) DEFAULT NULL,
  fixture_away_logo  VARCHAR(500) DEFAULT NULL,
  fixture_competition VARCHAR(100) DEFAULT NULL,
  fixture_kickoff    DATETIME     DEFAULT NULL,
  -- Meta
  organizer          VARCHAR(100) DEFAULT NULL,
  contact_email      VARCHAR(200) DEFAULT NULL,
  tags               VARCHAR(500) DEFAULT NULL,
  featured           TINYINT(1)   NOT NULL DEFAULT 0,
  requires_booking   TINYINT(1)   NOT NULL DEFAULT 1,
  created_by         VARCHAR(100) DEFAULT NULL,
  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_date   (date),
  INDEX idx_cat    (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 9. Event Bookings ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_bookings (
  id                VARCHAR(40)  NOT NULL PRIMARY KEY,
  event_id          INT          NOT NULL,
  event_title       VARCHAR(255) NOT NULL,
  member_id         BIGINT       DEFAULT NULL,
  member_name       VARCHAR(200) NOT NULL,
  membership_number VARCHAR(30)  DEFAULT NULL,
  email             VARCHAR(200) NOT NULL,
  phone             VARCHAR(30)  DEFAULT NULL,
  qty               INT          NOT NULL DEFAULT 1,
  unit_price        DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price       DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency          CHAR(3)      NOT NULL DEFAULT 'GHS',
  payment_method    VARCHAR(40)  DEFAULT NULL,
  payment_ref       VARCHAR(100) DEFAULT NULL,
  payment_status    ENUM('Free','Pending','Paid','Failed','Refunded') NOT NULL DEFAULT 'Pending',
  status            ENUM('Pending','Confirmed','Cancelled','Attended','No-Show') NOT NULL DEFAULT 'Pending',
  special_request   TEXT,
  admin_note        TEXT,
  confirmation_sent TINYINT(1)   NOT NULL DEFAULT 0,
  check_in_time     DATETIME     DEFAULT NULL,
  booked_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed_at      DATETIME     DEFAULT NULL,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id)  REFERENCES events(id)   ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id)  ON DELETE SET NULL,
  INDEX idx_event   (event_id),
  INDEX idx_member  (member_id),
  INDEX idx_status  (status),
  INDEX idx_booked  (booked_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 10. Event Attendance (check-in) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_attendance (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  event_id          INT          NOT NULL,
  member_id         BIGINT       NOT NULL,
  member_name       VARCHAR(200) NOT NULL,
  membership_number VARCHAR(30)  DEFAULT NULL,
  tier              VARCHAR(40)  DEFAULT NULL,
  checked_in_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  checked_in_by     VARCHAR(100) DEFAULT NULL,
  notes             TEXT,
  UNIQUE KEY unique_event_member (event_id, member_id),
  FOREIGN KEY (event_id)  REFERENCES events(id)   ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id)  ON DELETE CASCADE,
  INDEX idx_event  (event_id),
  INDEX idx_member (member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 11. Match Ticket Listings ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS match_tickets (
  id                VARCHAR(30)  NOT NULL PRIMARY KEY,
  match_name        VARCHAR(255) NOT NULL,
  competition       VARCHAR(100) DEFAULT NULL,
  match_date        DATE         NOT NULL,
  match_time        TIME         DEFAULT NULL,
  venue             VARCHAR(200) DEFAULT NULL,
  category          VARCHAR(40)  NOT NULL DEFAULT 'A',
  season            VARCHAR(20)  DEFAULT NULL,
  tickets_available INT          NOT NULL DEFAULT 0,
  ticket_price      DECIMAL(10,2) DEFAULT 0,
  currency          CHAR(3)      NOT NULL DEFAULT 'GHS',
  status            ENUM('Active','Sold Out','Closed','Cancelled') NOT NULL DEFAULT 'Active',
  notes             TEXT,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_date   (match_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 12. Match Ticket Requests (member requests) ──────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_requests (
  id                VARCHAR(30)  NOT NULL PRIMARY KEY,
  match_ticket_id   VARCHAR(30)  DEFAULT NULL,
  member_id         BIGINT       NOT NULL,
  member_name       VARCHAR(200) NOT NULL,
  membership_number VARCHAR(30)  NOT NULL,
  tier              VARCHAR(40)  DEFAULT NULL,
  match_name        VARCHAR(255) NOT NULL,
  category          VARCHAR(40)  NOT NULL DEFAULT 'A',
  qty               INT          NOT NULL DEFAULT 1,
  passport_used     VARCHAR(50)  DEFAULT NULL,
  status            ENUM('Pending','Approved','Partially Approved','Declined','Cancelled') NOT NULL DEFAULT 'Pending',
  payment_status    ENUM('Pending','Paid','Failed','Refunded') NOT NULL DEFAULT 'Pending',
  special_request   TEXT,
  admin_note        TEXT,
  submitted_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  INDEX idx_member (member_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 13. Ticket Bookings (advanced — links to match_tickets) ─────────────────
CREATE TABLE IF NOT EXISTS ticket_bookings (
  id                VARCHAR(40)  NOT NULL PRIMARY KEY,
  ticket_request_id VARCHAR(30)  DEFAULT NULL,
  match_ticket_id   VARCHAR(30)  DEFAULT NULL,
  member_id         BIGINT       NOT NULL,
  member_name       VARCHAR(200) NOT NULL,
  membership_number VARCHAR(30)  NOT NULL,
  tier              VARCHAR(40)  DEFAULT NULL,
  qty               INT          NOT NULL DEFAULT 1,
  unit_price        DECIMAL(10,2) DEFAULT 0,
  total_price       DECIMAL(10,2) DEFAULT 0,
  currency          CHAR(3)      DEFAULT 'GHS',
  payment_method    VARCHAR(40)  DEFAULT NULL,
  payment_ref       VARCHAR(100) DEFAULT NULL,
  payment_status    ENUM('Pending','Paid','Failed','Refunded') NOT NULL DEFAULT 'Pending',
  status            ENUM('Pending','Confirmed','Cancelled','Used') NOT NULL DEFAULT 'Pending',
  special_request   TEXT,
  admin_note        TEXT,
  booked_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed_at      DATETIME     DEFAULT NULL,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  INDEX idx_member       (member_id),
  INDEX idx_match_ticket (match_ticket_id),
  INDEX idx_status       (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 14. Announcements ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  title            VARCHAR(255) NOT NULL,
  body             TEXT         NOT NULL,
  type             ENUM('info','success','warning','danger','event','ticket') NOT NULL DEFAULT 'info',
  target           ENUM('all','members','admin','gold','platinum','silver','bronze') NOT NULL DEFAULT 'all',
  is_active        TINYINT(1)   NOT NULL DEFAULT 1,
  is_pinned        TINYINT(1)   NOT NULL DEFAULT 0,
  show_on_dashboard TINYINT(1)  NOT NULL DEFAULT 1,
  link_url         VARCHAR(500) DEFAULT NULL,
  link_label       VARCHAR(100) DEFAULT NULL,
  image_url        VARCHAR(500) DEFAULT NULL,
  expires_at       DATETIME     DEFAULT NULL,
  created_by       VARCHAR(100) DEFAULT NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active  (is_active),
  INDEX idx_type    (type),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 15. Admin Notifications ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_notifications (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  title      VARCHAR(200) NOT NULL,
  message    TEXT         NOT NULL,
  type       ENUM('info','success','warning','danger') NOT NULL DEFAULT 'info',
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  link_href  VARCHAR(500) DEFAULT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_read    (is_read),
  INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 15b. Member Notifications ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS member_notifications (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  member_id   BIGINT       NOT NULL,
  title       VARCHAR(200) NOT NULL,
  message     TEXT         NOT NULL,
  type        ENUM('info','success','warning','danger') NOT NULL DEFAULT 'info',
  icon        VARCHAR(80)  DEFAULT 'fa-solid fa-bell',
  category    VARCHAR(40)  DEFAULT 'system',
  is_read     TINYINT(1)   NOT NULL DEFAULT 0,
  link_href   VARCHAR(500) DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_member  (member_id),
  INDEX idx_read    (is_read),
  INDEX idx_created (created_at DESC),
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 16. Admin Settings (section key-value) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_settings (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  section       VARCHAR(60)  NOT NULL,
  setting_key   VARCHAR(100) NOT NULL,
  setting_value LONGTEXT,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_section_key (section, setting_key),
  INDEX idx_section (section)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 17. Contact Messages ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(200) NOT NULL,
  email      VARCHAR(200) NOT NULL,
  phone      VARCHAR(30)  DEFAULT NULL,
  subject    VARCHAR(255) DEFAULT NULL,
  message    TEXT         NOT NULL,
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  replied    TINYINT(1)   NOT NULL DEFAULT 0,
  reply_note TEXT,
  source     VARCHAR(60)  DEFAULT 'contact_form',
  ip_address VARCHAR(45)  DEFAULT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_read    (is_read),
  INDEX idx_email   (email),
  INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 18. Donations / Campaigns ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS donations (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  goal        DECIMAL(12,2) NOT NULL DEFAULT 0,
  raised      DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency    CHAR(3)      NOT NULL DEFAULT 'GHS',
  image       VARCHAR(500) DEFAULT NULL,
  status      ENUM('Active','Completed','Paused','Cancelled') NOT NULL DEFAULT 'Active',
  end_date    DATE         DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 19. Donation Pledges ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS donation_pledges (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  donation_id INT          NOT NULL,
  member_id   BIGINT       DEFAULT NULL,
  name        VARCHAR(200) NOT NULL,
  email       VARCHAR(200) DEFAULT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  currency    CHAR(3)      NOT NULL DEFAULT 'GHS',
  message     TEXT,
  anonymous   TINYINT(1)   NOT NULL DEFAULT 0,
  payment_ref VARCHAR(100) DEFAULT NULL,
  status      ENUM('Pending','Confirmed','Failed') NOT NULL DEFAULT 'Pending',
  pledged_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id)   REFERENCES members(id)   ON DELETE SET NULL,
  INDEX idx_donation (donation_id),
  INDEX idx_status   (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 20. Sponsors ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sponsors (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  logo_url    VARCHAR(500) DEFAULT NULL,
  website     VARCHAR(500) DEFAULT NULL,
  tier        ENUM('title','gold','silver','bronze','partner') NOT NULL DEFAULT 'partner',
  description TEXT,
  active      TINYINT(1)   NOT NULL DEFAULT 1,
  featured    TINYINT(1)   NOT NULL DEFAULT 0,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 21. Gallery Albums & Images ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gallery_albums (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(200) NOT NULL,
  slug         VARCHAR(200) UNIQUE,
  description  TEXT,
  category     VARCHAR(60)  DEFAULT NULL,
  cover_url    VARCHAR(500) DEFAULT NULL,
  cover_color  VARCHAR(20)  DEFAULT '#EF0107',
  is_public    TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order   INT          NOT NULL DEFAULT 0,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gallery_images (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  album_id     INT          NOT NULL,
  url          VARCHAR(500) NOT NULL,
  filename     VARCHAR(255) DEFAULT NULL,
  title        VARCHAR(200) DEFAULT NULL,
  caption      TEXT,
  width        INT          DEFAULT NULL,
  height       INT          DEFAULT NULL,
  file_size    BIGINT       DEFAULT NULL,
  sort_order   INT          NOT NULL DEFAULT 0,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (album_id) REFERENCES gallery_albums(id) ON DELETE CASCADE,
  INDEX idx_album (album_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 22. Blog Posts ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  slug         VARCHAR(255) UNIQUE,
  excerpt      TEXT,
  content      LONGTEXT,
  category     VARCHAR(60)  DEFAULT NULL,
  author       VARCHAR(100) DEFAULT NULL,
  image        VARCHAR(500) DEFAULT NULL,
  status       ENUM('Draft','Published') NOT NULL DEFAULT 'Draft',
  featured     TINYINT(1)   NOT NULL DEFAULT 0,
  views        INT          NOT NULL DEFAULT 0,
  tags         VARCHAR(500) DEFAULT NULL,
  published_at DATETIME     DEFAULT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status   (status),
  INDEX idx_category (category),
  INDEX idx_slug     (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 23. Voting Polls ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS voting_polls (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  title             VARCHAR(255) NOT NULL,
  description       TEXT,
  type              VARCHAR(30)  NOT NULL DEFAULT 'custom',
  starts_at         DATETIME     DEFAULT NULL,
  ends_at           DATETIME     DEFAULT NULL,
  is_active         TINYINT(1)   NOT NULL DEFAULT 1,
  allow_non_members TINYINT(1)   NOT NULL DEFAULT 0,
  show_results      TINYINT(1)   NOT NULL DEFAULT 1,
  result_type       ENUM('public','admin_only') NOT NULL DEFAULT 'public',
  created_by        VARCHAR(100) DEFAULT NULL,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_active  (is_active),
  INDEX idx_ends_at (ends_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS voting_options (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  poll_id     INT          NOT NULL,
  name        VARCHAR(200) NOT NULL,
  photo       VARCHAR(500) DEFAULT NULL,
  description VARCHAR(500) DEFAULT NULL,
  tier        VARCHAR(40)  DEFAULT NULL,
  branch      VARCHAR(60)  DEFAULT NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  FOREIGN KEY (poll_id) REFERENCES voting_polls(id) ON DELETE CASCADE,
  INDEX idx_poll (poll_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS poll_votes (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  poll_id     INT          NOT NULL,
  option_id   INT          NOT NULL,
  voter_id    INT          DEFAULT NULL,
  voter_name  VARCHAR(200) DEFAULT NULL,
  voter_ip    VARCHAR(45)  DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (poll_id)   REFERENCES voting_polls(id)   ON DELETE CASCADE,
  FOREIGN KEY (option_id) REFERENCES voting_options(id) ON DELETE CASCADE,
  FOREIGN KEY (voter_id)  REFERENCES members(id)        ON DELETE SET NULL,
  INDEX idx_poll   (poll_id),
  INDEX idx_option (option_id),
  INDEX idx_voter  (voter_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 24. Newsletter Subscribers ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  email        VARCHAR(200) NOT NULL UNIQUE,
  name         VARCHAR(200) DEFAULT NULL,
  member_id    INT          DEFAULT NULL,
  status       ENUM('Active','Unsubscribed','Bounced') NOT NULL DEFAULT 'Active',
  source       VARCHAR(60)  DEFAULT 'website',
  subscribed_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at DATETIME  DEFAULT NULL,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_email  (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  subject     VARCHAR(255) NOT NULL,
  body        LONGTEXT     NOT NULL,
  from_name   VARCHAR(100) DEFAULT NULL,
  from_email  VARCHAR(200) DEFAULT NULL,
  status      ENUM('Draft','Sending','Sent','Failed') NOT NULL DEFAULT 'Draft',
  sent_count  INT          NOT NULL DEFAULT 0,
  error_log   TEXT,
  sent_at     DATETIME     DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 25. Shop ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_products (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  slug         VARCHAR(255) UNIQUE,
  description  TEXT,
  price        DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2) DEFAULT NULL,
  currency     CHAR(3)      NOT NULL DEFAULT 'GHS',
  category     VARCHAR(60)  DEFAULT NULL,
  images       JSON,
  sizes        JSON,
  stock        INT          NOT NULL DEFAULT 0,
  status       ENUM('Active','Draft','Out of Stock') NOT NULL DEFAULT 'Active',
  featured     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status   (status),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shop_orders (
  id              VARCHAR(40)  NOT NULL PRIMARY KEY,
  member_id       INT          DEFAULT NULL,
  customer_name   VARCHAR(200) NOT NULL,
  customer_email  VARCHAR(200) NOT NULL,
  customer_phone  VARCHAR(30)  DEFAULT NULL,
  items           JSON         NOT NULL,
  subtotal        DECIMAL(10,2) NOT NULL,
  total           DECIMAL(10,2) NOT NULL,
  currency        CHAR(3)      NOT NULL DEFAULT 'GHS',
  payment_method  VARCHAR(40)  DEFAULT NULL,
  payment_ref     VARCHAR(100) DEFAULT NULL,
  payment_status  ENUM('Pending','Paid','Failed','Refunded') NOT NULL DEFAULT 'Pending',
  status          ENUM('Pending','Processing','Shipped','Delivered','Cancelled') NOT NULL DEFAULT 'Pending',
  delivery_address TEXT,
  notes           TEXT,
  admin_note      TEXT,
  placed_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL,
  INDEX idx_member (member_id),
  INDEX idx_status (status),
  INDEX idx_placed (placed_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 26. Suggestions / Feedback ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suggestions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  member_id   BIGINT       DEFAULT NULL,
  member_name VARCHAR(200) NOT NULL,
  category    VARCHAR(60)  DEFAULT 'General',
  title       VARCHAR(255) DEFAULT NULL,
  content     TEXT         NOT NULL,
  status      ENUM('New','Under Review','Implemented','Declined') NOT NULL DEFAULT 'New',
  upvotes     INT          NOT NULL DEFAULT 0,
  admin_note  TEXT,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL,
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 27. Arsenal Fixtures (club-managed) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS arsenal_fixtures (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  home_team      VARCHAR(100) NOT NULL DEFAULT 'Arsenal',
  away_team      VARCHAR(100) NOT NULL,
  competition    VARCHAR(100) DEFAULT 'Premier League',
  home_team_logo VARCHAR(500) DEFAULT NULL,
  away_team_logo VARCHAR(500) DEFAULT NULL,
  match_date     DATE         NOT NULL,
  match_time     TIME         DEFAULT NULL,
  venue          VARCHAR(200) DEFAULT 'Emirates Stadium',
  status         ENUM('upcoming','live','result','postponed') NOT NULL DEFAULT 'upcoming',
  home_score     INT          DEFAULT NULL,
  away_score     INT          DEFAULT NULL,
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  watch_party_venue VARCHAR(200) DEFAULT NULL,
  watch_party_time VARCHAR(50)  DEFAULT NULL,
  ticket_link    VARCHAR(500) DEFAULT NULL,
  event_id       INT          DEFAULT NULL COMMENT 'Link to events table if watch party event exists',
  sort_order     INT          NOT NULL DEFAULT 0,
  notes          TEXT,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
  INDEX idx_date   (match_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 28. Page Headers (per-page custom backgrounds) ───────────────────────────
CREATE TABLE IF NOT EXISTS page_headers (
  page_slug    VARCHAR(100) NOT NULL PRIMARY KEY,
  bg_type      ENUM('color','image','gradient') NOT NULL DEFAULT 'gradient',
  bg_value     VARCHAR(500) NOT NULL DEFAULT 'linear-gradient(135deg,#1A0505,#0C0B12)',
  overlay      DECIMAL(3,2) NOT NULL DEFAULT 0.70,
  text_color   VARCHAR(20)  NOT NULL DEFAULT '#FFFFFF',
  show_breadcrumb TINYINT(1) NOT NULL DEFAULT 1,
  breadcrumb_bg VARCHAR(100) DEFAULT NULL,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 29. Maintenance / Security Log ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS security_log (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_type  VARCHAR(60)  NOT NULL,
  description TEXT,
  ip_address  VARCHAR(45)  DEFAULT NULL,
  user_agent  VARCHAR(300) DEFAULT NULL,
  member_id   BIGINT       DEFAULT NULL,
  admin_user  VARCHAR(100) DEFAULT NULL,
  severity    ENUM('info','warning','danger','critical') NOT NULL DEFAULT 'info',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event    (event_type),
  INDEX idx_severity (severity),
  INDEX idx_created  (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 30. Backups Registry ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS backup_registry (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  filename    VARCHAR(255) NOT NULL,
  size_bytes  BIGINT       DEFAULT NULL,
  type        ENUM('full','settings','members','media') NOT NULL DEFAULT 'full',
  status      ENUM('complete','failed','partial') NOT NULL DEFAULT 'complete',
  notes       TEXT,
  created_by  VARCHAR(100) DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 31. Rate Limit Tracking ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rate_limit_log (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  identifier  VARCHAR(100) NOT NULL COMMENT 'IP or member_id',
  endpoint    VARCHAR(200) NOT NULL,
  hit_count   INT          NOT NULL DEFAULT 1,
  window_start DATETIME    NOT NULL,
  blocked     TINYINT(1)   NOT NULL DEFAULT 0,
  INDEX idx_identifier (identifier),
  INDEX idx_window     (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 32. Audit Log ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  actor_type  ENUM('admin','member','system') NOT NULL DEFAULT 'admin',
  actor_id    VARCHAR(100) DEFAULT NULL,
  actor_name  VARCHAR(200) DEFAULT NULL,
  action      VARCHAR(100) NOT NULL,
  resource    VARCHAR(100) DEFAULT NULL,
  resource_id VARCHAR(60)  DEFAULT NULL,
  old_value   LONGTEXT,
  new_value   LONGTEXT,
  ip_address  VARCHAR(45)  DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_actor    (actor_type, actor_id),
  INDEX idx_action   (action),
  INDEX idx_resource (resource),
  INDEX idx_created  (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 33. Community Posts ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_posts (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  channel     VARCHAR(60)  NOT NULL DEFAULT 'general',
  member_id   BIGINT       DEFAULT NULL,
  author_name VARCHAR(200) NOT NULL,
  author_tier VARCHAR(40)  DEFAULT NULL,
  content     TEXT         NOT NULL,
  media_url   VARCHAR(500) DEFAULT NULL,
  likes       INT          NOT NULL DEFAULT 0,
  is_pinned   TINYINT(1)   NOT NULL DEFAULT 0,
  is_visible  TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL,
  INDEX idx_channel (channel),
  INDEX idx_member  (member_id),
  INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 34. Exco Members ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exco_members (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  position    VARCHAR(100) NOT NULL,
  photo       VARCHAR(500) DEFAULT NULL,
  bio         TEXT,
  email       VARCHAR(200) DEFAULT NULL,
  phone       VARCHAR(30)  DEFAULT NULL,
  member_id   BIGINT       DEFAULT NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL,
  INDEX idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Triggers: keep booked count in sync ──────────────────────────────────────
DELIMITER $$

DROP TRIGGER IF EXISTS trg_event_booking_insert$$
CREATE TRIGGER trg_event_booking_insert
AFTER INSERT ON event_bookings
FOR EACH ROW
BEGIN
  IF NEW.status NOT IN ('Cancelled') THEN
    UPDATE events SET booked = booked + NEW.qty WHERE id = NEW.event_id;
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_event_booking_cancel$$
CREATE TRIGGER trg_event_booking_cancel
AFTER UPDATE ON event_bookings
FOR EACH ROW
BEGIN
  IF OLD.status != 'Cancelled' AND NEW.status = 'Cancelled' THEN
    UPDATE events SET booked = GREATEST(0, booked - OLD.qty) WHERE id = NEW.event_id;
  END IF;
  IF OLD.status = 'Cancelled' AND NEW.status != 'Cancelled' THEN
    UPDATE events SET booked = booked + NEW.qty WHERE id = NEW.event_id;
  END IF;
END$$

DELIMITER ;

-- ── Default Data ──────────────────────────────────────────────────────────────
-- Default welcome banner removed in v2.0.0 (use Admin → Announcements to publish site notices)

SET FOREIGN_KEY_CHECKS = 1;

-- ── Version marker ────────────────────────────────────────────────────────────
INSERT INTO app_state (`key`, `value`) VALUES ('db_version', '"1.0.0"')
ON DUPLICATE KEY UPDATE `value` = '"1.0.0"', updated_at = NOW();

SELECT CONCAT('Schema v1.0.0 installed — ', COUNT(*), ' tables') AS status
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE';

-- ── NEW FEATURES v1.3.0 ─────────────────────────────────────────────────────

-- 1. Match Predictions / Score Predictor
CREATE TABLE IF NOT EXISTS match_predictions (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  member_id     INT NOT NULL,
  fixture_ref   VARCHAR(80) NOT NULL,          -- e.g. "Arsenal-vs-Chelsea-2026-06-01"
  home_score    TINYINT NOT NULL DEFAULT 0,
  away_score    TINYINT NOT NULL DEFAULT 0,
  points        SMALLINT NOT NULL DEFAULT 0,   -- awarded after result
  is_settled    TINYINT(1) NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_member_fixture (member_id, fixture_ref),
  INDEX idx_fixture (fixture_ref),
  INDEX idx_member  (member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Prediction Leaderboard (materialised summary, updated on settle)
CREATE TABLE IF NOT EXISTS prediction_leaderboard (
  member_id         INT PRIMARY KEY,
  member_name       VARCHAR(200) NOT NULL,
  member_number     VARCHAR(50)  NOT NULL,
  member_photo      VARCHAR(500) DEFAULT NULL,
  total_points      INT NOT NULL DEFAULT 0,
  total_predictions INT NOT NULL DEFAULT 0,
  exact_scores      INT NOT NULL DEFAULT 0,
  correct_results   INT NOT NULL DEFAULT 0,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Fan Wall (community posts with reactions)
CREATE TABLE IF NOT EXISTS fan_wall_posts (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  member_id     INT NOT NULL,
  member_name   VARCHAR(200) NOT NULL,
  member_photo  VARCHAR(500) DEFAULT NULL,
  member_tier   VARCHAR(50)  DEFAULT NULL,
  content       TEXT NOT NULL,
  image_url     VARCHAR(500) DEFAULT NULL,
  post_type     ENUM('text','photo','matchday','celebration') NOT NULL DEFAULT 'text',
  likes         INT NOT NULL DEFAULT 0,
  is_pinned     TINYINT(1) NOT NULL DEFAULT 0,
  is_approved   TINYINT(1) NOT NULL DEFAULT 1,
  is_flagged    TINYINT(1) NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_member   (member_id),
  INDEX idx_created  (created_at),
  INDEX idx_approved (is_approved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fan wall reactions (likes)
CREATE TABLE IF NOT EXISTS fan_wall_likes (
  post_id   BIGINT NOT NULL,
  member_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fan wall comments
CREATE TABLE IF NOT EXISTS fan_wall_comments (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id     BIGINT NOT NULL,
  member_id   INT NOT NULL,
  member_name VARCHAR(200) NOT NULL,
  member_photo VARCHAR(500) DEFAULT NULL,
  content     TEXT NOT NULL,
  is_approved TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_post (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Watch Party RSVPs
CREATE TABLE IF NOT EXISTS watch_party_rsvps (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_id      INT NOT NULL,                  -- links to events table
  member_id     INT NOT NULL,
  member_name   VARCHAR(200) NOT NULL,
  member_number VARCHAR(50) NOT NULL,
  guests        TINYINT NOT NULL DEFAULT 0,    -- extra guests (+1, +2 etc)
  notes         TEXT DEFAULT NULL,
  checked_in    TINYINT(1) NOT NULL DEFAULT 0,
  checked_in_at DATETIME DEFAULT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_event_member (event_id, member_id),
  INDEX idx_event  (event_id),
  INDEX idx_member (member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Club Points / Loyalty Rewards
CREATE TABLE IF NOT EXISTS member_points (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  member_id   INT NOT NULL,
  points      INT NOT NULL DEFAULT 0,          -- can be negative for deductions
  action      VARCHAR(100) NOT NULL,           -- e.g. 'prediction_exact', 'event_attendance'
  description VARCHAR(300) DEFAULT NULL,
  ref_id      VARCHAR(100) DEFAULT NULL,       -- reference to related record
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_member (member_id),
  INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Points balance summary (denormalised for speed)
CREATE TABLE IF NOT EXISTS member_points_balance (
  member_id     INT PRIMARY KEY,
  total_points  INT NOT NULL DEFAULT 0,
  total_earned  INT NOT NULL DEFAULT 0,
  total_spent   INT NOT NULL DEFAULT 0,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rewards catalogue
CREATE TABLE IF NOT EXISTS rewards_catalogue (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(200) NOT NULL,
  description   TEXT DEFAULT NULL,
  image_url     VARCHAR(500) DEFAULT NULL,
  points_cost   INT NOT NULL DEFAULT 0,
  stock         INT NOT NULL DEFAULT -1,       -- -1 = unlimited
  category      VARCHAR(100) DEFAULT NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reward redemptions
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  member_id     INT NOT NULL,
  reward_id     INT NOT NULL,
  points_spent  INT NOT NULL,
  status        ENUM('pending','approved','fulfilled','cancelled') NOT NULL DEFAULT 'pending',
  admin_note    TEXT DEFAULT NULL,
  redeemed_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fulfilled_at  DATETIME DEFAULT NULL,
  INDEX idx_member (member_id),
  INDEX idx_reward (reward_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Fan of the Month
CREATE TABLE IF NOT EXISTS fan_of_month_nominations (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  period_year   SMALLINT NOT NULL,
  period_month  TINYINT NOT NULL,
  nominated_id  INT NOT NULL,                  -- member being nominated
  nominated_by  INT NOT NULL,                  -- member who nominated
  reason        TEXT DEFAULT NULL,
  is_winner     TINYINT(1) NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_period_nominator (period_year, period_month, nominated_id, nominated_by),
  INDEX idx_period   (period_year, period_month),
  INDEX idx_nominated(nominated_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Member Referrals
CREATE TABLE IF NOT EXISTS member_referrals (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  referrer_id   INT NOT NULL,
  referee_id    INT NOT NULL,
  referee_name  VARCHAR(200) NOT NULL,
  status        ENUM('pending','completed','rewarded') NOT NULL DEFAULT 'pending',
  points_awarded INT NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at  DATETIME DEFAULT NULL,
  UNIQUE KEY uq_referee (referee_id),
  INDEX idx_referrer (referrer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Push notification subscriptions (web push)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  member_id     INT DEFAULT NULL,
  endpoint      TEXT NOT NULL,
  p256dh        TEXT NOT NULL,
  auth_key      TEXT NOT NULL,
  device_info   VARCHAR(300) DEFAULT NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_member (member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Club Constitution & Documents
CREATE TABLE IF NOT EXISTS club_documents (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(300) NOT NULL,
  description   TEXT DEFAULT NULL,
  file_url      VARCHAR(500) NOT NULL,
  file_type     VARCHAR(20) DEFAULT 'pdf',
  category      VARCHAR(100) DEFAULT 'General',
  is_public     TINYINT(1) NOT NULL DEFAULT 1,
  download_count INT NOT NULL DEFAULT 0,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Arsenal Season Stats (admin-managed)
CREATE TABLE IF NOT EXISTS season_stats (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  season        VARCHAR(20) NOT NULL,          -- e.g. "2025/26"
  competition   VARCHAR(100) NOT NULL DEFAULT 'Premier League',
  played        SMALLINT NOT NULL DEFAULT 0,
  won           SMALLINT NOT NULL DEFAULT 0,
  drawn         SMALLINT NOT NULL DEFAULT 0,
  lost          SMALLINT NOT NULL DEFAULT 0,
  goals_for     SMALLINT NOT NULL DEFAULT 0,
  goals_against SMALLINT NOT NULL DEFAULT 0,
  position      TINYINT NOT NULL DEFAULT 1,
  points        SMALLINT NOT NULL DEFAULT 0,
  top_scorer    VARCHAR(100) DEFAULT NULL,
  top_scorer_goals TINYINT DEFAULT 0,
  assist_leader VARCHAR(100) DEFAULT NULL,
  assist_leader_assists TINYINT DEFAULT 0,
  clean_sheets  TINYINT NOT NULL DEFAULT 0,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_season_comp (season, competition)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════════════════
-- v1.5.0 Additions — added 2026-05-29
-- ═══════════════════════════════════════════════════════════════════════════════

-- 11. Button Style Presets (admin-managed, JSON)
CREATE TABLE IF NOT EXISTS button_styles (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  styles_json LONGTEXT     NOT NULL COMMENT 'JSON array of button style objects',
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Menu / Navigation Items
CREATE TABLE IF NOT EXISTS nav_menu_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  label       VARCHAR(100) NOT NULL,
  href        VARCHAR(500) NOT NULL,
  icon        VARCHAR(100) DEFAULT 'fa-solid fa-link',
  target      ENUM('_self','_blank') NOT NULL DEFAULT '_self',
  visible     TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order  INT          NOT NULL DEFAULT 0,
  parent_id   INT          DEFAULT NULL COMMENT 'null = top-level, set for dropdown children',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_parent (parent_id),
  INDEX idx_sort   (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Upload Provider Config (synced from app_state but queryable)
-- Note: upload config lives in app_state under key 'settings'; this view surfaces it.

-- 14. System Upgrade Log
CREATE TABLE IF NOT EXISTS system_upgrade_log (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  version     VARCHAR(20)  NOT NULL,
  description TEXT,
  sql_applied TEXT,
  applied_by  VARCHAR(100) DEFAULT 'admin',
  applied_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_version (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Maintenance Mode Log
CREATE TABLE IF NOT EXISTS maintenance_log (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  action      ENUM('enabled','disabled') NOT NULL,
  message     TEXT,
  triggered_by VARCHAR(100) DEFAULT 'admin',
  triggered_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update db_version
INSERT INTO app_state (`key`, `value`) VALUES ('db_version', '"1.5.0"')
  ON DUPLICATE KEY UPDATE `value` = '"1.5.0"', updated_at = NOW();

SELECT CONCAT('Schema v1.5.0 upgraded — ', NOW()) AS status;

-- ═══════════════════════════════════════════════════════════════════════════════
-- v1.7.0 Additions — Button assignments, Icon presets, form helpers
-- ═══════════════════════════════════════════════════════════════════════════════

-- 16. Per-section button assignments
CREATE TABLE IF NOT EXISTS section_button_assignments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  section_id  VARCHAR(60)  NOT NULL COMMENT 'e.g. hero, stats, countdown, bulletin, events, membership, shop',
  button_id   VARCHAR(40)  NOT NULL COMMENT 'ID matching button_styles.id or settings JSON id',
  label       VARCHAR(100) DEFAULT NULL,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_section (section_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Maps frontend sections to specific button style IDs';

-- 17. Icon presets
CREATE TABLE IF NOT EXISTS icon_presets (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  fa_class    VARCHAR(60)  NOT NULL,
  color       VARCHAR(30)  NOT NULL DEFAULT '#EF0107',
  size        SMALLINT     NOT NULL DEFAULT 18,
  style       VARCHAR(20)  NOT NULL DEFAULT 'solid',
  is_global   TINYINT(1)   NOT NULL DEFAULT 0,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_global (is_global)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add new columns to button_styles if not present (MySQL 5.7 / MariaDB 10.3 safe)
DELIMITER $$
DROP PROCEDURE IF EXISTS _ascg_btn_cols$$
CREATE PROCEDURE _ascg_btn_cols()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='button_styles' AND COLUMN_NAME='css_class') THEN
    ALTER TABLE button_styles ADD COLUMN css_class VARCHAR(60) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='button_styles' AND COLUMN_NAME='is_active') THEN
    ALTER TABLE button_styles ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='button_styles' AND COLUMN_NAME='section_tags') THEN
    ALTER TABLE button_styles ADD COLUMN section_tags VARCHAR(300) DEFAULT NULL;
  END IF;
END$$
DELIMITER ;
CALL _ascg_btn_cols();
DROP PROCEDURE IF EXISTS _ascg_btn_cols;

-- Default icon presets
INSERT IGNORE INTO icon_presets (id, name, fa_class, color, size, style, is_global, sort_order) VALUES
  (1, 'Arsenal Red Solid',   'fa-solid fa-shield-halved', '#EF0107', 18, 'solid', 1, 1),
  (2, 'Club Gold Solid',     'fa-solid fa-trophy',        '#C6A84B', 18, 'solid', 0, 2),
  (3, 'Navy Solid',          'fa-solid fa-futbol',        '#023474', 18, 'solid', 0, 3),
  (4, 'Success Green Solid', 'fa-solid fa-circle-check',  '#10B981', 18, 'solid', 0, 4),
  (5, 'Warning Amber Solid', 'fa-solid fa-bell',          '#F59E0B', 18, 'solid', 0, 5);

INSERT INTO app_state (`key`, `value`) VALUES ('db_version', '"1.7.0"')
  ON DUPLICATE KEY UPDATE `value` = '"1.7.0"', updated_at = NOW();

SELECT CONCAT('Schema v1.7.0 complete — ', NOW()) AS status;
