'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Briefcase, Building2, CheckCircle2, Search, ShieldCheck, Sparkles, TrendingUp, Users } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/jobs?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push('/jobs');
    }
  };
  return (
    <main className="flex-1 bg-surface">
      {/* Hero Section with Styleguide Tactile Grid & Mint Ambient Light */}
      <section className="relative overflow-hidden bg-grid-pattern py-20 sm:py-28 border-b border-[#E2E6EC]">
        {/* Soft radial mint ambient glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(159,227,200,0.35),transparent_70%)]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Styleguide Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#85DAB9] bg-white/90 px-4 py-1.5 text-xs font-semibold text-[#0B2D22] shadow-clay-1 mb-8 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-[#42C093] animate-pulse" />
            Verified Roles &amp; Trusted Employers Only
          </div>

          {/* Typography Scale: Display */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 font-heading max-w-4xl mx-auto leading-[1.12]">
            Where exceptional talent meets{' '}
            <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#289E73] to-[#1F7D5C]">
              extraordinary teams
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Explore thousands of verified engineering, design, and leadership opportunities with transparent salaries and direct employer response.
          </p>

          {/* Styleguide Recessed Concave Search Bar */}
          <div className="mt-10 mx-auto max-w-2xl">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3 p-2 rounded-full bg-white border border-[#E2E6EC] shadow-clay-2">
              <div className="flex items-center gap-3 flex-1 px-4 py-2 w-full">
                <Search className="h-5 w-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search jobs, tech stacks, or companies..."
                  className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#9FE3C8] text-[#0B2D22] font-semibold px-6 py-3 text-sm shadow-clay-btn hover:bg-[#8DE0C2] hover:shadow-clay-btn-hover active:scale-[0.98] border border-[#85DAB9] transition-all"
              >
                <Search className="h-4 w-4" />
                <span>Browse 15+ Open Jobs</span>
              </button>
            </form>
          </div>

          {/* Action Pills & Secondary CTA */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
            <span>Popular:</span>
            {['Frontend', 'Full-Stack', 'Cloud Architect', 'DevOps', 'Product Design'].map((tag) => (
              <Link
                key={tag}
                href={`/jobs?search=${encodeURIComponent(tag)}`}
                className="inline-flex items-center rounded-full bg-white border border-[#E2E6EC] px-3.5 py-1 font-medium text-slate-600 shadow-clay-1 hover:border-[#9FE3C8] hover:text-[#0B2D22] transition-all"
              >
                {tag}
              </Link>
            ))}
          </div>

          <div className="mt-8">
            <Link
              href="/register?role=EMPLOYER"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-[#289E73] transition-colors"
            >
              <Building2 className="h-4 w-4 text-[#289E73]" />
              <span>Hiring talent? Post a Job as Employer &rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Styleguide Feature Cards (Level 2 Elevation with Tactile Insets) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#289E73] bg-[#E1F5EC] px-3.5 py-1.5 rounded-full border border-[#C3EBDA]">
            Tactile Architecture
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
            Built for modern recruitment excellence
          </h2>
          <p className="mt-3 text-slate-600 text-sm leading-relaxed">
            Engineered with strict verification, verified salary disclosures, and an interactive Kanban hiring pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Verified Companies */}
          <div className="group rounded-3xl bg-white border border-[#E2E6EC] p-8 shadow-clay-2 hover:shadow-clay-3 hover:border-[#9FE3C8] transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E1F5EC] text-[#289E73] border border-[#C3EBDA] shadow-clay-1 mb-6 transition-transform group-hover:scale-105">
                <Briefcase className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-heading mb-2">Verified Companies</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Only verified companies can post jobs. No ghost listings, zero spam, and authentic career opportunities from checked organizations.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#289E73]">
              <span>Identity-Vetted</span>
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>

          {/* Card 2: Transparent Salary Ranges */}
          <div className="group rounded-3xl bg-white border border-[#E2E6EC] p-8 shadow-clay-2 hover:shadow-clay-3 hover:border-[#9FE3C8] transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] shadow-clay-1 mb-6 transition-transform group-hover:scale-105">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-heading mb-2">Transparent Compensation</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Upfront salary boundaries with range-overlap search filtering. Know exact benchmarks before investing your time in applications.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#92400E]">
              <span>Real Salary Ranges</span>
              <Sparkles className="h-4 w-4" />
            </div>
          </div>

          {/* Card 3: Interactive Pipeline */}
          <div className="group rounded-3xl bg-white border border-[#E2E6EC] p-8 shadow-clay-2 hover:shadow-clay-3 hover:border-[#9FE3C8] transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] shadow-clay-1 mb-6 transition-transform group-hover:scale-105">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-heading mb-2">Interactive Pipeline</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Multi-stage candidate review via drag-and-drop Kanban boards with instant application telemetry and live candidate status synchronization.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#4F46E5]">
              <span>Live Application FSM</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Styleguide UI Tokens Preview Banner */}
        <div className="mt-16 rounded-3xl bg-white border border-[#E2E6EC] p-8 shadow-clay-2">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-left max-w-lg">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#E1F5EC] border border-[#C3EBDA] px-3.5 py-1 text-xs font-semibold text-[#1F7D5C] mb-3">
                <Sparkles className="h-3.5 w-3.5" />
                Live Demo Experience
              </div>
              <h4 className="text-2xl font-bold text-slate-900 font-heading">
                Ready to find your next career milestone?
              </h4>
              <p className="mt-2 text-sm text-slate-600">
                Join thousands of candidates discovering high-growth engineering, product, and architecture roles.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/jobs"
                className="btn-clay-primary text-sm"
              >
                Explore Directory
              </Link>
              <Link
                href="/register"
                className="btn-clay-secondary text-sm"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
