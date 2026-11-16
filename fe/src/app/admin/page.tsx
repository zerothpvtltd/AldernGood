'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';

interface AdminStats {
  users: number;
  sellers: number;
  products: number;
  orders: number;
  revenue: number;
}

export default function AdminOverviewPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      router.replace('/login');
      return;
    }

    apiFetch<{ stats: AdminStats }>('/admin/stats')
      .then((res) => setStats(res.stats))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || loading || !stats) {
    return <div className="h-48 animate-pulse rounded-[8px] bg-[#EFECE6]" />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[24px] font-semibold text-ink">Platform Overview</h1>
        <p className="mt-1 text-[14px] text-muted">
          Marketplace metrics and administrative controls.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="card-surface p-5">
          <p className="text-[13px] text-muted">Platform Volume</p>
          <p className="mt-2 text-[22px] font-semibold text-ink">
            {formatPrice(stats.revenue)}
          </p>
        </div>

        <div className="card-surface p-5">
          <p className="text-[13px] text-muted">Completed Orders</p>
          <p className="mt-2 text-[22px] font-semibold text-ink">{stats.orders}</p>
        </div>

        <div className="card-surface p-5">
          <p className="text-[13px] text-muted">Catalog Products</p>
          <p className="mt-2 text-[22px] font-semibold text-ink">{stats.products}</p>
        </div>

        <div className="card-surface p-5">
          <p className="text-[13px] text-muted">Active Sellers</p>
          <p className="mt-2 text-[22px] font-semibold text-ink">{stats.sellers}</p>
        </div>

        <div className="card-surface p-5">
          <p className="text-[13px] text-muted">Total Users</p>
          <p className="mt-2 text-[22px] font-semibold text-ink">{stats.users}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/users"
          className="card-surface p-5 transition-shadow hover:shadow-card"
        >
          <h2 className="font-semibold text-ink">Manage Users</h2>
          <p className="mt-1 text-[13px] text-muted">
            Review accounts and suspend or reactivate access.
          </p>
        </Link>

        <Link
          href="/admin/categories"
          className="card-surface p-5 transition-shadow hover:shadow-card"
        >
          <h2 className="font-semibold text-ink">Manage Categories</h2>
          <p className="mt-1 text-[13px] text-muted">
            Add, rename, or remove storefront departments.
          </p>
        </Link>

        <Link
          href="/admin/products"
          className="card-surface p-5 transition-shadow hover:shadow-card"
        >
          <h2 className="font-semibold text-ink">Product Moderation</h2>
          <p className="mt-1 text-[13px] text-muted">
            Hide or restore listings across all seller stores.
          </p>
        </Link>

        <Link
          href="/admin/orders"
          className="card-surface p-5 transition-shadow hover:shadow-card"
        >
          <h2 className="font-semibold text-ink">All Orders</h2>
          <p className="mt-1 text-[13px] text-muted">
            Inspect marketplace order history and fulfillment.
          </p>
        </Link>
      </div>
    </div>
  );
}