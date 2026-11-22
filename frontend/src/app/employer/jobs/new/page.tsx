'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Briefcase, Building2, DollarSign, MapPin } from 'lucide-react';

const jobFormSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters'),
    description: z.string().trim().min(10, 'Description must be at least 10 characters'),
    requirements: z.string().trim().min(10, 'Requirements must be at least 10 characters'),
    responsibilities: z.string().trim().min(10, 'Responsibilities must be at least 10 characters'),
    location: z.string().trim().min(2, 'Location is required'),
    employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE']),
    experienceLevel: z.enum(['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD']),
    salaryMin: z.coerce.number().positive().optional().nullable(),
    salaryMax: z.coerce.number().positive().optional().nullable(),
    salaryCurrency: z.string().default('USD'),
    status: z.enum(['DRAFT', 'PUBLISHED']).default('PUBLISHED'),
  })
  .refine(
    (data) => {
      if (data.salaryMin && data.salaryMax) {
        return data.salaryMin <= data.salaryMax;
      }
      return true;
    },
    {
      message: 'Minimum salary must be less than or equal to maximum salary',
      path: ['salaryMax'],
    }
  );

type JobFormData = z.infer<typeof jobFormSchema>;

export default function NewJobPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const primaryCompany = user?.companyMemberships?.[0]?.company;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      employmentType: 'FULL_TIME',
      experienceLevel: 'MID',
      salaryCurrency: 'USD',
      status: primaryCompany?.verified ? 'PUBLISHED' : 'DRAFT',
    },
  });

  const selectedStatus = watch('status');

  const onSubmit = async (data: JobFormData) => {
    if (!primaryCompany) {
      setServerError('You must be a member of a company to post jobs.');
      return;
    }

    setServerError(null);
    try {
      await apiClient('/api/v1/jobs', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          companyId: primaryCompany.id,
        }),
      });

      router.push('/employer/jobs');
    } catch (err: any) {
      setServerError(err.message || 'Failed to create job posting');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 font-heading">
          Post a New Position
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Create a verified role listing for {primaryCompany?.name || 'your company'}.
        </p>
      </div>

      {!primaryCompany?.verified && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <strong>Notice:</strong> Your company is currently pending admin verification. You may save jobs as <strong>DRAFT</strong>. Once verification is approved by admin, you can publish them publicly.
        </div>
      )}

      {serverError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Job Title *
          </label>
          <input
            type="text"
            {...register('title')}
            placeholder="e.g. Senior Full-Stack Engineer"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          {errors.title && <p className="mt-1 text-[11px] text-red-600">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Location *
            </label>
            <input
              type="text"
              {...register('location')}
              placeholder="e.g. San Francisco, CA or Remote"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {errors.location && <p className="mt-1 text-[11px] text-red-600">{errors.location.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Employment Type
            </label>
            <select
              {...register('employmentType')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="FULL_TIME">Full Time</option>
              <option value="REMOTE">Remote</option>
              <option value="CONTRACT">Contract</option>
              <option value="PART_TIME">Part Time</option>
              <option value="INTERNSHIP">Internship</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Experience Level
            </label>
            <select
              {...register('experienceLevel')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="ENTRY">Entry Level</option>
              <option value="JUNIOR">Junior</option>
              <option value="MID">Mid-Level</option>
              <option value="SENIOR">Senior</option>
              <option value="LEAD">Lead / Staff</option>
            </select>
          </div>
        </div>

        {/* Salary Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Minimum Salary ($ / yr)
            </label>
            <input
              type="number"
              {...register('salaryMin')}
              placeholder="e.g. 130000"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Maximum Salary ($ / yr)
            </label>
            <input
              type="number"
              {...register('salaryMax')}
              placeholder="e.g. 165000"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {errors.salaryMax && <p className="mt-1 text-[11px] text-red-600">{errors.salaryMax.message}</p>}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Job Description *
          </label>
          <textarea
            rows={4}
            {...register('description')}
            placeholder="Explain what the team is building, why this role is crucial, and project context..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 leading-relaxed"
          />
          {errors.description && <p className="mt-1 text-[11px] text-red-600">{errors.description.message}</p>}
        </div>

        {/* Responsibilities */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Key Responsibilities *
          </label>
          <textarea
            rows={4}
            {...register('responsibilities')}
            placeholder="Outline daily duties, architectural stewardship, code reviews, and cross-team collaboration..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 leading-relaxed"
          />
          {errors.responsibilities && <p className="mt-1 text-[11px] text-red-600">{errors.responsibilities.message}</p>}
        </div>

        {/* Requirements */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Role Requirements *
          </label>
          <textarea
            rows={4}
            {...register('requirements')}
            placeholder="Required engineering experience, language proficiencies, frameworks, and system design expertise..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 leading-relaxed"
          />
          {errors.requirements && <p className="mt-1 text-[11px] text-red-600">{errors.requirements.message}</p>}
        </div>

        {/* Publication Status Choice */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Listing Status
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
              <input
                type="radio"
                value="PUBLISHED"
                checked={selectedStatus === 'PUBLISHED'}
                onChange={() => setValue('status', 'PUBLISHED')}
                disabled={!primaryCompany?.verified}
                className="text-brand-600 focus:ring-brand-500"
              />
              <span>Publish Publicly Immediately</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
              <input
                type="radio"
                value="DRAFT"
                checked={selectedStatus === 'DRAFT'}
                onChange={() => setValue('status', 'DRAFT')}
                className="text-brand-600 focus:ring-brand-500"
              />
              <span>Save as Draft</span>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-brand-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-500 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Creating Position...' : 'Create Position'}
          </button>
        </div>
      </form>
    </div>
  );
}
