'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
import { EmptyState } from '@/components/EmptyState';

interface SellerSummary {
  totalSales: number;
  ordersCount: number;
  totalProducts: number;
  lowStockItems: Array<{
    _id: string;
    title: string;
    stock: number;
    price: number;
  }>;
}

export default function SellerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<SellerSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'seller') {
      router.replace('/login');
      return;
    }

    apiFetch<SellerSummary>('/seller/summary')
      .then((res) => setSummary(res))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || loading || !summary) {
    return <div className="h-56 animate-pulse rounded-[8px] bg-[#EFECE6]" />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-ink">
            {user?.storeName || 'Seller Dashboard'}
          </h1>
          <p className="mt-1 text-[14px] text-muted">
            Store performance and inventory alerts.
          </p>
        </div>
        <Link href="/seller/products/new" className="btn-primary">
          Add new product
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-surface p-5">
          <p className="text-[13px] text-muted">Gross Sales</p>
          <p className="mt-2 text-[24px] font-semibold text-ink">
            {formatPrice(summary.totalSales)}
          </p>
        </div>

        <div className="card-surface p-5">
          <p className="text-[13px] text-muted">Active Orders</p>
          <p className="mt-2 text-[24px] font-semibold text-ink">{summary.ordersCount}</p>
        </div>

        <div className="card-surface p-5">
          <p className="text-[13px] text-muted">Listed Products</p>
          <p className="mt-2 text-[24px] font-semibold text-ink">{summary.totalProducts}</p>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold text-ink">Low Stock Alerts (5 or fewer)</h2>
          <Link href="/seller/products" className="text-[14px] font-medium text-accent">
            Manage all products
          </Link>
        </div>

        {summary.lowStockItems.length === 0 ? (
          <EmptyState message="All products currently have healthy stock levels." />
        ) : (
          <div className="card-surface divide-y divide-border">
            {summary.lowStockItems.map((item) => (
              <div
                key={item._id}
                className="flex flex-wrap items-center justify-between gap-4 p-4"
              >
                <div>
                  <p className="font-medium text-ink">{item.title}</p>
                  <p className="text-[13px] text-muted">{formatPrice(item.price)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-[13px] font-medium ${
                      item.stock === 0 ? 'text-danger' : 'text-warning'
                    }`}
                  >
                    {item.stock} remaining
                  </span>
                  <Link
                    href={`/seller/products/${item._id}/edit`}
                    className="btn-secondary"
                  >
                    Restock
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}