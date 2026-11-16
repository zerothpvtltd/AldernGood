'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Cart } from '@/types';
import { apiFetch } from '@/lib/api';
import { formatPrice, getImageUrl } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { EmptyState } from '@/components/EmptyState';
import { TableSkeleton } from '@/components/Skeletons';

export default function CartPage() {
  const { user, loading: authLoading, refreshCartCount } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    try {
      const res = await apiFetch<{ cart: Cart }>('/cart');
      setCart(res.cart);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'buyer') {
      router.replace('/');
      return;
    }
    loadCart();
  }, [user, authLoading, router, loadCart]);

  const updateQuantity = async (productId: string, quantity: number) => {
    setBusyId(productId);
    try {
      const res = await apiFetch<{ cart: Cart }>(`/cart/items/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      });
      setCart(res.cart);
      await refreshCartCount();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update quantity', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const removeItem = async (productId: string) => {
    setBusyId(productId);
    try {
      const res = await apiFetch<{ cart: Cart }>(`/cart/items/${productId}`, {
        method: 'DELETE',
      });
      setCart(res.cart);
      await refreshCartCount();
      showToast('Item removed from cart');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not remove item', 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading || loading) {
    return <TableSkeleton rows={3} />;
  }

  const items = cart?.items || [];
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <div className="space-y-6">
      <h1 className="text-[24px] font-semibold text-ink">Shopping Cart</h1>

      {items.length === 0 ? (
        <EmptyState
          message="Your cart is currently empty."
          actionLabel="Browse products"
          actionHref="/products"
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="card-surface divide-y divide-border lg:col-span-2">
            {items.map((item) => (
              <div
                key={item.product._id}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={getImageUrl(item.product.images[0])}
                    alt={item.product.title}
                    className="h-20 w-24 rounded-[6px] border border-border object-cover"
                  />
                  <div>
                    <Link
                      href={`/products/${item.product._id}`}
                      className="font-medium text-ink hover:text-accent"
                    >
                      {item.product.title}
                    </Link>
                    <p className="mt-0.5 text-[13px] text-muted">
                      {formatPrice(item.product.price)} each
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <label htmlFor={`qty-${item.product._id}`} className="sr-only">
                    Quantity for {item.product.title}
                  </label>
                  <select
                    id={`qty-${item.product._id}`}
                    disabled={busyId === item.product._id}
                    value={item.quantity}
                    onChange={(e) =>
                      updateQuantity(item.product._id, Number(e.target.value))
                    }
                    className="input-field w-20"
                  >
                    {Array.from({ length: Math.min(item.product.stock, 15) }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>

                  <span className="w-20 text-right font-medium text-ink">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>

                  <button
                    type="button"
                    disabled={busyId === item.product._id}
                    onClick={() => removeItem(item.product._id)}
                    className="text-[13px] text-muted hover:text-danger"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="card-surface h-fit space-y-4 p-6">
            <h2 className="text-[18px] font-semibold text-ink">Order Summary</h2>
            <div className="flex justify-between border-t border-border pt-4 text-[14px]">
              <span className="text-muted">Subtotal</span>
              <span className="font-semibold text-ink">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-[12px] text-muted">
              Standard shipping is included on all orders.
            </p>
            <Link href="/checkout" className="btn-primary w-full">
              Proceed to checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}