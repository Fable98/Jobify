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
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-lg">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-md shadow-brand-600/25">
            <Briefcase className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 font-heading">
            Create an Account
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Join HireHub as a job candidate or hiring employer.
          </p>
        </div>

        {/* Role toggle tabs */}
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setValue('role', 'JOB_SEEKER')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all ${
              selectedRole === 'JOB_SEEKER'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Job Seeker</span>
          </button>

          <button
            type="button"
            onClick={() => setValue('role', 'EMPLOYER')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all ${
              selectedRole === 'EMPLOYER'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Employer</span>
          </button>
        </div>

        {serverError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="Alex Rivera"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {errors.name && (
              <p className="mt-1 text-[11px] text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                {...register('email')}
                placeholder="name@domain.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-[11px] text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                {...register('password')}
                placeholder="Minimum 8 characters"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-[11px] text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-brand-600 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-600/20 hover:bg-brand-500 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
          Already registered?{' '}
          <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
