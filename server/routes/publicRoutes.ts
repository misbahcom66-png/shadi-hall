import { Router } from 'express';
import { hallsController } from '../controllers/hallsController.ts';
import { servicesController } from '../controllers/servicesController.ts';
import { contactController } from '../controllers/contactController.ts';
import { dataRepository } from '../repositories/dataRepository.ts';
import { verifyCsrfToken } from '../middleware/security.ts';

const router = Router();

router.get('/halls', hallsController.listPublic);
router.get('/halls/:id', hallsController.getPublicDetails);
router.get('/services', servicesController.listPublic);
router.post('/contact', verifyCsrfToken, contactController.submit);
router.get('/site-info', async (_req, res) => {
  const settings = await dataRepository.getSettings();
  res.json({ settings });
});

export default router;
