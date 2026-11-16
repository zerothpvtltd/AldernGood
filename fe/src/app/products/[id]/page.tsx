'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product, Review, Order } from '@/types';
import { apiFetch, ApiClientError } from '@/lib/api';
import { formatPrice, formatDate, getImageUrl } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

const reviewFormSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3, 'Please write at least 3 characters').max(500),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, refreshCartCount } = useAuth();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: { rating: 5, comment: '' },
  });

  useEffect(() => {
    async function load() {
      try {
        const [prodRes, revRes] = await Promise.all([
          apiFetch<{ product: Product }>(`/products/${id}`),
          apiFetch<{ reviews: Review[] }>(`/products/${id}/reviews`),
        ]);
        setProduct(prodRes.product);
        setReviews(revRes.reviews);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Product not found');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    async function checkEligibility() {
      if (!user || user.role !== 'buyer') {
        setCanReview(false);
        return;
      }
      const alreadyReviewed = reviews.some((r) => r.buyer?._id === user.id);
      if (alreadyReviewed) {
        setCanReview(false);
        return;
      }
      try {
        const { orders } = await apiFetch<{ orders: Order[] }>('/orders');
        const delivered = orders.some((order) =>
          order.items.some((item) => {
            const pid = typeof item.product === 'string' ? item.product : item.product._id;
            return pid === id && item.status === 'delivered';
          })
        );
        setCanReview(delivered);
      } catch {
        setCanReview(false);
      }
    }
    checkEligibility();
  }, [user, reviews, id]);

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'buyer') {
      showToast('Sign in with a buyer account to purchase items', 'error');
      return;
    }

    setAdding(true);
    try {
      await apiFetch('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId: id, quantity }),
      });
      await refreshCartCount();
      showToast('Added to your cart');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not add item', 'error');
    } finally {
      setAdding(false);
    }
  };

  const onSubmitReview = async (values: ReviewFormValues) => {
    try {
      const res = await apiFetch<{ review: Review }>(`/products/${id}/reviews`, {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setReviews((prev) => [res.review, ...prev]);
      const updatedProd = await apiFetch<{ product: Product }>(`/products/${id}`);
      setProduct(updatedProd.product);
      setCanReview(false);
      reset();
      showToast('Review published');
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Unable to submit review';
      showToast(msg, 'error');
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="aspect-[4/3] animate-pulse rounded-[8px] bg-[#EFECE6]" />
        <div className="space-y-4">
          <div className="h-4 w-32 animate-pulse rounded bg-[#EFECE6]" />
          <div className="h-8 w-3/4 animate-pulse rounded bg-[#EFECE6]" />
          <div className="h-6 w-24 animate-pulse rounded bg-[#EFECE6]" />
          <div className="h-24 w-full animate-pulse rounded bg-[#EFECE6]" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="card-surface p-8 text-center">
        <p className="text-danger">{error || 'Product not found'}</p>
        <Link href="/products" className="btn-secondary mt-4">
          Back to catalog
        </Link>
      </div>
    );
  }

  const gallery = product.images.length > 0 ? product.images : ['/uploads/seed/home.svg'];

  return (
    <div className="space-y-12">
      <div>
        <Link href="/products" className="text-[13px] text-muted hover:text-ink">
          &larr; Back to catalog
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="space-y-3">
          <div className="card-surface aspect-[4/3] overflow-hidden bg-[#F3F1ED]">
            <img
              src={getImageUrl(gallery[selectedImage])}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          </div>

          {gallery.length > 1 && (
            <div className="flex gap-3">
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(idx)}
                  className={`h-16 w-20 overflow-hidden rounded-[6px] border ${
                    selectedImage === idx ? 'border-accent ring-2 ring-accent/30' : 'border-border'
                  }`}
                >
                  <img
                    src={getImageUrl(img)}
                    alt={`${product.title} view ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 text-[13px] text-muted">
              <span>{product.category?.name}</span>
              <span>&middot;</span>
              <span>Sold by {product.seller?.storeName || product.seller?.name}</span>
            </div>
            <h1 className="mt-2 text-[28px] font-semibold leading-tight text-ink">
              {product.title}
            </h1>
            <div className="mt-3 flex items-center gap-4">
              <span className="text-[22px] font-semibold text-ink">
                {formatPrice(product.price)}
              </span>
              {product.ratingCount > 0 && (
                <span className="text-[13px] text-muted">
                  {product.ratingAverage.toFixed(1)} out of 5 ({product.ratingCount} review
                  {product.ratingCount === 1 ? '' : 's'})
                </span>
              )}
            </div>
          </div>

          <p className="text-[15px] leading-relaxed text-ink/90">{product.description}</p>

          <div className="border-t border-border pt-6">
            <p className="text-[13px] font-medium">
              {product.stock > 0 ? (
                <span className="text-success">In stock ({product.stock} available)</span>
              ) : (
                <span className="text-danger">Currently out of stock</span>
              )}
            </p>

            {product.stock > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label htmlFor="qty-select" className="sr-only">
                  Quantity
                </label>
                <select
                  id="qty-select"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="input-field w-24"
                >
                  {Array.from({ length: Math.min(product.stock, 10) }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={adding}
                  className="btn-primary px-6"
                >
                  {adding ? 'Adding...' : 'Add to cart'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <section aria-labelledby="reviews-heading" className="border-t border-border pt-10">
        <h2 id="reviews-heading" className="text-[20px] font-semibold text-ink">
          Customer Reviews ({reviews.length})
        </h2>

        {canReview && (
          <form
            onSubmit={handleSubmit(onSubmitReview)}
            className="card-surface mt-6 max-w-xl space-y-4 p-5"
          >
            <h3 className="text-[15px] font-medium text-ink">Write a review</h3>
            <div>
              <label htmlFor="review-rating" className="block text-[13px] font-medium text-ink">
                Rating
              </label>
              <select id="review-rating" {...register('rating', { valueAsNumber: true })} className="input-field mt-1 w-36">
                <option value={5}>5 — Excellent</option>
                <option value={4}>4 — Good</option>
                <option value={3}>3 — Average</option>
                <option value={2}>2 — Fair</option>
                <option value={1}>1 — Poor</option>
              </select>
            </div>

            <div>
              <label htmlFor="review-comment" className="block text-[13px] font-medium text-ink">
                Comment
              </label>
              <textarea
                id="review-comment"
                rows={3}
                {...register('comment')}
                placeholder="Share how the quality, materials, or sizing worked for you."
                className="input-field mt-1"
              />
              {errors.comment && (
                <p className="mt-1 text-[12px] text-danger">{errors.comment.message}</p>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Posting...' : 'Post review'}
            </button>
          </form>
        )}

        <div className="mt-6 space-y-4">
          {reviews.length === 0 ? (
            <p className="text-[14px] text-muted">No reviews yet for this product.</p>
          ) : (
            reviews.map((rev) => (
              <div key={rev._id} className="card-surface p-5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink">{rev.buyer?.name || 'Verified Buyer'}</span>
                  <span className="text-[12px] text-muted">{formatDate(rev.createdAt)}</span>
                </div>
                <p className="mt-1 text-[13px] font-medium text-accent">
                  Rating: {rev.rating} / 5
                </p>
                <p className="mt-2 text-[14px] text-ink/90">{rev.comment}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}