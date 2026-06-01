-- ASC Ghana Database Upgrade v2.0.0
-- Prefer Admin → Backup & Database → Upgrade to v2.0.0 (idempotent API migration)

CREATE TABLE IF NOT EXISTS admin_activity_log (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(100) NOT NULL,
  actor_name  VARCHAR(200) DEFAULT NULL,
  action      VARCHAR(100) NOT NULL,
  detail      TEXT,
  ip_address  VARCHAR(45)  DEFAULT NULL,
  user_agent  VARCHAR(300) DEFAULT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_action (action),
  INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELETE FROM announcements WHERE title LIKE 'Welcome to Arsenal SC Ghana Portal%';

INSERT INTO app_state (`key`, `value`) VALUES ('db_version', '"2.0.0"')
  ON DUPLICATE KEY UPDATE `value` = '"2.0.0"', updated_at = NOW();
