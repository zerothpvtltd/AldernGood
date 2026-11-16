'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Category, Product } from '@/types';
import { apiFetch, ApiClientError } from '@/lib/api';
import { getImageUrl } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

const editProductSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(2000),
  price: z.number({ error: 'Enter a valid price' }).positive('Price must be greater than $0.00'),
  stock: z.number({ error: 'Enter a valid stock count' }).int().min(0, 'Stock cannot be negative'),
  category: z.string().min(1, 'Please select a category'),
});

type EditProductValues = z.infer<typeof editProductSchema>;

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditProductValues>({
    resolver: zodResolver(editProductSchema),
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'seller') {
      router.replace('/login');
      return;
    }

    Promise.all([
      apiFetch<{ categories: Category[] }>('/categories'),
      apiFetch<{ products: Product[] }>('/seller/products'),
    ])
      .then(([catRes, prodRes]) => {
        setCategories(catRes.categories);
        const found = prodRes.products.find((p) => p._id === id);
        if (!found) {
          router.replace('/seller/products');
          return;
        }
        setExistingImages(found.images);
        reset({
          title: found.title,
          description: found.description,
          price: Number((found.price / 100).toFixed(2)),
          stock: found.stock,
          category: found.category?._id || '',
        });
      })
      .finally(() => setLoading(false));
  }, [id, user, authLoading, router, reset]);

  const removeExistingImage = (imgPath: string) => {
    setExistingImages((prev) => prev.filter((item) => item !== imgPath));
  };

  const onSubmit = async (values: EditProductValues) => {
    setServerError(null);
    try {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('price', String(values.price));
      formData.append('stock', String(values.stock));
      formData.append('category', values.category);
      existingImages.forEach((img) => formData.append('existingImages', img));

      const remainingSlots = Math.max(0, 4 - existingImages.length);
      newFiles.slice(0, remainingSlots).forEach((file) => formData.append('images', file));

      await apiFetch(`/seller/products/${id}`, {
        method: 'PUT',
        body: formData,
      });

      showToast('Product updated');
      router.push('/seller/products');
    } catch (err) {
      setServerError(
        err instanceof ApiClientError ? err.message : 'Unable to update product'
      );
    }
  };

  if (authLoading || loading) {
    return <div className="h-64 animate-pulse rounded-[8px] bg-[#EFECE6]" />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/seller/products" className="text-[13px] text-muted hover:text-ink">
          &larr; Back to my products
        </Link>
        <h1 className="mt-2 text-[24px] font-semibold text-ink">Edit Product</h1>
      </div>

      {serverError && (
        <div className="rounded-[6px] border border-danger/40 bg-danger/10 px-4 py-3 text-[13px] text-danger">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="card-surface space-y-5 p-6">
        <div>
          <label htmlFor="title" className="block text-[13px] font-medium text-ink">
            Product title
          </label>
          <input id="title" {...register('title')} className="input-field mt-1" />
          {errors.title && <p className="mt-1 text-[12px] text-danger">{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="category" className="block text-[13px] font-medium text-ink">
            Category
          </label>
          <select id="category" {...register('category')} className="input-field mt-1">
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="price" className="block text-[13px] font-medium text-ink">
              Price (USD)
            </label>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0.01"
              {...register('price')}
              className="input-field mt-1"
            />
            {errors.price && (
              <p className="mt-1 text-[12px] text-danger">{errors.price.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="stock" className="block text-[13px] font-medium text-ink">
              Available stock
            </label>
            <input
              id="stock"
              type="number"
              min="0"
              step="1"
              {...register('stock')}
              className="input-field mt-1"
            />
            {errors.stock && (
              <p className="mt-1 text-[12px] text-danger">{errors.stock.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-[13px] font-medium text-ink">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            {...register('description')}
            className="input-field mt-1"
          />
          {errors.description && (
            <p className="mt-1 text-[12px] text-danger">{errors.description.message}</p>
          )}
        </div>

        {existingImages.length > 0 && (
          <div>
            <p className="text-[13px] font-medium text-ink">Current images</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {existingImages.map((img) => (
                <div key={img} className="relative">
                  <img
                    src={getImageUrl(img)}
                    alt="Current product"
                    className="h-20 w-24 rounded-[6px] border border-border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(img)}
                    className="mt-1 block text-[12px] text-danger hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {existingImages.length < 4 && (
          <div>
            <label htmlFor="newImages" className="block text-[13px] font-medium text-ink">
              Add images (up to {4 - existingImages.length} more)
            </label>
            <input
              id="newImages"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              multiple
              onChange={(e) =>
                setNewFiles(
                  Array.from(e.target.files || []).slice(0, 4 - existingImages.length)
                )
              }
              className="mt-1 block w-full text-[13px] text-muted file:mr-4 file:rounded-[6px] file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-[13px] file:font-medium file:text-ink"
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/seller/products" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}