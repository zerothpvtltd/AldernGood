import { Router } from 'express';
import {
  listSellerProducts,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  listSellerOrders,
  updateSellerOrderItemStatus,
  getSellerSummary,
} from '../controllers/seller.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { uploadProductImages } from '../middleware/upload';
import { validateBody } from '../middleware/validate';
import { createProductSchema, updateProductSchema } from '../validators/product.validator';
import { updateItemStatusSchema } from '../validators/order.validator';

const router = Router();

router.use(requireAuth, requireRole('seller'));

router.get('/summary', getSellerSummary);
router.get('/products', listSellerProducts);
router.post(
  '/products',
  uploadProductImages.array('images', 4),
  validateBody(createProductSchema),
  createSellerProduct
);
router.put(
  '/products/:id',
  uploadProductImages.array('images', 4),
  validateBody(updateProductSchema),
  updateSellerProduct
);
router.delete('/products/:id', deleteSellerProduct);
router.get('/orders', listSellerOrders);
router.patch(
  '/orders/:orderId/items/:productId/status',
  validateBody(updateItemStatusSchema),
  updateSellerOrderItemStatus
);

export default router;