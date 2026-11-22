'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Briefcase, Building2, LayoutDashboard, LogOut, ShieldCheck, User } from 'lucide-react';

export function Navbar() {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    if (user.role === 'EMPLOYER') return '/employer/dashboard';
    return '/dashboard';
  };

  const getDashboardLabel = () => {
    if (!user) return 'Dashboard';
    if (user.role === 'ADMIN') return 'Admin Suite';
    if (user.role === 'EMPLOYER') return 'Employer Portal';
    return 'Candidate Portal';
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/25 transition-transform group-hover:scale-105">
            <Briefcase className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-slate-900 font-heading">
              Job<span className="text-brand-600">ify</span>
            </span>
          </div>
        </Link>

        {/* Center navigation */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <Link
            href="/jobs"
            className={`transition-colors hover:text-brand-600 ${
              pathname.startsWith('/jobs') ? 'text-brand-600 font-semibold' : ''
            }`}
          >
            Find Jobs
          </Link>
          <Link
            href="/companies"
            className={`transition-colors hover:text-brand-600 ${
              pathname.startsWith('/companies') ? 'text-brand-600 font-semibold' : ''
            }`}
          >
            Companies
          </Link>
        </nav>

        {/* User state */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-9 w-24 rounded-lg bg-slate-100 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link
                href={getDashboardLink()}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-100 hover:bg-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
              >
                {user.role === 'ADMIN' ? (
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                ) : user.role === 'EMPLOYER' ? (
                  <Building2 className="h-4 w-4 text-brand-600" />
                ) : (
                  <LayoutDashboard className="h-4 w-4 text-brand-600" />
                )}
                <span>{getDashboardLabel()}</span>
              </Link>

              <button
                onClick={() => logout()}
                title="Sign out"
                className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-brand-500 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                <User className="h-3.5 w-3.5" />
                <span>Get Started</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
