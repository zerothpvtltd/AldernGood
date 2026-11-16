import { Response, NextFunction } from 'express';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { Order } from '../models/Order';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../utils/apiError';

export async function listSellerProducts(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const products = await Product.find({ seller: req.user!._id })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ products });
  } catch (err) {
    next(err);
  }
}

export async function createSellerProduct(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { title, description, price, stock, category } = req.body;

    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      throw new ApiError(400, 'Selected category does not exist', {
        category: ['Invalid category'],
      });
    }

    const files = (req.files as Express.Multer.File[]) || [];
    const imagePaths = files.map((file) => `/uploads/${file.filename}`);

    const product = await Product.create({
      seller: req.user!._id,
      title,
      description,
      price: Math.round(Number(price) * 100),
      stock: Number(stock),
      category: categoryDoc._id,
      images: imagePaths,
    });

    const populated = await Product.findById(product._id)
      .populate('category', 'name slug')
      .lean();

    res.status(201).json({ product: populated });
  } catch (err) {
    next(err);
  }
}

export async function updateSellerProduct(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      seller: req.user!._id,
    });

    if (!product) {
      throw new ApiError(404, 'Product not found or you do not own this listing');
    }

    const { title, description, price, stock, category, existingImages } = req.body;

    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      throw new ApiError(400, 'Selected category does not exist', {
        category: ['Invalid category'],
      });
    }

    const files = (req.files as Express.Multer.File[]) || [];
    const newUploads = files.map((file) => `/uploads/${file.filename}`);

    // Retain only existing images that genuinely belonged to this product
    const keptExisting = (existingImages || []).filter((img: string) =>
      product.images.includes(img)
    );
    const combinedImages = [...keptExisting, ...newUploads].slice(0, 4);

    product.title = title;
    product.description = description;
    product.price = Math.round(Number(price) * 100);
    product.stock = Number(stock);
    product.category = categoryDoc._id;
    product.images = combinedImages;

    await product.save();

    const populated = await Product.findById(product._id)
      .populate('category', 'name slug')
      .lean();

    res.json({ product: populated });
  } catch (err) {
    next(err);
  }
}

export async function deleteSellerProduct(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const deleted = await Product.findOneAndDelete({
      _id: req.params.id,
      seller: req.user!._id,
    });

    if (!deleted) {
      throw new ApiError(404, 'Product not found or you do not own this listing');
    }

    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
}

export async function listSellerOrders(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sellerId = req.user!._id.toString();

    const orders = await Order.find({ 'items.seller': sellerId })
      .populate('buyer', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const filteredOrders = orders.map((order) => ({
      _id: order._id,
      buyer: order.buyer,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
      items: order.items.filter((item) => item.seller.toString() === sellerId),
    }));

    res.json({ orders: filteredOrders });
  } catch (err) {
    next(err);
  }
}

export async function updateSellerOrderItemStatus(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { orderId, productId } = req.params;
    const { status } = req.body;
    const sellerId = req.user!._id.toString();

    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    const item = order.items.find(
      (i) => i.product.toString() === productId && i.seller.toString() === sellerId
    );

    if (!item) {
      throw new ApiError(404, 'Order item not found for your store');
    }

    // Restore stock if cancelling an active item
    if (status === 'cancelled' && item.status !== 'cancelled') {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity } }
      );
    }

    item.status = status;
    await order.save();

    res.json({ item });
  } catch (err) {
    next(err);
  }
}

export async function getSellerSummary(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sellerId = req.user!._id;
    const sellerIdStr = sellerId.toString();

    const [orders, lowStockProducts, totalProducts] = await Promise.all([
      Order.find({ 'items.seller': sellerId }).lean(),
      Product.find({ seller: sellerId, stock: { $lte: 5 } })
        .select('title stock price images')
        .sort({ stock: 1 })
        .lean(),
      Product.countDocuments({ seller: sellerId }),
    ]);

    let totalSalesCents = 0;
    let activeOrdersCount = 0;

    for (const order of orders) {
      let hasActiveItem = false;
      for (const item of order.items) {
        if (item.seller.toString() === sellerIdStr) {
          if (item.status !== 'cancelled') {
            totalSalesCents += item.priceSnapshot * item.quantity;
            hasActiveItem = true;
          }
        }
      }
      if (hasActiveItem) activeOrdersCount += 1;
    }

    res.json({
      totalSales: totalSalesCents,
      ordersCount: activeOrdersCount,
      totalProducts,
      lowStockItems: lowStockProducts,
    });
  } catch (err) {
    next(err);
  }
}