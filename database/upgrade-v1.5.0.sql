-- ═══════════════════════════════════════════════════════════════════════════════
-- Arsenal Supporters Club Ghana — Upgrade Script v1.4.x → v1.5.0
-- Run this ONLY if upgrading an existing v1.4.x install.
-- For fresh installs use schema.sql instead.
-- ═══════════════════════════════════════════════════════════════════════════════

SET NAMES utf8mb4;

-- 1. Button Styles table
CREATE TABLE IF NOT EXISTS button_styles (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  styles_json LONGTEXT     NOT NULL,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Nav Menu Items table
CREATE TABLE IF NOT EXISTS nav_menu_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  label       VARCHAR(100) NOT NULL,
  href        VARCHAR(500) NOT NULL,
  icon        VARCHAR(100) DEFAULT 'fa-solid fa-link',
  target      ENUM('_self','_blank') NOT NULL DEFAULT '_self',
  visible     TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order  INT          NOT NULL DEFAULT 0,
  parent_id   INT          DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_parent (parent_id),
  INDEX idx_sort   (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. System Upgrade Log
CREATE TABLE IF NOT EXISTS system_upgrade_log (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  version     VARCHAR(20)  NOT NULL,
  description TEXT,
  sql_applied TEXT,
  applied_by  VARCHAR(100) DEFAULT 'admin',
  applied_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_version (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Maintenance Mode Log
CREATE TABLE IF NOT EXISTS maintenance_log (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  action      ENUM('enabled','disabled') NOT NULL,
  message     TEXT,
  triggered_by VARCHAR(100) DEFAULT 'admin',
  triggered_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Add upload provider columns to app_state (handled via JSON, no columns needed)
-- 6. Add sectionBgs to settings JSON (handled via app_state JSON key)

-- Log the upgrade
INSERT INTO system_upgrade_log (version, description, applied_by)
  VALUES ('1.5.0', 'Added button_styles, nav_menu_items, system_upgrade_log, maintenance_log tables. Cloudinary/ImgBB upload provider. Maintenance mode frontend guard. Button CRUD. Menu CRUD. Section backgrounds. Social media filter fix. Contact page DB-driven. Logo text DB-driven.', 'system');

-- Update version
INSERT INTO app_state (`key`, `value`) VALUES ('db_version', '"1.5.0"')
  ON DUPLICATE KEY UPDATE `value` = '"1.5.0"', updated_at = NOW();

SELECT CONCAT('Upgrade to v1.5.0 complete — ', NOW()) AS status;

-- ── v1.6.0 additions (run after v1.5.0) ──────────────────────────────────────
-- Fix members.id and all member_id columns to BIGINT to prevent out-of-range errors

ALTER TABLE members MODIFY COLUMN id BIGINT AUTO_INCREMENT;
ALTER TABLE password_reset_tokens MODIFY COLUMN member_id BIGINT NOT NULL;
ALTER TABLE auth_sessions MODIFY COLUMN member_id BIGINT NOT NULL;
ALTER TABLE event_attendance MODIFY COLUMN member_id BIGINT NOT NULL;
ALTER TABLE event_bookings MODIFY COLUMN member_id BIGINT DEFAULT NULL;
ALTER TABLE match_tickets MODIFY COLUMN member_id BIGINT NOT NULL;
ALTER TABLE ticket_requests MODIFY COLUMN member_id BIGINT NOT NULL;
ALTER TABLE community_posts MODIFY COLUMN member_id BIGINT NOT NULL;
ALTER TABLE shop_orders MODIFY COLUMN member_id BIGINT DEFAULT NULL;

INSERT INTO system_upgrade_log (version, description, applied_by)
  VALUES ('1.6.0', 'BIGINT member IDs, localStorage settings fallback, btn-arsenal #e30613 with clip-path, light/dark theme text fixes, auth settings DB sync', 'system');

INSERT INTO app_state (`key`, `value`) VALUES ('db_version', '"1.6.0"')
  ON DUPLICATE KEY UPDATE `value` = '"1.6.0"', updated_at = NOW();

SELECT CONCAT('Upgrade to v1.6.0 complete — ', NOW()) AS status;
