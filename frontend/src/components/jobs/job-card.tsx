'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bookmark, Building2, CheckCircle2, DollarSign, MapPin } from 'lucide-react';
import { Job } from '@/lib/types';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface JobCardProps {
  job: Job;
  initialSaved?: boolean;
}

export function JobCard({ job, initialSaved = false }: JobCardProps) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isSaving, setIsSaving] = useState(false);

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      window.location.href = '/login';
      return;
    }

    const previous = isSaved;
    setIsSaved(!previous); // Optimistic UI update
    setIsSaving(true);

    try {
      if (previous) {
        await apiClient(`/api/v1/saved-jobs/${job.id}`, { method: 'DELETE' });
      } else {
        await apiClient('/api/v1/saved-jobs', {
          method: 'POST',
          body: JSON.stringify({ jobId: job.id }),
        });
      }
    } catch {
      setIsSaved(previous); // Rollback on error
    } finally {
      setIsSaving(false);
    }
  };

  const formatSalary = (min?: number | string | null, max?: number | string | null) => {
    if (!min && !max) return null;
    const numMin = min ? Math.round(Number(min) / 1000) : null;
    const numMax = max ? Math.round(Number(max) / 1000) : null;

    if (numMin && numMax) return `$${numMin}k – $${numMax}k`;
    if (numMin) return `From $${numMin}k`;
    return `Up to $${numMax}k`;
  };

  const salaryString = formatSalary(job.salaryMin, job.salaryMax);

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm hover:border-brand-300 hover:shadow-md transition-all duration-200">
      <div>
        {/* Header: Company & Bookmark */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold text-sm border border-slate-200 overflow-hidden">
              {job.company.logoUrl ? (
                <img
                  src={job.company.logoUrl}
                  alt={job.company.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="h-5 w-5 text-slate-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/companies/${job.company.slug || job.company.id}`}
                  className="text-xs font-semibold text-slate-700 hover:text-brand-600 transition-colors"
                >
                  {job.company.name}
                </Link>
                {job.company.verified && (
                  <span title="Verified Company">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading group-hover:text-brand-600 transition-colors mt-0.5 line-clamp-1">
                <Link href={`/jobs/${job.id}`}>
                  {job.title}
                </Link>
              </h3>
            </div>
          </div>

          <button
            onClick={toggleSave}
            disabled={isSaving}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
              isSaved
                ? 'border-brand-200 bg-brand-50 text-brand-600'
                : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50'
            }`}
            title={isSaved ? 'Remove from saved' : 'Save job'}
            aria-label={isSaved ? 'Remove from saved' : 'Save job'}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-brand-600' : ''}`} />
          </button>
        </div>

        {/* Location & Tags */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            {job.location}
          </span>

          <span className="rounded-md bg-indigo-50 px-2.5 py-1 font-medium text-brand-700 border border-brand-100">
            {job.employmentType.replace('_', ' ')}
          </span>

          <span className="rounded-md bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
            {job.experienceLevel}
          </span>

          {salaryString && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 border border-emerald-100">
              <DollarSign className="h-3 w-3" />
              {salaryString}
            </span>
          )}
        </div>

        {/* Short description snippet */}
        <p className="mt-3 text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">
          {job.description}
        </p>
      </div>

      {/* Footer link */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          {job.publishedAt
            ? `Posted ${new Date(job.publishedAt).toLocaleDateString()}`
            : 'Recently added'}
        </span>
        <Link
          href={`/jobs/${job.id}`}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1"
        >
          View Position &rarr;
        </Link>
      </div>
    </div>
  );
}
