import { Router } from 'express';
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
} from '../controllers/cart.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { addToCartSchema, updateCartItemSchema } from '../validators/cart.validator';

const router = Router();

router.use(requireAuth, requireRole('buyer'));

router.get('/', getCart);
router.post('/items', validateBody(addToCartSchema), addCartItem);
router.patch('/items/:productId', validateBody(updateCartItemSchema), updateCartItem);
router.delete('/items/:productId', removeCartItem);

export default router;