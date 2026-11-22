'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import {
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Eye,
  MapPin,
  Users,
} from 'lucide-react';

interface AdminJobItem {
  id: string;
  title: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'REMOVED';
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency: string;
  createdAt: string;
  publishedAt?: string | null;
  company: {
    id: string;
    name: string;
    slug: string;
    verified: boolean;
  };
  _count: {
    applications: number;
  };
}

interface ListJobsResponse {
  jobs: AdminJobItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminJobsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
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
  if (statusFilter) queryParams.set('status', statusFilter);

  const { data, isLoading, error } = useQuery<ListJobsResponse>({
    queryKey: ['admin-jobs', page, debouncedSearch, statusFilter],
    queryFn: async () => {
      const res = await apiClient.get<AdminJobItem[]>(`/admin/jobs?${queryParams.toString()}`);
      return {
        jobs: res.data,
        meta: res.meta as ListJobsResponse['meta'],
      };
    },
  });

  const moderateMutation = useMutation({
    mutationFn: async ({ jobId, newStatus }: { jobId: string; newStatus: 'REMOVED' | 'PUBLISHED' }) => {
      return apiClient.patch(`/admin/jobs/${jobId}/moderate`, { status: newStatus });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setActionMsg({
        type: 'success',
        text: `Job listing successfully ${variables.newStatus === 'REMOVED' ? 'removed from public listings' : 'restored to published'}.`,
      });
      setTimeout(() => setActionMsg(null), 4000);
    },
    onError: (err: Error) => {
      setActionMsg({ type: 'error', text: err.message || 'Failed to update job status.' });
    },
  });

  const handleToggleModerate = (job: AdminJobItem) => {
    if (job.status === 'REMOVED') {
      if (confirm(`Restore listing "${job.title}" back to PUBLISHED?`)) {
        moderateMutation.mutate({ jobId: job.id, newStatus: 'PUBLISHED' });
      }
    } else {
      if (confirm(`Remove listing "${job.title}"? It will immediately disappear from public search results.`)) {
        moderateMutation.mutate({ jobId: job.id, newStatus: 'REMOVED' });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-emerald-600" /> Platform Job Moderation
          </h1>
          <p className="text-sm text-slate-500">
            Audit job listings across all organizations and moderate inappropriate, spam, or non-compliant posts.
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
            placeholder="Search job title, company..."
            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
            <Filter className="h-3.5 w-3.5 text-slate-400" /> Status:
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-emerald-600 outline-hidden bg-white"
          >
            <option value="">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="CLOSED">Closed</option>
            <option value="REMOVED">Removed (Moderated)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse text-sm">
            Loading job catalog...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-sm">
            Failed to load jobs: {(error as Error).message}
          </div>
        ) : data?.jobs && data.jobs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Listing Title</th>
                  <th className="px-6 py-3.5">Organization</th>
                  <th className="px-6 py-3.5">Type & Level</th>
                  <th className="px-6 py-3.5">Applicants</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Moderation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {job.title}
                        {job.status === 'PUBLISHED' && (
                          <Link
                            href={`/jobs/${job.id}`}
                            target="_blank"
                            className="text-slate-400 hover:text-indigo-600"
                            title="View Public Listing"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {job.location}
                        </span>
                        <span>•</span>
                        <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        {job.company.name}
                        {job.company.verified ? (
                          <span title="Verified Company">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          </span>
                        ) : (
                          <span title="Unverified Company">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">/{job.company.slug}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700 mr-1.5">
                          {job.employmentType.replace('_', ' ')}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
                          {job.experienceLevel}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 font-semibold text-[11px]">
                        <Users className="h-3 w-3 text-slate-500" />
                        {job._count.applications}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          job.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : job.status === 'DRAFT'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : job.status === 'CLOSED'
                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {job.status === 'REMOVED' ? (
                        <button
                          onClick={() => handleToggleModerate(job)}
                          disabled={moderateMutation.isPending}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition"
                        >
                          <Eye className="h-3.5 w-3.5" /> Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleModerate(job)}
                          disabled={moderateMutation.isPending}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition"
                        >
                          <EyeOff className="h-3.5 w-3.5" /> Moderate
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
            No job postings match the selected filters.
          </div>
        )}

        {/* Pagination */}
        {data?.meta && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-600">
            <div>
              Showing page <strong className="text-slate-900">{data.meta.page}</strong> of{' '}
              <strong className="text-slate-900">{data.meta.totalPages}</strong> ({data.meta.total} jobs)
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
