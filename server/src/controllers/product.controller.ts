import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { ApiError } from '../utils/apiError';

export async function listCategories(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.json({ categories });
  } catch (err) {
    next(err);
  }
}

export async function listProducts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      q,
      category,
      minPrice,
      maxPrice,
      sort = 'newest',
      page = '1',
      limit = '12',
    } = req.query as Record<string, string | undefined>;

    const filter: Record<string, unknown> = { isHidden: false };

    if (q && q.trim().length > 0) {
      const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
      ];
    }

    if (category && category !== 'all') {
      if (mongoose.Types.ObjectId.isValid(category)) {
        filter.category = new mongoose.Types.ObjectId(category);
      } else {
        const catDoc = await Category.findOne({ slug: category.toLowerCase() });
        if (catDoc) {
          filter.category = catDoc._id;
        } else {
          res.json({ products: [], total: 0, page: 1, totalPages: 1 });
          return;
        }
      }
    }

    const priceFilter: Record<string, number> = {};
    if (minPrice && !Number.isNaN(Number(minPrice)) && Number(minPrice) >= 0) {
      priceFilter.$gte = Math.round(Number(minPrice) * 100);
    }
    if (maxPrice && !Number.isNaN(Number(maxPrice)) && Number(maxPrice) >= 0) {
      priceFilter.$lte = Math.round(Number(maxPrice) * 100);
    }
    if (Object.keys(priceFilter).length > 0) {
      filter.price = priceFilter;
    }

    let sortStage: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === 'price_asc') sortStage = { price: 1, createdAt: -1 };
    if (sort === 'price_desc') sortStage = { price: -1, createdAt: -1 };
    if (sort === 'rating') sortStage = { ratingAverage: -1, ratingCount: -1, createdAt: -1 };

    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(48, Math.max(1, parseInt(limit || '12', 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .populate('seller', 'name storeName isSuspended')
        .sort(sortStage)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      total,
      page: pageNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    });
  } catch (err) {
    next(err);
  }
}

export async function getProductById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('seller', 'name storeName')
      .lean();

    if (!product || product.isHidden) {
      throw new ApiError(404, 'Product not found');
    }

    res.json({ product });
  } catch (err) {
    next(err);
  }
}