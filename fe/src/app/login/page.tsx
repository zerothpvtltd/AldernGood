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

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    try {
      const res = await apiFetch<{ user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      await refreshUser();
      showToast(`Welcome back, ${res.user.name}`);

      if (res.user.role === 'seller') router.push('/seller');
      else if (res.user.role === 'admin') router.push('/admin');
      else router.push('/products');
    } catch (err) {
      setServerError(
        err instanceof ApiClientError ? err.message : 'Unable to sign in'
      );
    }
  };

  return (
    <div className="mx-auto max-w-md pt-4">
      <div className="card-surface p-6 sm:p-8">
        <h1 className="text-[24px] font-semibold text-ink">Sign in</h1>
        <p className="mt-1 text-[14px] text-muted">
          Enter your account credentials to continue.
        </p>

        {serverError && (
          <div className="mt-4 rounded-[6px] border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-[13px] font-medium text-ink">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className="input-field mt-1"
            />
            {errors.email && (
              <p className="mt-1 text-[12px] text-danger">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-[13px] font-medium text-ink">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className="input-field mt-1"
            />
            {errors.password && (
              <p className="mt-1 text-[12px] text-danger">{errors.password.message}</p>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-muted">
          New to Alder &amp; Goods?{' '}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}