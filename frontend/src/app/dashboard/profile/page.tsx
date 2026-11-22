'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';
import { FileText, Plus, Upload, X } from 'lucide-react';

const profileSchema = z.object({
  headline: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(100).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function SeekerProfilePage() {
  const { user, refetchUser } = useAuth();
  const [skills, setSkills] = useState<string[]>(user?.profile?.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      headline: user?.profile?.headline || '',
      bio: user?.profile?.bio || '',
      location: user?.profile?.location || '',
    },
  });

  const addSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setStatusMessage({ type: 'error', text: 'Only PDF resume files (.pdf) are permitted' });
      return;
    }

    setIsUploading(true);
    setStatusMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      await apiClient('/api/v1/files/resume', {
        method: 'POST',
        body: formData,
      });

      await refetchUser();
      setStatusMessage({ type: 'success', text: 'Resume uploaded and set as default successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to upload resume' });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setStatusMessage(null);
    try {
      await apiClient('/api/v1/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          ...data,
          skills,
        }),
      });

      await refetchUser();
      setStatusMessage({ type: 'success', text: 'Candidate profile updated successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 font-heading">
          Candidate Profile & Resume
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          This profile information is presented to verified companies when you apply for positions.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`rounded-xl p-3.5 text-xs font-semibold border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Resume Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 font-heading mb-4">
          Default PDF Resume
        </h3>

        {user?.profile?.defaultResume ? (
          <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50/50 p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {user.profile.defaultResume.originalName}
                </p>
                <p className="text-[11px] text-slate-500">
                  {Math.round(user.profile.defaultResume.sizeBytes / 1024)} KB &bull; Uploaded{' '}
                  {new Date(user.profile.defaultResume.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <a
              href={`/api/v1/files/${user.profile.defaultResume.id}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 transition-colors"
            >
              View Document
            </a>
          </div>
        ) : (
          <p className="text-xs text-slate-500 mb-4">
            No resume uploaded yet. Upload a PDF resume to attach to job applications.
          </p>
        )}

        <div className="relative inline-block">
          <label className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm cursor-pointer transition-colors">
            <Upload className="h-4 w-4" />
            <span>{isUploading ? 'Uploading...' : 'Upload New PDF Resume'}</span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleResumeUpload}
              disabled={isUploading}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-slate-900 font-heading">
          Professional Details
        </h3>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Professional Headline
          </label>
          <input
            type="text"
            {...register('headline')}
            placeholder="e.g. Senior Full-Stack Engineer | TypeScript, React, Distributed Systems"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Location / Preferred Work Hub
          </label>
          <input
            type="text"
            {...register('location')}
            placeholder="e.g. San Francisco, CA or Remote"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Bio / Summary
          </label>
          <textarea
            rows={4}
            {...register('bio')}
            placeholder="Briefly highlight your engineering background, favorite tech stacks, and career milestones..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 leading-relaxed"
          />
        </div>

        {/* Skills Tag Editor */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Key Technical Skills & Competencies
          </label>

          <div className="flex flex-wrap gap-2 mb-3">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-brand-200 px-3 py-1 text-xs font-semibold text-brand-700"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="text-brand-400 hover:text-brand-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 max-w-sm">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={addSkill}
              placeholder="e.g. Kubernetes, React, Go"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="button"
              onClick={addSkill}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-brand-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-500 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
