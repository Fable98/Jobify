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
    <article className="group relative flex flex-col justify-between rounded-3xl border border-[#E2E6EC] bg-white p-6 shadow-clay-2 hover:shadow-clay-3 hover:border-[#9FE3C8] transition-all duration-300">
      <div>
        {/* Header: Company & Bookmark */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF1F5] text-slate-700 font-bold text-sm border border-[#E2E6EC] shadow-clay-inset overflow-hidden shrink-0">
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
                  className="text-xs font-semibold text-slate-700 hover:text-[#289E73] transition-colors"
                >
                  {job.company.name}
                </Link>
                {job.company.verified && (
                  <span title="Verified Company">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#289E73] flex-shrink-0" />
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading group-hover:text-[#289E73] transition-colors mt-0.5 line-clamp-1">
                <Link href={`/jobs/${job.id}`}>
                  {job.title}
                </Link>
              </h3>
            </div>
          </div>

          <button
            onClick={toggleSave}
            disabled={isSaving}
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all ${
              isSaved
                ? 'border-[#85DAB9] bg-[#E1F5EC] text-[#1F7D5C] shadow-clay-1'
                : 'border-[#E2E6EC] bg-white text-slate-400 shadow-clay-1 hover:border-[#9FE3C8] hover:text-slate-600'
            }`}
            title={isSaved ? 'Remove from saved' : 'Save job'}
            aria-label={isSaved ? 'Remove from saved' : 'Save job'}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-[#1F7D5C]' : ''}`} />
          </button>
        </div>

        {/* Location & Tags (Pill Capsules) */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200/80 px-3 py-1 font-medium text-slate-700">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            {job.location}
          </span>

          <span className="rounded-full bg-[#E1F5EC] border border-[#C3EBDA] px-3 py-1 font-semibold text-[#1F7D5C]">
            {job.employmentType.replace('_', ' ')}
          </span>

          <span className="rounded-full bg-slate-100 border border-slate-200/80 px-3 py-1 font-medium text-slate-700">
            {job.experienceLevel}
          </span>

          {salaryString && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#FEF3C7] border border-[#FDE68A] px-3 py-1 font-semibold text-[#92400E]">
              <DollarSign className="h-3 w-3" />
              {salaryString}
            </span>
          )}
        </div>

        {/* Short description snippet */}
        <p className="mt-3.5 text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">
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
          className="inline-flex items-center gap-1 rounded-full bg-[#9FE3C8] text-[#0B2D22] font-semibold px-4 py-1.5 text-xs shadow-clay-btn hover:bg-[#8DE0C2] hover:shadow-clay-btn-hover transition-all"
        >
          View Position &rarr;
        </Link>
      </div>
    </article>
  );
}
