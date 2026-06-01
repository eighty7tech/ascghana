import { type NextRequest, NextResponse } from "next/server";
import { getStateValue } from "@/lib/databaseState";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { memberNumber } = await req.json();
    if (!memberNumber) return NextResponse.json({ success: false, error: "Membership number required" }, { status: 400 });

    const members = await getStateValue<any[]>("members", []);
    const member = members.find(m => m.membershipNumber === memberNumber);

    // Always return success to prevent enumeration
    if (!member || !member.email) {
      return NextResponse.json({ success: true, message: "If the account exists, reset instructions have been sent." });
    }

    // Generate a temporary token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const settings = await getStateValue<any>("settings", {});
    const smtpHost = process.env.SMTP_HOST || settings?.smtpHost;
    const smtpUser = process.env.SMTP_USER || settings?.smtpUser;
    const smtpPass = process.env.SMTP_PASS || settings?.smtpPass;
    const fromName = settings?.newsletterFromName || "Arsenal SC Ghana";
    const fromEmail = settings?.newsletterFromEmail || smtpUser;

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const nodemailer = (await import("nodemailer")).default;
        const transporter = nodemailer.createTransport({
          host: smtpHost, port: parseInt(settings?.smtpPort || "587"),
          secure: false, auth: { user: smtpUser, pass: smtpPass },
        });
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
        await transporter.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to: member.email,
          subject: "Arsenal SC Ghana — Password Reset",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0F0D13;color:#fff;border-radius:8px;overflow:hidden">
              <div style="background:#EF0107;padding:20px 24px;text-align:center">
                <h1 style="margin:0;font-size:18px;font-weight:900;letter-spacing:2px">ARSENAL SC GHANA</h1>
              </div>
              <div style="padding:28px 24px">
                <p>Hi ${member.firstName},</p>
                <p style="color:rgba(255,255,255,0.7)">A password reset was requested for your account (<strong>${memberNumber}</strong>).</p>
                <p style="color:rgba(255,255,255,0.7)">Please contact the admin to reset your password, or reply to this email.</p>
                <p style="color:rgba(255,255,255,0.5);font-size:12px">If you did not request this, please ignore this email.</p>
              </div>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("[ForgotPassword] Email error:", emailErr);
      }
    } else {
      console.log(`[ForgotPassword] SMTP not configured. Member ${memberNumber} requested reset.`);
    }

    return NextResponse.json({ success: true, message: "Reset instructions sent." });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}
