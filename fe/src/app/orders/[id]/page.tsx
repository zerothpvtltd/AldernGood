'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Order } from '@/types';
import { apiFetch } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
import { StatusBadge } from '@/components/StatusBadge';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const isConfirmed = searchParams.get('confirmed') === '1';
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'buyer') {
      router.replace('/login');
      return;
    }

    apiFetch<{ order: Order }>(`/orders/${id}`)
      .then((res) => setOrder(res.order))
      .catch((err) => setError(err instanceof Error ? err.message : 'Order not found'))
      .finally(() => setLoading(false));
  }, [id, user, authLoading, router]);

  if (authLoading || loading) {
    return <div className="h-64 animate-pulse rounded-[8px] bg-[#EFECE6]" />;
  }

  if (error || !order) {
    return (
      <div className="card-surface p-8 text-center">
        <p className="text-danger">{error || 'Order not found'}</p>
        <Link href="/orders" className="btn-secondary mt-4">
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/orders" className="text-[13px] text-muted hover:text-ink">
          &larr; Back to my orders
        </Link>
      </div>

      {isConfirmed && (
        <div className="rounded-[8px] border border-success/40 bg-success/10 p-4 text-[14px] text-success">
          Thank you. Your order has been confirmed and sent to the seller for fulfillment.
        </div>
      )}

      <div className="card-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <h1 className="text-[22px] font-semibold text-ink">
              Order #{order._id.slice(-6).toUpperCase()}
            </h1>
            <p className="mt-1 text-[13px] text-muted">
              Placed on {formatDate(order.createdAt)} &middot; Payment Ref:{' '}
              {order.payment.reference}
              {order.payment.last4 ? ` (Card ending ${order.payment.last4})` : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[12px] text-muted">Total Paid</p>
            <p className="text-[20px] font-semibold text-ink">
              {formatPrice(order.totalAmount)}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-3 md:col-span-2">
            <h2 className="text-[15px] font-semibold text-ink">Items</h2>
            <div className="divide-y divide-border rounded-[8px] border border-border">
              {order.items.map((item, idx) => {
                const productId =
                  typeof item.product === 'string' ? item.product : item.product._id;
                return (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center justify-between gap-4 p-4"
                  >
                    <div>
                      <Link
                        href={`/products/${productId}`}
                        className="font-medium text-ink hover:text-accent"
                      >
                        {item.titleSnapshot}
                      </Link>
                      <p className="mt-0.5 text-[13px] text-muted">
                        {formatPrice(item.priceSnapshot)} &times; {item.quantity}
                      </p>
                      {item.status === 'delivered' && (
                        <Link
                          href={`/products/${productId}`}
                          className="mt-1 inline-block text-[12px] font-medium text-accent hover:underline"
                        >
                          Leave a review
                        </Link>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <StatusBadge status={item.status} />
                      <span className="font-medium text-ink">
                        {formatPrice(item.priceSnapshot * item.quantity)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-[15px] font-semibold text-ink">Shipping Address</h2>
            <div className="rounded-[8px] border border-border p-4 text-[14px] text-ink/90">
              <p className="font-medium text-ink">{order.shippingAddress.fullName}</p>
              <p className="mt-1">{order.shippingAddress.line1}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.postalCode}
              </p>
              <p className="mt-1 text-muted">{order.shippingAddress.phone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}