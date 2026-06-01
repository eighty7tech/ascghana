-- ═══════════════════════════════════════════════════════════════════════════════
-- Arsenal Supporters Club Ghana — Database Upgrade v3.0.0
-- Run AFTER existing schema is in place (v2.x)
-- Idempotent: safe to run multiple times
-- ═══════════════════════════════════════════════════════════════════════════════

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── Membership Types ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS membership_types (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(60)   NOT NULL UNIQUE,
  slug          VARCHAR(60)   NOT NULL UNIQUE,
  description   TEXT,
  price         DECIMAL(10,2) NOT NULL,
  renewal_price DECIMAL(10,2) NOT NULL,
  benefits      JSON          NOT NULL,
  color         VARCHAR(20)   NOT NULL DEFAULT '#CD7F32',
  icon          VARCHAR(80)   NOT NULL DEFAULT 'fa-solid fa-medal',
  is_popular    TINYINT(1)    NOT NULL DEFAULT 0,
  is_family     TINYINT(1)    NOT NULL DEFAULT 0,
  family_size   INT           DEFAULT NULL,
  sort_order    INT           NOT NULL DEFAULT 0,
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default tiers
INSERT IGNORE INTO membership_types (name, slug, price, renewal_price, benefits, color, icon, is_popular, sort_order) VALUES
('Bronze',   'bronze',   150, 100, '["Member ID card","Club newsletter","Watch party invitations","Voting rights at AGM","Basic community access"]', '#CD7F32', 'fa-solid fa-medal',  0, 1),
('Silver',   'silver',   300, 200, '["All Bronze benefits","Ticket request eligibility","Event priority booking","Silver member badge","Community forum"]', '#A8A9AD', 'fa-solid fa-shield', 0, 2),
('Gold',     'gold',     500, 350, '["All Silver benefits","10% event & shop discount","Gold jersey discount","VIP social access","Priority ticket allocation"]', '#C6A84B', 'fa-solid fa-star',   1, 3),
('Platinum', 'platinum', 1000, 700, '["All Gold benefits","VIP seating","Exclusive Platinum jersey","Dedicated member liaison","Club sponsor recognition"]', '#E8E8E8', 'fa-solid fa-trophy', 0, 4),
('Abusua',   'abusua',   800, 500, '["Family membership (up to 5)","All Gold benefits for family","Family jersey set","Priority watch party seating"]', '#2ECC71', 'fa-solid fa-people-roof', 0, 5);

-- ── Membership Applications ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS membership_applications (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  member_id           BIGINT       DEFAULT NULL,
  membership_type_id  INT          NOT NULL,
  first_name          VARCHAR(100) NOT NULL,
  last_name           VARCHAR(100) NOT NULL,
  email               VARCHAR(200) NOT NULL,
  phone               VARCHAR(30)  DEFAULT NULL,
  branch              VARCHAR(60)  DEFAULT NULL,
  status              ENUM('Pending','Under Review','Approved','Rejected','Waitlisted') NOT NULL DEFAULT 'Pending',
  reviewed_by         VARCHAR(100) DEFAULT NULL,
  review_note         TEXT,
  reviewed_at         DATETIME     DEFAULT NULL,
  payment_status      ENUM('Pending','Paid','Failed','Refunded','Cancelled') NOT NULL DEFAULT 'Pending',
  payment_ref         VARCHAR(100) DEFAULT NULL,
  submitted_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (membership_type_id) REFERENCES membership_types(id),
  INDEX idx_status (status),
  INDEX idx_email  (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Supporters Groups ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supporters_groups (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(200) NOT NULL UNIQUE,
  slug          VARCHAR(200) NOT NULL UNIQUE,
  region        VARCHAR(80)  NOT NULL,
  city          VARCHAR(80)  DEFAULT NULL,
  description   TEXT,
  logo_url      VARCHAR(500) DEFAULT NULL,
  contact_name  VARCHAR(200) DEFAULT NULL,
  contact_phone VARCHAR(30)  DEFAULT NULL,
  contact_email VARCHAR(200) DEFAULT NULL,
  member_count  INT          NOT NULL DEFAULT 0,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  founded_year  VARCHAR(10)  DEFAULT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Executive Positions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS executive_positions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200) NOT NULL UNIQUE,
  description TEXT,
  sort_order  INT          NOT NULL DEFAULT 0,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO executive_positions (title, sort_order) VALUES
('President', 1), ('Vice President', 2), ('General Secretary', 3),
('Treasurer', 4), ('Membership Coordinator', 5), ('Events Coordinator', 6),
('Communications Officer', 7), ('Social Media Manager', 8);

-- ── Executive Committee ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS executive_committee (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  member_id   BIGINT       DEFAULT NULL,
  position_id INT          NOT NULL,
  name        VARCHAR(200) NOT NULL,
  photo       VARCHAR(500) DEFAULT NULL,
  bio         TEXT,
  email       VARCHAR(200) DEFAULT NULL,
  phone       VARCHAR(30)  DEFAULT NULL,
  facebook    VARCHAR(300) DEFAULT NULL,
  instagram   VARCHAR(300) DEFAULT NULL,
  twitter     VARCHAR(300) DEFAULT NULL,
  term_start  VARCHAR(20)  DEFAULT NULL,
  term_end    VARCHAR(20)  DEFAULT NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (position_id) REFERENCES executive_positions(id),
  INDEX idx_position (position_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Match Viewings ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS match_viewings (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  match_title  VARCHAR(255)  NOT NULL,
  competition  VARCHAR(100)  DEFAULT NULL,
  match_date   DATETIME      NOT NULL,
  kickoff_time VARCHAR(10)   DEFAULT NULL,
  venue        VARCHAR(255)  NOT NULL,
  address      TEXT,
  capacity     INT           NOT NULL DEFAULT 0,
  rsvp_count   INT           NOT NULL DEFAULT 0,
  is_free      TINYINT(1)    NOT NULL DEFAULT 1,
  entry_fee    DECIMAL(10,2) DEFAULT NULL,
  image        VARCHAR(500)  DEFAULT NULL,
  description  TEXT,
  status       VARCHAR(30)   NOT NULL DEFAULT 'Upcoming',
  is_active    TINYINT(1)    NOT NULL DEFAULT 1,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_date   (match_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Payments (v3 unified table) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id           VARCHAR(40)   NOT NULL PRIMARY KEY,
  member_id    BIGINT        DEFAULT NULL,
  member_name  VARCHAR(200)  NOT NULL,
  email        VARCHAR(200)  NOT NULL,
  amount       DECIMAL(10,2) NOT NULL,
  currency     CHAR(3)       NOT NULL DEFAULT 'GHS',
  method       ENUM('Mobile Money','Bank Transfer','Cash','Card','Paystack') NOT NULL,
  reference    VARCHAR(100)  DEFAULT NULL UNIQUE,
  gateway      VARCHAR(40)   DEFAULT NULL,
  gateway_ref  VARCHAR(200)  DEFAULT NULL,
  status       ENUM('Pending','Paid','Failed','Refunded','Cancelled') NOT NULL DEFAULT 'Pending',
  purpose      VARCHAR(100)  NOT NULL,
  description  TEXT,
  metadata     JSON,
  paid_at      DATETIME      DEFAULT NULL,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_member  (member_id),
  INDEX idx_status  (status),
  INDEX idx_purpose (purpose),
  INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Community Projects ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_projects (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  slug        VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  image       VARCHAR(500) DEFAULT NULL,
  location    VARCHAR(200) DEFAULT NULL,
  start_date  DATE         DEFAULT NULL,
  end_date    DATE         DEFAULT NULL,
  status      VARCHAR(30)  NOT NULL DEFAULT 'Active',
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Volunteers ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS volunteers (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  member_id    BIGINT       DEFAULT NULL,
  name         VARCHAR(200) NOT NULL,
  email        VARCHAR(200) NOT NULL,
  phone        VARCHAR(30)  DEFAULT NULL,
  skills       TEXT,
  availability VARCHAR(200) DEFAULT NULL,
  status       ENUM('Active','Inactive','Pending') NOT NULL DEFAULT 'Pending',
  joined_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS volunteer_assignments (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  volunteer_id INT           NOT NULL,
  project_id   INT           NOT NULL,
  member_id    BIGINT        DEFAULT NULL,
  role         VARCHAR(100)  DEFAULT NULL,
  hours_logged DECIMAL(6,2)  NOT NULL DEFAULT 0,
  assigned_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id)   REFERENCES community_projects(id) ON DELETE CASCADE,
  INDEX idx_volunteer (volunteer_id),
  INDEX idx_project   (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Audit Logs (v3 — replaces admin_activity_log) ────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  actor_id   BIGINT       DEFAULT NULL,
  actor_name VARCHAR(200) DEFAULT NULL,
  actor_type VARCHAR(20)  NOT NULL DEFAULT 'admin',
  action     ENUM('Create','Update','Delete','Login','Logout','Approve','Reject','Export') NOT NULL,
  entity     VARCHAR(60)  NOT NULL,
  entity_id  VARCHAR(40)  DEFAULT NULL,
  detail     TEXT,
  ip_address VARCHAR(45)  DEFAULT NULL,
  user_agent VARCHAR(300) DEFAULT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_actor   (actor_id),
  INDEX idx_action  (action),
  INDEX idx_entity  (entity),
  INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Settings v3 ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings_v3 (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  section       VARCHAR(60)  NOT NULL,
  setting_key   VARCHAR(100) NOT NULL,
  setting_value LONGTEXT,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_section_key (section, setting_key),
  INDEX idx_section (section)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Contact Submissions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_submissions (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(200) NOT NULL,
  email      VARCHAR(200) NOT NULL,
  phone      VARCHAR(30)  DEFAULT NULL,
  subject    VARCHAR(255) DEFAULT NULL,
  message    TEXT         NOT NULL,
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  replied    TINYINT(1)   NOT NULL DEFAULT 0,
  reply_note TEXT,
  source     VARCHAR(60)  NOT NULL DEFAULT 'contact_form',
  ip_address VARCHAR(45)  DEFAULT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_read    (is_read),
  INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Version bump ──────────────────────────────────────────────────────────────
INSERT INTO app_state (`key`, `value`) VALUES ('db_version', '"3.0.0"')
  ON DUPLICATE KEY UPDATE `value` = '"3.0.0"', updated_at = NOW();

SET FOREIGN_KEY_CHECKS = 1;
