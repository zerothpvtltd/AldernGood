'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Order } from '@/types';
import { apiFetch } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { TableSkeleton } from '@/components/Skeletons';

export default function AdminOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      router.replace('/login');
      return;
    }

    apiFetch<{ orders: Order[] }>('/admin/orders')
      .then((res) => setOrders(res.orders))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return <TableSkeleton rows={5} />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-[24px] font-semibold text-ink">All Platform Orders</h1>

      {orders.length === 0 ? (
        <EmptyState message="No orders have been placed on the platform yet." />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const buyerName =
              typeof order.buyer === 'string' ? order.buyer : order.buyer?.name;
            return (
              <div key={order._id} className="card-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <span className="font-semibold text-ink">
                      Order #{order._id.slice(-6).toUpperCase()}
                    </span>
                    <span className="ml-3 text-[13px] text-muted">
                      Buyer: {buyerName} &middot; {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <span className="font-semibold text-ink">
                    {formatPrice(order.totalAmount)}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {order.items.map((item, idx) => {
                    const storeName =
                      typeof item.seller === 'string'
                        ? ''
                        : item.seller?.storeName || item.seller?.name || '';
                    return (
                      <div
                        key={idx}
                        className="flex flex-wrap items-center justify-between gap-2 text-[14px]"
                      >
                        <div>
                          <span className="text-ink">
                            {item.titleSnapshot} &times; {item.quantity}
                          </span>
                          {storeName && (
                            <span className="ml-2 text-[12px] text-muted">
                              ({storeName})
                            </span>
                          )}
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}