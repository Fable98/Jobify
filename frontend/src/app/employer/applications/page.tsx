'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Application, Job } from '@/lib/types';
import {
  CheckCircle2,
  ChevronRight,
  Columns,
  FileText,
  Filter,
  User,
  XCircle,
} from 'lucide-react';

const PIPELINE_COLUMNS = [
  { id: 'PENDING', title: 'New Applications', badge: 'bg-slate-100 text-slate-700' },
  { id: 'REVIEWING', title: 'Under Review', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'SHORTLISTED', title: 'Shortlisted', badge: 'bg-indigo-50 text-brand-700 border-brand-200' },
  { id: 'ACCEPTED', title: 'Accepted / Hired', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'REJECTED', title: 'Declined', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export default function EmployerApplicationsPipelinePage() {
  const searchParams = useSearchParams();
  const initialJobId = searchParams.get('jobId') || '';
  const queryClient = useQueryClient();

  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  // 1. Fetch employer jobs for dropdown filter
  const { data: jobsData } = useQuery<{ jobs: Job[] }>({
    queryKey: ['employer', 'jobs'],
    queryFn: async () => {
      const res = await apiClient<{ jobs: Job[] }>('/api/v1/employer/jobs');
      return res.data;
    },
  });

  // 2. Fetch applications
  const { data: appsData, isLoading } = useQuery<{ applications: Application[] }>({
    queryKey: ['employer', 'applications', selectedJobId],
    queryFn: async () => {
      const url = selectedJobId
        ? `/api/v1/employer/applications?jobId=${selectedJobId}&pageSize=50`
        : '/api/v1/employer/applications?pageSize=50';
      const res = await apiClient<Application[]>(url);
      return { applications: res.data };
    },
  });

  // Mutation for updating status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: string; status: string }) => {
      setPipelineError(null);
      const res = await apiClient(`/api/v1/employer/applications/${applicationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer', 'applications'] });
      queryClient.invalidateQueries({ queryKey: ['stats', 'employer'] });
    },
    onError: (err: any) => {
      setPipelineError(err.message || 'Status transition failed');
    },
  });

  const applications = appsData?.applications || [];
  const jobs = jobsData?.jobs || [];

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Columns className="h-5 w-5 text-brand-600" />
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              Applicant Pipeline
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Kanban workflow tracking candidates across structured review stages.
          </p>
        </div>

        {/* Job filter dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Job Positions ({applications.length})</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {pipelineError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {pipelineError}
        </div>
      )}

      {/* Kanban Board Container */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-96 rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
          {PIPELINE_COLUMNS.map((col) => {
            const colApps = applications.filter((a) => a.status === col.id);

            return (
              <div
                key={col.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-slate-100/60 p-3.5 min-w-[260px] md:min-w-0"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80">
                  <span className="text-xs font-bold text-slate-800 font-heading">
                    {col.title}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold border ${col.badge}`}
                  >
                    {colApps.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-3 min-h-[120px]">
                  {colApps.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-slate-400 font-medium">
                      No candidates in {col.title.toLowerCase()}
                    </div>
                  ) : (
                    colApps.map((app) => (
                      <div
                        key={app.id}
                        className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm hover:shadow transition-shadow space-y-2.5"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                            {app.applicant?.email || 'Candidate'}
                          </h4>
                          <p className="text-[11px] font-semibold text-brand-600 line-clamp-1">
                            {app.job.title}
                          </p>
                        </div>

                        {app.applicant?.profile?.headline && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {app.applicant.profile.headline}
                          </p>
                        )}

                        {app.resumeFile && (
                          <div className="pt-1">
                            <a
                              href={`/api/v1/files/${app.resumeFile.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-brand-600 underline"
                            >
                              <FileText className="h-3 w-3 text-slate-400" />
                              View PDF Resume
                            </a>
                          </div>
                        )}

                        {/* Interactive transition buttons */}
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                          {col.id === 'PENDING' && (
                            <>
                              <button
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    applicationId: app.id,
                                    status: 'REVIEWING',
                                  })
                                }
                                disabled={updateStatusMutation.isPending}
                                className="flex-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 py-1 px-2 text-[10px] font-bold transition-colors"
                              >
                                Review &rarr;
                              </button>
                              <button
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    applicationId: app.id,
                                    status: 'REJECTED',
                                  })
                                }
                                disabled={updateStatusMutation.isPending}
                                className="rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 py-1 px-2 text-[10px] font-bold transition-colors"
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {col.id === 'REVIEWING' && (
                            <>
                              <button
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    applicationId: app.id,
                                    status: 'SHORTLISTED',
                                  })
                                }
                                disabled={updateStatusMutation.isPending}
                                className="flex-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-brand-700 py-1 px-2 text-[10px] font-bold transition-colors"
                              >
                                Shortlist &rarr;
                              </button>
                              <button
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    applicationId: app.id,
                                    status: 'REJECTED',
                                  })
                                }
                                disabled={updateStatusMutation.isPending}
                                className="rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 py-1 px-2 text-[10px] font-bold transition-colors"
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {col.id === 'SHORTLISTED' && (
                            <>
                              <button
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    applicationId: app.id,
                                    status: 'ACCEPTED',
                                  })
                                }
                                disabled={updateStatusMutation.isPending}
                                className="flex-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-1 px-2 text-[10px] font-bold transition-colors"
                              >
                                Accept / Hire &rarr;
                              </button>
                              <button
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    applicationId: app.id,
                                    status: 'REJECTED',
                                  })
                                }
                                disabled={updateStatusMutation.isPending}
                                className="rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 py-1 px-2 text-[10px] font-bold transition-colors"
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {col.id === 'ACCEPTED' && (
                            <span className="text-[10px] font-bold text-emerald-600 inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Offer Finalized
                            </span>
                          )}

                          {col.id === 'REJECTED' && (
                            <span className="text-[10px] font-bold text-slate-400 inline-flex items-center gap-1">
                              <XCircle className="h-3 w-3" /> Declined
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
