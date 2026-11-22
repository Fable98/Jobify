'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Building2, CheckCircle2, Shield, Trash2, UserPlus, Users } from 'lucide-react';

const companySettingsSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  website: z.string().trim().url('Invalid URL').optional().or(z.literal('')),
  industry: z.string().trim().optional(),
  location: z.string().trim().optional(),
  description: z.string().trim().optional(),
  logoUrl: z.string().trim().url('Invalid logo URL').optional().or(z.literal('')),
});

type CompanySettingsFormData = z.infer<typeof companySettingsSchema>;

interface Member {
  id: string;
  role: 'OWNER' | 'RECRUITER';
  createdAt: string;
  user: {
    id: string;
    email: string;
    status: string;
    profile?: {
      headline?: string | null;
    };
  };
}

export default function EmployerCompanyPage() {
  const queryClient = useQueryClient();
  const { user, refetchUser } = useAuth();
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'OWNER' | 'RECRUITER'>('RECRUITER');

  const primaryCompany = user?.companyMemberships?.[0]?.company;
  const isOwner = user?.companyMemberships?.[0]?.role === 'OWNER';

  // 1. Fetch company members
  const { data: membersData, isLoading: isMembersLoading } = useQuery<{ members: Member[] }>({
    queryKey: ['company', primaryCompany?.id, 'members'],
    queryFn: async () => {
      const res = await apiClient<{ members: Member[] }>(
        `/api/v1/companies/${primaryCompany!.id}/members`
      );
      return res.data;
    },
    enabled: Boolean(primaryCompany?.id),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanySettingsFormData>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      name: primaryCompany?.name || '',
      website: primaryCompany?.website || '',
      industry: primaryCompany?.industry || '',
      location: primaryCompany?.location || '',
      description: primaryCompany?.description || '',
      logoUrl: primaryCompany?.logoUrl || '',
    },
  });

  // Update company settings mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: CompanySettingsFormData) => {
      setStatusMsg(null);
      const res = await apiClient(`/api/v1/companies/${primaryCompany!.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      setStatusMsg({ type: 'success', text: 'Company settings saved successfully!' });
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update company settings' });
    },
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async () => {
      setStatusMsg(null);
      const res = await apiClient(`/api/v1/companies/${primaryCompany!.id}/members`, {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', primaryCompany?.id, 'members'] });
      setInviteEmail('');
      setStatusMsg({ type: 'success', text: 'Member added to company successfully!' });
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to add member' });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      setStatusMsg(null);
      const res = await apiClient(`/api/v1/companies/${primaryCompany!.id}/members/${memberId}`, {
        method: 'DELETE',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', primaryCompany?.id, 'members'] });
      setStatusMsg({ type: 'success', text: 'Member removed.' });
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to remove member' });
    },
  });

  // Create company mutation for new employers
  const createCompanyMutation = useMutation({
    mutationFn: async (data: CompanySettingsFormData) => {
      setStatusMsg(null);
      const cleanData = {
        name: data.name,
        industry: data.industry?.trim() || undefined,
        location: data.location?.trim() || undefined,
        description: data.description?.trim() || undefined,
        website: data.website?.trim() || undefined,
        logoUrl: data.logoUrl?.trim() || undefined,
      };
      const res = await apiClient<{ company: { id: string } }>('/api/v1/companies', {
        method: 'POST',
        body: JSON.stringify(cleanData),
      });
      return res.data;
    },
    onSuccess: async () => {
      await refetchUser();
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      setStatusMsg({ type: 'success', text: 'Company registered successfully!' });
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to create company' });
    },
  });

  const members = membersData?.members || [];

  if (!primaryCompany) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-heading">
            Register Your Organization
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Create your company profile to post jobs and review candidates on HireHub.
          </p>
        </div>

        {statusMsg && (
          <div
            className={`rounded-xl p-3.5 text-xs font-semibold border ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        <form
          onSubmit={handleSubmit((d) => createCompanyMutation.mutate(d))}
          className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="e.g. Acme Innovations Inc."
              className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {errors.name && (
              <p className="mt-1 text-[11px] text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Industry
              </label>
              <input
                type="text"
                {...register('industry')}
                placeholder="e.g. Enterprise Cloud Software"
                className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Location
              </label>
              <input
                type="text"
                {...register('location')}
                placeholder="e.g. San Francisco, CA"
                className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Website URL
            </label>
            <input
              type="text"
              {...register('website')}
              placeholder="https://acme.example.com"
              className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              {...register('description')}
              placeholder="Tell candidates about your company mission and culture..."
              className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <button
            type="submit"
            disabled={createCompanyMutation.isPending}
            className="w-full rounded-xl bg-brand-600 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-600/20 hover:bg-brand-500 transition-colors disabled:opacity-50"
          >
            {createCompanyMutation.isPending ? 'Registering Company...' : 'Register Company'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 font-heading">
          Company Settings & Team
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Manage your verified organization profile and team member recruitment access.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`rounded-xl p-3.5 text-xs font-semibold border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Organization Details Form */}
      <form
        onSubmit={handleSubmit((d) => updateCompanyMutation.mutate(d))}
        className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 font-heading">
            Organization Profile
          </h3>
          {primaryCompany.verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-100">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Verified Employer
            </span>
          ) : (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-100">
              Verification Pending
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              {...register('name')}
              disabled={!isOwner}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Industry
            </label>
            <input
              type="text"
              {...register('industry')}
              disabled={!isOwner}
              placeholder="e.g. Enterprise SaaS, Cloud"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-60"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Location / Headquarters
            </label>
            <input
              type="text"
              {...register('location')}
              disabled={!isOwner}
              placeholder="e.g. San Francisco, CA"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Official Website URL
            </label>
            <input
              type="url"
              {...register('website')}
              disabled={!isOwner}
              placeholder="https://company.example.com"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-60"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Logo Image URL
          </label>
          <input
            type="url"
            {...register('logoUrl')}
            disabled={!isOwner}
            placeholder="https://images.unsplash.com/..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-60"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Company Description
          </label>
          <textarea
            rows={3}
            {...register('description')}
            disabled={!isOwner}
            placeholder="Brief overview of the mission, products, and tech stack..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 leading-relaxed disabled:opacity-60"
          />
        </div>

        {isOwner && (
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || updateCompanyMutation.isPending}
              className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-500 transition-colors disabled:opacity-50"
            >
              {isSubmitting || updateCompanyMutation.isPending ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        )}
      </form>

      {/* Team Members Management Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 font-heading">
            Team Members ({members.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage who has permission to create job listings and evaluate candidate resumes.
          </p>
        </div>

        {/* Add member form (Owner only) */}
        {isOwner && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <span className="text-xs font-bold text-slate-800">Invite / Add Colleague</span>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="flex-1 rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-800"
              >
                <option value="RECRUITER">Recruiter</option>
                <option value="OWNER">Owner</option>
              </select>
              <button
                type="button"
                onClick={() => addMemberMutation.mutate()}
                disabled={!inviteEmail.trim() || addMemberMutation.isPending}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-500 transition-colors disabled:opacity-50"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Add Member</span>
              </button>
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="divide-y divide-slate-100">
          {members.map((m) => (
            <div key={m.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900">{m.user.email}</p>
                <span className="text-slate-400 text-[11px]">
                  Joined {new Date(m.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    m.role === 'OWNER'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {m.role}
                </span>

                {isOwner && m.user.id !== user?.id && (
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${m.user.email} from the company?`)) {
                        removeMemberMutation.mutate(m.id);
                      }
                    }}
                    className="rounded-lg p-1 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    title="Remove member"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
