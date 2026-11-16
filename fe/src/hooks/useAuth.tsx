'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Cart } from '@/types';
import { apiFetch } from '@/lib/api';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  cartCount: number;
  refreshUser: () => Promise<void>;
  refreshCartCount: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  const refreshCartCount = useCallback(async () => {
    try {
      const data = await apiFetch<{ cart: Cart }>('/cart');
      const total = data.cart.items.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(total);
    } catch {
      setCartCount(0);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiFetch<{ user: User }>('/auth/me');
      setUser(data.user);
      if (data.user.role === 'buyer') {
        await refreshCartCount();
      } else {
        setCartCount(0);
      }
    } catch {
      setUser(null);
      setCartCount(0);
    } finally {
      setLoading(false);
    }
  }, [refreshCartCount]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    await apiFetch('/auth/logout', { method: 'POST' });
    setUser(null);
    setCartCount(0);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, cartCount, refreshUser, refreshCartCount, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}