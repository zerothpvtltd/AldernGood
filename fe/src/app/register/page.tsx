'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiFetch, ApiClientError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { User } from '@/types';

const registerFormSchema = z
  .object({
    name: z.string().trim().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['buyer', 'seller']),
    storeName: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'seller' && (!data.storeName || data.storeName.length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['storeName'],
        message: 'Store name is required for seller accounts',
      });
    }
  });

type RegisterValues = z.infer<typeof registerFormSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { role: 'buyer' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (values: RegisterValues) => {
    setServerError(null);
    try {
      const res = await apiFetch<{ user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      await refreshUser();
      showToast('Account created');
      router.push(res.user.role === 'seller' ? '/seller' : '/products');
    } catch (err) {
      setServerError(
        err instanceof ApiClientError ? err.message : 'Registration failed'
      );
    }
  };

  return (
    <div className="mx-auto max-w-md pt-4">
      <div className="card-surface p-6 sm:p-8">
        <h1 className="text-[24px] font-semibold text-ink">Create an account</h1>
        <p className="mt-1 text-[14px] text-muted">
          Join as a buyer or register an independent storefront.
        </p>

        {serverError && (
          <div className="mt-4 rounded-[6px] border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <fieldset>
            <legend className="block text-[13px] font-medium text-ink">Account type</legend>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <label
                className={`flex cursor-pointer items-center justify-center rounded-[6px] border px-3 py-2.5 text-[14px] font-medium transition-colors ${
                  selectedRole === 'buyer'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-surface text-ink'
                }`}
              >
                <input
                  type="radio"
                  value="buyer"
                  {...register('role')}
                  className="sr-only"
                />
                Buy goods
              </label>

              <label
                className={`flex cursor-pointer items-center justify-center rounded-[6px] border px-3 py-2.5 text-[14px] font-medium transition-colors ${
                  selectedRole === 'seller'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-surface text-ink'
                }`}
              >
                <input
                  type="radio"
                  value="seller"
                  {...register('role')}
                  className="sr-only"
                />
                Sell products
              </label>
            </div>
          </fieldset>

          <div>
            <label htmlFor="name" className="block text-[13px] font-medium text-ink">
              Your name
            </label>
            <input id="name" type="text" {...register('name')} className="input-field mt-1" />
            {errors.name && (
              <p className="mt-1 text-[12px] text-danger">{errors.name.message}</p>
            )}
          </div>

          {selectedRole === 'seller' && (
            <div>
              <label htmlFor="storeName" className="block text-[13px] font-medium text-ink">
                Store name
              </label>
              <input
                id="storeName"
                type="text"
                placeholder="e.g. Cedar & Clay Studio"
                {...register('storeName')}
                className="input-field mt-1"
              />
              {errors.storeName && (
                <p className="mt-1 text-[12px] text-danger">{errors.storeName.message}</p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-[13px] font-medium text-ink">
              Email address
            </label>
            <input id="email" type="email" {...register('email')} className="input-field mt-1" />
            {errors.email && (
              <p className="mt-1 text-[12px] text-danger">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-[13px] font-medium text-ink">
              Password (min 8 characters)
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className="input-field mt-1"
            />
            {errors.password && (
              <p className="mt-1 text-[12px] text-danger">{errors.password.message}</p>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-muted">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}