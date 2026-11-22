'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Job, Application } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import {
  ArrowLeft,
  Bookmark,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Globe,
  MapPin,
  Send,
  Upload,
} from 'lucide-react';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const jobId = params.id as string;

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [uploadedResumeFile, setUploadedResumeFile] = useState<File | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // 1. Fetch Job
  const { data: jobData, isLoading, isError } = useQuery<{ job: Job }>({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const res = await apiClient<{ job: Job }>(`/api/v1/jobs/${jobId}`);
      return res.data;
    },
    enabled: Boolean(jobId),
  });

  // 2. Fetch User's existing applications to check if already applied
  const { data: myAppsData } = useQuery<{ applications: Application[] }>({
    queryKey: ['applications', 'my'],
    queryFn: async () => {
      const res = await apiClient<{ applications: Application[] }>('/api/v1/applications/my');
      return res.data;
    },
    enabled: Boolean(user && user.role === 'JOB_SEEKER'),
  });

  const existingApp = myAppsData?.applications.find((a) => a.jobId === jobId);

  // Initialize selected resume with default resume if available
  React.useEffect(() => {
    if (user?.profile?.defaultResumeFileId && !selectedResumeId) {
      setSelectedResumeId(user.profile.defaultResumeFileId);
    }
  }, [user, selectedResumeId]);

  // Apply Mutation
  const applyMutation = useMutation({
    mutationFn: async () => {
      let resumeIdToUse = selectedResumeId;

      // If user uploaded a new file in modal, upload it first
      if (uploadedResumeFile) {
        const formData = new FormData();
        formData.append('file', uploadedResumeFile);
        const uploadRes = await apiClient<{ file: { id: string } }>('/api/v1/files/resume', {
          method: 'POST',
          body: formData,
        });
        resumeIdToUse = uploadRes.data.file.id;
      }

      if (!resumeIdToUse) {
        throw new Error('Please select or upload a resume PDF before applying.');
      }

      const res = await apiClient<{ application: Application }>(`/api/v1/jobs/${jobId}/apply`, {
        method: 'POST',
        body: JSON.stringify({
          resumeFileId: resumeIdToUse,
          coverLetter: coverLetter.trim() || undefined,
        }),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', 'my'] });
      setIsApplyModalOpen(false);
      setApplyError(null);
    },
    onError: (err: any) => {
      setApplyError(err.message || 'Failed to submit application');
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-slate-200 rounded" />
        <div className="h-12 w-3/4 bg-slate-200 rounded" />
        <div className="h-48 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (isError || !jobData?.job) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800 font-heading">Position Not Found</h2>
        <p className="mt-2 text-xs text-slate-500">
          This listing may have expired, been closed by the employer, or moved.
        </p>
        <Link
          href="/jobs"
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to open jobs
        </Link>
      </div>
    );
  }

  const job = jobData.job;

  const toggleSave = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    const prev = isSaved;
    setIsSaved(!prev);
    try {
      if (prev) {
        await apiClient(`/api/v1/saved-jobs/${job.id}`, { method: 'DELETE' });
      } else {
        await apiClient('/api/v1/saved-jobs', {
          method: 'POST',
          body: JSON.stringify({ jobId: job.id }),
        });
      }
    } catch {
      setIsSaved(prev);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Back button */}
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to jobs
      </Link>

      {/* Main Card Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold text-xl border border-slate-200 overflow-hidden flex-shrink-0">
              {job.company.logoUrl ? (
                <img
                  src={job.company.logoUrl}
                  alt={job.company.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="h-8 w-8 text-slate-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/companies/${job.company.slug || job.company.id}`}
                  className="text-sm font-semibold text-brand-600 hover:underline"
                >
                  {job.company.name}
                </Link>
                {job.company.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-100">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Verified Employer
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-heading mt-1">
                {job.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
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

                {job.salaryMin && job.salaryMax && (
                  <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 border border-emerald-100">
                    <DollarSign className="h-3.5 w-3.5" />
                    ${Math.round(Number(job.salaryMin) / 1000)}k – ${Math.round(Number(job.salaryMax) / 1000)}k / yr
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={toggleSave}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-full border px-5 py-2.5 text-xs font-semibold transition-all shadow-clay-1 ${
                isSaved
                  ? 'border-[#85DAB9] bg-[#E1F5EC] text-[#1F7D5C]'
                  : 'border-[#E2E6EC] bg-white text-slate-700 hover:border-[#9FE3C8]'
              }`}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-[#1F7D5C]' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            {existingApp ? (
              <div className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-full bg-[#E1F5EC] px-5 py-2.5 text-xs font-bold text-[#1F7D5C] border border-[#C3EBDA] shadow-clay-1">
                <CheckCircle2 className="h-4 w-4 text-[#289E73]" />
                <span>Applied ({existingApp.status})</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (!user) {
                    router.push('/login');
                  } else if (user.role !== 'JOB_SEEKER') {
                    alert('Only job seekers can apply for positions.');
                  } else {
                    setIsApplyModalOpen(true);
                  }
                }}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-full bg-[#9FE3C8] border border-[#85DAB9] px-6 py-2.5 text-xs font-bold text-[#0B2D22] shadow-clay-btn hover:bg-[#8DE0C2] hover:shadow-clay-btn-hover transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#289E73]"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Apply for this role</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Content: Left Specs, Right Company Info */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Job Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Role Overview */}
          <section className="rounded-3xl border border-[#E2E6EC] bg-white p-6 sm:p-8 shadow-clay-2">
            <h2 className="text-lg font-bold text-slate-900 font-heading mb-4">
              About the Role
            </h2>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {job.description}
            </div>
          </section>

          {/* Responsibilities */}
          <section className="rounded-3xl border border-[#E2E6EC] bg-white p-6 sm:p-8 shadow-clay-2">
            <h2 className="text-lg font-bold text-slate-900 font-heading mb-4">
              Key Responsibilities
            </h2>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {job.responsibilities}
            </div>
          </section>

          {/* Requirements */}
          <section className="rounded-3xl border border-[#E2E6EC] bg-white p-6 sm:p-8 shadow-clay-2">
            <h2 className="text-lg font-bold text-slate-900 font-heading mb-4">
              Role Requirements
            </h2>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {job.requirements}
            </div>
          </section>
        </div>

        {/* Right Column: Company Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 font-heading mb-4">
              About {job.company.name}
            </h3>

            {job.company.description && (
              <p className="text-xs text-slate-600 leading-relaxed mb-5">
                {job.company.description}
              </p>
            )}

            <div className="space-y-3 border-t border-slate-100 pt-4 text-xs">
              {job.company.industry && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Industry</span>
                  <span className="font-semibold text-slate-800">{job.company.industry}</span>
                </div>
              )}

              {job.company.location && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Headquarters</span>
                  <span className="font-semibold text-slate-800">{job.company.location}</span>
                </div>
              )}

              {job.company.website && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Website</span>
                  <a
                    href={job.company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-brand-600 hover:underline inline-flex items-center gap-1"
                  >
                    Visit <Globe className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link
                href={`/companies/${job.company.slug || job.company.id}`}
                className="w-full inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2.5 text-xs font-semibold text-slate-800 transition-colors"
              >
                View all company openings
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* Apply Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-[#E2E6EC] bg-white p-6 sm:p-8 shadow-clay-3 relative">
            <h3 className="text-xl font-bold text-slate-900 font-heading">
              Apply to {job.company.name}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Position: <span className="font-semibold text-slate-800">{job.title}</span>
            </p>

            {applyError && (
              <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 shadow-clay-1">
                {applyError}
              </div>
            )}

            <div className="mt-6 space-y-5">
              {/* Resume selection or upload */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Attach PDF Resume
                </label>

                {user?.profile?.defaultResume && (
                  <div className="mb-3 flex items-center justify-between rounded-2xl border border-[#C3EBDA] bg-[#E1F5EC]/60 p-3 text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#289E73]" />
                      <span className="font-semibold text-slate-800">
                        {user.profile.defaultResume.originalName}
                      </span>
                    </div>
                    <span className="rounded-full bg-[#9FE3C8] px-2.5 py-0.5 text-[10px] font-bold text-[#0B2D22]">
                      Default
                    </span>
                  </div>
                )}

                <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E2E6EC] p-4 hover:border-[#9FE3C8] bg-[#EFF1F5]/50 transition-colors text-center">
                  <Upload className="h-6 w-6 text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-700">
                    {uploadedResumeFile ? uploadedResumeFile.name : 'Upload different PDF resume'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Maximum size 5 MB</span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setUploadedResumeFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Cover Letter */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Cover Letter / Note (Optional)
                </label>
                <textarea
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Introduce yourself, your recent engineering projects, and why you're a good fit..."
                  className="w-full rounded-2xl border border-[#E2E6EC] bg-[#EFF1F5] shadow-clay-inset p-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#74D4B1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9FE3C8]"
                />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="rounded-full border border-[#E2E6EC] bg-white px-5 py-2.5 text-xs font-semibold text-slate-600 shadow-clay-1 hover:shadow-clay-2 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => applyMutation.mutate()}
                disabled={applyMutation.isPending}
                className="inline-flex items-center gap-2 rounded-full bg-[#9FE3C8] border border-[#85DAB9] px-6 py-2.5 text-xs font-bold text-[#0B2D22] shadow-clay-btn hover:bg-[#8DE0C2] hover:shadow-clay-btn-hover transition-all disabled:opacity-50"
              >
                {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
