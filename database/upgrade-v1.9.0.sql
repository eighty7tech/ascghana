-- ASC Ghana Database Upgrade v1.9.0
-- Run via Admin → Backup & Database → Upgrade to v1.9.0

-- member_id on auth_sessions (MySQL 5.7 safe — run via Admin → Upgrade to v1.9.0 API instead if this fails)
-- ALTER TABLE auth_sessions ADD COLUMN member_id BIGINT DEFAULT NULL AFTER token_hash;

CREATE TABLE IF NOT EXISTS membership_change_requests (
  id                VARCHAR(40)  PRIMARY KEY,
  member_id         BIGINT       NOT NULL,
  membership_number VARCHAR(30)  NOT NULL,
  member_name       VARCHAR(200) NOT NULL,
  email             VARCHAR(200) DEFAULT NULL,
  phone             VARCHAR(40)  DEFAULT NULL,
  branch            VARCHAR(80)  DEFAULT NULL,
  current_tier      VARCHAR(30)  NOT NULL,
  requested_tier    VARCHAR(30)  NOT NULL,
  request_type      ENUM('renew','upgrade','downgrade') NOT NULL DEFAULT 'renew',
  amount            DECIMAL(10,2) NOT NULL DEFAULT 0,
  season            VARCHAR(20)  DEFAULT NULL,
  status            ENUM('Pending','Approved','Declined') NOT NULL DEFAULT 'Pending',
  notes             TEXT,
  admin_notes       TEXT,
  member_details    JSON DEFAULT NULL,
  submitted_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at      DATETIME     DEFAULT NULL,
  processed_by      VARCHAR(100) DEFAULT NULL,
  INDEX idx_member (member_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO app_state (`key`, `value`) VALUES ('membershipRequests', '[]')
  ON DUPLICATE KEY UPDATE `key` = `key`;

INSERT INTO app_state (`key`, `value`) VALUES ('db_version', '"1.9.0"')
  ON DUPLICATE KEY UPDATE `value` = '"1.9.0"', updated_at = NOW();

INSERT INTO system_upgrade_log (version, description, applied_by)
VALUES ('1.9.0', 'v1.9.0: auth hardening, membership DB sync, currency persistence, session refresh', 'manual-sql');
