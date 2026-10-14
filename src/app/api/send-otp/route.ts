import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email, otp, name } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    // Check if SMTP environment variables are configured
    const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || 587);
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER || process.env.GMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD || process.env.GMAIL_APP_PASSWORD;
    const fromEmail = process.env.SMTP_FROM || process.env.EMAIL_FROM || "no-reply@operatsi.com";

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0f172a; margin: 0 0 8px; font-size: 22px; font-weight: 700;">OperatSI Workspace Activation</h2>
          <p style="color: #64748b; font-size: 14px; margin: 0;">An OVIC Labs Company</p>
        </div>
        <p style="color: #334155; font-size: 15px; line-height: 1.5;">Hello${name ? ` ${name}` : ""},</p>
        <p style="color: #334155; font-size: 15px; line-height: 1.5;">Your 5-digit security code to activate your OperatSI workspace is:</p>
        <div style="margin: 28px 0; text-align: center;">
          <span style="display: inline-block; background: #2563eb; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: 8px; padding: 14px 28px; border-radius: 10px; font-family: monospace;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">This code will expire in 10 minutes. If you did not request this verification code, please ignore this email or contact support@operatsi.com.</p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">&copy; 2026 OperatSI. All rights reserved.</p>
      </div>
    `;

    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"OperatSI Platform" <${fromEmail}>`,
        to: email,
        subject: `Your OperatSI Activation Code: ${otp}`,
        text: `Your OperatSI 5-digit activation code is: ${otp}. Enter this in your browser to verify your workspace.`,
        html: emailHtml,
      });

      return NextResponse.json({ success: true, delivered: "smtp" });
    } else {
      // Log for developer in server terminal
      console.log(`\n==================================================`);
      console.log(`[OperatSI Email Service] OTP for ${email}: ${otp}`);
      console.log(`To enable live SMTP delivery, add SMTP_HOST, SMTP_USER, SMTP_PASS to .env.local`);
      console.log(`==================================================\n`);

      return NextResponse.json({
        success: true,
        delivered: "simulated",
        message: `OTP dispatched for ${email}`,
      });
    }
  } catch (err: unknown) {
    console.error("[send-otp route error]:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to process OTP dispatch" },
      { status: 500 }
    );
  }
}
