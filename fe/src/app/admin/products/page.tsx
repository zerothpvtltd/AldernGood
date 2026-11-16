'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { apiFetch } from '@/lib/api';
import { formatPrice, getImageUrl } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { TableSkeleton } from '@/components/Skeletons';

export default function AdminProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      router.replace('/login');
      return;
    }

    apiFetch<{ products: Product[] }>('/admin/products')
      .then((res) => setProducts(res.products))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const toggleHide = async (product: Product) => {
    setBusyId(product._id);
    try {
      const res = await apiFetch<{ product: Product }>(
        `/admin/products/${product._id}/hide`,
        { method: 'PATCH' }
      );
      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? { ...p, isHidden: res.product.isHidden } : p))
      );
      showToast(res.product.isHidden ? 'Product hidden from catalog' : 'Product restored');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Action failed', 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading || loading) {
    return <TableSkeleton rows={6} />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-[24px] font-semibold text-ink">Product Moderation</h1>

      <div className="card-surface hidden overflow-hidden md:block">
        <table className="w-full text-left text-[14px]">
          <thead className="border-b border-border bg-[#F5F4F0] text-[13px] font-medium text-muted">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Store</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Visibility</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => (
              <tr key={p._id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={getImageUrl(p.images[0])}
                      alt={p.title}
                      className="h-10 w-12 rounded-[6px] border border-border object-cover"
                    />
                    <span className="font-medium text-ink">{p.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">
                  {p.seller?.storeName || p.seller?.name}
                </td>
                <td className="px-4 py-3 text-ink">{formatPrice(p.price)}</td>
                <td className="px-4 py-3">
                  {p.isHidden ? (
                    <span className="text-[12px] font-medium text-danger">Hidden</span>
                  ) : (
                    <span className="text-[12px] text-success">Visible</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    disabled={busyId === p._id}
                    onClick={() => toggleHide(p)}
                    className={p.isHidden ? 'btn-secondary' : 'btn-danger'}
                  >
                    {p.isHidden ? 'Unhide' : 'Hide'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {products.map((p) => (
          <div key={p._id} className="card-surface space-y-2 p-4">
            <p className="font-medium text-ink">{p.title}</p>
            <p className="text-[13px] text-muted">
              {p.seller?.storeName || p.seller?.name} &middot; {formatPrice(p.price)}
            </p>
            <button
              type="button"
              disabled={busyId === p._id}
              onClick={() => toggleHide(p)}
              className={p.isHidden ? 'btn-secondary w-full' : 'btn-danger w-full'}
            >
              {p.isHidden ? 'Unhide' : 'Hide'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}