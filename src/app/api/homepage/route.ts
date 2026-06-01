import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getStateValue } from "@/lib/databaseState";

export const revalidate = 60; // ISR — revalidate every 60s

async function safeQuery<T>(sql: string, params: unknown[] = [], fallback: T): Promise<T> {
  try {
    const rows = await query<any>(sql, params);
    return (rows as unknown as T) ?? fallback;
  } catch {
    return fallback;
  }
}

export async function GET() {
  try {
    const [
      memberStats,
      latestNews,
      upcomingEvents,
      matchViewings,
      executives,
      sponsors,
      galleryAlbums,
      communityProjects,
      supportersGroups,
      membershipTypes,
      donations,
      settings,
    ] = await Promise.all([
      // Member stats
      safeQuery<any[]>(`
        SELECT
          COUNT(*) AS total,
          SUM(status = 'Active') AS active,
          COUNT(DISTINCT branch) AS branches
        FROM members WHERE deleted_at IS NULL
      `, [], [{ total: 0, active: 0, branches: 0 }]),

      // Latest news (3)
      safeQuery<any[]>(`
        SELECT id, title, slug, excerpt, category, author, image, published_at, views
        FROM news_articles
        WHERE status = 'Published' AND deleted_at IS NULL
        ORDER BY published_at DESC LIMIT 3
      `, [], []),

      // Upcoming events (3)
      safeQuery<any[]>(`
        SELECT id, title, slug, date, time, venue, category, image, capacity, booked,
               is_free, member_price, non_member_price, short_description
        FROM events
        WHERE status = 'Published' AND date >= CURDATE() AND deleted_at IS NULL
        ORDER BY date ASC LIMIT 3
      `, [], []),

      // Match viewings (3)
      safeQuery<any[]>(`
        SELECT id, match_title, competition, match_date, kickoff_time,
               venue, address, capacity, rsvp_count, is_free, entry_fee, image
        FROM match_viewings
        WHERE is_active = 1 AND match_date >= NOW()
        ORDER BY match_date ASC LIMIT 3
      `, [], []),

      // Executive committee
      safeQuery<any[]>(`
        SELECT ec.id, ec.name, ec.photo, ec.bio, ec.sort_order,
               ep.title AS position
        FROM executive_committee ec
        JOIN executive_positions ep ON ec.position_id = ep.id
        WHERE ec.is_active = 1
        ORDER BY ec.sort_order ASC LIMIT 8
      `, [], []),

      // Sponsors
      safeQuery<any[]>(`
        SELECT id, name, logo_url, website, tier, description
        FROM sponsors WHERE active = 1
        ORDER BY sort_order ASC, tier ASC LIMIT 20
      `, [], []),

      // Gallery albums with first image
      safeQuery<any[]>(`
        SELECT ga.id, ga.name, ga.slug, ga.cover_url, ga.cover_color, ga.category,
               COUNT(gi.id) AS image_count
        FROM gallery_albums ga
        LEFT JOIN gallery_images gi ON gi.album_id = ga.id
        WHERE ga.is_public = 1
        GROUP BY ga.id
        ORDER BY ga.sort_order ASC, ga.created_at DESC LIMIT 6
      `, [], []),

      // Community projects
      safeQuery<any[]>(`
        SELECT id, title, slug, description, image, location, status
        FROM community_projects WHERE is_active = 1
        ORDER BY created_at DESC LIMIT 3
      `, [], []),

      // Supporters groups
      safeQuery<any[]>(`
        SELECT id, name, slug, region, city, logo_url, member_count, founded_year
        FROM supporters_groups WHERE is_active = 1
        ORDER BY member_count DESC LIMIT 8
      `, [], []),

      // Membership types
      safeQuery<any[]>(`
        SELECT id, name, slug, description, price, renewal_price, benefits, color, icon, is_popular, is_family
        FROM membership_types WHERE is_active = 1
        ORDER BY sort_order ASC
      `, [], []),

      // Active donations
      safeQuery<any[]>(`
        SELECT id, title, description, goal, raised, currency, image
        FROM donations WHERE status = 'Active'
        ORDER BY created_at DESC LIMIT 3
      `, [], []),

      // Site settings from app_state
      getStateValue<any>("settings", {}),
    ]);

    // Count upcoming events
    const eventCount = await safeQuery<any[]>(
      `SELECT COUNT(*) AS count FROM events WHERE status = 'Published' AND date >= CURDATE()`,
      [], [{ count: 0 }]
    );

    // Count community projects
    const projectCount = await safeQuery<any[]>(
      `SELECT COUNT(*) AS count FROM community_projects WHERE is_active = 1`,
      [], [{ count: 0 }]
    );

    const ms = memberStats[0] || {};

    return NextResponse.json({
      ok: true,
      stats: {
        totalMembers:  Number(ms.total  || 0),
        activeMembers: Number(ms.active || 0),
        branches:      Number(ms.branches || 0),
        upcomingEvents: Number(eventCount[0]?.count || 0),
        communityProjects: Number(projectCount[0]?.count || 0),
      },
      latestNews,
      upcomingEvents,
      matchViewings,
      executives,
      sponsors,
      galleryAlbums,
      communityProjects,
      supportersGroups,
      membershipTypes,
      donations,
      settings: {
        siteName:    settings.siteName    || "Arsenal Supporters Club Ghana",
        tagline:     settings.tagline     || "Victoria Concordia Crescit",
        logoUrl:     settings.logoUrl     || "",
        heroSlides:  settings.heroSlides  || [],
        socialLinks: settings.socialLinks || [],
        newsTickerItems: settings.newsTickerItems || [],
        nextMatch:   settings.nextMatch   || null,
        arsenalFixtures: settings.arsenalFixtures || [],
        clubFounded: settings.clubFounded || "2003",
        clubApprovedYear: settings.clubApprovedYear || "2008",
      },
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 503 });
  }
}
