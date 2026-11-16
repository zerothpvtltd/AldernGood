import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Review } from '../models/Review';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../utils/apiError';

export async function listProductReviews(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reviews = await Review.find({ product: req.params.id })
      .populate('buyer', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ reviews });
  } catch (err) {
    next(err);
  }
}

export async function createProductReview(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = req.params.id;
    const buyerId = req.user!._id;
    const { rating, comment } = req.body;

    const product = await Product.findById(productId);
    if (!product || product.isHidden) {
      throw new ApiError(404, 'Product not found');
    }

    const deliveredOrder = await Order.findOne({
      buyer: buyerId,
      items: {
        $elemMatch: {
          product: new mongoose.Types.ObjectId(productId),
          status: 'delivered',
        },
      },
    });

    if (!deliveredOrder) {
      throw new ApiError(
        403,
        'You can only review products from orders that have been delivered'
      );
    }

    const existingReview = await Review.findOne({ product: productId, buyer: buyerId });
    if (existingReview) {
      throw new ApiError(409, 'You have already reviewed this product');
    }

    const review = await Review.create({
      product: productId,
      buyer: buyerId,
      rating,
      comment,
    });

    const stats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: '$product',
          avg: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      product.ratingAverage = Math.round(stats[0].avg * 10) / 10;
      product.ratingCount = stats[0].count;
      await product.save();
    }

    const populated = await Review.findById(review._id).populate('buyer', 'name').lean();
    res.status(201).json({ review: populated });
  } catch (err) {
    next(err);
  }
}