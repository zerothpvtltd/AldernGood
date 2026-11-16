'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OrderItem, OrderItemStatus, ShippingAddress } from '@/types';
import { apiFetch } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { TableSkeleton } from '@/components/Skeletons';

interface SellerOrder {
  _id: string;
  buyer: { name: string; email: string };
  shippingAddress: ShippingAddress;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_OPTIONS: OrderItemStatus[] = [
  'placed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export default function SellerOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'seller') {
      router.replace('/login');
      return;
    }

    apiFetch<{ orders: SellerOrder[] }>('/seller/orders')
      .then((res) => setOrders(res.orders))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const handleStatusChange = async (
    orderId: string,
    productId: string,
    status: OrderItemStatus
  ) => {
    const key = `${orderId}-${productId}`;
    setUpdatingKey(key);
    try {
      await apiFetch(`/seller/orders/${orderId}/items/${productId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      setOrders((prev) =>
        prev.map((o) => {
          if (o._id !== orderId) return o;
          return {
            ...o,
            items: o.items.map((item) => {
              const pid =
                typeof item.product === 'string' ? item.product : item.product._id;
              return pid === productId ? { ...item, status } : item;
            }),
          };
        })
      );
      showToast(`Status updated to ${status}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setUpdatingKey(null);
    }
  };

  if (authLoading || loading) {
    return <TableSkeleton rows={4} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold text-ink">Orders to Fulfil</h1>
        <p className="mt-1 text-[14px] text-muted">
          Update shipping progress for items ordered from your store.
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState message="No customer orders have been placed for your products yet." />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="card-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
                <div>
                  <p className="font-semibold text-ink">
                    Order #{order._id.slice(-6).toUpperCase()}
                  </p>
                  <p className="text-[13px] text-muted">
                    Placed {formatDate(order.createdAt)} by {order.buyer?.name}
                  </p>
                </div>
                <div className="text-[13px] text-muted sm:text-right">
                  <p className="font-medium text-ink">{order.shippingAddress.fullName}</p>
                  <p>
                    {order.shippingAddress.line1}, {order.shippingAddress.city}{' '}
                    {order.shippingAddress.postalCode}
                  </p>
                  <p>{order.shippingAddress.phone}</p>
                </div>
              </div>

              <div className="mt-4 divide-y divide-border">
                {order.items.map((item, idx) => {
                  const productId =
                    typeof item.product === 'string' ? item.product : item.product._id;
                  const key = `${order._id}-${productId}`;
                  return (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium text-ink">{item.titleSnapshot}</p>
                        <p className="text-[13px] text-muted">
                          Qty: {item.quantity} &middot;{' '}
                          {formatPrice(item.priceSnapshot * item.quantity)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <StatusBadge status={item.status} />
                        <label htmlFor={`status-${key}`} className="sr-only">
                          Fulfillment status
                        </label>
                        <select
                          id={`status-${key}`}
                          disabled={updatingKey === key}
                          value={item.status}
                          onChange={(e) =>
                            handleStatusChange(
                              order._id,
                              productId,
                              e.target.value as OrderItemStatus
                            )
                          }
                          className="input-field w-36"
                        >
                          {STATUS_OPTIONS.map((st) => (
                            <option key={st} value={st}>
                              {st.charAt(0).toUpperCase() + st.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}