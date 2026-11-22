'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { SavedJob } from '@/lib/types';
import { JobCard } from '@/components/jobs/job-card';
import { Bookmark, Search } from 'lucide-react';

export default function SeekerSavedJobsPage() {
  const { data, isLoading } = useQuery<{ savedJobs: SavedJob[] }>({
    queryKey: ['saved-jobs'],
    queryFn: async () => {
      const res = await apiClient<{ savedJobs: SavedJob[] }>('/api/v1/saved-jobs');
      return res.data;
    },
  });

  const savedJobs = data?.savedJobs || [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-44 rounded-xl bg-slate-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 font-heading">
          Saved Positions ({savedJobs.length})
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Bookmarked positions for quick reference and application review.
        </p>
      </div>

      {savedJobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Bookmark className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No saved jobs</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Click the bookmark icon on any job posting to save it here for later.
          </p>
          <Link
            href="/jobs"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500"
          >
            Explore open jobs
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedJobs.map((item) => (
            <JobCard key={item.id} job={item.job} initialSaved={true} />
          ))}
        </div>
      )}
    </div>
  );
}
