-- Arsenal Supporters Club Ghana — Upgrade to v1.8.0
-- Run after v1.7.0. Safe to re-run (IF NOT EXISTS).

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
  submitted_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at      DATETIME     DEFAULT NULL,
  processed_by      VARCHAR(100) DEFAULT NULL,
  INDEX idx_member (member_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO app_state (`key`, `value`) VALUES ('membershipRequests', '[]')
ON DUPLICATE KEY UPDATE `key` = `key`;

INSERT INTO app_state (`key`, `value`) VALUES ('db_version', '"1.8.0"')
ON DUPLICATE KEY UPDATE `value` = '"1.8.0"', updated_at = NOW();

INSERT INTO system_upgrade_log (version, description, applied_by)
SELECT '1.8.0', 'v1.8.0: membership change requests, auth improvements, currency persistence', 'manual-sql'
WHERE EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'system_upgrade_log');
