import crypto from "crypto";
import { type NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getStateValue } from "@/lib/databaseState";
import { ensureTwoFactorSchema } from "@/lib/dbSchemaFix";

async function sendOTPEmail(email: string, code: string, name: string, settings: any) {
  // Use nodemailer if SMTP is configured
  const smtpHost = process.env.SMTP_HOST || settings?.smtpHost;
  const smtpPort = parseInt(process.env.SMTP_PORT || settings?.smtpPort || "587");
  const smtpUser = process.env.SMTP_USER || settings?.smtpUser;
  const smtpPass = process.env.SMTP_PASS || settings?.smtpPass;
  const fromEmail = settings?.newsletterFromEmail || process.env.SMTP_FROM || smtpUser;
  const fromName = settings?.newsletterFromName || "Arsenal SC Ghana";

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log(`[2FA] OTP for ${email}: ${code} (SMTP not configured)`);
    return true; // Dev mode: code is visible in logs
  }

  try {
    const nodemailer = (await import("nodemailer")).default;
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: `Your Arsenal Ghana verification code: ${code}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0F0D13;color:#fff;border-radius:8px;overflow:hidden">
          <div style="background:#EF0107;padding:24px;text-align:center">
            <h1 style="margin:0;font-size:22px;letter-spacing:2px">ARSENAL SC GHANA</h1>
            <p style="margin:6px 0 0;font-size:13px;opacity:0.85">Victoria Concordia Crescit</p>
          </div>
          <div style="padding:32px 24px">
            <p style="font-size:16px;margin:0 0 8px">Hi ${name},</p>
            <p style="font-size:14px;color:rgba(255,255,255,0.7);margin:0 0 24px">
              Your one-time verification code is:
            </p>
            <div style="background:#1C1829;border:1px solid #C6A84B;border-radius:8px;padding:20px;text-align:center;margin:0 0 24px">
              <span style="font-size:36px;font-weight:900;letter-spacing:10px;color:#C6A84B">${code}</span>
            </div>
            <p style="font-size:13px;color:rgba(255,255,255,0.5);margin:0">
              This code expires in <strong style="color:#fff">10 minutes</strong>. 
              If you did not request this, please ignore this email.
            </p>
          </div>
          <div style="padding:16px 24px;background:#1C1829;text-align:center">
            <p style="font-size:11px;color:rgba(255,255,255,0.3);margin:0">Arsenal Supporters Club Ghana © ${new Date().getFullYear()}</p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("[2FA] Email send failed:", err);
    return false;
  }
}

// POST: send OTP
export async function POST(req: NextRequest) {
  try {
    await ensureTwoFactorSchema();
    const { memberId, email, name, purpose = "login" } = await req.json();
    if (!memberId || !email) return NextResponse.json({ error: "memberId and email required" }, { status: 400 });

    // Cleanup expired codes
    await query("DELETE FROM two_factor_codes WHERE expires_at < NOW()");

    // Generate 6-digit code
    const code = String(crypto.randomInt(100000, 999999));
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await query(
      "INSERT INTO two_factor_codes (member_id, code, purpose, expires_at) VALUES (?, ?, ?, ?)",
      [memberId, code, purpose, expires]
    );

    const settings = await getStateValue<any>("settings", {});
    const sent = await sendOTPEmail(email, code, name || "Member", settings);

    return NextResponse.json({ success: true, sent, dev: !sent ? code : undefined });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "2FA send failed" }, { status: 503 });
  }
}

// PUT: verify OTP
export async function PUT(req: NextRequest) {
  try {
    await ensureTwoFactorSchema();
    const { memberId, code, purpose = "login" } = await req.json();
    if (!memberId || !code) return NextResponse.json({ error: "memberId and code required" }, { status: 400 });

    const row = await queryOne(
      "SELECT id FROM two_factor_codes WHERE member_id = ? AND code = ? AND purpose = ? AND expires_at > NOW() AND used = 0 ORDER BY created_at DESC LIMIT 1",
      [memberId, String(code), purpose]
    ) as { id: number } | null;

    if (!row) return NextResponse.json({ success: false, error: "Invalid or expired code" }, { status: 400 });

    await query("UPDATE two_factor_codes SET used = 1 WHERE id = ?", [row.id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "2FA verify failed" }, { status: 503 });
  }
}

// DELETE: clear codes for member
export async function DELETE(req: NextRequest) {
  try {
    await ensureTwoFactorSchema();
    const { memberId } = await req.json();
    if (memberId) await query("DELETE FROM two_factor_codes WHERE member_id = ?", [memberId]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}
