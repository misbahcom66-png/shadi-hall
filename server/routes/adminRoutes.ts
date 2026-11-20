import { Router } from 'express';
import { adminController } from '../controllers/adminController.ts';
import { bookingsController } from '../controllers/bookingsController.ts';
import { hallsController } from '../controllers/hallsController.ts';
import { servicesController } from '../controllers/servicesController.ts';
import { contactController } from '../controllers/contactController.ts';
import { authenticateUser, requireAdmin } from '../middleware/auth.ts';
import { verifyCsrfToken } from '../middleware/security.ts';

const router = Router();

// Enforce authentication and admin role on every admin route
router.use(authenticateUser, requireAdmin);

router.get('/overview', adminController.overview);
router.get('/customers', adminController.customers);
router.get('/activity-logs', adminController.activityLogs);
router.get('/settings', adminController.getSettings);
router.put('/settings', verifyCsrfToken, adminController.updateSettings);

// Bookings management
router.get('/bookings', bookingsController.listAdmin);
router.patch('/bookings/:id/status', verifyCsrfToken, bookingsController.updateStatusAdmin);
router.delete('/bookings/:id', verifyCsrfToken, bookingsController.deleteAdmin);

// Halls management
router.get('/halls', hallsController.listAdmin);
router.post('/halls', verifyCsrfToken, hallsController.create);
router.put('/halls/:id', verifyCsrfToken, hallsController.update);
router.delete('/halls/:id', verifyCsrfToken, hallsController.remove);
router.post('/halls/upload-image', verifyCsrfToken, hallsController.uploadImage);

// Services management
router.post('/services', verifyCsrfToken, servicesController.create);
router.put('/services/:id', verifyCsrfToken, servicesController.update);
router.delete('/services/:id', verifyCsrfToken, servicesController.remove);

// Messages inbox
router.get('/messages', contactController.listAdmin);
router.patch('/messages/:id/read', verifyCsrfToken, contactController.markReadAdmin);
router.delete('/messages/:id', verifyCsrfToken, contactController.deleteAdmin);

export default router;
