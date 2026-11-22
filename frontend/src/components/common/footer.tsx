import React from 'react';
import Link from 'next/link';
import { Briefcase } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-[#E2E6EC] bg-white py-12 shadow-clay-1">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#9FE3C8] text-[#0B2D22] shadow-clay-btn border border-[#85DAB9]">
              <Briefcase className="h-4 w-4" />
            </div>
            <span className="text-base font-bold text-slate-900 font-heading">
              Job<span className="text-[#289E73]">ify</span>
            </span>
            <span className="text-xs text-slate-500 ml-2 hidden sm:inline">
              Production-Grade Full-Stack Career Platform
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-6 text-xs font-medium text-slate-600">
            <Link href="/jobs" className="rounded-full px-3 py-1.5 hover:text-[#289E73] hover:bg-slate-50 transition-colors">
              Browse Jobs
            </Link>
            <Link href="/companies" className="rounded-full px-3 py-1.5 hover:text-[#289E73] hover:bg-slate-50 transition-colors">
              Verified Companies
            </Link>
            <Link href="/register?role=EMPLOYER" className="rounded-full px-3 py-1.5 hover:text-[#289E73] hover:bg-slate-50 transition-colors">
              Post a Role
            </Link>
            <Link href="/login" className="rounded-full px-3 py-1.5 hover:text-[#289E73] hover:bg-slate-50 transition-colors">
              Candidate Login
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-[#E2E6EC]/60 pt-6 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Jobify Inc. Accessible WCAG AA Compliant Engineering Platform.</p>
        </div>
      </div>
    </footer>
  );
}
