import { Router } from 'express';
import {
  getAdminStats,
  listUsers,
  toggleUserSuspension,
  createCategory,
  updateCategory,
  deleteCategory,
  listAllProductsAdmin,
  toggleProductHidden,
  listAllOrdersAdmin,
} from '../controllers/admin.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { categorySchema } from '../validators/admin.validator';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/stats', getAdminStats);
router.get('/users', listUsers);
router.patch('/users/:id/suspend', toggleUserSuspension);

router.post('/categories', validateBody(categorySchema), createCategory);
router.put('/categories/:id', validateBody(categorySchema), updateCategory);
router.delete('/categories/:id', deleteCategory);

router.get('/products', listAllProductsAdmin);
router.patch('/products/:id/hide', toggleProductHidden);

router.get('/orders', listAllOrdersAdmin);

export default router;