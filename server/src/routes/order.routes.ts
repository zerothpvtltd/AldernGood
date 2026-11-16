import { Router } from 'express';
import { checkout, listMyOrders, getMyOrderById } from '../controllers/order.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { checkoutSchema } from '../validators/order.validator';

const router = Router();

router.use(requireAuth, requireRole('buyer'));

router.post('/checkout', validateBody(checkoutSchema), checkout);
router.get('/', listMyOrders);
router.get('/:id', getMyOrderById);

export default router;