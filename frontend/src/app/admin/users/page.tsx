'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import {
  Users,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYER' | 'JOB_SEEKER';
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
  profile?: {
    headline?: string | null;
    location?: string | null;
  } | null;
  companyMemberships?: Array<{
    role: string;
    company: { name: string; slug: string };
  }>;
}

interface ListUsersResponse {
  users: AdminUser[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Simple debounce
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('pageSize', '15');
  if (debouncedSearch) queryParams.set('search', debouncedSearch);
  if (roleFilter) queryParams.set('role', roleFilter);
  if (statusFilter) queryParams.set('status', statusFilter);

  const { data, isLoading, error } = useQuery<ListUsersResponse>({
    queryKey: ['admin-users', page, debouncedSearch, roleFilter, statusFilter],
    queryFn: async () => {
      const res = await apiClient.get<AdminUser[]>(`/admin/users?${queryParams.toString()}`);
      return {
        users: res.data,
        meta: res.meta as ListUsersResponse['meta'],
      };
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: 'ACTIVE' | 'SUSPENDED' }) => {
      return apiClient.patch(`/admin/users/${userId}/status`, { status: newStatus });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setActionMsg({
        type: 'success',
        text: `User account successfully ${variables.newStatus === 'ACTIVE' ? 'reactivated' : 'suspended'}.`,
      });
      setTimeout(() => setActionMsg(null), 4000);
    },
    onError: (err: Error) => {
      setActionMsg({ type: 'error', text: err.message || 'Failed to update user status.' });
    },
  });

  const handleToggleStatus = (u: AdminUser) => {
    const targetStatus = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const actionLabel = targetStatus === 'SUSPENDED' ? 'suspend' : 'reactivate';
    if (confirm(`Are you sure you want to ${actionLabel} account ${u.email}? ${targetStatus === 'SUSPENDED' ? 'This will instantly terminate all active sessions.' : ''}`)) {
      updateStatusMutation.mutate({ userId: u.id, newStatus: targetStatus });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600" /> User Governance & Auditing
          </h1>
          <p className="text-sm text-slate-500">
            Monitor all registered accounts, audit permissions, and suspend compromised or malicious users.
          </p>
        </div>
      </div>

      {actionMsg && (
        <div
          className={`rounded-xl p-4 text-xs font-semibold flex items-center gap-2 ${
            actionMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {actionMsg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          {actionMsg.text}
        </div>
      )}

      {/* Filters Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email..."
            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
            <Filter className="h-3.5 w-3.5 text-slate-400" /> Role:
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-600 outline-hidden bg-white"
          >
            <option value="">All Roles</option>
            <option value="JOB_SEEKER">Job Seeker</option>
            <option value="EMPLOYER">Employer</option>
            <option value="ADMIN">Admin</option>
          </select>

          <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold ml-2">
            Status:
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-600 outline-hidden bg-white"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse text-sm">
            Loading user accounts...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-sm">
            Failed to load users: {(error as Error).message}
          </div>
        ) : data?.users && data.users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">User / Identifier</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Associated Entity</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Created</th>
                  <th className="px-6 py-3.5 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{u.email}</div>
                      <div className="text-[11px] font-mono text-slate-400 truncate max-w-xs">{u.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-slate-900 text-white'
                            : u.role === 'EMPLOYER'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {u.role === 'JOB_SEEKER' && u.profile?.headline ? (
                        <span className="truncate max-w-xs block text-slate-700">
                          {u.profile.headline}
                        </span>
                      ) : u.role === 'EMPLOYER' && u.companyMemberships && u.companyMemberships.length > 0 ? (
                        <span className="font-semibold text-slate-800">
                          {u.companyMemberships[0].company.name} ({u.companyMemberships[0].role})
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-700 border border-red-200">
                          <XCircle className="h-3 w-3 text-red-500" /> Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.role === 'ADMIN' ? (
                        <span className="text-slate-400 italic text-[11px]">Protected</span>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={updateStatusMutation.isPending}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                            u.status === 'ACTIVE'
                              ? 'text-red-700 bg-red-50 hover:bg-red-100 border border-red-200'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? (
                            <>
                              <ShieldAlert className="h-3.5 w-3.5" /> Suspend
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-3.5 w-3.5" /> Reactivate
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 text-sm">
            No user accounts match the current query parameters.
          </div>
        )}

        {/* Pagination Bar */}
        {data?.meta && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-600">
            <div>
              Showing page <strong className="text-slate-900">{data.meta.page}</strong> of{' '}
              <strong className="text-slate-900">{data.meta.totalPages}</strong> ({data.meta.total} users)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={data.meta.page <= 1}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                disabled={data.meta.page >= data.meta.totalPages}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
