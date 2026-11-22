'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Application } from '@/lib/types';
import {
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
} from 'lucide-react';

interface SeekerStats {
  appliedCount: number;
  activeApplications: number;
  shortlistedCount: number;
  acceptedCount: number;
  savedJobsCount: number;
  applicationsByStatus: Record<string, number>;
  recentApplications: Application[];
}

export default function SeekerDashboardOverview() {
  const { data, isLoading } = useQuery<{ stats: SeekerStats }>({
    queryKey: ['stats', 'job-seeker'],
    queryFn: async () => {
      const res = await apiClient<SeekerStats>('/api/v1/stats/job-seeker');
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
      title: 'Total Applied',
      value: stats?.appliedCount ?? 0,
      icon: FileText,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      title: 'Active Pipeline',
      value: stats?.activeApplications ?? 0,
      icon: Clock,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      title: 'Shortlisted',
      value: stats?.shortlistedCount ?? 0,
      icon: TrendingUp,
      color: 'text-brand-600 bg-brand-50 border-brand-100',
    },
    {
      title: 'Offers / Accepted',
      value: stats?.acceptedCount ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* 4 Primary Metric Cards */}
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

      {/* Pipeline Status Breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 font-heading mb-4">
          Application Funnel Status
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {[
            { label: 'Pending', count: stats?.applicationsByStatus?.PENDING ?? 0, bg: 'bg-slate-50 text-slate-700' },
            { label: 'Reviewing', count: stats?.applicationsByStatus?.REVIEWING ?? 0, bg: 'bg-blue-50 text-blue-700' },
            { label: 'Shortlisted', count: stats?.applicationsByStatus?.SHORTLISTED ?? 0, bg: 'bg-indigo-50 text-indigo-700' },
            { label: 'Accepted', count: stats?.applicationsByStatus?.ACCEPTED ?? 0, bg: 'bg-emerald-50 text-emerald-700' },
            { label: 'Rejected', count: stats?.applicationsByStatus?.REJECTED ?? 0, bg: 'bg-rose-50 text-rose-700' },
            { label: 'Withdrawn', count: stats?.applicationsByStatus?.WITHDRAWN ?? 0, bg: 'bg-slate-50 text-slate-500' },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl p-3 text-center border border-slate-200/60 ${item.bg}`}>
              <div className="text-lg font-extrabold">{item.count}</div>
              <div className="text-[11px] font-semibold mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Applications Preview */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 font-heading">
            Recent Applications
          </h2>
          <Link
            href="/dashboard/applications"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            View all &rarr;
          </Link>
        </div>

        {stats?.recentApplications && stats.recentApplications.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {stats.recentApplications.map((app) => (
              <div key={app.id} className="py-3.5 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-slate-900">{app.job.title}</h4>
                  <p className="text-slate-500 mt-0.5">{app.job.company.name}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      app.status === 'ACCEPTED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : app.status === 'SHORTLISTED'
                        ? 'bg-indigo-50 text-brand-700 border border-brand-200'
                        : app.status === 'REJECTED'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : app.status === 'WITHDRAWN'
                        ? 'bg-slate-100 text-slate-600 border border-slate-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {app.status}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-500">
            No applications submitted yet.{' '}
            <Link href="/jobs" className="text-brand-600 font-semibold underline">
              Browse jobs to apply.
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
