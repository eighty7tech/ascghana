-- ═══════════════════════════════════════════════════════════════════════════════
-- Arsenal SC Ghana — Upgrade Script (run on existing installs)
-- Safely adds new tables/columns without dropping existing data
-- Works with MySQL 5.7+, 8.0+, and MariaDB 10.2+
-- Silently handles columns that already exist
-- ═══════════════════════════════════════════════════════════════════════════════

SET FOREIGN_KEY_CHECKS = 0;
SET SESSION sql_mode = '';

-- Create a stored procedure to safely add columns (handles existing columns gracefully)
DELIMITER $$

DROP PROCEDURE IF EXISTS add_column_if_not_exists $$
CREATE PROCEDURE add_column_if_not_exists(
    IN p_table_name VARCHAR(100),
    IN p_column_name VARCHAR(100),
    IN p_column_definition VARCHAR(500)
)
BEGIN
    DECLARE column_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO column_exists 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = p_table_name
    AND COLUMN_NAME = p_column_name;
    
    IF column_exists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE ', p_table_name, ' ADD COLUMN ', p_column_name, ' ', p_column_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END $$

DELIMITER ;

-- ── Members table upgrades ────────────────────────────────────────────────────
CALL add_column_if_not_exists('members', 'two_factor_enabled', 'TINYINT(1) NOT NULL DEFAULT 0');
CALL add_column_if_not_exists('members', 'two_factor_secret', 'VARCHAR(64) DEFAULT NULL');
CALL add_column_if_not_exists('members', 'last_login', 'DATETIME DEFAULT NULL');
CALL add_column_if_not_exists('members', 'login_attempts', 'INT NOT NULL DEFAULT 0');
CALL add_column_if_not_exists('members', 'locked_until', 'DATETIME DEFAULT NULL');

-- ── Events table upgrades ─────────────────────────────────────────────────────
-- Fixture columns
CALL add_column_if_not_exists('events', 'fixture_home_team', 'VARCHAR(100) DEFAULT NULL');
CALL add_column_if_not_exists('events', 'fixture_away_team', 'VARCHAR(100) DEFAULT NULL');
CALL add_column_if_not_exists('events', 'fixture_home_logo', 'VARCHAR(500) DEFAULT NULL');
CALL add_column_if_not_exists('events', 'fixture_away_logo', 'VARCHAR(500) DEFAULT NULL');
CALL add_column_if_not_exists('events', 'fixture_competition', 'VARCHAR(100) DEFAULT NULL');
CALL add_column_if_not_exists('events', 'fixture_kickoff', 'DATETIME DEFAULT NULL');

-- Event enhancement columns
CALL add_column_if_not_exists('events', 'short_description', 'VARCHAR(500) DEFAULT NULL');
CALL add_column_if_not_exists('events', 'end_time', 'TIME DEFAULT NULL');
CALL add_column_if_not_exists('events', 'address', 'TEXT');
CALL add_column_if_not_exists('events', 'online_link', 'VARCHAR(500) DEFAULT NULL');
CALL add_column_if_not_exists('events', 'is_free', 'TINYINT(1) NOT NULL DEFAULT 1');
CALL add_column_if_not_exists('events', 'organizer', 'VARCHAR(100) DEFAULT NULL');
CALL add_column_if_not_exists('events', 'contact_email', 'VARCHAR(200) DEFAULT NULL');
CALL add_column_if_not_exists('events', 'tags', 'VARCHAR(500) DEFAULT NULL');
CALL add_column_if_not_exists('events', 'featured', 'TINYINT(1) NOT NULL DEFAULT 0');
CALL add_column_if_not_exists('events', 'requires_booking', 'TINYINT(1) NOT NULL DEFAULT 1');

-- ── Posts table upgrades ──────────────────────────────────────────────────────
CALL add_column_if_not_exists('posts', 'published_at', 'DATETIME DEFAULT NULL');

-- ── Sponsors table upgrades ───────────────────────────────────────────────────
CALL add_column_if_not_exists('sponsors', 'featured', 'TINYINT(1) NOT NULL DEFAULT 0');

-- ── Cleanup: Drop the helper procedure ────────────────────────────────────────
DROP PROCEDURE add_column_if_not_exists;

-- ── NOTE: To create new tables from schema.sql, run separately ──────────────────
-- The schema.sql file contains CREATE TABLE IF NOT EXISTS statements for all tables
-- Run it separately using one of these methods:
--
-- Method 1 - Via MySQL CLI (recommended):
--   mysql -u root -p your_database < database/schema.sql
--
-- Method 2 - Via phpMyAdmin:
--   1. Go to phpMyAdmin
--   2. Click "Import"
--   3. Select database/schema.sql file
--   4. Click "Import"
--
-- Method 3 - Copy/paste schema.sql content into phpMyAdmin SQL tab

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Upgrade complete - All columns added successfully!' AS status;
SELECT 'IMPORTANT: Also run database/schema.sql to ensure all tables exist!' AS reminder;
