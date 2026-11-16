import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { Category } from '../models/Category';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../utils/apiError';
import { slugify } from '../utils/slugify';

export async function getAdminStats(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [usersCount, sellersCount, productsCount, orders] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'seller' }),
      Product.countDocuments(),
      Order.find({ 'payment.status': 'paid' }).select('totalAmount items').lean(),
    ]);

    const revenue = orders.reduce((acc, order) => {
      const activeTotal = order.items
        .filter((i) => i.status !== 'cancelled')
        .reduce((sum, i) => sum + i.priceSnapshot * i.quantity, 0);
      return acc + activeTotal;
    }, 0);

    res.json({
      stats: {
        users: usersCount,
        sellers: sellersCount,
        products: productsCount,
        orders: orders.length,
        revenue,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function listUsers(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const users = await User.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export async function toggleUserSuspension(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const targetUser = await User.findById(req.params.id).select('-passwordHash');
    if (!targetUser) {
      throw new ApiError(404, 'User not found');
    }

    if (targetUser._id.toString() === req.user!._id.toString()) {
      throw new ApiError(400, 'You cannot suspend your own admin account');
    }

    targetUser.isSuspended = !targetUser.isSuspended;
    await targetUser.save();

    res.json({ user: targetUser });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name } = req.body;
    const slug = slugify(name);

    const existing = await Category.findOne({ $or: [{ name }, { slug }] });
    if (existing) {
      throw new ApiError(409, 'A category with this name already exists');
    }

    const category = await Category.create({ name, slug });
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name } = req.body;
    const slug = slugify(name);

    const duplicate = await Category.findOne({
      _id: { $ne: req.params.id },
      $or: [{ name }, { slug }],
    });

    if (duplicate) {
      throw new ApiError(409, 'Another category already uses this name');
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, slug },
      { new: true }
    );

    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    res.json({ category });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const inUseCount = await Product.countDocuments({ category: req.params.id });
    if (inUseCount > 0) {
      throw new ApiError(
        400,
        `Cannot delete category while ${inUseCount} product(s) are assigned to it`
      );
    }

    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) {
      throw new ApiError(404, 'Category not found');
    }

    res.json({ message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
}

export async function listAllProductsAdmin(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const products = await Product.find()
      .populate('category', 'name slug')
      .populate('seller', 'name storeName email')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ products });
  } catch (err) {
    next(err);
  }
}

export async function toggleProductHidden(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    product.isHidden = !product.isHidden;
    await product.save();

    res.json({ product });
  } catch (err) {
    next(err);
  }
}

export async function listAllOrdersAdmin(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orders = await Order.find()
      .populate('buyer', 'name email')
      .populate('items.seller', 'storeName name')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}