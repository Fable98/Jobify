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
        <div className="inline-flex items-center gap-2 rounded-full bg-[#E1F5EC] px-3.5 py-1 text-xs font-semibold text-[#1F7D5C] mb-3 border border-[#C3EBDA] shadow-clay-1">
          <Building2 className="h-3.5 w-3.5" />
          <span>Vetted Workplaces</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-heading sm:text-4xl">
          Verified Companies
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-xl">
          Discover top technology workplaces vetted by Jobify for verified identities, authentic salary disclosures, and responsive hiring standards.
        </p>

        {/* Styleguide Recessed Concave Search input */}
        <div className="mt-6 max-w-md relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company name, industry, or location..."
            className="w-full rounded-full bg-[#EFF1F5] border border-[#E2E6EC] shadow-clay-inset py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9FE3C8] transition-all"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-3xl bg-slate-200/80 animate-pulse border border-[#E2E6EC]" />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#E2E6EC] p-12 text-center bg-white shadow-clay-2">
          <Building2 className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <h3 className="text-sm font-bold text-slate-800 font-heading">No companies found</h3>
          <p className="text-xs text-slate-500 mt-1">Try refining your search keyword.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <Link
              key={company.id}
              href={`/companies/${company.slug || company.id}`}
              className="group flex flex-col justify-between rounded-3xl border border-[#E2E6EC] bg-white p-6 shadow-clay-2 hover:shadow-clay-3 hover:border-[#9FE3C8] transition-all duration-300"
            >
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF1F5] text-slate-700 font-bold border border-[#E2E6EC] shadow-clay-inset overflow-hidden shrink-0">
                    {company.logoUrl ? (
                      <img src={company.logoUrl} alt={company.name} className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-6 w-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-base font-bold text-slate-900 font-heading group-hover:text-[#289E73] transition-colors">
                        {company.name}
                      </h2>
                      {company.verified && (
                        <span title="Verified">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#289E73]" />
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
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {company.location || 'Remote'}
                </span>

                <span className="inline-flex items-center gap-1 rounded-full bg-[#E1F5EC] text-[#1F7D5C] px-3 py-1 font-semibold text-[11px] group-hover:bg-[#9FE3C8] transition-colors">
                  View Profile &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
