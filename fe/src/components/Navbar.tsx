'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export function Navbar() {
  const { user, loading, cartCount, logout } = useAuth();
  const { showToast } = useToast();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    showToast('Signed out');
    router.push('/');
  };

  const navLinkClass = (href: string) =>
    `text-[14px] font-medium transition-colors duration-150 ${
      pathname === href ? 'text-accent' : 'text-muted hover:text-ink'
    }`;

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-container flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-[18px] font-semibold tracking-tight text-ink">
            Alder &amp; Goods
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-6">
            <Link href="/products" className={navLinkClass('/products')}>
              Catalog
            </Link>

            {user?.role === 'buyer' && (
              <>
                <Link href="/orders" className={navLinkClass('/orders')}>
                  Orders
                </Link>
                <Link href="/cart" className={navLinkClass('/cart')}>
                  Cart{cartCount > 0 ? ` (${cartCount})` : ''}
                </Link>
              </>
            )}

            {user?.role === 'seller' && (
              <>
                <Link href="/seller" className={navLinkClass('/seller')}>
                  Dashboard
                </Link>
                <Link href="/seller/products" className={navLinkClass('/seller/products')}>
                  Products
                </Link>
                <Link href="/seller/orders" className={navLinkClass('/seller/orders')}>
                  Fulfillment
                </Link>
              </>
            )}

            {user?.role === 'admin' && (
              <>
                <Link href="/admin" className={navLinkClass('/admin')}>
                  Overview
                </Link>
                <Link href="/admin/users" className={navLinkClass('/admin/users')}>
                  Users
                </Link>
                <Link href="/admin/categories" className={navLinkClass('/admin/categories')}>
                  Categories
                </Link>
                <Link href="/admin/products" className={navLinkClass('/admin/products')}>
                  Moderation
                </Link>
                <Link href="/admin/orders" className={navLinkClass('/admin/orders')}>
                  Orders
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {!loading && !user && (
            <>
              <Link href="/login" className="btn-secondary">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary">
                Create account
              </Link>
            </>
          )}

          {!loading && user && (
            <div className="flex items-center gap-3">
              <span className="hidden text-[13px] text-muted sm:inline">
                {user.storeName ? user.storeName : user.name}
              </span>
              <button type="button" onClick={handleLogout} className="btn-secondary">
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}