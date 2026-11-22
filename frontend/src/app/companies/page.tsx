'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Company } from '@/lib/types';
import { Building2, CheckCircle2, Globe, MapPin, Search } from 'lucide-react';

export default function CompaniesPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery<{ companies: Company[] }>({
    queryKey: ['companies', search],
    queryFn: async () => {
      const res = await apiClient<Company[]>(
        `/api/v1/companies${search ? `?search=${encodeURIComponent(search)}` : ''}`
      );
      return { companies: res.data };
    },
  });

  const companies = data?.companies || [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-heading sm:text-4xl">
          Verified Companies
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-xl">
          Discover top technology workplaces vetted by Jobify for verified identities, authentic salary disclosures, and responsive hiring standards.
        </p>

        {/* Search input */}
        <div className="mt-6 max-w-md relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company name, industry, or location..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center bg-white">
          <Building2 className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No companies found</h3>
          <p className="text-xs text-slate-500 mt-1">Try refining your search keyword.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <Link
              key={company.id}
              href={`/companies/${company.slug || company.id}`}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-brand-300 hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold border border-slate-200 overflow-hidden">
                    {company.logoUrl ? (
                      <img src={company.logoUrl} alt={company.name} className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-6 w-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-base font-bold text-slate-900 font-heading group-hover:text-brand-600 transition-colors">
                        {company.name}
                      </h2>
                      {company.verified && (
                        <span title="Verified">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        </span>
                      )}
                    </div>
                    {company.industry && (
                      <span className="text-xs text-slate-500 font-medium">{company.industry}</span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                  {company.description || 'Enterprise technology company.'}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-slate-400" />
                  {company.location || 'Remote'}
                </span>
                <span className="font-semibold text-brand-600">
                  {company._count?.jobs ? `${company._count.jobs} open roles` : 'View Profile'} &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
