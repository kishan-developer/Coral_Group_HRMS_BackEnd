import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/error.middleware';
import { verifySMTPConnection, sendGenericEmail, sendBulkEmails } from '../../utils/email.utils';
import { User } from '../../models/user.model';

export class EmailController {
  // GET /api/v1/email/verify-smtp
  verifySMTP = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isConnected = await verifySMTPConnection();
      const currentTime = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full',
        timeStyle: 'medium',
      });

      res.status(200).json({
        success: true,
        data: {
          connected: isConnected,
          checkedAt: currentTime,
          timestamp: new Date().toISOString(),
        },
        message: isConnected ? 'SMTP connection verified successfully' : 'SMTP connection failed',
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/v1/email/send
  sendCustomEmail = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { to, subject, heading, message, actionButton } = req.body;

      if (!to || !subject || !message) {
        throw new AppError('Recipient (to), subject, and message are required', 400, 'MISSING_FIELDS');
      }

      const sentTime = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full',
        timeStyle: 'medium',
      });

      const formattedHeading = heading || subject;
      const fullMessage = `${message}\n\nSent on: ${sentTime}`;

      await sendGenericEmail(to, subject, formattedHeading, fullMessage, actionButton);

      res.status(200).json({
        success: true,
        data: {
          to,
          subject,
          sentAt: sentTime,
          timestamp: new Date().toISOString(),
        },
        message: `Email dispatched successfully to ${Array.isArray(to) ? to.join(', ') : to}`,
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/v1/email/test
  sendTestEmail = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      let targetEmail = req.body.to;

      if (!targetEmail && req.userId) {
        const user = await User.findById(req.userId);
        if (user) {
          targetEmail = user.email;
        }
      }

      if (!targetEmail) {
        throw new AppError('Recipient email is required', 400, 'MISSING_FIELDS');
      }

      const currentTime = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full',
        timeStyle: 'medium',
      });

      const subject = '🧪 HRMS Email Test Connection';
      const heading = 'SMTP Email Process Verification';
      const message = `Hello,\n\nThis is an automated test email sent from the HRMS Backend Email API.\nIf you are reading this email, your SMTP configuration is active and operating correctly.\n\nProcess Time: ${currentTime}`;

      await sendGenericEmail(targetEmail, subject, heading, message, {
        label: 'Open HRMS Portal',
        url: process.env.FRONTEND_URL || 'https://hrms.dashboard.coral-group.cloud',
      });

      res.status(200).json({
        success: true,
        data: {
          to: targetEmail,
          sentAt: currentTime,
          timestamp: new Date().toISOString(),
        },
        message: `Test email sent successfully to ${targetEmail}`,
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/v1/email/bulk
  sendBulkEmail = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { recipients, role, subject, heading, message, actionButton } = req.body;

      let targetEmails: string[] = [];

      if (recipients && Array.isArray(recipients) && recipients.length > 0) {
        targetEmails = recipients;
      } else if (role) {
        const users = await User.find({ role, isActive: true }).select('email');
        targetEmails = users.map((u) => u.email).filter(Boolean);
      } else {
        // Default: send to all active users if no recipients or role specified
        const users = await User.find({ isActive: true }).select('email');
        targetEmails = users.map((u) => u.email).filter(Boolean);
      }

      if (targetEmails.length === 0) {
        throw new AppError('No valid recipient emails found', 400, 'NO_RECIPIENTS');
      }

      if (!subject || !message) {
        throw new AppError('Subject and message are required', 400, 'MISSING_FIELDS');
      }

      const sentTime = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full',
        timeStyle: 'medium',
      });

      const formattedHeading = heading || subject;
      const fullMessage = `${message}\n\nBroadcast Process Time: ${sentTime}`;

      const result = await sendBulkEmails(targetEmails, subject, formattedHeading, fullMessage, actionButton);

      res.status(200).json({
        success: true,
        data: {
          totalTargeted: targetEmails.length,
          successCount: result.successCount,
          failureCount: result.failureCount,
          errors: result.errors,
          sentAt: sentTime,
          timestamp: new Date().toISOString(),
        },
        message: `Bulk email process completed. ${result.successCount} sent, ${result.failureCount} failed.`,
      });
    } catch (error) {
      next(error);
    }
  };
}
