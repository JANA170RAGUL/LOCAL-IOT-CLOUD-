import React from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Building2,
  Tag,
  Mail,
  Phone,
  Globe,
  Clock,
  DollarSign,
  Calendar,
  Award,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Shield,
  Layers
} from 'lucide-react';
import { useOrganizationQuery } from '../features/organizations/hooks/useOrganizations';

export const OrganizationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: org, isLoading, isError, error } = useOrganizationQuery(id || '');

  const initials = org?.name ? org.name.substring(0, 2).toUpperCase() : 'ORG';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Back Button & Page Header */}
      <div>
        <button
          onClick={() => navigate('/organizations')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer mb-4"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Back to Organizations</span>
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Organization Profile
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Detailed metadata configuration for this workspace.
            </p>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-400 animate-pulse font-medium shadow-xs">
          Loading organization details...
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          <p className="font-bold">Error Loading Organization</p>
          <p className="text-xs">{error?.message || 'Something went wrong.'}</p>
        </div>
      )}

      {/* Detail card */}
      {org && (
        <div className="space-y-6">
          
          {/* Header Banner Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shadow-sm shrink-0">
                {initials}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {org.name}
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" /> Code: <span className="font-bold text-slate-700">{org.code}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Status Badge */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                org.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : org.status === 'TRIAL' || org.status === 'INACTIVE'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  org.status === 'ACTIVE' ? 'bg-emerald-500' :
                  org.status === 'TRIAL' || org.status === 'INACTIVE' ? 'bg-amber-500' : 'bg-rose-500'
                }`} />
                {org.status}
              </span>

              {/* License Tier Badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Award className="w-3.5 h-3.5 text-indigo-600" />
                {org.license_type}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Identity & Contact Info Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
                <Mail className="w-4 h-4 text-[#2563EB]" />
                <span>Identity & Contact Details</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Organization Code
                  </span>
                  <span className="text-sm font-bold text-[#2563EB] font-mono">
                    {org.code}
                  </span>
                </div>

                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Contact Email
                  </span>
                  <a href={`mailto:${org.email}`} className="text-sm font-medium text-slate-900 hover:text-[#2563EB] transition-colors">
                    {org.email}
                  </a>
                </div>

                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Contact Phone
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {org.phone || '—'}
                  </span>
                </div>

                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Website
                  </span>
                  {org.website ? (
                    <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[#2563EB] hover:underline">
                      {org.website}
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-slate-400">—</span>
                  )}
                </div>
              </div>
            </div>

            {/* System & Regional Settings Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
                <Globe className="w-4 h-4 text-[#2563EB]" />
                <span>System & Regional Settings</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Timezone / Language
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {org.timezone} / {org.language ? org.language.toUpperCase() : 'EN'}
                  </span>
                </div>

                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Currency
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {org.currency}
                  </span>
                </div>

                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Created At
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {new Date(org.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Last Updated
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {new Date(org.updated_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Description Section Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
              <FileText className="w-4 h-4 text-[#2563EB]" />
              <span>Description</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {org.description || 'No description provided for this organization.'}
            </p>
          </div>

        </div>
      )}
    </div>
  );
};
