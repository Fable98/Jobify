import React from 'react';
import Link from 'next/link';
import { Briefcase } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Briefcase className="h-4 w-4" />
            </div>
            <span className="text-base font-bold text-slate-900 font-heading">
              Hire<span className="text-brand-600">Hub</span>
            </span>
            <span className="text-xs text-slate-500 ml-2">
              Production-Grade Full-Stack Career Platform
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs font-medium text-slate-600">
            <Link href="/jobs" className="hover:text-brand-600 transition-colors">
              Browse Jobs
            </Link>
            <Link href="/companies" className="hover:text-brand-600 transition-colors">
              Verified Companies
            </Link>
            <Link href="/register?role=EMPLOYER" className="hover:text-brand-600 transition-colors">
              Post a Role
            </Link>
            <Link href="/login" className="hover:text-brand-600 transition-colors">
              Candidate Login
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} HireHub Inc. Accessible WCAG AA Compliant Engineering Platform.</p>
        </div>
      </div>
    </footer>
  );
}
