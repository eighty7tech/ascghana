import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { testEmail, host, port, user, pass, secure, fromName, fromEmail } = await req.json();

    if (!testEmail || !host || !user || !fromEmail) {
      return NextResponse.json({ error: "Missing required SMTP fields" }, { status: 400 });
    }

    // Try to create a real transport and send a test email
    // nodemailer may not be installed — handle gracefully
    let transporter: any;
    try {
      const nm = await import("nodemailer");
      transporter = nm.createTransport({
        host, port: Number(port) || 587, secure: !!secure,
        auth: { user, pass },
      });
    } catch {
      // nodemailer not installed — return a helpful message
      return NextResponse.json({
        error: "nodemailer is not installed. Run: npm install nodemailer",
      }, { status: 503 });
    }

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: testEmail,
      subject: "Test Email — Arsenal SC Ghana",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#07060F;color:#fff;border-radius:8px;">
          <h2 style="color:#EF0107;margin:0 0 16px;">✅ SMTP Test Successful</h2>
          <p style="color:#ccc;">Your email settings are working correctly.</p>
          <p style="color:#888;font-size:12px;margin-top:24px;">Sent from Arsenal SC Ghana Admin Panel</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "SMTP error" }, { status: 500 });
  }
}
