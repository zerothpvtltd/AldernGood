'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Category } from '@/types';
import { apiFetch, ApiClientError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

const productFormSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(2000),
  price: z.number({ error: 'Enter a valid price' }).positive('Price must be greater than $0.00'),
  stock: z.number({ error: 'Enter a valid stock count' }).int().min(0, 'Stock cannot be negative'),
  category: z.string().min(1, 'Please select a category'),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function NewProductPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: { stock: 10 },
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'seller') {
      router.replace('/login');
      return;
    }

    apiFetch<{ categories: Category[] }>('/categories').then((res) =>
      setCategories(res.categories)
    );
  }, [user, authLoading, router]);

  const onSubmit = async (values: ProductFormValues) => {
    setServerError(null);
    try {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('price', String(values.price));
      formData.append('stock', String(values.stock));
      formData.append('category', values.category);
      files.slice(0, 4).forEach((file) => formData.append('images', file));

      await apiFetch('/seller/products', {
        method: 'POST',
        body: formData,
      });

      showToast('Product created');
      router.push('/seller/products');
    } catch (err) {
      setServerError(
        err instanceof ApiClientError ? err.message : 'Unable to create product'
      );
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/seller/products" className="text-[13px] text-muted hover:text-ink">
          &larr; Back to my products
        </Link>
        <h1 className="mt-2 text-[24px] font-semibold text-ink">New Product Listing</h1>
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
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-[12px] text-danger">{errors.category.message}</p>
          )}
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
              placeholder="48.00"
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

        <div>
          <label htmlFor="images" className="block text-[13px] font-medium text-ink">
            Product images (up to 4 files, JPEG/PNG/WebP/SVG)
          </label>
          <input
            id="images"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 4))}
            className="mt-1 block w-full text-[13px] text-muted file:mr-4 file:rounded-[6px] file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-[13px] file:font-medium file:text-ink"
          />
          {files.length > 0 && (
            <p className="mt-1 text-[12px] text-muted">{files.length} file(s) selected</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/seller/products" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Saving...' : 'Publish listing'}
          </button>
        </div>
      </form>
    </div>
  );
}