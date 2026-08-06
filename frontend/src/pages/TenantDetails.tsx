import React from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Layers,
  Tag,
  Mail,
  Phone,
  Globe,
  Clock,
  Calendar,
  Building2,
  FileText
} from 'lucide-react';
import { useTenantQuery } from '../features/tenants/hooks/useTenants';

export const TenantDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: tenant, isLoading, isError, error } = useTenantQuery(id ?? '');

  const initials = tenant?.name ? tenant.name.substring(0, 2).toUpperCase() : 'TEN';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Back Button & Page Header */}
      <div>
        <button
          onClick={() => navigate('/tenants')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer mb-4"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Back to Tenants</span>
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Tenant Profile
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Detailed view of tenant configuration and contact details.
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-400 animate-pulse font-medium shadow-xs">
          Loading tenant details...
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          <p className="font-bold">Error Loading Tenant</p>
          <p className="text-xs">{error?.message || 'Failed to load tenant details.'}</p>
        </div>
      )}

      {/* Tenant Detail Content */}
      {tenant && (
        <div className="space-y-6">
          
          {/* Header Banner Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-extrabold text-lg flex items-center justify-center shadow-sm shrink-0">
                {initials}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {tenant.name}
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" /> Code: <span className="font-bold text-slate-700">{tenant.code}</span>
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
              tenant.status === 'ACTIVE'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : tenant.status === 'TRIAL' || tenant.status === 'INACTIVE'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                tenant.status === 'ACTIVE' ? 'bg-emerald-500' :
                tenant.status === 'TRIAL' || tenant.status === 'INACTIVE' ? 'bg-amber-500' : 'bg-rose-500'
              }`} />
              {tenant.status}
            </span>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Identity & Contact Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
                <Mail className="w-4 h-4 text-[#2563EB]" />
                <span>Identity & Parent Org</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Tenant Code
                  </span>
                  <span className="text-sm font-bold text-[#2563EB] font-mono">
                    {tenant.code}
                  </span>
                </div>

                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Organization ID
                  </span>
                  <span className="text-xs font-mono text-slate-700 truncate">
                    {tenant.organization_id}
                  </span>
                </div>

                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Contact Email
                  </span>
                  <a href={`mailto:${tenant.email}`} className="text-sm font-medium text-slate-900 hover:text-[#2563EB] transition-colors">
                    {tenant.email}
                  </a>
                </div>

                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Phone
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {tenant.phone || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Regional & System Details */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
                <Globe className="w-4 h-4 text-[#2563EB]" />
                <span>Regional & System Info</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Website
                  </span>
                  {tenant.website ? (
                    <a href={tenant.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[#2563EB] hover:underline">
                      {tenant.website}
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-slate-400">—</span>
                  )}
                </div>

                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Timezone
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {tenant.timezone}
                  </span>
                </div>

                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Created
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {new Date(tenant.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Last Updated
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {new Date(tenant.updated_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
              <FileText className="w-4 h-4 text-[#2563EB]" />
              <span>Description</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {tenant.description || 'No description provided for this tenant.'}
            </p>
          </div>

        </div>
      )}
    </div>
  );
};
