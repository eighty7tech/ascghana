import { type NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getMemberSession } from "@/lib/sessionAuth";
import { getStateValue, setStateValue } from "@/lib/databaseState";
import { ensureMemberNotificationsTable } from "@/lib/memberNotifications";

type NotificationPrefs = {
  email: boolean;
  sms: boolean;
  events: boolean;
  tickets: boolean;
  renewals: boolean;
  community: boolean;
};

const DEFAULT_PREFS: NotificationPrefs = {
  email: true,
  sms: false,
  events: true,
  tickets: true,
  renewals: true,
  community: false,
};

async function loadPrefs(memberId: number): Promise<NotificationPrefs> {
  const all = await getStateValue<Record<string, NotificationPrefs>>("memberNotificationPrefs", {});
  return { ...DEFAULT_PREFS, ...(all[String(memberId)] || {}) };
}

async function savePrefs(memberId: number, prefs: NotificationPrefs) {
  const all = await getStateValue<Record<string, NotificationPrefs>>("memberNotificationPrefs", {});
  all[String(memberId)] = prefs;
  await setStateValue("memberNotificationPrefs", all);
}

export async function GET(req: NextRequest) {
  try {
    const member = await getMemberSession();
    if (!member) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    await ensureMemberNotificationsTable();
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || "30"), 100);

    const notifications = (await query(
      `SELECT id, title, message, type, icon, category, is_read AS isRead, link_href AS linkHref, created_at AS createdAt
       FROM member_notifications
       WHERE member_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [member.id, limit]
    )) as object[];

    const unreadRow = (await query(
      "SELECT COUNT(*) AS c FROM member_notifications WHERE member_id = ? AND is_read = 0",
      [member.id]
    )) as { c: number }[];

    const preferences = await loadPrefs(member.id);
    return NextResponse.json({
      notifications,
      unreadCount: Number(unreadRow[0]?.c ?? 0),
      preferences,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load notifications" },
      { status: 503 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const member = await getMemberSession();
    if (!member) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    await ensureMemberNotificationsTable();
    const body = await req.json();
    const { id, markAllRead, preferences } = body as {
      id?: number;
      markAllRead?: boolean;
      preferences?: Partial<NotificationPrefs>;
    };

    if (preferences && typeof preferences === "object") {
      const current = await loadPrefs(member.id);
      await savePrefs(member.id, { ...current, ...preferences });
    }

    if (markAllRead) {
      await query("UPDATE member_notifications SET is_read = 1 WHERE member_id = ? AND is_read = 0", [
        member.id,
      ]);
    } else if (id) {
      await query("UPDATE member_notifications SET is_read = 1 WHERE id = ? AND member_id = ?", [
        id,
        member.id,
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update notifications" },
      { status: 503 }
    );
  }
}
