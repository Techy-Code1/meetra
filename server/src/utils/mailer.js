import nodemailer from 'nodemailer';

// ── Shared transporter ─────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// ── 1. OTP Email — register / forgot password ──────────────────────────
const sendOTPEmail = async (email, otp, name) => {
  await transporter.sendMail({
    from:    `"Meetra || Connecting Ideas" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: "Verify your email — OTP",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Hi ${name},</h2>
        <p>Your email verification code is:</p>
        <h1 style="letter-spacing:10px;color:#378ADD">${otp}</h1>
        <p>This code expires in <strong>24 hours</strong>.</p>
        <p>If you did not create an account, ignore this email.</p>
      </div>
    `,
  });
};


// ── 2. Meeting Invite Email ────────────────────────────────────────────
const sendInviteEmail = async ({
  to_email,
  host_name,
  meeting_title,
  description,
  scheduled_at,
  duration_minutes,
  meeting_link,
  meeting_code,
  message,
}) => {
  const scheduled = new Date(scheduled_at).toLocaleString("en-US", {
    weekday: "long",
    year:    "numeric",
    month:   "long",
    day:     "numeric",
    hour:    "2-digit",
    minute:  "2-digit",
  });

  await transporter.sendMail({
    from:    `"Meetra || Connecting Ideas" <${process.env.EMAIL_USER}>`,
    to:      to_email,
    subject: `You're invited to "${meeting_title}"`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
        
        <!-- Header -->
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#378ADD;margin:0;font-size:28px;">Meetra</h1>
          <p style="color:#6b7280;margin:4px 0 0;">Connecting Ideas</p>
        </div>

        <!-- Title -->
        <h2 style="color:#111827;font-size:20px;margin-bottom:4px;">
          You're invited to a meeting
        </h2>
        <p style="color:#6b7280;margin-top:0;">
          <strong style="color:#111827;">${host_name}</strong> has invited you to join.
        </p>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>

        <!-- Meeting Details -->
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#6b7280;width:140px;vertical-align:top;">Meeting</td>
            <td style="padding:8px 0;color:#111827;font-weight:600;">${meeting_title}</td>
          </tr>
          ${description ? `
          <tr>
            <td style="padding:8px 0;color:#6b7280;vertical-align:top;">Description</td>
            <td style="padding:8px 0;color:#111827;">${description}</td>
          </tr>` : ""}
          <tr>
            <td style="padding:8px 0;color:#6b7280;vertical-align:top;">When</td>
            <td style="padding:8px 0;color:#111827;">${scheduled}</td>
          </tr>
          ${duration_minutes ? `
          <tr>
            <td style="padding:8px 0;color:#6b7280;vertical-align:top;">Duration</td>
            <td style="padding:8px 0;color:#111827;">${duration_minutes} minutes</td>
          </tr>` : ""}
          <tr>
            <td style="padding:8px 0;color:#6b7280;vertical-align:top;">Meeting Code</td>
            <td style="padding:8px 0;">
              <span style="background:#f3f4f6;padding:4px 10px;border-radius:6px;font-family:monospace;font-size:16px;color:#378ADD;font-weight:700;letter-spacing:4px;">
                ${meeting_code}
              </span>
            </td>
          </tr>
        </table>

        <!-- Host message -->
        ${message ? `
        <div style="background:#f0f7ff;border-left:4px solid #378ADD;padding:12px 16px;margin:20px 0;border-radius:0 8px 8px 0;">
          <p style="margin:0;color:#1e40af;font-style:italic;">"${message}"</p>
          <p style="margin:6px 0 0;color:#6b7280;font-size:13px;">— ${host_name}</p>
        </div>` : ""}

        <!-- CTA Button -->
        <div style="text-align:center;margin:28px 0;">
          <a href="${meeting_link}" style="
            background-color: #378ADD;
            color: white;
            padding: 14px 36px;
            text-decoration: none;
            border-radius: 8px;
            display: inline-block;
            font-weight: bold;
            font-size: 16px;
          ">Join Meeting</a>
        </div>

        <!-- Fallback link -->
        <p style="color:#6b7280;font-size:13px;text-align:center;">
          Or copy this link:<br/>
          <a href="${meeting_link}" style="color:#378ADD;word-break:break-all;">${meeting_link}</a>
        </p>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>

        <!-- Footer -->
        <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
          You received this because someone invited you to a Meetra meeting.<br/>
          If this was unexpected, you can safely ignore this email.
        </p>

      </div>
    `,
  });
};


export { transporter, sendInviteEmail };
export default sendOTPEmail;