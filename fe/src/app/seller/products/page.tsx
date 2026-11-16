'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { apiFetch } from '@/lib/api';
import { formatPrice, getImageUrl } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { TableSkeleton } from '@/components/Skeletons';

export default function SellerProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'seller') {
      router.replace('/login');
      return;
    }

    apiFetch<{ products: Product[] }>('/seller/products')
      .then((res) => setProducts(res.products))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/seller/products/${deleteTarget._id}`, { method: 'DELETE' });
      setProducts((prev) => prev.filter((p) => p._id !== deleteTarget._id));
      showToast('Product deleted');
      setDeleteTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to delete product', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || loading) {
    return <TableSkeleton rows={5} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[24px] font-semibold text-ink">My Products</h1>
        <Link href="/seller/products/new" className="btn-primary">
          Add product
        </Link>
      </div>

      {products.length === 0 ? (
        <EmptyState
          message="You have not created any product listings yet."
          actionLabel="Create your first listing"
          actionHref="/seller/products/new"
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="card-surface hidden overflow-hidden md:block">
            <table className="w-full text-left text-[14px]">
              <thead className="border-b border-border bg-[#F5F4F0] text-[13px] font-medium text-muted">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Visibility</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => (
                  <tr key={product._id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={getImageUrl(product.images[0])}
                          alt={product.title}
                          className="h-10 w-12 rounded-[6px] border border-border object-cover"
                        />
                        <span className="font-medium text-ink">{product.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{product.category?.name}</td>
                    <td className="px-4 py-3 font-medium text-ink">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          product.stock <= 5 ? 'font-medium text-warning' : 'text-ink'
                        }
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {product.isHidden ? (
                        <span className="text-[12px] font-medium text-danger">
                          Hidden by admin
                        </span>
                      ) : (
                        <span className="text-[12px] text-success">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/seller/products/${product._id}/edit`}
                          className="btn-secondary px-3 py-1.5"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(product)}
                          className="btn-danger"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards */}
          <div className="space-y-3 md:hidden">
            {products.map((product) => (
              <div key={product._id} className="card-surface space-y-3 p-4">
                <div className="flex items-center gap-3">
                  <img
                    src={getImageUrl(product.images[0])}
                    alt={product.title}
                    className="h-14 w-16 rounded-[6px] border border-border object-cover"
                  />
                  <div>
                    <p className="font-medium text-ink">{product.title}</p>
                    <p className="text-[13px] text-muted">
                      {formatPrice(product.price)} &middot; Stock: {product.stock}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Link
                    href={`/seller/products/${product._id}/edit`}
                    className="btn-secondary flex-1"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(product)}
                    className="btn-danger flex-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete product listing"
        description={`Are you sure you want to permanently remove "${deleteTarget?.title}"?`}
        confirmLabel="Delete product"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}