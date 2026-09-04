import { Router } from 'express';
import { EmailController } from '../../controllers/email/email.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const emailController = new EmailController();

// Verify SMTP Connection
router.get('/verify-smtp', authMiddleware, emailController.verifySMTP);

// Send Custom Email Process
router.post('/send', authMiddleware, emailController.sendCustomEmail);

// Send Test Email
router.post('/test', authMiddleware, emailController.sendTestEmail);

// Send Bulk Email Process
router.post('/bulk', authMiddleware, emailController.sendBulkEmail);

export default router;
