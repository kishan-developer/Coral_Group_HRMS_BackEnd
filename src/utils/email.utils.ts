import nodemailer from 'nodemailer';

const getTransporter = () => {
  console.log('SMTP Config:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    hasPassword: !!process.env.SMTP_PASSWORD,
  });

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

export const verifySMTPConnection = async (): Promise<boolean> => {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log('✅ SMTP Connected Successfully');
    return true;
  } catch (error) {
    console.error('❌ SMTP Connection Failed:', error);
    return false;
  }
};

const stripHtmlToText = (html: string): string => {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  try {
    const transporter = getTransporter();
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'admin@coral-group.in';
    const text = stripHtmlToText(html);

    await transporter.sendMail({
      from: `"Coral Group HRMS" <${fromAddress}>`,
      to,
      subject,
      html,
      text,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email via SMTP:', error);
    if (process.env.NODE_ENV !== 'production') {
      console.log('--------------------------------------------------');
      console.log(`DEVELOPMENT FALLBACK: Email Details for ${to}`);
      console.log(`Subject: ${subject}`);
      const textOnly = stripHtmlToText(html);
      console.log(`Body (Text): ${textOnly}`);
      console.log('--------------------------------------------------');
      return;
    }
    throw error;
  }
};

/**
 * Base Responsive HTML Email Wrapper with Modern Dark Glassmorphism Styling & Logo Header
 */
const getBaseEmailTemplate = ({
  title,
  preheader,
  contentHtml,
}: {
  title: string;
  preheader?: string;
  contentHtml: string;
}): string => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://hrms.dashboard.coral-group.cloud';
  const logoUrl = `${frontendUrl.trim().replace(/\/+$/, '')}/logo.png`;
  const year = new Date().getFullYear();

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body {
          margin: 0;
          padding: 0;
          width: 100% !important;
          background-color: #0b0f17;
          font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .preheader {
          display: none !important;
          max-height: 0;
          overflow: hidden;
          font-size: 1px;
          line-height: 1px;
          color: #0b0f17;
          opacity: 0;
        }
        .wrapper {
          width: 100%;
          background-color: #0b0f17;
          padding: 40px 15px;
          box-sizing: border-box;
        }
        .main-card {
          max-width: 600px;
          margin: 0 auto;
          background: #141b2d;
          border: 1px solid #222f47;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        }
        .header-bar {
          background: linear-gradient(135deg, #182238 0%, #0f172a 100%);
          padding: 32px 36px 28px 36px;
          border-bottom: 1px solid #222f47;
          text-align: center;
        }
        .logo-box {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          padding: 8px 16px;
          border-radius: 12px;
          margin-bottom: 14px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .logo-img {
          height: 36px;
          width: auto;
          object-fit: contain;
          display: block;
        }
        .brand-title {
          color: #ffffff;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: 0.5px;
          margin: 0;
        }
        .brand-subtitle {
          color: #94cb3d;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin: 4px 0 0 0;
        }
        .content-body {
          padding: 36px;
          color: #cbd5e1;
          font-size: 15px;
          line-height: 1.6;
        }
        .headline {
          color: #f8fafc;
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 16px 0;
        }
        .otp-box {
          background: linear-gradient(135deg, rgba(148, 203, 61, 0.12) 0%, rgba(148, 203, 61, 0.04) 100%);
          border: 2px dashed #94cb3d;
          border-radius: 16px;
          padding: 28px 20px;
          margin: 28px 0;
          text-align: center;
        }
        .otp-tag {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #94cb3d;
          margin-bottom: 8px;
        }
        .otp-number {
          font-family: 'Courier New', Courier, monospace;
          font-size: 42px;
          font-weight: 800;
          letter-spacing: 12px;
          color: #ffffff;
          margin: 10px 0;
          text-shadow: 0 0 12px rgba(148, 203, 61, 0.4);
        }
        .otp-timer {
          display: inline-block;
          font-size: 12px;
          font-weight: 600;
          color: #e2e8f0;
          background: rgba(255, 255, 255, 0.08);
          padding: 4px 14px;
          border-radius: 20px;
          margin-top: 6px;
        }
        .info-card {
          background-color: #1e293b;
          border-left: 4px solid #38bdf8;
          border-radius: 10px;
          padding: 18px 20px;
          margin: 24px 0;
        }
        .info-card h4 {
          margin: 0 0 8px 0;
          color: #38bdf8;
          font-size: 14px;
          font-weight: 700;
        }
        .info-card ul {
          margin: 0;
          padding-left: 18px;
          color: #94a3b8;
          font-size: 13px;
        }
        .info-card li {
          margin-bottom: 6px;
        }
        .info-card li:last-child {
          margin-bottom: 0;
        }
        .warning-card {
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 10px;
          padding: 16px 20px;
          margin: 24px 0;
          color: #fca5a5;
          font-size: 13px;
        }
        .warning-card strong {
          color: #ef4444;
        }
        .badge-status {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .footer {
          background-color: #0f172a;
          padding: 24px 36px;
          border-top: 1px solid #1e293b;
          text-align: center;
          color: #64748b;
          font-size: 12px;
          line-height: 1.5;
        }
        .footer a {
          color: #94cb3d;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      ${preheader ? `<div class="preheader">${preheader}</div>` : ''}
      <div class="wrapper">
        <div class="main-card">
          <!-- Header Bar with Logo -->
          <div class="header-bar">
            <div class="logo-box">
              <img src="${logoUrl}" alt="Coral Group Logo" class="logo-img" />
            </div>
            <h1 class="brand-title">CORAL GROUP</h1>
            <div class="brand-subtitle">Human Resource Management Portal</div>
          </div>

          <!-- Body Content -->
          <div class="content-body">
            ${contentHtml}
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Sent securely by <strong>Coral Group HRMS Engine</strong>.</p>
            <p>© ${year} Coral Group. All rights reserved.</p>
            <p style="margin-top: 10px; font-size: 11px; color: #475569;">
              This is an automated operational email. Please do not reply directly.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const sendVerificationOTPEmail = async (
  email: string,
  otp: string
): Promise<void> => {
  const expiryMins = process.env.OTP_EXPIRY_MINUTES || '5';
  const subject = '🔐 Verify Your Email - Coral Group HRMS';
  const preheader = `Your 6-digit verification code is ${otp}. Valid for ${expiryMins} minutes.`;

  const contentHtml = `
    <h2 class="headline">Verify Your Email</h2>
    <p>Dear User,</p>
    <p>Thank you for registering with <strong>Coral Group HRMS</strong>. Please use the following OTP to verify your email address:</p>

    <div class="otp-box">
      <div class="otp-tag">Official Verification Code</div>
      <div class="otp-number">${otp}</div>
      <div class="otp-timer">⏱ This OTP will expire in ${expiryMins} minutes • Single Use Only</div>
    </div>

    <div class="info-card">
      <h4>🔒 Security Instructions:</h4>
      <ul>
        <li>Enter this code in the verification field on the registration portal.</li>
        <li>Never share this verification code with anyone.</li>
        <li>This OTP will expire in ${expiryMins} minutes.</li>
      </ul>
    </div>

    <div class="warning-card">
      If you did not request this verification, please ignore this email.
    </div>

    <p style="margin-top: 28px;">Best regards,<br><strong style="color: #f8fafc;">Coral Group HRMS Team</strong></p>
  `;

  const html = getBaseEmailTemplate({
    title: 'Verify Your Email - Coral Group HRMS',
    preheader,
    contentHtml,
  });

  await sendEmail(email, subject, html);
};

export const sendPasswordResetOTPEmail = async (
  email: string,
  otp: string
): Promise<void> => {
  const expiryMins = process.env.OTP_EXPIRY_MINUTES || '5';
  const subject = '🔑 Password Reset OTP - Coral Group HRMS';
  const preheader = `Your 6-digit password reset code is ${otp}. Valid for ${expiryMins} minutes.`;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl.trim().replace(/\/+$/, '')}/auth/reset-password?email=${encodeURIComponent(email)}`;

  const contentHtml = `
    <h2 class="headline">Password Reset Security Verification</h2>
    <p>We received a request to reset the password for your <strong>Coral Group HRMS</strong> account registered under <strong style="color: #94cb3d;">${email}</strong>.</p>

    <div class="otp-box">
      <div class="otp-tag">Password Reset OTP</div>
      <div class="otp-number">${otp}</div>
      <div class="otp-timer">⏱ Valid for ${expiryMins} Minutes • Confidential</div>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${resetLink}" target="_blank" style="display: inline-block; background: #94cb3d; color: #0b0f17; font-weight: 800; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 15px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(148, 203, 61, 0.3);">
        Reset Password Now
      </a>
    </div>

    <div class="info-card">
      <h4>📌 Next Steps & Security Protocol:</h4>
      <ul>
        <li>Click the button above or navigate to: <a href="${resetLink}" style="color: #38bdf8; word-break: break-all;">${resetLink}</a></li>
        <li>Enter your 6-digit OTP code <strong>${otp}</strong>.</li>
        <li>Create a strong new password with uppercase letters, numbers, and symbols.</li>
        <li>After updating, all existing sessions will be securely signed out.</li>
      </ul>
    </div>

    <div class="warning-card">
      <strong>⚠️ Security Notice:</strong> If you did not request a password reset, please ignore this email immediately and verify your account settings. Your password remains safe and unchanged.
    </div>

    <p style="margin-top: 28px;">Best regards,<br><strong style="color: #f8fafc;">Coral Group HRMS Security Engine</strong></p>
  `;

  const html = getBaseEmailTemplate({
    title: 'Password Reset OTP - Coral Group HRMS',
    preheader,
    contentHtml,
  });

  await sendEmail(email, subject, html);
};


export const sendLeaveApprovalEmail = async (
  email: string,
  employeeName: string,
  leaveType: string,
  status: 'Approved' | 'Rejected',
  reason?: string
): Promise<void> => {
  const subject = `Leave Request ${status} - Coral Group HRMS`;
  const isApproved = status === 'Approved';
  const statusColor = isApproved ? '#22c55e' : '#ef4444';
  const statusBg = isApproved ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';
  const statusBorder = isApproved ? '#22c55e' : '#ef4444';

  const contentHtml = `
    <h2 class="headline">Leave Request Status Update</h2>
    <p>Dear <strong>${employeeName}</strong>,</p>
    <p>Your leave request has been reviewed by management. Here are the details:</p>

    <div style="text-align: center; margin: 24px 0;">
      <span class="badge-status" style="background-color: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder};">
        ${status.toUpperCase()}
      </span>
    </div>

    <div class="info-card" style="border-left-color: ${statusColor};">
      <h4 style="color: ${statusColor};">Request Summary:</h4>
      <ul>
        <li><strong>Leave Type:</strong> ${leaveType}</li>
        <li><strong>Status:</strong> ${status}</li>
      </ul>
    </div>

    ${reason ? `
    <div class="warning-card" style="background: #1e293b; border-color: #334155; color: #cbd5e1;">
      <strong style="color: #94cb3d;">Manager Remarks:</strong> ${reason}
    </div>
    ` : ''}

    <p style="margin-top: 24px;">If you have any questions, please contact the HR department or view your leave balance on the portal.</p>
    <p style="margin-top: 20px;">Best regards,<br><strong style="color: #f8fafc;">Coral Group HR Team</strong></p>
  `;

  const html = getBaseEmailTemplate({
    title: `Leave Request ${status} - Coral Group HRMS`,
    contentHtml,
  });

  await sendEmail(email, subject, html);
};

export const sendLeaveRequestEmail = async (
  managerEmail: string,
  employeeName: string,
  leaveType: string,
  fromDate: string,
  toDate: string
): Promise<void> => {
  const subject = `📋 New Leave Request - ${employeeName} - Coral Group HRMS`;

  const contentHtml = `
    <h2 class="headline">Action Required: New Leave Request</h2>
    <p>Dear Manager,</p>
    <p><strong>${employeeName}</strong> has submitted a new leave request requiring your review and approval.</p>

    <div class="info-card">
      <h4>Application Details:</h4>
      <ul>
        <li><strong>Employee:</strong> ${employeeName}</li>
        <li><strong>Leave Type:</strong> ${leaveType}</li>
        <li><strong>From Date:</strong> ${fromDate}</li>
        <li><strong>To Date:</strong> ${toDate}</li>
      </ul>
    </div>

    <p style="margin-top: 24px;">Please log in to the HRMS Manager Dashboard to review and approve or reject this request.</p>
    <p style="margin-top: 20px;">Best regards,<br><strong style="color: #f8fafc;">Coral Group HR System</strong></p>
  `;

  const html = getBaseEmailTemplate({
    title: 'New Leave Request - Coral Group HRMS',
    contentHtml,
  });

  await sendEmail(managerEmail, subject, html);
};

export const sendGenericEmail = async (
  to: string | string[],
  subject: string,
  heading: string,
  message: string,
  actionButton?: { label: string; url: string }
): Promise<void> => {
  const recipients = Array.isArray(to) ? to.join(', ') : to;
  const contentHtml = `
    <h2 class="headline">${heading}</h2>
    <div style="margin: 20px 0; font-size: 15px; line-height: 1.7; color: #cbd5e1;">
      ${message.replace(/\n/g, '<br/>')}
    </div>
    ${
      actionButton
        ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${actionButton.url}" target="_blank" style="display: inline-block; background: #94cb3d; color: #0b0f17; font-weight: 700; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-size: 14px;">
        ${actionButton.label}
      </a>
    </div>
    `
        : ''
    }
  `;

  const html = getBaseEmailTemplate({
    title: subject,
    contentHtml,
  });

  await sendEmail(recipients, subject, html);
};

export const sendBulkEmails = async (
  recipients: string[],
  subject: string,
  heading: string,
  message: string,
  actionButton?: { label: string; url: string }
): Promise<{ successCount: number; failureCount: number; errors: any[] }> => {
  let successCount = 0;
  let failureCount = 0;
  const errors: any[] = [];

  for (const email of recipients) {
    try {
      await sendGenericEmail(email, subject, heading, message, actionButton);
      successCount++;
    } catch (err: any) {
      failureCount++;
      errors.push({ email, error: err.message || err });
    }
  }

  return { successCount, failureCount, errors };
};

export const sendLoginSuccessEmail = async (
  email: string,
  userName: string,
  ipAddress: string,
  deviceInfo: string,
  loginTime: string
): Promise<void> => {
  const subject = '🔒 Security Notification: New Login to Coral Group HRMS';
  const preheader = `A new login to your HRMS account was detected from ${deviceInfo}.`;

  const contentHtml = `
    <h2 class="headline">New Account Login Detected</h2>
    <p>Dear <strong>${userName}</strong>,</p>
    <p>Your <strong>Coral Group HRMS</strong> account was successfully accessed.</p>

    <div class="info-card">
      <h4>💻 Login Event Details:</h4>
      <ul>
        <li><strong>User Email:</strong> ${email}</li>
        <li><strong>Time of Login:</strong> ${loginTime}</li>
        <li><strong>IP Address:</strong> ${ipAddress}</li>
        <li><strong>Device / Browser:</strong> ${deviceInfo}</li>
      </ul>
    </div>

    <div class="warning-card">
      <strong>Didn't log in?</strong> If this was not you, please immediately reset your password or contact the Coral Group Security Team to secure your account.
    </div>

    <p style="margin-top: 24px;">Best regards,<br><strong style="color: #f8fafc;">Coral Group Security Engine</strong></p>
  `;

  const html = getBaseEmailTemplate({
    title: 'New Account Login Detected - Coral Group HRMS',
    preheader,
    contentHtml,
  });

  await sendEmail(email, subject, html);
};

export const sendPasswordResetSuccessEmail = async (
  email: string,
  resetTime: string
): Promise<void> => {
  const subject = '✅ Password Changed Successfully - Coral Group HRMS';
  const preheader = 'Your Coral Group HRMS account password was updated.';

  const contentHtml = `
    <h2 class="headline">Password Updated Successfully</h2>
    <p>This email confirms that the password for your <strong>Coral Group HRMS</strong> account (<strong style="color: #94cb3d;">${email}</strong>) was successfully changed.</p>

    <div class="info-card">
      <h4>🔒 Security Audit Details:</h4>
      <ul>
        <li><strong>Account Email:</strong> ${email}</li>
        <li><strong>Changed At:</strong> ${resetTime}</li>
        <li><strong>Status:</strong> Password Updated & All Previous Sessions Terminated</li>
      </ul>
    </div>

    <div class="warning-card">
      <strong>Did not make this change?</strong> If you did not update your password, your account may be compromised. Please contact HR support immediately.
    </div>

    <p style="margin-top: 24px;">Best regards,<br><strong style="color: #f8fafc;">Coral Group Security Team</strong></p>
  `;

  const html = getBaseEmailTemplate({
    title: 'Password Changed Successfully - Coral Group HRMS',
    preheader,
    contentHtml,
  });

  await sendEmail(email, subject, html);
};


