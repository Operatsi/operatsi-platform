import nodemailer from "nodemailer";

export interface NotificationEmailPayload {
  toEmail: string;
  recipientName?: string;
  title: string;
  body: string;
  category: string;
  priority: string;
  actionUrl: string;
  workspaceName?: string;
}

export async function sendNotificationEmail(payload: NotificationEmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const {
    toEmail,
    recipientName = "OperatSI User",
    title,
    body,
    category,
    priority,
    actionUrl,
    workspaceName = "OperatSI Platform",
  } = payload;

  const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || 587);
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD || process.env.GMAIL_APP_PASSWORD;
  const fromEmail = process.env.SMTP_FROM || process.env.EMAIL_FROM || "no-reply@operatsi.com";

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn("[EmailService] SMTP not fully configured in environment. Skipping email dispatch.");
    return { success: false, error: "SMTP configuration not available" };
  }

  const priorityColor =
    priority === "urgent" ? "#dc2626" : priority === "high" ? "#ea580c" : "#2563eb";

  const fullActionUrl = actionUrl.startsWith("http")
    ? actionUrl
    : `https://operatsi.com${actionUrl}`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }
        .card { background: #ffffff; max-width: 540px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #0f172a; color: #ffffff; padding: 24px 28px; }
        .logo { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; color: #ffffff; margin: 0; }
        .badge { display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 3px 8px; border-radius: 6px; margin-top: 8px; }
        .content { padding: 28px; }
        .title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 12px; }
        .body-text { font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 24px; white-space: pre-line; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-align: center; }
        .footer { background: #f8fafc; border-top: 1px solid #f1f5f9; padding: 20px 28px; font-size: 12px; color: #64748b; line-height: 1.5; }
        .footer a { color: #2563eb; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo">OperatSI Console &bull; <span style="font-weight: 400; opacity: 0.8;">${workspaceName}</span></div>
          <span class="badge" style="background: ${priorityColor}; color: #ffffff;">${priority.toUpperCase()} &bull; ${category.toUpperCase()}</span>
        </div>
        <div class="content">
          <h2 class="title">${title}</h2>
          <p class="body-text">Hello ${recipientName},<br><br>${body}</p>
          <div style="margin: 24px 0 12px;">
            <a href="${fullActionUrl}" class="btn" style="color: #ffffff !important;">Open in OperatSI &rarr;</a>
          </div>
        </div>
        <div class="footer">
          You received this notification because your notification preferences allow email delivery for <strong>${category}</strong>.<br>
          Manage your channels anytime in <a href="https://operatsi.com/settings">Settings &rarr; Notifications</a>.<br><br>
          &copy; 2026 OperatSI &bull; An OVIC Labs Enterprise Platform
        </div>
      </div>
    </body>
    </html>
  `;

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
      from: `"OperatSI Notifications" <${fromEmail}>`,
      to: toEmail,
      subject: `[${priority === "urgent" ? "URGENT" : "OperatSI"}] ${title}`,
      text: `${title}\n\n${body}\n\nView here: ${fullActionUrl}`,
      html: emailHtml,
    });

    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error("[EmailService] Failed to send notification email:", err);
    return { success: false, error: err.message || "Failed to dispatch email" };
  }
}
