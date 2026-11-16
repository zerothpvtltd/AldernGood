import { Router } from 'express';
import {
  listProducts,
  getProductById,
  listCategories,
} from '../controllers/product.controller';
import {
  listProductReviews,
  createProductReview,
} from '../controllers/review.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createReviewSchema } from '../validators/review.validator';

const router = Router();

router.get('/categories', listCategories);
router.get('/products', listProducts);
router.get('/products/:id', getProductById);
router.get('/products/:id/reviews', listProductReviews);
router.post(
  '/products/:id/reviews',
  requireAuth,
  requireRole('buyer'),
  validateBody(createReviewSchema),
  createProductReview
);

export default router;