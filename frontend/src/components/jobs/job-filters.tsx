'use client';

import React from 'react';
import { Search, MapPin, X, SlidersHorizontal } from 'lucide-react';
import { EmploymentType, ExperienceLevel } from '@/lib/types';

interface JobFiltersProps {
  search: string;
  setSearch: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  employmentType: EmploymentType | '';
  setEmploymentType: (v: EmploymentType | '') => void;
  experienceLevel: ExperienceLevel | '';
  setExperienceLevel: (v: ExperienceLevel | '') => void;
  minSalary: string;
  setMinSalary: (v: string) => void;
  maxSalary: string;
  setMaxSalary: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  onReset: () => void;
}

const EMPLOYMENT_TYPES: { label: string; value: EmploymentType }[] = [
  { label: 'Full Time', value: 'FULL_TIME' },
  { label: 'Remote', value: 'REMOTE' },
  { label: 'Contract', value: 'CONTRACT' },
  { label: 'Part Time', value: 'PART_TIME' },
  { label: 'Internship', value: 'INTERNSHIP' },
];

const EXPERIENCE_LEVELS: { label: string; value: ExperienceLevel }[] = [
  { label: 'Entry Level', value: 'ENTRY' },
  { label: 'Junior', value: 'JUNIOR' },
  { label: 'Mid-Level', value: 'MID' },
  { label: 'Senior', value: 'SENIOR' },
  { label: 'Lead / Staff', value: 'LEAD' },
];

export function JobFilters({
  search,
  setSearch,
  location,
  setLocation,
  employmentType,
  setEmploymentType,
  experienceLevel,
  setExperienceLevel,
  minSalary,
  setMinSalary,
  maxSalary,
  setMaxSalary,
  sortBy,
  setSortBy,
  onReset,
}: JobFiltersProps) {
  const hasActiveFilters =
    Boolean(search) ||
    Boolean(location) ||
    Boolean(employmentType) ||
    Boolean(experienceLevel) ||
    Boolean(minSalary) ||
    Boolean(maxSalary);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-brand-600" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-heading">
            Filter Jobs
          </h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            <X className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      {/* Keyword search */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Role / Keywords
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. Full-Stack, React"
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Location
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. San Francisco, Remote"
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Sort By
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="publishedAt">Most Recent</option>
          <option value="salaryMax">Highest Salary</option>
          <option value="title">Job Title (A-Z)</option>
        </select>
      </div>

      {/* Employment Type */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Employment Type
        </label>
        <div className="flex flex-wrap gap-1.5">
          {EMPLOYMENT_TYPES.map((t) => {
            const isSelected = employmentType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setEmploymentType(isSelected ? '' : t.value)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Experience Level */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Experience Level
        </label>
        <div className="flex flex-wrap gap-1.5">
          {EXPERIENCE_LEVELS.map((lvl) => {
            const isSelected = experienceLevel === lvl.value;
            return (
              <button
                key={lvl.value}
                type="button"
                onClick={() => setExperienceLevel(isSelected ? '' : lvl.value)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {lvl.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Salary Overlap Range */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Salary Range ($ USD / yr)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={minSalary}
            onChange={(e) => setMinSalary(e.target.value)}
            placeholder="Min e.g. 100000"
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <input
            type="number"
            value={maxSalary}
            onChange={(e) => setMaxSalary(e.target.value)}
            placeholder="Max e.g. 200000"
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>
    </div>
  );
}
