'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Category } from '@/types';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export default function AdminCategoriesPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      router.replace('/login');
      return;
    }

    apiFetch<{ categories: Category[] }>('/categories')
      .then((res) => setCategories(res.categories))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const res = await apiFetch<{ category: Category }>('/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim() }),
      });
      setCategories((prev) => [...prev, res.category]);
      setNewName('');
      showToast('Category added');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to add category', 'error');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      const res = await apiFetch<{ category: Category }>(`/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editingName.trim() }),
      });
      setCategories((prev) => prev.map((c) => (c._id === id ? res.category : c)));
      setEditingId(null);
      showToast('Category updated');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/admin/categories/${deleteTarget._id}`, { method: 'DELETE' });
      setCategories((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      setDeleteTarget(null);
      showToast('Category removed');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Cannot delete category', 'error');
      setDeleteTarget(null);
    }
  };

  if (authLoading || loading) {
    return <div className="h-48 animate-pulse rounded-[8px] bg-[#EFECE6]" />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-[24px] font-semibold text-ink">Categories</h1>

      <form onSubmit={handleCreate} className="card-surface flex gap-3 p-4">
        <label htmlFor="new-cat" className="sr-only">
          New category name
        </label>
        <input
          id="new-cat"
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New department name..."
          className="input-field flex-1"
        />
        <button type="submit" className="btn-primary">
          Add category
        </button>
      </form>

      <div className="card-surface divide-y divide-border">
        {categories.map((cat) => (
          <div
            key={cat._id}
            className="flex flex-wrap items-center justify-between gap-3 p-4"
          >
            {editingId === cat._id ? (
              <div className="flex flex-1 items-center gap-2">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="input-field"
                />
                <button
                  type="button"
                  onClick={() => handleUpdate(cat._id)}
                  className="btn-primary"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <div>
                  <p className="font-medium text-ink">{cat.name}</p>
                  <p className="text-[12px] text-muted">/{cat.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(cat._id);
                      setEditingName(cat.name);
                    }}
                    className="btn-secondary"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(cat)}
                    className="btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete category"
        description={`Remove "${deleteTarget?.name}"? Categories with active products cannot be deleted.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}