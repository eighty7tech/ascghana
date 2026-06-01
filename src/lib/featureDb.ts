import { query } from "@/lib/db";

export async function ensurePredictionsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS match_predictions (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      member_id INT NOT NULL,
      fixture_ref VARCHAR(80) NOT NULL,
      home_score TINYINT NOT NULL DEFAULT 0,
      away_score TINYINT NOT NULL DEFAULT 0,
      points SMALLINT NOT NULL DEFAULT 0,
      is_settled TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_member_fixture (member_id, fixture_ref),
      INDEX idx_fixture (fixture_ref),
      INDEX idx_member (member_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS prediction_leaderboard (
      member_id INT PRIMARY KEY,
      member_name VARCHAR(200) NOT NULL,
      member_number VARCHAR(50) NOT NULL,
      member_photo VARCHAR(500) DEFAULT NULL,
      total_points INT NOT NULL DEFAULT 0,
      total_predictions INT NOT NULL DEFAULT 0,
      exact_scores INT NOT NULL DEFAULT 0,
      correct_results INT NOT NULL DEFAULT 0,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function ensureFanWallTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS fan_wall_posts (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      member_id INT NOT NULL,
      member_name VARCHAR(200) NOT NULL,
      member_photo VARCHAR(500) DEFAULT NULL,
      member_tier VARCHAR(50) DEFAULT NULL,
      content TEXT NOT NULL,
      image_url VARCHAR(500) DEFAULT NULL,
      post_type ENUM('text','photo','matchday','celebration') NOT NULL DEFAULT 'text',
      likes INT NOT NULL DEFAULT 0,
      is_pinned TINYINT(1) NOT NULL DEFAULT 0,
      is_approved TINYINT(1) NOT NULL DEFAULT 1,
      is_flagged TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_member (member_id),
      INDEX idx_created (created_at),
      INDEX idx_approved (is_approved)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS fan_wall_likes (
      post_id BIGINT NOT NULL,
      member_id INT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (post_id, member_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS fan_wall_comments (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      post_id BIGINT NOT NULL,
      member_id INT NOT NULL,
      member_name VARCHAR(200) NOT NULL,
      member_photo VARCHAR(500) DEFAULT NULL,
      content TEXT NOT NULL,
      is_approved TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_post (post_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function ensurePointsTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS member_points (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      member_id INT NOT NULL,
      points INT NOT NULL DEFAULT 0,
      action VARCHAR(100) NOT NULL,
      description VARCHAR(300) DEFAULT NULL,
      ref_id VARCHAR(100) DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_member (member_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS member_points_balance (
      member_id INT PRIMARY KEY,
      total_points INT NOT NULL DEFAULT 0,
      total_earned INT NOT NULL DEFAULT 0,
      total_spent INT NOT NULL DEFAULT 0,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function awardPoints(memberId: number, points: number, action: string, description: string, refId?: string) {
  await ensurePointsTables();
  await query(
    `INSERT INTO member_points (member_id, points, action, description, ref_id) VALUES (?,?,?,?,?)`,
    [memberId, points, action, description, refId || null]
  );
  await query(
    `INSERT INTO member_points_balance (member_id, total_points, total_earned, total_spent)
     VALUES (?, ?, ?, 0)
     ON DUPLICATE KEY UPDATE
       total_points = total_points + ?,
       total_earned = IF(? > 0, total_earned + ?, total_earned),
       total_spent  = IF(? < 0, total_spent  + ABS(?), total_spent)`,
    [memberId, points, points > 0 ? points : 0,
     points, points, points, points, points]
  );
}

export async function ensureWatchPartyTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS watch_party_rsvps (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      event_id INT NOT NULL,
      member_id INT NOT NULL,
      member_name VARCHAR(200) NOT NULL,
      member_number VARCHAR(50) NOT NULL,
      guests TINYINT NOT NULL DEFAULT 0,
      notes TEXT DEFAULT NULL,
      checked_in TINYINT(1) NOT NULL DEFAULT 0,
      checked_in_at DATETIME DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_event_member (event_id, member_id),
      INDEX idx_event (event_id),
      INDEX idx_member (member_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function ensureDocumentsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS club_documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(300) NOT NULL,
      description TEXT DEFAULT NULL,
      file_url VARCHAR(500) NOT NULL,
      file_type VARCHAR(20) DEFAULT 'pdf',
      category VARCHAR(100) DEFAULT 'General',
      is_public TINYINT(1) NOT NULL DEFAULT 1,
      download_count INT NOT NULL DEFAULT 0,
      sort_order INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function ensureSeasonStatsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS season_stats (
      id INT AUTO_INCREMENT PRIMARY KEY,
      season VARCHAR(20) NOT NULL,
      competition VARCHAR(100) NOT NULL DEFAULT 'Premier League',
      played SMALLINT NOT NULL DEFAULT 0,
      won SMALLINT NOT NULL DEFAULT 0,
      drawn SMALLINT NOT NULL DEFAULT 0,
      lost SMALLINT NOT NULL DEFAULT 0,
      goals_for SMALLINT NOT NULL DEFAULT 0,
      goals_against SMALLINT NOT NULL DEFAULT 0,
      position TINYINT NOT NULL DEFAULT 1,
      points SMALLINT NOT NULL DEFAULT 0,
      top_scorer VARCHAR(100) DEFAULT NULL,
      top_scorer_goals TINYINT DEFAULT 0,
      assist_leader VARCHAR(100) DEFAULT NULL,
      assist_leader_assists TINYINT DEFAULT 0,
      clean_sheets TINYINT NOT NULL DEFAULT 0,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_season_comp (season, competition)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function ensureRewardsTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS rewards_catalogue (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      description TEXT DEFAULT NULL,
      image_url VARCHAR(500) DEFAULT NULL,
      points_cost INT NOT NULL DEFAULT 0,
      stock INT NOT NULL DEFAULT -1,
      category VARCHAR(100) DEFAULT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS reward_redemptions (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      member_id INT NOT NULL,
      reward_id INT NOT NULL,
      points_spent INT NOT NULL,
      status ENUM('pending','approved','fulfilled','cancelled') NOT NULL DEFAULT 'pending',
      admin_note TEXT DEFAULT NULL,
      redeemed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      fulfilled_at DATETIME DEFAULT NULL,
      INDEX idx_member (member_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function ensureFanOfMonthTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS fan_of_month_nominations (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      period_year SMALLINT NOT NULL,
      period_month TINYINT NOT NULL,
      nominated_id INT NOT NULL,
      nominated_by INT NOT NULL,
      reason TEXT DEFAULT NULL,
      is_winner TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_period_nominator (period_year, period_month, nominated_id, nominated_by),
      INDEX idx_period (period_year, period_month),
      INDEX idx_nominated (nominated_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}
