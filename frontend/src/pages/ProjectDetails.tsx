import React from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  FolderKanban,
  Tag,
  Layers,
  Calendar,
  FileText
} from 'lucide-react';
import { useProjectDetailsQuery } from '../features/projects/hooks/useProjects';

export const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading, isError, error } = useProjectDetailsQuery(id ?? '');

  const initials = project?.name ? project.name.substring(0, 2).toUpperCase() : 'PRJ';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Back Button & Page Header */}
      <div>
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer mb-4"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Back to Projects</span>
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Project Profile
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Detailed view of the project configuration and gateway scope.
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-400 animate-pulse font-medium shadow-xs">
          Loading project details...
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          <p className="font-bold">Error Loading Project</p>
          <p className="text-xs">{error?.message || 'Failed to load project details.'}</p>
        </div>
      )}

      {/* Project Detail Content */}
      {project && (
        <div className="space-y-6">
          
          {/* Header Banner Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white font-extrabold text-lg flex items-center justify-center shadow-sm shrink-0">
                {initials}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {project.name}
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" /> Code: <span className="font-bold text-slate-700">{project.code}</span>
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
              project.status === 'ACTIVE'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : project.status === 'TRIAL' || project.status === 'INACTIVE'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                project.status === 'ACTIVE' ? 'bg-emerald-500' :
                project.status === 'TRIAL' || project.status === 'INACTIVE' ? 'bg-amber-500' : 'bg-rose-500'
              }`} />
              {project.status}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Project Identity & Scope */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
                <Tag className="w-4 h-4 text-[#2563EB]" />
                <span>Project Identity & Parent Scope</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Project Code
                  </span>
                  <span className="text-sm font-bold text-[#2563EB] font-mono">
                    {project.code}
                  </span>
                </div>

                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Layers className="w-3 h-3" /> Parent Tenant ID
                  </span>
                  <span className="text-xs font-mono text-slate-700 truncate">
                    {project.tenant_id}
                  </span>
                </div>
              </div>
            </div>

            {/* Audit & Timestamps */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
                <Calendar className="w-4 h-4 text-[#2563EB]" />
                <span>Audit & Timestamps</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Created
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {new Date(project.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Last Updated
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {new Date(project.updated_at).toLocaleString()}
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
              {project.description || 'No description provided for this project.'}
            </p>
          </div>

        </div>
      )}
    </div>
  );
};
