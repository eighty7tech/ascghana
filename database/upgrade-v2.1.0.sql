-- ═══════════════════════════════════════════════════════════════════════════════
-- Arsenal Supporters Club Ghana — Database Upgrade v2.1.0
-- New homepage features: live scores, fan wall, milestones, newsletter
-- Run via Admin → Settings → Database → Upgrade, or manually
-- ═══════════════════════════════════════════════════════════════════════════════

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── Homepage: Live Score / Match Status ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS live_scores (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  home_team       VARCHAR(100) NOT NULL DEFAULT 'Arsenal',
  away_team       VARCHAR(100) NOT NULL,
  home_score      INT          NOT NULL DEFAULT 0,
  away_score      INT          NOT NULL DEFAULT 0,
  home_team_logo  VARCHAR(500) DEFAULT NULL,
  away_team_logo  VARCHAR(500) DEFAULT NULL,
  competition     VARCHAR(100) DEFAULT 'Premier League',
  match_date      DATE         NOT NULL,
  match_time      VARCHAR(10)  DEFAULT '17:30',
  venue           VARCHAR(200) DEFAULT NULL,
  status          ENUM('upcoming','live','halftime','result','postponed') NOT NULL DEFAULT 'upcoming',
  minute          INT          DEFAULT NULL,
  is_featured     TINYINT(1)   NOT NULL DEFAULT 1,
  watch_party_venue VARCHAR(200) DEFAULT NULL,
  watch_party_time  VARCHAR(20)  DEFAULT NULL,
  ticket_link     VARCHAR(500) DEFAULT NULL,
  sort_order      INT          NOT NULL DEFAULT 0,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status  (status),
  INDEX idx_date    (match_date),
  INDEX idx_featured (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Live match scores and upcoming fixtures for homepage display';

-- ── Homepage: Fan Wall Posts ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fan_wall_posts (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  member_id       BIGINT       DEFAULT NULL,
  author_name     VARCHAR(200) NOT NULL,
  author_initials VARCHAR(4)   DEFAULT NULL,
  author_photo    VARCHAR(500) DEFAULT NULL,
  author_tier     VARCHAR(40)  DEFAULT 'Bronze',
  author_tier_color VARCHAR(20) DEFAULT '#CD7F32',
  content         TEXT         NOT NULL,
  image_url       VARCHAR(500) DEFAULT NULL,
  reaction_fire   INT          NOT NULL DEFAULT 0,
  reaction_heart  INT          NOT NULL DEFAULT 0,
  reaction_gooner INT          NOT NULL DEFAULT 0,
  is_pinned       TINYINT(1)   NOT NULL DEFAULT 0,
  is_approved     TINYINT(1)   NOT NULL DEFAULT 1,
  is_featured     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL,
  INDEX idx_member   (member_id),
  INDEX idx_approved (is_approved),
  INDEX idx_featured (is_featured),
  INDEX idx_created  (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Public fan wall posts shown on homepage';

-- ── Homepage: Club Milestones / Timeline ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS club_milestones (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  year        VARCHAR(10)  NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  icon        VARCHAR(80)  DEFAULT 'fa-solid fa-star',
  color       VARCHAR(20)  DEFAULT '#EF0107',
  image_url   VARCHAR(500) DEFAULT NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Club history milestones for homepage timeline';

-- ── Homepage: Newsletter Signups ──────────────────────────────────────────────
-- (newsletter_subscribers already exists — just ensure it has source tracking)
ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS source_page VARCHAR(100) DEFAULT 'homepage' AFTER source,
  ADD COLUMN IF NOT EXISTS confirmed    TINYINT(1)  NOT NULL DEFAULT 0 AFTER source_page;

-- ── Homepage: Social Feed Cache ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_feed_cache (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  platform     VARCHAR(40)  NOT NULL,
  post_id      VARCHAR(200) NOT NULL UNIQUE,
  content      TEXT,
  image_url    VARCHAR(500) DEFAULT NULL,
  post_url     VARCHAR(500) DEFAULT NULL,
  likes        INT          NOT NULL DEFAULT 0,
  comments     INT          NOT NULL DEFAULT 0,
  posted_at    DATETIME     DEFAULT NULL,
  cached_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_platform (platform),
  INDEX idx_posted   (posted_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Cached social media posts for homepage social feed';

-- ── Seed: Default Club Milestones ─────────────────────────────────────────────
INSERT IGNORE INTO club_milestones (year, title, description, icon, color, sort_order) VALUES
  ('2003', 'Club Founded',          'Arsenal Supporters Club Ghana established by passionate Gooners in Accra.', 'fa-solid fa-flag',           '#EF0107', 1),
  ('2005', 'First Watch Party',     'Hosted our first official watch party with over 200 fans at Silver Star Tower.', 'fa-solid fa-tv',             '#C6A84B', 2),
  ('2008', 'Arsenal FC Approval',   'Officially approved and recognised by Arsenal Football Club as an official supporters club.', 'fa-solid fa-shield-halved',  '#3B82F6', 3),
  ('2010', 'Official Registration', 'Registered as an official organisation in Ghana with registration number #84594504054.', 'fa-solid fa-certificate',    '#10B981', 4),
  ('2015', '1,000 Members',         'Reached the milestone of 1,000 registered members across all regions of Ghana.', 'fa-solid fa-users',          '#8B5CF6', 5),
  ('2019', 'Emirates Trip',         'First official club trip to the Emirates Stadium for a Premier League match.', 'fa-solid fa-plane',          '#F59E0B', 6),
  ('2023', '20 Years Strong',       'Celebrated 20 years of the Ghana Gooners with a grand gala and 2,000+ members.', 'fa-solid fa-trophy',         '#EF0107', 7),
  ('2024', '2,400+ Members',        'Grew to over 2,400 active members across 10 regions of Ghana.', 'fa-solid fa-chart-line',     '#C6A84B', 8);

-- ── Version bump ──────────────────────────────────────────────────────────────
INSERT INTO app_state (`key`, `value`) VALUES ('db_version', '"2.1.0"')
  ON DUPLICATE KEY UPDATE `value` = '"2.1.0"', updated_at = NOW();

SET FOREIGN_KEY_CHECKS = 1;
