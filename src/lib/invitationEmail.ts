import nodemailer from "nodemailer";
import crypto from "crypto";

export interface InvitationEmailOptions {
  toEmail: string;
  recipientName?: string;
  inviterName: string;
  workspaceName: string;
  role: string;
  rawToken: string;
  expiresAt: Date;
  customMessage?: string;
  appBaseUrl?: string;
}

export interface InvitationEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  inviteUrl: string;
}

export function generateSecureToken(): { rawToken: string; tokenHash: string } {
  // Generate 32 bytes (256 bits) of cryptographically secure random entropy
  const rawToken = crypto.randomBytes(32).toString("hex");
  // Compute SHA-256 hash for secure server storage
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, tokenHash };
}

export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function sendWorkspaceInvitationEmail(
  options: InvitationEmailOptions
): Promise<InvitationEmailResult> {
  const {
    toEmail,
    inviterName,
    workspaceName,
    role,
    rawToken,
    expiresAt,
    customMessage,
    appBaseUrl,
  } = options;

  // Resolve base URL (Production domain, Vercel URL, or fallback)
  const resolvedBaseUrl = (
    appBaseUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "https://operatsi.com"
  ).replace(/\/$/, "");

  const inviteUrl = `${resolvedBaseUrl}/invite/accept?token=${encodeURIComponent(rawToken)}`;

  const formattedExpiration = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(expiresAt) + " UTC";

  const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1);

  // Branded HTML Email Template adhering to Operatsi & OVIC Labs Design System
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You've been invited to join ${workspaceName} on Operatsi</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #0b0f19;
          color: #f8fafc;
          margin: 0;
          padding: 24px;
        }
        .container {
          max-width: 560px;
          margin: 0 auto;
          background-color: #131b2e;
          border: 1px solid #243049;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
        }
        .header {
          background-color: #0b0f19;
          border-bottom: 1px solid #243049;
          padding: 24px 32px;
          display: flex;
          align-items: center;
        }
        .logo-text {
          font-size: 19px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin: 0;
        }
        .logo-text span {
          color: #2563eb;
        }
        .content {
          padding: 36px 32px;
        }
        .greeting {
          font-size: 16px;
          color: #94a3b8;
          margin: 0 0 16px;
        }
        .headline {
          font-size: 22px;
          font-weight: 700;
          color: #f8fafc;
          line-height: 1.35;
          margin: 0 0 20px;
        }
        .message-box {
          background-color: rgba(37, 99, 235, 0.08);
          border-left: 3px solid #2563eb;
          padding: 14px 18px;
          border-radius: 4px;
          margin: 0 0 24px;
          font-style: italic;
          color: #cbd5e1;
          font-size: 14px;
          line-height: 1.5;
        }
        .details-card {
          background-color: #0b0f19;
          border: 1px solid #243049;
          border-radius: 8px;
          padding: 18px 20px;
          margin: 0 0 28px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          color: #64748b;
          font-weight: 500;
        }
        .detail-val {
          color: #f8fafc;
          font-weight: 600;
        }
        .btn-wrapper {
          text-align: center;
          margin: 32px 0;
        }
        .btn {
          display: inline-block;
          background-color: #2563eb;
          color: #ffffff !important;
          text-decoration: none;
          font-size: 15px;
          font-weight: 600;
          padding: 14px 36px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }
        .alt-link-box {
          background-color: #0b0f19;
          border: 1px solid #243049;
          border-radius: 6px;
          padding: 12px;
          word-break: break-all;
          font-size: 12px;
          color: #64748b;
          margin: 20px 0 0;
        }
        .alt-link-box a {
          color: #3b82f6;
          text-decoration: none;
        }
        .expiry-note {
          font-size: 13px;
          color: #64748b;
          margin: 24px 0 0;
          line-height: 1.5;
        }
        .footer {
          background-color: #0b0f19;
          border-top: 1px solid #243049;
          padding: 24px 32px;
          font-size: 12px;
          color: #64748b;
          line-height: 1.6;
        }
        .footer a {
          color: #3b82f6;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-text">Operat<span>SI</span> &bull; <span style="font-size: 14px; font-weight: 400; color: #94a3b8;">Autonomous Enterprise Operations</span></div>
        </div>
        <div class="content">
          <p class="greeting">Hello,</p>
          <h1 class="headline">
            <span style="color: #60a5fa;">${inviterName}</span> has invited you to join <span style="color: #ffffff;">${workspaceName}</span> on Operatsi.
          </h1>

          ${
            customMessage
              ? `<div class="message-box">"${escapeHtml(customMessage)}"</div>`
              : ""
          }

          <div class="details-card">
            <div class="detail-row">
              <span class="detail-label">Workspace</span>
              <span class="detail-val">${escapeHtml(workspaceName)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Assigned Role</span>
              <span class="detail-val" style="color: #60a5fa;">${roleCapitalized}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Invited By</span>
              <span class="detail-val">${escapeHtml(inviterName)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Expires</span>
              <span class="detail-val">${formattedExpiration}</span>
            </div>
          </div>

          <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0 0 24px;">
            Operatsi helps teams plan, delegate, orchestrate Nano Agents, and execute mission-critical business operations.
          </p>

          <div class="btn-wrapper">
            <a href="${inviteUrl}" class="btn" target="_blank" rel="noopener noreferrer">Accept Invitation &rarr;</a>
          </div>

          <p class="expiry-note">
            This invitation link is single-use and will expire on <strong>${formattedExpiration}</strong>.<br>
            If you were not expecting this invitation, you can safely ignore this email.
          </p>

          <div class="alt-link-box">
            If the button doesn't work, copy and paste this secure URL into your browser:<br>
            <a href="${inviteUrl}">${inviteUrl}</a>
          </div>
        </div>

        <div class="footer">
          Operatsi &bull; An OVIC Labs Enterprise Platform<br>
          Sent securely to <strong>${escapeHtml(toEmail)}</strong>. To manage your notification preferences, visit your account settings.<br>
          &copy; ${new Date().getFullYear()} OVIC Labs Inc. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  // Plain-text alternative fallback
  const textContent = `
Hello,

${inviterName} has invited you to join ${workspaceName} on Operatsi.

You've been invited as: ${roleCapitalized}

${customMessage ? `Personal message: "${customMessage}"\n\n` : ""}Operatsi helps teams plan, delegate and execute business operations.

Click the link below to accept your invitation:
${inviteUrl}

This invitation expires on: ${formattedExpiration}.

If you were not expecting this invitation, you can ignore this email.

Operatsi
An OVIC Labs Company
  `.trim();

  // Read SMTP Configuration
  const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || 587);
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD || process.env.GMAIL_APP_PASSWORD;
  const fromEmail = process.env.SMTP_FROM || process.env.EMAIL_FROM || "no-reply@operatsi.com";

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn("[InvitationEmail] SMTP configuration missing. Email dispatch simulated in local dev.");
    return {
      success: false,
      error: "SMTP credentials not configured in server environment",
      inviteUrl,
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const info = await transporter.sendMail({
      from: `"Operatsi Workspace" <${fromEmail}>`,
      to: toEmail,
      subject: `You've been invited to join ${workspaceName} on Operatsi`,
      text: textContent,
      html: htmlContent,
    });

    return {
      success: true,
      messageId: info.messageId,
      inviteUrl,
    };
  } catch (err: any) {
    console.error("[InvitationEmail] Delivery error:", err);
    return {
      success: false,
      error: err.message || "Failed to dispatch invitation email",
      inviteUrl,
    };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
