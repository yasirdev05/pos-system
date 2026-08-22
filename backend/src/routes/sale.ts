import { Router } from 'express';
import { getSales, getSale, createSale } from '../controllers/sale';
import { authenticate } from '../middleware/auth';
const router = Router();
router.use(authenticate);
router.get('/', getSales);
router.get('/:id', getSale);
router.post('/', createSale);
export default router;
