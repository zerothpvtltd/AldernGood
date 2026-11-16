import { Response, NextFunction } from 'express';
import { Cart } from '../models/Cart';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../utils/apiError';
import { paymentService } from '../utils/paymentService';

export async function checkout(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const decremented: Array<{ productId: string; quantity: number }> = [];

  try {
    const userId = req.user!._id;
    const { shippingAddress, cardDetails } = req.body;

    const cart = await Cart.findOne({ user: userId });
    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, 'Your cart is empty');
    }

    // Load fresh products and validate availability
    const lineItems: Array<{
      product: typeof Product.prototype;
      quantity: number;
    }> = [];

    for (const cartItem of cart.items) {
      const product = await Product.findById(cartItem.product);
      if (!product || product.isHidden) {
        throw new ApiError(400, 'One or more items in your cart are no longer available');
      }
      if (product.stock < cartItem.quantity) {
        throw new ApiError(
          400,
          `Insufficient stock for "${product.title}" (available: ${product.stock})`
        );
      }
      lineItems.push({ product, quantity: cartItem.quantity });
    }

    const totalAmount = lineItems.reduce(
      (sum, entry) => sum + entry.product.price * entry.quantity,
      0
    );

    // Atomically reserve stock item by item; roll back on any failure
    for (const entry of lineItems) {
      const updated = await Product.findOneAndUpdate(
        {
          _id: entry.product._id,
          isHidden: false,
          stock: { $gte: entry.quantity },
        },
        { $inc: { stock: -entry.quantity } },
        { new: true }
      );

      if (!updated) {
        throw new ApiError(
          409,
          `Stock changed while checking out "${entry.product.title}". Please try again.`
        );
      }

      decremented.push({
        productId: entry.product._id.toString(),
        quantity: entry.quantity,
      });
    }

    // Run mock payment
    const paymentResult = await paymentService.processPayment(totalAmount, cardDetails);

    if (paymentResult.status === 'failed') {
      throw new ApiError(
        402,
        paymentResult.message || 'Payment declined. Your order was not placed.'
      );
    }

    // Create order
    const order = await Order.create({
      buyer: userId,
      items: lineItems.map((entry) => ({
        product: entry.product._id,
        seller: entry.product.seller,
        titleSnapshot: entry.product.title,
        priceSnapshot: entry.product.price,
        quantity: entry.quantity,
        status: 'placed',
      })),
      shippingAddress,
      totalAmount,
      payment: {
        method: 'test_card',
        status: 'paid',
        reference: paymentResult.reference,
        last4: paymentResult.last4,
      },
    });

    // Clear buyer cart
    cart.items = [];
    await cart.save();

    res.status(201).json({ order });
  } catch (err) {
    // Roll back any reserved stock
    for (const item of decremented) {
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { stock: item.quantity } }
      ).catch(() => {});
    }
    next(err);
  }
}

export async function listMyOrders(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orders = await Order.find({ buyer: req.user!._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

export async function getMyOrderById(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      buyer: req.user!._id,
    })
      .populate('items.product', 'images title')
      .lean();

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    res.json({ order });
  } catch (err) {
    next(err);
  }
}