'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Job } from '@/lib/types';
import { Briefcase, CheckCircle2, Clock, Eye, MoreHorizontal, PlusCircle, Trash2, XCircle } from 'lucide-react';

export default function EmployerJobsPage() {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ jobs: Job[] }>({
    queryKey: ['employer', 'jobs'],
    queryFn: async () => {
      const res = await apiClient<{ jobs: Job[] }>('/api/v1/employer/jobs');
      return res.data;
    },
  });

  const jobs = data?.jobs || [];

  // Status transition mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ jobId, status }: { jobId: string; status: string }) => {
      setActionError(null);
      const res = await apiClient(`/api/v1/jobs/${jobId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer', 'jobs'] });
      queryClient.invalidateQueries({ queryKey: ['stats', 'employer'] });
    },
    onError: (err: any) => {
      setActionError(err.message || 'Action failed');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (jobId: string) => {
      setActionError(null);
      const res = await apiClient(`/api/v1/jobs/${jobId}`, {
        method: 'DELETE',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer', 'jobs'] });
      queryClient.invalidateQueries({ queryKey: ['stats', 'employer'] });
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to delete job');
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'CLOSED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'REMOVED':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-heading">
            Job Listings ({jobs.length})
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Manage your company&apos;s active postings, review applications, and toggle publication state.
          </p>
        </div>

        <Link
          href="/employer/jobs/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-500 shadow-sm"
        >
          <PlusCircle className="h-3.5 w-3.5" /> Post New Job
        </Link>
      </div>

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
          {actionError}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Briefcase className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No jobs posted</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            You haven&apos;t created any job postings yet. Draft or publish a role to start receiving candidates.
          </p>
          <Link
            href="/employer/jobs/new"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500"
          >
            Create first listing
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    {job.title}
                  </h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${getStatusBadge(job.status)}`}>
                    {job.status}
                  </span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{job.location}</span>
                  <span>&bull;</span>
                  <span>{job.employmentType.replace('_', ' ')}</span>
                  <span>&bull;</span>
                  <span>{job.experienceLevel}</span>
                  <span>&bull;</span>
                  <Link
                    href={`/employer/applications?jobId=${job.id}`}
                    className="font-bold text-brand-600 hover:underline"
                  >
                    {job._count?.applications ?? 0} Applicants
                  </Link>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                {/* Publish draft */}
                {job.status === 'DRAFT' && (
                  <button
                    onClick={() => updateStatusMutation.mutate({ jobId: job.id, status: 'PUBLISHED' })}
                    disabled={updateStatusMutation.isPending}
                    className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    Publish
                  </button>
                )}

                {/* Close published */}
                {job.status === 'PUBLISHED' && (
                  <button
                    onClick={() => updateStatusMutation.mutate({ jobId: job.id, status: 'CLOSED' })}
                    disabled={updateStatusMutation.isPending}
                    className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                  >
                    Close Job
                  </button>
                )}

                {/* Re-open closed */}
                {job.status === 'CLOSED' && (
                  <button
                    onClick={() => updateStatusMutation.mutate({ jobId: job.id, status: 'PUBLISHED' })}
                    disabled={updateStatusMutation.isPending}
                    className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    Reopen
                  </button>
                )}

                {/* Delete button (only when 0 applications) */}
                {(job._count?.applications ?? 0) === 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Delete this job listing?')) {
                        deleteMutation.mutate(job.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                    title="Delete Draft Job"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
