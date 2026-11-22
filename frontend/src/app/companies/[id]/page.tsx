'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Company, Job } from '@/lib/types';
import { JobCard } from '@/components/jobs/job-card';
import { ArrowLeft, Building2, CheckCircle2, Globe, MapPin } from 'lucide-react';

export default function CompanyDetailPage() {
  const params = useParams();
  const idOrSlug = params.id as string;

  const { data: companyData, isLoading: isCompanyLoading } = useQuery<{ company: Company }>({
    queryKey: ['company', idOrSlug],
    queryFn: async () => {
      const res = await apiClient<{ company: Company }>(`/api/v1/companies/${idOrSlug}`);
      return res.data;
    },
    enabled: Boolean(idOrSlug),
  });

  const company = companyData?.company;

  const { data: jobsData, isLoading: isJobsLoading } = useQuery<{ jobs: Job[] }>({
    queryKey: ['company-jobs', company?.id],
    queryFn: async () => {
      const res = await apiClient<{ jobs: Job[] }>(`/api/v1/companies/${company!.id}/jobs`);
      return res.data;
    },
    enabled: Boolean(company?.id),
  });

  if (isCompanyLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 animate-pulse space-y-6">
        <div className="h-40 bg-slate-200 rounded-2xl" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800 font-heading">Company Not Found</h2>
        <p className="mt-2 text-xs text-slate-500">
          The requested company profile is unverified or does not exist.
        </p>
        <Link
          href="/companies"
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to companies
        </Link>
      </div>
    );
  }

  const jobs = jobsData?.jobs || [];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <Link
        href="/companies"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to all companies
      </Link>

      {/* Company Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold text-2xl border border-slate-200 overflow-hidden flex-shrink-0">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-8 w-8 text-slate-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-heading">
                  {company.name}
                </h1>
                {company.verified && (
                  <span title="Verified Company">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                {company.industry && (
                  <span className="font-medium text-slate-800">{company.industry}</span>
                )}
                {company.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {company.location}
                  </span>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {company.description && (
          <p className="mt-6 pt-6 border-t border-slate-100 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
            {company.description}
          </p>
        )}
      </div>

      {/* Open Positions Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 font-heading">
            Open Positions ({jobs.length})
          </h2>
        </div>

        {isJobsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-44 rounded-xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-xs text-slate-500">
              There are currently no active public listings for {company.name}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={{
                  ...job,
                  company: {
                    id: company.id,
                    name: company.name,
                    slug: company.slug,
                    logoUrl: company.logoUrl,
                    verified: company.verified,
                    location: company.location,
                  },
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
