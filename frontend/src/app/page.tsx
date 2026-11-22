import Link from 'next/link';
import { ArrowRight, Briefcase, Building2, ShieldCheck, Search } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/20">
              <Briefcase className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 font-heading">Jobify</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/jobs" className="hover:text-brand-600 transition-colors">Find Jobs</Link>
            <Link href="/companies" className="hover:text-brand-600 transition-colors">Companies</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden bg-slate-900 py-24 sm:py-32 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(255,255,255,0))]" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/80 px-4 py-1.5 text-xs font-medium text-brand-300 mb-8 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Verified Roles & Trusted Employers Only
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl font-heading max-w-4xl mx-auto leading-tight">
              Where exceptional talent meets <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-brand-400 to-indigo-200">extraordinary teams</span>
            </h1>
            <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Explore thousands of verified engineering, design, and leadership opportunities with transparent salaries and direct employer response.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/jobs"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-500 transition-all"
              >
                <Search className="h-4 w-4" /> Browse 15+ Open Jobs
              </Link>
              <Link
                href="/register?role=EMPLOYER"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-6 py-3.5 text-base font-semibold text-slate-200 hover:bg-slate-700/80 transition-all"
              >
                <Building2 className="h-4 w-4" /> Post a Job as Employer
              </Link>
            </div>
          </div>
        </section>

        {/* Feature section */}
        <section className="py-20 bg-white border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-2xl border border-slate-200 p-8 shadow-sm hover:border-brand-200 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 mb-6">
                  <Briefcase className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-heading mb-2">Verified Companies</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Only verified companies can post jobs. No spam, no ghost listings, and real applicant status tracking.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-8 shadow-sm hover:border-brand-200 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-6">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-heading mb-2">Transparent Salary Ranges</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Every position features upfront compensation boundaries and structured career experience tiers.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-8 shadow-sm hover:border-brand-200 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-6">
                  <ArrowRight className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-heading mb-2">Interactive Pipeline</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Employers manage applicants via Kanban pipelines, while job seekers receive live application progression updates.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Jobify. Built for production-grade full-stack recruitment.</p>
          <div className="flex gap-6">
            <Link href="/jobs" className="hover:text-slate-900">Jobs</Link>
            <Link href="/login" className="hover:text-slate-900">Sign In</Link>
            <Link href="/register" className="hover:text-slate-900">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
