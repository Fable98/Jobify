'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import {
  Users,
  Building2,
  Briefcase,
  FileText,
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalCompanies: number;
  totalJobs: number;
  totalApplications: number;
  usersByRole: {
    ADMIN: number;
    EMPLOYER: number;
    JOB_SEEKER: number;
  };
  jobsByStatus: {
    DRAFT: number;
    PUBLISHED: number;
    CLOSED: number;
    REMOVED: number;
  };
  applicationsByStatus: {
    PENDING: number;
    REVIEWING: number;
    SHORTLISTED: number;
    REJECTED: number;
    ACCEPTED: number;
    WITHDRAWN: number;
  };
  dbLatencyMs: number;
}

interface MonitorApplication {
  id: string;
  status: string;
  createdAt: string;
  applicant: {
    email: string;
    profile?: { headline?: string | null };
  };
  job: {
    id: string;
    title: string;
    company: { name: string; slug: string };
  };
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await apiClient.get<AdminStats>('/admin/stats');
      return res.data;
    },
    refetchInterval: 30000,
  });

  const { data: recentApps, isLoading: appsLoading } = useQuery<{
    applications: MonitorApplication[];
    meta: { total: number };
  }>({
    queryKey: ['admin-applications-monitor'],
    queryFn: async () => {
      const res = await apiClient.get<MonitorApplication[]>('/admin/applications?page=1&pageSize=5');
      return { applications: res.data, meta: res.meta as { total: number } };
    },
  });

  if (statsLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  if (statsError || !stats) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6" />
          <h2 className="text-lg font-bold">Failed to load platform telemetry</h2>
        </div>
        <p className="mt-1 text-sm text-red-600">
          {(statsError as Error)?.message || 'An unexpected error occurred while loading admin statistics.'}
        </p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Accounts',
      value: stats.totalUsers,
      sub: `${stats.usersByRole.JOB_SEEKER} seekers, ${stats.usersByRole.EMPLOYER} employers`,
      icon: Users,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Registered Companies',
      value: stats.totalCompanies,
      sub: 'Verified & pending verification',
      icon: Building2,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
    {
      title: 'Job Postings',
      value: stats.totalJobs,
      sub: `${stats.jobsByStatus.PUBLISHED} active, ${stats.jobsByStatus.DRAFT} drafts`,
      icon: Briefcase,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Applications Logged',
      value: stats.totalApplications,
      sub: `${stats.applicationsByStatus.PENDING} pending review`,
      icon: FileText,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      title: 'Database Latency',
      value: `${stats.dbLatencyMs} ms`,
      sub: 'PostgreSQL round-trip time',
      icon: Activity,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Platform Telemetry & Governance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time aggregate data, role breakdown, job lifecycle metrics, and platform health.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> System Healthy
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Auto-refresh 30s
          </span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {c.title}
                </span>
                <div className={`rounded-xl p-2.5 border ${c.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-4 text-2xl font-black text-slate-900 tracking-tight">{c.value}</p>
              <p className="mt-1 text-xs text-slate-500 truncate">{c.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Breakdown Panels */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* User Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-600" /> Users by Role
              </h2>
              <Link
                href="/admin/users"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                Manage <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Job Seekers</span>
                  <span className="text-slate-900 font-bold">{stats.usersByRole.JOB_SEEKER}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{
                      width: `${(stats.usersByRole.JOB_SEEKER / (stats.totalUsers || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Employers & Recruiters</span>
                  <span className="text-slate-900 font-bold">{stats.usersByRole.EMPLOYER}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{
                      width: `${(stats.usersByRole.EMPLOYER / (stats.totalUsers || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Administrators</span>
                  <span className="text-slate-900 font-bold">{stats.usersByRole.ADMIN}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-slate-700 rounded-full"
                    style={{
                      width: `${(stats.usersByRole.ADMIN / (stats.totalUsers || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>Accounts verified via argon2id</span>
            <span className="font-semibold text-slate-700">{stats.totalUsers} total</span>
          </div>
        </div>

        {/* Job Listings Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-emerald-600" /> Jobs by Status
              </h2>
              <Link
                href="/admin/jobs"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
              >
                Moderate <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Published</span>
                <p className="mt-1 text-2xl font-black text-slate-900">{stats.jobsByStatus.PUBLISHED}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Draft</span>
                <p className="mt-1 text-2xl font-black text-slate-900">{stats.jobsByStatus.DRAFT}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Closed</span>
                <p className="mt-1 text-2xl font-black text-slate-900">{stats.jobsByStatus.CLOSED}</p>
              </div>
              <div className="rounded-xl border border-red-100 bg-red-50/40 p-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">Removed</span>
                <p className="mt-1 text-2xl font-black text-slate-900">{stats.jobsByStatus.REMOVED}</p>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>Verified company rule enforced</span>
            <span className="font-semibold text-slate-700">{stats.totalJobs} total</span>
          </div>
        </div>

        {/* Application Funnel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" /> Application Pipeline
              </h2>
              <span className="text-xs text-slate-400 font-mono">Finite State</span>
            </div>
            <div className="mt-6 space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-amber-400" /> Pending Review
                </span>
                <span className="font-bold text-slate-900">{stats.applicationsByStatus.PENDING}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-blue-500" /> In Review
                </span>
                <span className="font-bold text-slate-900">{stats.applicationsByStatus.REVIEWING}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-purple-500" /> Shortlisted
                </span>
                <span className="font-bold text-slate-900">{stats.applicationsByStatus.SHORTLISTED}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Accepted Offers
                </span>
                <span className="font-bold text-slate-900">{stats.applicationsByStatus.ACCEPTED}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-red-400" /> Rejected
                </span>
                <span className="font-bold text-slate-900">{stats.applicationsByStatus.REJECTED}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-slate-400" /> Withdrawn by Seeker
                </span>
                <span className="font-bold text-slate-900">{stats.applicationsByStatus.WITHDRAWN}</span>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>Terminal status guarantees</span>
            <span className="font-semibold text-slate-700">{stats.totalApplications} total</span>
          </div>
        </div>
      </div>

      {/* Live Application Stream Monitor */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Live Application Stream (Read-Only Monitor)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Superuser platform audit log of recent candidate submissions across all employers
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Total {recentApps?.meta?.total ?? 0} logged
          </span>
        </div>

        {appsLoading ? (
          <div className="py-8 text-center text-slate-400 animate-pulse text-sm">
            Loading recent applications...
          </div>
        ) : recentApps?.applications && recentApps.applications.length > 0 ? (
          <div className="mt-4 divide-y divide-slate-100">
            {recentApps.applications.map((app) => (
              <div key={app.id} className="py-3 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{app.applicant.email}</span>
                    {app.applicant.profile?.headline && (
                      <span className="text-xs text-slate-500 font-normal">
                        ({app.applicant.profile.headline})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>Applied to <strong className="text-slate-800">{app.job.title}</strong></span>
                    <span>•</span>
                    <span className="text-indigo-600 font-medium">{app.job.company.name}</span>
                    <span>•</span>
                    <span>{new Date(app.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      app.status === 'ACCEPTED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : app.status === 'REJECTED'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : app.status === 'SHORTLISTED'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : app.status === 'REVIEWING'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {app.status}
                  </span>
                  <Link
                    href={`/jobs/${app.job.id}`}
                    target="_blank"
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50"
                    title="View Job"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-sm">
            No applications logged yet.
          </div>
        )}
      </div>

      {/* Governance Quick Links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/admin/users"
          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 group-hover:text-indigo-600 flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" /> User Accounts
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-600 transition" />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Audit user accounts, inspect roles, and suspend or reactivate compromised accounts.
          </p>
        </Link>

        <Link
          href="/admin/companies"
          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-purple-300 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 group-hover:text-purple-600 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-purple-600" /> Company Verification
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 group-hover:text-purple-600 transition" />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Review employer organizations, grant official verified badges, and unlock job publishing.
          </p>
        </Link>

        <Link
          href="/admin/jobs"
          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 group-hover:text-emerald-600 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-emerald-600" /> Job Moderation
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-600 transition" />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Moderate job listings, hide non-compliant posts, and maintain high listing quality.
          </p>
        </Link>
      </div>
    </div>
  );
}
