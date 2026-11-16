'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { apiFetch } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { TableSkeleton } from '@/components/Skeletons';

export default function AdminUsersPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser || currentUser.role !== 'admin') {
      router.replace('/login');
      return;
    }

    apiFetch<{ users: User[] }>('/admin/users')
      .then((res) => setUsers(res.users))
      .finally(() => setLoading(false));
  }, [currentUser, authLoading, router]);

  const toggleSuspend = async (target: User) => {
    const targetId = target._id || target.id;
    setBusyId(targetId);
    try {
      const res = await apiFetch<{ user: User }>(`/admin/users/${targetId}/suspend`, {
        method: 'PATCH',
      });
      setUsers((prev) =>
        prev.map((u) => ((u._id || u.id) === targetId ? res.user : u))
      );
      showToast(
        res.user.isSuspended ? 'Account suspended' : 'Account reactivated'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Action failed', 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading || loading) {
    return <TableSkeleton rows={5} />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-[24px] font-semibold text-ink">Users</h1>

      <div className="card-surface hidden overflow-hidden md:block">
        <table className="w-full text-left text-[14px]">
          <thead className="border-b border-border bg-[#F5F4F0] text-[13px] font-medium text-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => {
              const uid = u._id || u.id;
              const isSelf = uid === currentUser?.id;
              return (
                <tr key={uid}>
                  <td className="px-4 py-3 font-medium text-ink">
                    {u.name}
                    {u.storeName && (
                      <span className="block text-[12px] font-normal text-muted">
                        {u.storeName}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{u.email}</td>
                  <td className="px-4 py-3 capitalize text-ink">{u.role}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    {u.isSuspended ? (
                      <span className="text-[12px] font-medium text-danger">Suspended</span>
                    ) : (
                      <span className="text-[12px] text-success">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!isSelf && (
                      <button
                        type="button"
                        disabled={busyId === uid}
                        onClick={() => toggleSuspend(u)}
                        className={u.isSuspended ? 'btn-secondary' : 'btn-danger'}
                      >
                        {u.isSuspended ? 'Reactivate' : 'Suspend'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {users.map((u) => {
          const uid = u._id || u.id;
          const isSelf = uid === currentUser?.id;
          return (
            <div key={uid} className="card-surface space-y-2 p-4">
              <div className="flex justify-between">
                <p className="font-medium text-ink">{u.name}</p>
                <span className="text-[12px] capitalize text-muted">{u.role}</span>
              </div>
              <p className="text-[13px] text-muted">{u.email}</p>
              {!isSelf && (
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={busyId === uid}
                    onClick={() => toggleSuspend(u)}
                    className={u.isSuspended ? 'btn-secondary w-full' : 'btn-danger w-full'}
                  >
                    {u.isSuspended ? 'Reactivate' : 'Suspend'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}