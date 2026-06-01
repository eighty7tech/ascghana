-- ═══════════════════════════════════════════════════════════════════════════════
-- Arsenal Supporters Club Ghana — Upgrade Script v1.6.x → v1.7.0
-- Run this ONLY if upgrading an existing v1.6.x install.
-- For fresh installs use schema.sql instead.
-- ═══════════════════════════════════════════════════════════════════════════════

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. Button Active / Section Assignment support ────────────────────────────
-- These are stored as JSON in app_state under key 'settings' (activeButtonId, sectionButtonIds).
-- No new table needed; we just document the new setting keys here.
-- activeButtonId     VARCHAR — the id of the globally active button style
-- sectionButtonIds   JSON    — map of section→buttonId overrides

-- ── 2. Icon Settings support ─────────────────────────────────────────────────
-- Stored as JSON in app_state under key 'settings':
-- iconSettings = { size: number, color: string, style: string }
-- No new table needed — documented here for clarity.

-- ── 3. Ensure admin_settings has the icons section ───────────────────────────
INSERT IGNORE INTO admin_settings (section, setting_key, setting_value)
VALUES
  ('icons', 'size',  '18'),
  ('icons', 'color', '"#EF0107"'),
  ('icons', 'style', '"solid"');

-- ── 4. Add Arsenal Button CSS class column to button_styles table ────────────
-- Safe column additions (compatible with MySQL 5.7 / MariaDB 10.3 — no IF NOT EXISTS on ALTER)
DELIMITER $$
DROP PROCEDURE IF EXISTS _ascg_add_cols$$
CREATE PROCEDURE _ascg_add_cols()
BEGIN
  -- css_class
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'button_styles'
      AND COLUMN_NAME  = 'css_class'
  ) THEN
    ALTER TABLE button_styles
      ADD COLUMN css_class VARCHAR(60) DEFAULT NULL
        COMMENT 'Optional CSS class override e.g. btn-primary, btn-glow';
  END IF;

  -- is_active
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'button_styles'
      AND COLUMN_NAME  = 'is_active'
  ) THEN
    ALTER TABLE button_styles
      ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 0
        COMMENT '1 = global default button';
  END IF;

  -- section_tags
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'button_styles'
      AND COLUMN_NAME  = 'section_tags'
  ) THEN
    ALTER TABLE button_styles
      ADD COLUMN section_tags VARCHAR(300) DEFAULT NULL
        COMMENT 'Comma-separated section IDs this button is assigned to';
  END IF;
END$$
DELIMITER ;
CALL _ascg_add_cols();
DROP PROCEDURE IF EXISTS _ascg_add_cols;

-- ── 5. Per-section button assignment table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS section_button_assignments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  section_id  VARCHAR(60)  NOT NULL COMMENT 'e.g. hero, stats, countdown, bulletin, events, membership, shop',
  button_id   VARCHAR(40)  NOT NULL COMMENT 'ID matching button_styles record or settings JSON id',
  label       VARCHAR(100) DEFAULT NULL,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_section (section_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Maps frontend sections to specific button style IDs';

-- ── 6. Icon presets table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS icon_presets (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL COMMENT 'e.g. Arsenal Red Solid',
  fa_class    VARCHAR(60)  NOT NULL COMMENT 'Full FontAwesome class e.g. fa-solid fa-shield-halved',
  color       VARCHAR(30)  NOT NULL DEFAULT '#EF0107',
  size        SMALLINT     NOT NULL DEFAULT 18,
  style       VARCHAR(20)  NOT NULL DEFAULT 'solid' COMMENT 'solid|regular|light|thin|duotone|brands',
  is_global   TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '1 = applies site-wide as default',
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_global (is_global)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 7. Seed default icon presets ─────────────────────────────────────────────
INSERT IGNORE INTO icon_presets (id, name, fa_class, color, size, style, is_global, sort_order) VALUES
  (1, 'Arsenal Red Solid',   'fa-solid fa-shield-halved', '#EF0107', 18, 'solid',  1, 1),
  (2, 'Club Gold Solid',     'fa-solid fa-trophy',        '#C6A84B', 18, 'solid',  0, 2),
  (3, 'Navy Solid',          'fa-solid fa-futbol',        '#023474', 18, 'solid',  0, 3),
  (4, 'Success Green Solid', 'fa-solid fa-circle-check',  '#10B981', 18, 'solid',  0, 4),
  (5, 'Warning Amber Solid', 'fa-solid fa-bell',          '#F59E0B', 18, 'solid',  0, 5);

-- ── 8. Seed Arsenal button system presets into button_styles ─────────────────
-- These match the CSS classes added in v1.7.0 globals.css
INSERT IGNORE INTO button_styles (id, name, styles_json) VALUES
  (1, 'Arsenal System Presets', JSON_OBJECT(
    'presets', JSON_ARRAY(
      JSON_OBJECT('css_class','btn-primary',          'label','Primary — Arsenal Red'),
      JSON_OBJECT('css_class','btn-glow',             'label','Glow — Glowing Red'),
      JSON_OBJECT('css_class','btn-secondary-a',      'label','Secondary — Red Outline'),
      JSON_OBJECT('css_class','btn-gold-full',        'label','Gold Premium'),
      JSON_OBJECT('css_class','btn-gold-outline-full','label','Gold Outline'),
      JSON_OBJECT('css_class','btn-hero-full',        'label','Hero — Large CTA'),
      JSON_OBJECT('css_class','btn-sm',               'label','Small'),
      JSON_OBJECT('css_class','btn-md',               'label','Medium'),
      JSON_OBJECT('css_class','btn-lg',               'label','Large')
    )
  ))
ON DUPLICATE KEY UPDATE name = name;

-- ── 9. Add light-theme text safety columns to members view ───────────────────
-- No schema change needed — handled by CSS variable fixes in globals.css

-- ── 10. Log the upgrade ───────────────────────────────────────────────────────
INSERT INTO system_upgrade_log (version, description, applied_by)
VALUES (
  '1.7.0',
  'Added: section_button_assignments, icon_presets tables. '
  'New columns: button_styles.css_class, is_active, section_tags. '
  'Admin icon settings page (/admin/settings/icons). '
  'Button system — activeButtonId + sectionButtonIds in settings JSON. '
  'Full Arsenal button CSS system (btn-primary, btn-glow, btn-secondary-a, btn-gold-full, btn-gold-outline-full, btn-hero-full + sizes). '
  'Light-theme member dashboard text visibility fixes. '
  'Admin form insert-box padding/margin classes (.insert-box, .form-group, .form-row). '
  'useButtonStyle() hook for per-section button style resolution on frontend.',
  'system'
);

-- ── 11. Update schema version ────────────────────────────────────────────────
INSERT INTO app_state (`key`, `value`) VALUES ('db_version', '"1.7.0"')
  ON DUPLICATE KEY UPDATE `value` = '"1.7.0"', updated_at = NOW();

SET FOREIGN_KEY_CHECKS = 1;

SELECT CONCAT('Upgrade to v1.7.0 complete — ', NOW()) AS status;
