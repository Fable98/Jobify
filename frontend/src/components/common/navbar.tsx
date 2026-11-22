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
    <header className="sticky top-0 z-40 border-b border-[#E2E6EC] bg-white/85 backdrop-blur-md shadow-clay-1 transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#9FE3C8] text-[#0B2D22] shadow-clay-btn border border-[#85DAB9] transition-transform group-hover:scale-105">
            <Briefcase className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-slate-900 font-heading">
              Job<span className="text-[#289E73]">ify</span>
            </span>
          </div>
        </Link>

        {/* Center navigation */}
        <nav className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-600">
          <Link
            href="/jobs"
            className={`rounded-full px-4 py-1.5 transition-all ${
              pathname.startsWith('/jobs')
                ? 'bg-[#E1F5EC] text-[#1F7D5C] font-semibold shadow-clay-1'
                : 'hover:text-[#289E73] hover:bg-slate-100/60'
            }`}
          >
            Find Jobs
          </Link>
          <Link
            href="/companies"
            className={`rounded-full px-4 py-1.5 transition-all ${
              pathname.startsWith('/companies')
                ? 'bg-[#E1F5EC] text-[#1F7D5C] font-semibold shadow-clay-1'
                : 'hover:text-[#289E73] hover:bg-slate-100/60'
            }`}
          >
            Companies
          </Link>
        </nav>

        {/* User state */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-9 w-24 rounded-full bg-slate-200/70 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link
                href={getDashboardLink()}
                className="inline-flex items-center gap-2 rounded-full bg-white border border-[#E2E6EC] shadow-clay-1 hover:shadow-clay-2 px-4 py-2 text-xs font-semibold text-slate-800 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE3C8]"
              >
                {user.role === 'ADMIN' ? (
                  <ShieldCheck className="h-4 w-4 text-[#289E73]" />
                ) : user.role === 'EMPLOYER' ? (
                  <Building2 className="h-4 w-4 text-[#289E73]" />
                ) : (
                  <LayoutDashboard className="h-4 w-4 text-[#289E73]" />
                )}
                <span>{getDashboardLabel()}</span>
              </Link>

              <button
                onClick={() => logout()}
                title="Sign out"
                className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-[#E2E6EC] bg-white text-slate-500 shadow-clay-1 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="rounded-full border border-[#E2E6EC] bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-clay-1 hover:bg-slate-50 hover:shadow-clay-2 transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#9FE3C8] border border-[#85DAB9] px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-[#0B2D22] shadow-clay-btn hover:bg-[#8DE0C2] hover:shadow-clay-btn-hover transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#289E73]"
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
