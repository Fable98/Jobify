'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Columns,
  PlusCircle,
  TrendingUp,
  Users,
} from 'lucide-react';

interface EmployerStats {
  activeJobsCount: number;
  draftJobsCount: number;
  totalJobsCount: number;
  totalApplicantsCount: number;
  pendingReviewCount: number;
  shortlistedCount: number;
  hiresCount: number;
  applicantsByJob: Array<{
    jobId: string;
    title: string;
    status: string;
    applicantsCount: number;
  }>;
  recentApplications: any[];
}

export default function EmployerDashboardOverview() {
  const { data, isLoading } = useQuery<{ stats: EmployerStats }>({
    queryKey: ['stats', 'employer'],
    queryFn: async () => {
      const res = await apiClient<EmployerStats>('/api/v1/stats/employer');
      return { stats: res.data };
    },
  });

  const stats = data?.stats;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-200" />
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Active Positions',
      value: stats?.activeJobsCount ?? 0,
      icon: Briefcase,
      color: 'text-brand-600 bg-brand-50 border-brand-100',
    },
    {
      title: 'Total Candidates',
      value: stats?.totalApplicantsCount ?? 0,
      icon: Users,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      title: 'Pending Review',
      value: stats?.pendingReviewCount ?? 0,
      icon: Clock,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      title: 'Accepted Offers',
      value: stats?.hiresCount ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{card.title}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 font-heading">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/employer/applications"
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-brand-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Columns className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-heading group-hover:text-brand-600">
                Kanban Candidate Pipeline
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Drag and review candidates across stages from Pending to Hired.
              </p>
            </div>
          </div>
          <span className="text-brand-600 font-semibold text-xs group-hover:translate-x-1 transition-transform">
            &rarr;
          </span>
        </Link>

        <Link
          href="/employer/jobs/new"
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-brand-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-heading group-hover:text-brand-600">
                Create New Job Listing
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Publish a verified position with structured salary bounds.
              </p>
            </div>
          </div>
          <span className="text-brand-600 font-semibold text-xs group-hover:translate-x-1 transition-transform">
            &rarr;
          </span>
        </Link>
      </div>

      {/* Pipeline Distribution Per Job */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 font-heading mb-4">
          Candidates by Job Listing
        </h2>

        {stats?.applicantsByJob && stats.applicantsByJob.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {stats.applicantsByJob.map((item) => (
              <div key={item.jobId} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-slate-900">{item.title}</h4>
                  <span className="text-slate-400 mt-0.5 inline-block">Status: {item.status}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                    {item.applicantsCount} {item.applicantsCount === 1 ? 'applicant' : 'applicants'}
                  </span>
                  <Link
                    href={`/employer/applications?jobId=${item.jobId}`}
                    className="font-semibold text-brand-600 hover:text-brand-700"
                  >
                    View Pipeline &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-6 text-center">
            No job positions created yet.{' '}
            <Link href="/employer/jobs/new" className="text-brand-600 font-semibold underline">
              Create your first job listing.
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
