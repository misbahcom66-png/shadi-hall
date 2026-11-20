import { Router } from 'express';
import { bookingsController } from '../controllers/bookingsController.ts';
import { authenticateUser } from '../middleware/auth.ts';
import { verifyCsrfToken } from '../middleware/security.ts';

const router = Router();

router.use(authenticateUser);

router.get('/my', bookingsController.myBookings);
router.post('/', verifyCsrfToken, bookingsController.create);
router.patch('/:id/cancel', verifyCsrfToken, bookingsController.cancelMyBooking);

export default router;
