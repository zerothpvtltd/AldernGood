import { Response, NextFunction } from 'express';
import { Cart } from '../models/Cart';
import { Product } from '../models/Product';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../utils/apiError';

async function getHydratedCart(userId: string) {
  let cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'title price stock images isHidden seller',
    populate: { path: 'seller', select: 'storeName name' },
  });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  // Filter out deleted or hidden products cleanly
  const validItems = cart.items.filter((item) => {
    const prod = item.product as unknown as { isHidden?: boolean } | null;
    return prod && !prod.isHidden;
  });

  if (validItems.length !== cart.items.length) {
    cart.items = validItems;
    await cart.save();
  }

  return cart;
}

export async function getCart(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cart = await getHydratedCart(req.user!._id.toString());
    res.json({ cart });
  } catch (err) {
    next(err);
  }
}

export async function addCartItem(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { productId, quantity } = req.body;
    const product = await Product.findById(productId);

    if (!product || product.isHidden) {
      throw new ApiError(404, 'Product is unavailable');
    }

    if (product.stock < 1) {
      throw new ApiError(400, 'This item is currently out of stock');
    }

    const userId = req.user!._id.toString();
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (i) => i.product.toString() === productId
    );

    const currentQty = existingIndex > -1 ? cart.items[existingIndex].quantity : 0;
    const desiredQty = currentQty + quantity;

    if (desiredQty > product.stock) {
      throw new ApiError(
        400,
        `Only ${product.stock} unit(s) available in stock`
      );
    }

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity = desiredQty;
    } else {
      cart.items.push({ product: product._id, quantity });
    }

    await cart.save();
    const hydrated = await getHydratedCart(userId);
    res.json({ cart: hydrated });
  } catch (err) {
    next(err);
  }
}

export async function updateCartItem(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product || product.isHidden) {
      throw new ApiError(404, 'Product is unavailable');
    }

    if (quantity > product.stock) {
      throw new ApiError(400, `Only ${product.stock} unit(s) available in stock`);
    }

    const userId = req.user!._id.toString();
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      throw new ApiError(404, 'Cart not found');
    }

    const item = cart.items.find((i) => i.product.toString() === productId);
    if (!item) {
      throw new ApiError(404, 'Item not found in cart');
    }

    item.quantity = quantity;
    await cart.save();

    const hydrated = await getHydratedCart(userId);
    res.json({ cart: hydrated });
  } catch (err) {
    next(err);
  }
}

export async function removeCartItem(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { productId } = req.params;
    const userId = req.user!._id.toString();

    const cart = await Cart.findOne({ user: userId });
    if (cart) {
      cart.items = cart.items.filter((i) => i.product.toString() !== productId);
      await cart.save();
    }

    const hydrated = await getHydratedCart(userId);
    res.json({ cart: hydrated });
  } catch (err) {
    next(err);
  }
}