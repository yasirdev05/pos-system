import { Router } from 'express';
import { getInventory, adjustStock, getInventoryHistory } from '../controllers/inventory';
import { authenticate } from '../middleware/auth';
const router = Router();
router.use(authenticate);
router.get('/', getInventory);
router.post('/adjust', adjustStock);
router.get('/history', getInventoryHistory);
export default router;
