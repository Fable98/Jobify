'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Job, EmploymentType, ExperienceLevel, PaginationMeta } from '@/lib/types';
import { JobCard } from '@/components/jobs/job-card';
import { JobFilters } from '@/components/jobs/job-filters';
import { Briefcase, ChevronLeft, ChevronRight, SearchX } from 'lucide-react';

export default function JobsPage() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState<EmploymentType | ''>('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | ''>('');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [sortBy, setSortBy] = useState('publishedAt');
  const [page, setPage] = useState(1);

  // Construct query params
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('pageSize', '9');
  params.set('sortBy', sortBy);
  params.set('sortOrder', 'desc');

  if (search) params.set('search', search);
  if (location) params.set('location', location);
  if (employmentType) params.set('employmentType', employmentType);
  if (experienceLevel) params.set('experienceLevel', experienceLevel);
  if (minSalary) params.set('minSalary', minSalary);
  if (maxSalary) params.set('maxSalary', maxSalary);

  const { data, isLoading, isError } = useQuery<{ jobs: Job[]; meta: PaginationMeta }>({
    queryKey: ['jobs', 'public', params.toString()],
    queryFn: async () => {
      const res = await apiClient<Job[]>(`/api/v1/jobs?${params.toString()}`);
      return {
        jobs: res.data,
        meta: res.meta as unknown as PaginationMeta,
      };
    },
  });

  const handleReset = () => {
    setSearch('');
    setLocation('');
    setEmploymentType('');
    setExperienceLevel('');
    setMinSalary('');
    setMaxSalary('');
    setSortBy('publishedAt');
    setPage(1);
  };

  const jobs = data?.jobs || [];
  const meta = data?.meta;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Title */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 mb-3 border border-brand-100">
          <Briefcase className="h-3.5 w-3.5" />
          <span>Verified Opportunities</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-heading sm:text-4xl">
          Explore Open Roles
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-2xl">
          Browse vetted positions from verified technology companies offering transparent compensation and responsive hiring teams.
        </p>
      </div>

      {/* Main Grid: Filters + Job Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Sidebar: Filters */}
        <aside className="lg:col-span-1 lg:sticky lg:top-24">
          <JobFilters
            search={search}
            setSearch={(v) => { setSearch(v); setPage(1); }}
            location={location}
            setLocation={(v) => { setLocation(v); setPage(1); }}
            employmentType={employmentType}
            setEmploymentType={(v) => { setEmploymentType(v); setPage(1); }}
            experienceLevel={experienceLevel}
            setExperienceLevel={(v) => { setExperienceLevel(v); setPage(1); }}
            minSalary={minSalary}
            setMinSalary={(v) => { setMinSalary(v); setPage(1); }}
            maxSalary={maxSalary}
            setMaxSalary={(v) => { setMaxSalary(v); setPage(1); }}
            sortBy={sortBy}
            setSortBy={(v) => { setSortBy(v); setPage(1); }}
            onReset={handleReset}
          />
        </aside>

        {/* Right Area: Results List */}
        <main className="lg:col-span-3 space-y-6">
          {/* Results count banner */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pb-2">
            <span>
              {isLoading
                ? 'Loading positions...'
                : `Showing ${jobs.length} of ${meta?.total ?? jobs.length} positions`}
            </span>
          </div>

          {/* Loading Skeletons */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-200" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 w-24 bg-slate-200 rounded" />
                      <div className="h-4 w-40 bg-slate-200 rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-3/4 bg-slate-200 rounded" />
                  <div className="flex gap-2">
                    <div className="h-6 w-20 bg-slate-200 rounded" />
                    <div className="h-6 w-20 bg-slate-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
              <p className="font-semibold text-sm">Failed to load jobs</p>
              <p className="text-xs mt-1">Please check your network connection and try again.</p>
              <button
                onClick={handleReset}
                className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && jobs.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-4">
                <SearchX className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 font-heading">
                No matching jobs found
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                We couldn&apos;t find any published roles matching your active criteria. Try broadening your salary range or search keywords.
              </p>
              <button
                onClick={handleReset}
                className="mt-5 inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-500 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Jobs Grid */}
          {!isLoading && !isError && jobs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {meta && meta.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>

              <span className="text-xs font-medium text-slate-600">
                Page {meta.page} of {meta.totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
