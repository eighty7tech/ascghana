import { query } from "@/lib/db";
import { columnExists, ensureAuthSessionSchema } from "@/lib/dbSchemaFix";

export type MembershipRequestRecord = {
  id: string;
  memberId: number;
  memberName: string;
  membershipNumber: string;
  email: string;
  phone: string;
  branch: string;
  currentTier: string;
  requestedTier: string;
  requestType: "renew" | "upgrade" | "downgrade";
  amount: number;
  season: string;
  renewalWindow: boolean;
  status: "Pending" | "Approved" | "Declined";
  notes?: string;
  adminNotes?: string;
  submittedAt: string;
  processedAt?: string;
  processedBy?: string;
  memberDetails?: Record<string, unknown>;
};

export async function upsertMembershipRequest(req: MembershipRequestRecord): Promise<void> {
  try {
    await query(
      `INSERT INTO membership_change_requests (
        id, member_id, membership_number, member_name, email, phone, branch,
        current_tier, requested_tier, request_type, amount, season, status,
        notes, admin_notes, member_details, submitted_at, processed_at, processed_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        admin_notes = VALUES(admin_notes),
        processed_at = VALUES(processed_at),
        processed_by = VALUES(processed_by)`,
      [
        req.id,
        req.memberId,
        req.membershipNumber,
        req.memberName,
        req.email,
        req.phone || "",
        req.branch,
        req.currentTier,
        req.requestedTier,
        req.requestType,
        req.amount,
        req.season,
        req.status,
        req.notes || null,
        req.adminNotes || null,
        req.memberDetails ? JSON.stringify(req.memberDetails) : null,
        req.submittedAt.slice(0, 19).replace("T", " "),
        req.processedAt ? req.processedAt.slice(0, 19).replace("T", " ") : null,
        req.processedBy || null,
      ]
    );
  } catch {
    /* table may not exist until upgrade */
  }
}

export async function refreshMemberAuthSessions(
  memberId: number,
  updates: {
    tier?: string;
    status?: string;
    renewalDue?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  }
): Promise<void> {
  await ensureAuthSessionSchema();

  const tierColors: Record<string, string> = {
    Platinum: "#E8E8E8",
    Gold: "#C6A84B",
    Silver: "#A8A9AD",
    Bronze: "#CD7F32",
    Abusua: "#2ECC71",
  };

  const patchUser = (user: Record<string, unknown>) => ({
    ...user,
    ...(updates.tier ? { tier: updates.tier, tierColor: tierColors[updates.tier] || user.tierColor } : {}),
    ...(updates.status ? { status: updates.status } : {}),
    ...(updates.renewalDue ? { renewalDue: updates.renewalDue } : {}),
    ...(updates.firstName ? { firstName: updates.firstName } : {}),
    ...(updates.lastName ? { lastName: updates.lastName } : {}),
    ...(updates.name ? { name: updates.name } : {}),
  });

  try {
    const hasMemberId = await columnExists("auth_sessions", "member_id");

    if (hasMemberId) {
      const rows = (await query<{ token_hash: string; user_json: string }>(
        "SELECT token_hash, user_json FROM auth_sessions WHERE member_id = ? AND expires_at > NOW()",
        [memberId]
      )) as { token_hash: string; user_json: string }[];

      for (const row of rows || []) {
        const updated = patchUser(JSON.parse(row.user_json));
        await query("UPDATE auth_sessions SET user_json = ? WHERE token_hash = ?", [
          JSON.stringify(updated),
          row.token_hash,
        ]);
      }
      return;
    }

    const rows = (await query<{ token_hash: string; user_json: string }>(
      "SELECT token_hash, user_json FROM auth_sessions WHERE expires_at > NOW()",
      []
    )) as { token_hash: string; user_json: string }[];

    for (const row of rows || []) {
      const user = JSON.parse(row.user_json) as { id?: number };
      if (user.id !== memberId) continue;
      const updated = patchUser(user as Record<string, unknown>);
      await query("UPDATE auth_sessions SET user_json = ? WHERE token_hash = ?", [
        JSON.stringify(updated),
        row.token_hash,
      ]);
    }
  } catch {
    /* non-fatal */
  }
}
