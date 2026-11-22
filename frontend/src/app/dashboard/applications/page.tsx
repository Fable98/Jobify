'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Application } from '@/lib/types';
import { Building2, FileText, XCircle } from 'lucide-react';

export default function SeekerApplicationsPage() {
  const queryClient = useQueryClient();
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ applications: Application[] }>({
    queryKey: ['applications', 'my'],
    queryFn: async () => {
      const res = await apiClient<{ applications: Application[] }>('/api/v1/applications/my');
      return res.data;
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const res = await apiClient(`/api/v1/applications/${applicationId}/withdraw`, {
        method: 'PATCH',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', 'my'] });
      queryClient.invalidateQueries({ queryKey: ['stats', 'job-seeker'] });
      setWithdrawingId(null);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to withdraw application');
      setWithdrawingId(null);
    },
  });

  const applications = data?.applications || [];

  const canWithdraw = (status: string) => {
    return ['PENDING', 'REVIEWING', 'SHORTLISTED'].includes(status);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'SHORTLISTED':
        return 'bg-indigo-50 text-brand-700 border-brand-200';
      case 'REVIEWING':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'WITHDRAWN':
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
      <div>
        <h2 className="text-xl font-bold text-slate-900 font-heading">
          My Applications ({applications.length})
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Track real-time employer reviews, interview shortlist status, and offers.
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No applications yet</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            You haven&apos;t submitted any job applications yet. Find your next role from verified employers.
          </p>
          <Link
            href="/jobs"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500"
          >
            Browse verified openings
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div
              key={app.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold border border-slate-200 overflow-hidden flex-shrink-0">
                  {app.job.company.logoUrl ? (
                    <img src={app.job.company.logoUrl} alt={app.job.company.name} className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="h-5 w-5 text-slate-400" />
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">
                    <Link href={`/jobs/${app.job.id}`} className="hover:text-brand-600 transition-colors">
                      {app.job.title}
                    </Link>
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{app.job.company.name}</span>
                    <span>&bull;</span>
                    <span>Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                    {app.resumeFile && (
                      <>
                        <span>&bull;</span>
                        <a
                          href={`/api/v1/files/${app.resumeFile.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-600 hover:underline inline-flex items-center gap-0.5"
                        >
                          <FileText className="h-3 w-3" />
                          Resume
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <span className={`rounded-full px-3 py-1 text-xs font-bold border ${getStatusBadge(app.status)}`}>
                  {app.status}
                </span>

                {canWithdraw(app.status) && (
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
                        setWithdrawingId(app.id);
                        withdrawMutation.mutate(app.id);
                      }
                    }}
                    disabled={withdrawingId === app.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>{withdrawingId === app.id ? 'Withdrawing...' : 'Withdraw'}</span>
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
