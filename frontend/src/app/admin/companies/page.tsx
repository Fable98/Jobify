'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import {
  Building2,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldX,
  Globe,
  MapPin,
  Briefcase,
} from 'lucide-react';

interface CompanyAdminItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website?: string | null;
  industry?: string | null;
  location?: string | null;
  logoUrl?: string | null;
  verified: boolean;
  createdAt: string;
  members: Array<{
    id: string;
    role: string;
    user: { id: string; email: string };
  }>;
  _count: {
    jobs: number;
  };
}

interface ListCompaniesResponse {
  companies: CompanyAdminItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminCompaniesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
  if (verifiedFilter !== '') queryParams.set('verified', verifiedFilter);

  const { data, isLoading, error } = useQuery<ListCompaniesResponse>({
    queryKey: ['admin-companies', page, debouncedSearch, verifiedFilter],
    queryFn: async () => {
      const res = await apiClient.get<CompanyAdminItem[]>(`/admin/companies?${queryParams.toString()}`);
      return {
        companies: res.data,
        meta: res.meta as ListCompaniesResponse['meta'],
      };
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ companyId, verified }: { companyId: string; verified: boolean }) => {
      return apiClient.patch(`/admin/companies/${companyId}/verify`, { verified });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setActionMsg({
        type: 'success',
        text: `Company successfully ${variables.verified ? 'verified! They can now publish live jobs.' : 'unverified.'}`,
      });
      setTimeout(() => setActionMsg(null), 4000);
    },
    onError: (err: Error) => {
      setActionMsg({ type: 'error', text: err.message || 'Failed to update company verification status.' });
    },
  });

  const handleToggleVerify = (c: CompanyAdminItem) => {
    const targetState = !c.verified;
    const action = targetState ? 'verify' : 'revoke verification for';
    if (confirm(`Are you sure you want to ${action} "${c.name}"? ${targetState ? 'This allows the employer to publish live job postings.' : ''}`)) {
      verifyMutation.mutate({ companyId: c.id, verified: targetState });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-purple-600" /> Company Verification & Trust
          </h1>
          <p className="text-sm text-slate-500">
            Review employer profiles, verify legal standing, and permit organizations to publish public jobs.
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

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company name, industry, location..."
            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
            <Filter className="h-3.5 w-3.5 text-slate-400" /> Verification Status:
          </div>
          <select
            value={verifiedFilter}
            onChange={(e) => {
              setVerifiedFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-purple-600 outline-hidden bg-white"
          >
            <option value="">All Companies</option>
            <option value="true">Verified Only</option>
            <option value="false">Unverified / Pending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse text-sm">
            Loading companies directory...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-sm">
            Failed to load companies: {(error as Error).message}
          </div>
        ) : data?.companies && data.companies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Company</th>
                  <th className="px-6 py-3.5">Industry & Location</th>
                  <th className="px-6 py-3.5">Owners / Members</th>
                  <th className="px-6 py-3.5">Total Postings</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.companies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{c.name}</span>
                        {c.verified && (
                          <span title="Verified Company">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                        <span className="font-mono">/{c.slug}</span>
                        {c.website && (
                          <a
                            href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-purple-600 hover:underline"
                          >
                            <Globe className="h-3 w-3" /> Website
                          </a>
                        )}
                        <Link
                          href={`/companies/${c.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-slate-500 hover:text-purple-600"
                        >
                          <ExternalLink className="h-3 w-3" /> Public Profile
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        {c.industry || 'General Industry'}
                      </div>
                      {c.location && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" /> {c.location}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {c.members.map((m) => (
                          <div key={m.id} className="text-slate-700 text-[11px]">
                            <strong className="text-slate-900">{m.user.email}</strong>{' '}
                            <span className="text-slate-400 font-mono text-[10px]">({m.role})</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 font-semibold text-[11px]">
                        <Briefcase className="h-3 w-3 text-slate-500" />
                        {c._count.jobs} jobs
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {c.verified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                          <AlertCircle className="h-3 w-3 text-amber-500" /> Pending Review
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleVerify(c)}
                        disabled={verifyMutation.isPending}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          c.verified
                            ? 'text-red-700 bg-red-50 hover:bg-red-100 border border-red-200'
                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {c.verified ? (
                          <>
                            <ShieldX className="h-3.5 w-3.5" /> Revoke Verification
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5" /> Grant Verification
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 text-sm">
            No company profiles match the selected criteria.
          </div>
        )}

        {/* Pagination */}
        {data?.meta && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-600">
            <div>
              Showing page <strong className="text-slate-900">{data.meta.page}</strong> of{' '}
              <strong className="text-slate-900">{data.meta.totalPages}</strong> ({data.meta.total} companies)
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
