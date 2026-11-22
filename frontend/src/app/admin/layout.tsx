'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  ShieldAlert,
  Users,
  Building2,
  Briefcase,
  Activity,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.replace('/login?redirect=' + encodeURIComponent(pathname));
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#289E73] border-t-transparent" />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="rounded-full bg-red-100 p-4 text-red-600 mb-4 shadow-clay-1">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2 font-heading">Admin Access Required</h1>
        <p className="text-slate-600 max-w-md mb-6 text-sm">
          This portal is restricted to Jobify platform administrators. You must be signed in with an admin account.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-full bg-[#9FE3C8] border border-[#85DAB9] px-6 py-2.5 font-bold text-xs text-[#0B2D22] shadow-clay-btn hover:bg-[#8DE0C2]"
        >
          Sign in to Admin Account <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const navLinks = [
    { href: '/admin/dashboard', label: 'Platform Stats', icon: Activity },
    { href: '/admin/users', label: 'User Governance', icon: Users },
    { href: '/admin/companies', label: 'Company Verification', icon: Building2 },
    { href: '/admin/jobs', label: 'Job Moderation', icon: Briefcase },
  ];

  return (
    <div className="min-h-screen bg-surface pb-16">
      {/* Top Admin Banner */}
      <div className="bg-slate-900 border-b border-slate-800 text-slate-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4 text-xs font-medium">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#42C093] animate-pulse" />
            <ShieldCheck className="h-4 w-4 text-[#9FE3C8]" />
            <span className="font-semibold text-white">Jobify System Administration</span>
            <span className="rounded-full bg-[#9FE3C8]/20 px-2.5 py-0.5 text-[#9FE3C8] font-mono text-[10px] border border-[#9FE3C8]/30">
              SUPERUSER
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Signed in as <strong className="text-white">{user.email}</strong></span>
            <span>Status: <strong className="text-[#9FE3C8]">ACTIVE</strong></span>
          </div>
        </div>
      </div>

      {/* Admin Nav Sub-bar with Styleguide Pill Tabs */}
      <div className="border-b border-[#E2E6EC] bg-white sticky top-16 z-30 shadow-clay-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-2 sm:space-x-3 overflow-x-auto py-2.5">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#E1F5EC] text-[#1F7D5C] shadow-clay-1 border border-[#C3EBDA]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-[#EFF1F5]'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-[#289E73]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        {children}
      </div>
    </div>
  );
}
