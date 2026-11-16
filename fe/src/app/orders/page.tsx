'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Order } from '@/types';
import { apiFetch } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { TableSkeleton } from '@/components/Skeletons';

export default function BuyerOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'buyer') {
      router.replace('/login');
      return;
    }

    apiFetch<{ orders: Order[] }>('/orders')
      .then((res) => setOrders(res.orders))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return <TableSkeleton rows={4} />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-[24px] font-semibold text-ink">My Orders</h1>

      {orders.length === 0 ? (
        <EmptyState
          message="You have not placed any orders yet."
          actionLabel="Explore catalog"
          actionHref="/products"
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order._id}
              href={`/orders/${order._id}`}
              className="card-surface block p-5 transition-shadow duration-150 hover:shadow-card"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <div>
                  <span className="text-[13px] font-medium text-ink">
                    Order #{order._id.slice(-6).toUpperCase()}
                  </span>
                  <span className="ml-3 text-[13px] text-muted">
                    Placed {formatDate(order.createdAt)}
                  </span>
                </div>
                <span className="font-semibold text-ink">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[14px]">
                    <span className="text-ink">
                      {item.titleSnapshot} &times; {item.quantity}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}