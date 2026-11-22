'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Bookmark, FileText, LayoutDashboard, UserCircle } from 'lucide-react';

export default function SeekerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent" />
        <p className="mt-3 text-xs text-slate-500 font-medium">Loading candidate portal...</p>
      </div>
    );
  }

  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Applications', href: '/dashboard/applications', icon: FileText },
    { label: 'Saved Positions', href: '/dashboard/saved-jobs', icon: Bookmark },
    { label: 'Profile & Resume', href: '/dashboard/profile', icon: UserCircle },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 border border-brand-100">
              Candidate Portal
            </span>
            <span className="text-xs text-slate-400">&bull;</span>
            <span className="text-xs text-slate-600 font-medium">{user.email}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading sm:text-3xl mt-1">
            Welcome back, {user.profile?.headline?.split('|')[0]?.trim() || 'Candidate'}
          </h1>
        </div>

        <Link
          href="/jobs"
          className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-500 transition-colors"
        >
          Explore New Roles
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Navigation Sidebar */}
        <nav className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Content Pane */}
        <div className="lg:col-span-4">{children}</div>
      </div>
    </div>
  );
}
