import { Router } from 'express';
import { authController } from '../controllers/authController.ts';
import { authenticateUser, requireAdmin } from '../middleware/auth.ts';
import { authRateLimiter, verifyCsrfToken } from '../middleware/security.ts';

const router = Router();

router.post('/register', authRateLimiter, verifyCsrfToken, authController.register);
router.post('/login', authRateLimiter, verifyCsrfToken, authController.login);
router.post('/verify-2fa', authRateLimiter, verifyCsrfToken, authController.verify2FA);
router.post('/logout', verifyCsrfToken, authController.logout);
router.get('/me', authenticateUser, authController.me);

// Admin 2FA management
router.post('/2fa/setup', authenticateUser, requireAdmin, verifyCsrfToken, authController.setup2FA);
router.post('/2fa/enable', authenticateUser, requireAdmin, verifyCsrfToken, authController.enable2FA);
router.post('/2fa/disable', authenticateUser, requireAdmin, verifyCsrfToken, authController.disable2FA);

export default router;
