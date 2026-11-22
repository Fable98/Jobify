'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Briefcase, Lock, Mail } from 'lucide-react';

const loginFormSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { refetchUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const res = await apiClient<{ user: { id: string; role: string } }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      await refetchUser();

      // Role-based redirect
      const role = res.data.user.role;
      if (role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (role === 'EMPLOYER') {
        router.push('/employer/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setServerError(err.message || 'Invalid email or password');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-surface">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-[#E2E6EC] bg-white p-8 sm:p-10 shadow-clay-3">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#9FE3C8] text-[#0B2D22] border border-[#85DAB9] shadow-clay-btn">
            <Briefcase className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 font-heading">
            Sign in to Jobify
          </h2>
          <p className="mt-1.5 text-xs text-slate-500">
            Access your applications, posted roles, or company settings.
          </p>
        </div>

        {serverError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 shadow-clay-1">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="email"
                {...register('email')}
                placeholder="name@company.com"
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
                placeholder="••••••••"
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
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center pt-3 border-t border-[#E2E6EC] text-xs text-slate-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-[#289E73] hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
