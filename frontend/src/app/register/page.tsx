'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Briefcase, Building2, Lock, Mail, User } from 'lucide-react';

const registerFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['JOB_SEEKER', 'EMPLOYER']),
});

type RegisterFormData = z.infer<typeof registerFormSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { refetchUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      role: 'JOB_SEEKER',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      const res = await apiClient<{ user: { id: string; role: string } }>('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      await refetchUser();

      if (res.data.user.role === 'EMPLOYER') {
        router.push('/employer/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setServerError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-surface">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-[#E2E6EC] bg-white p-8 sm:p-10 shadow-clay-3">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#9FE3C8] text-[#0B2D22] border border-[#85DAB9] shadow-clay-btn">
            <Briefcase className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 font-heading">
            Create an Account
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Join Jobify as a job candidate or hiring employer.
          </p>
        </div>

        {/* Styleguide Pill Tabs for Role selection */}
        <div className="grid grid-cols-2 gap-1 rounded-full bg-[#EFF1F5] p-1.5 border border-[#E2E6EC] shadow-clay-inset text-xs font-semibold">
          <button
            type="button"
            onClick={() => setValue('role', 'JOB_SEEKER')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-full py-2 transition-all ${
              selectedRole === 'JOB_SEEKER'
                ? 'bg-[#9FE3C8] text-[#0B2D22] font-bold shadow-clay-btn border border-[#85DAB9]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Job Seeker</span>
          </button>

          <button
            type="button"
            onClick={() => setValue('role', 'EMPLOYER')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-full py-2 transition-all ${
              selectedRole === 'EMPLOYER'
                ? 'bg-[#9FE3C8] text-[#0B2D22] font-bold shadow-clay-btn border border-[#85DAB9]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Employer</span>
          </button>
        </div>

        {serverError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 shadow-clay-1">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                {...register('name')}
                placeholder="Alex Rivera"
                className="w-full rounded-full bg-[#EFF1F5] border border-[#E2E6EC] shadow-clay-inset py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9FE3C8] focus:border-transparent transition-all"
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-[11px] text-red-600 pl-3">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="email"
                {...register('email')}
                placeholder="name@domain.com"
                className="w-full rounded-full bg-[#EFF1F5] border border-[#E2E6EC] shadow-clay-inset py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9FE3C8] focus:border-transparent transition-all"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-[11px] text-red-600 pl-3">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="password"
                {...register('password')}
                placeholder="Minimum 8 characters"
                className="w-full rounded-full bg-[#EFF1F5] border border-[#E2E6EC] shadow-clay-inset py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9FE3C8] focus:border-transparent transition-all"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-[11px] text-red-600 pl-3">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-[#9FE3C8] py-3 text-xs font-bold text-[#0B2D22] border border-[#85DAB9] shadow-clay-btn hover:bg-[#8DE0C2] hover:shadow-clay-btn-hover transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#289E73] disabled:opacity-50"
          >
            {isSubmitting ? 'Creating account...' : 'Complete Registration'}
          </button>
        </form>

        <div className="text-center pt-3 border-t border-[#E2E6EC] text-xs text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-[#289E73] hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
