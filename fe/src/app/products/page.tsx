'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Category, Product } from '@/types';
import { apiFetch } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/Skeletons';
import { EmptyState } from '@/components/EmptyState';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  useEffect(() => {
    apiFetch<{ categories: Category[] }>('/categories')
      .then((res) => setCategories(res.categories))
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (category && category !== 'all') params.set('category', category);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (sort) params.set('sort', sort);
      params.set('page', String(page));
      params.set('limit', '12');

      const res = await apiFetch<{
        products: Product[];
        total: number;
        totalPages: number;
      }>(`/products?${params.toString()}`);

      setProducts(res.products);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load products');
    } finally {
      setLoading(false);
    }
  }, [q, category, minPrice, maxPrice, sort, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (category !== 'all') params.set('category', category);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (sort !== 'newest') params.set('sort', sort);
    router.replace(`/products?${params.toString()}`);
  };

  const resetFilters = () => {
    setQ('');
    setCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
    setPage(1);
    router.replace('/products');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold text-ink">Product Catalog</h1>
        <p className="mt-1 text-[14px] text-muted">
          {loading ? 'Loading items...' : `${total} item${total === 1 ? '' : 's'} available`}
        </p>
      </div>

      <form
        onSubmit={handleFilterSubmit}
        className="card-surface grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-6"
      >
        <div className="lg:col-span-2">
          <label htmlFor="search-q" className="block text-[12px] font-medium text-muted">
            Search
          </label>
          <input
            id="search-q"
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Linen, ceramic, pen..."
            className="input-field mt-1"
          />
        </div>

        <div>
          <label htmlFor="filter-cat" className="block text-[12px] font-medium text-muted">
            Category
          </label>
          <select
            id="filter-cat"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="input-field mt-1"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="min-price" className="block text-[12px] font-medium text-muted">
              Min ($)
            </label>
            <input
              id="min-price"
              type="number"
              min="0"
              step="1"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0"
              className="input-field mt-1"
            />
          </div>
          <div>
            <label htmlFor="max-price" className="block text-[12px] font-medium text-muted">
              Max ($)
            </label>
            <input
              id="max-price"
              type="number"
              min="0"
              step="1"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="500"
              className="input-field mt-1"
            />
          </div>
        </div>

        <div>
          <label htmlFor="sort-by" className="block text-[12px] font-medium text-muted">
            Sort by
          </label>
          <select
            id="sort-by"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="input-field mt-1"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to high</option>
            <option value="price_desc">Price: High to low</option>
            <option value="rating">Highest rated</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button type="submit" className="btn-primary flex-1">
            Apply
          </button>
          <button type="button" onClick={resetFilters} className="btn-secondary">
            Reset
          </button>
        </div>
      </form>

      {loading && <ProductGridSkeleton count={8} />}

      {!loading && error && (
        <div className="card-surface p-6 text-danger">{error}</div>
      )}

      {!loading && !error && products.length === 0 && (
        <EmptyState message="No products match your current filters." />
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-6">
              <p className="text-[13px] text-muted">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="btn-secondary"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-secondary"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductGridSkeleton count={8} />}>
      <ProductsContent />
    </Suspense>
  );
}