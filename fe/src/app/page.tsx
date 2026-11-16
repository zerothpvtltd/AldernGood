'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Category, Product } from '@/types';
import { apiFetch } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/Skeletons';
import { EmptyState } from '@/components/EmptyState';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [catRes, prodRes] = await Promise.all([
          apiFetch<{ categories: Category[] }>('/categories'),
          apiFetch<{ products: Product[] }>('/products?limit=8&sort=newest'),
        ]);
        setCategories(catRes.categories);
        setProducts(prodRes.products);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load storefront');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-12">
      <section className="border-b border-border pb-10 pt-2">
        <h1 className="max-w-2xl text-[28px] font-semibold leading-tight tracking-tight text-ink sm:text-[32px]">
          Everyday objects made by small independent studios.
        </h1>
        <p className="mt-3 max-w-xl text-[15px] text-muted">
          Direct from workshops to your home. Browse durable textiles, ceramics, stationery, and kitchen tools.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link href="/products" className="btn-primary">
            Browse all products
          </Link>
          <Link href="/register" className="btn-secondary">
            Sell on Alder &amp; Goods
          </Link>
        </div>
      </section>

      {categories.length > 0 && (
        <section aria-labelledby="categories-heading">
          <h2 id="categories-heading" className="text-[14px] font-medium text-muted">
            Shop by department
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                href={`/products?category=${cat.slug}`}
                className="rounded-[6px] border border-border bg-surface px-3.5 py-2 text-[14px] font-medium text-ink transition-colors duration-150 hover:border-accent hover:text-accent"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="featured-heading">
        <div className="mb-6 flex items-center justify-between">
          <h2 id="featured-heading" className="text-[20px] font-semibold text-ink">
            Recent arrivals
          </h2>
          <Link href="/products" className="text-[14px] font-medium text-accent hover:text-accent-hover">
            View full catalog
          </Link>
        </div>

        {loading && <ProductGridSkeleton count={8} />}

        {!loading && error && (
          <div className="card-surface p-6 text-[14px] text-danger">{error}</div>
        )}

        {!loading && !error && products.length === 0 && (
          <EmptyState message="No products have been listed yet." />
        )}

        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}