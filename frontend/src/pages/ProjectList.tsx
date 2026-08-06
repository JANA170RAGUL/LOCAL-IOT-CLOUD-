import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  Layers,
  Eye,
  Pencil,
  Trash2,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Folder
} from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ProjectForm } from '../features/projects/components/ProjectForm';
import {
  useProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} from '../features/projects/hooks/useProjects';
import { useTenantsQuery } from '../features/tenants/hooks/useTenants';
import { useOrganizationsQuery } from '../features/organizations/hooks/useOrganizations';
import type { ProjectSummary } from '../features/projects/types';

export const ProjectList: React.FC = () => {
  const navigate = useNavigate();

  // Selectors state
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState('');

  // Table state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeChip, setActiveChip] = useState<string>('all');

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectSummary | null>(null);

  // Data queries
  const { data: orgsData } = useOrganizationsQuery(1, 200, {});
  
  const { data: tenantsData } = useTenantsQuery(
    selectedOrgId,
    1,
    200,
    {}
  );

  const { data, isLoading, isError, error } = useProjectsQuery(
    selectedTenantId,
    page,
    pageSize,
    { search: search || undefined, status: statusFilter || undefined }
  );

  const createMutation = useCreateProjectMutation(selectedTenantId);
  const updateMutation = useUpdateProjectMutation();
  const deleteMutation = useDeleteProjectMutation();

  const handleFormSubmit = async (values: any) => {
    try {
      if (selectedProject) {
        await updateMutation.mutateAsync({ id: selectedProject.id, data: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      setFormOpen(false);
      setSelectedProject(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleChipClick = (chip: string) => {
    setActiveChip(chip);
    setPage(1);
    if (chip === 'all') setStatusFilter('');
    else if (chip === 'active') setStatusFilter('ACTIVE');
    else if (chip === 'suspended') setStatusFilter('SUSPENDED');
    else if (chip === 'trial') setStatusFilter('TRIAL');
  };

  const projects = data?.items || [];
  const totalProjects = data?.total || 0;
  const activeProjectsCount = projects.filter(p => p.status === 'ACTIVE').length;
  const suspendedProjectsCount = projects.filter(p => p.status === 'SUSPENDED' || p.status === 'EXPIRED').length;
  const selectedTenantName = tenantsData?.items.find(t => t.id === selectedTenantId)?.name || 'None Selected';

  const totalPages = Math.ceil(totalProjects / pageSize) || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Light Enterprise Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100 shrink-0">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Projects
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage projects containing gateways and IoT assets.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (!selectedTenantId) return;
            setSelectedProject(null);
            setFormOpen(true);
          }}
          disabled={!selectedTenantId}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Projects</span>
            <Folder className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {totalProjects}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Projects in selected tenant
          </p>
        </div>

        {/* Active Projects */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Active Projects</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            {activeProjectsCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Operating normally
          </p>
        </div>

        {/* Suspended Projects */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Suspended</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600">
            {suspendedProjectsCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Restricted projects
          </p>
        </div>

        {/* Selected Tenant */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Selected Tenant</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-lg font-bold text-purple-600 truncate">
            {selectedTenantName}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Current tenant context
          </p>
        </div>
      </div>

      {/* Filter Control Card with Cascading Selectors */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          {/* Organization Selector */}
          <div className="sm:col-span-3 relative flex items-center">
            <Building2 className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={selectedOrgId}
              onChange={(e) => {
                setSelectedOrgId(e.target.value);
                setSelectedTenantId('');
                setPage(1);
              }}
              className="w-full h-10 pl-10 pr-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
            >
              <option value="">— Select Organization —</option>
              {orgsData?.items.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tenant Selector (Cascading) */}
          <div className="sm:col-span-3 relative flex items-center">
            <Layers className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              disabled={!selectedOrgId}
              value={selectedTenantId}
              onChange={(e) => {
                setSelectedTenantId(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 pl-10 pr-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer disabled:opacity-50"
            >
              <option value="">— Select Tenant —</option>
              {tenantsData?.items.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="sm:col-span-3 relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              disabled={!selectedTenantId}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search project code, name..."
              className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all disabled:opacity-50"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              disabled={!selectedTenantId}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); setActiveChip(''); }}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer disabled:opacity-50"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">🟢 Active</option>
              <option value="TRIAL">🟠 Trial</option>
              <option value="INACTIVE">🟠 Inactive</option>
              <option value="SUSPENDED">🔴 Suspended</option>
              <option value="EXPIRED">🔴 Expired</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Chips */}
        {selectedTenantId && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Quick Filter:
            </span>

            {[
              { id: 'all', label: 'All Projects' },
              { id: 'active', label: '🟢 Active' },
              { id: 'trial', label: '🟠 Trial' },
              { id: 'suspended', label: '🔴 Suspended' },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => handleChipClick(chip.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeChip === chip.id
                    ? 'bg-[#2563EB] text-white shadow-2xs font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Prompt when no Tenant is selected */}
      {!selectedTenantId && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-16 text-center shadow-xs">
          <div className="max-w-sm mx-auto flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Select a Tenant
            </h3>
            <p className="text-xs text-slate-500">
              Choose an organization and a tenant from the dropdowns above to load its projects.
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {selectedTenantId && isError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-3">
          <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <div>
            <p className="font-bold">Error Loading Projects</p>
            <p className="text-xs">{error?.message || 'Failed to fetch projects for the selected tenant.'}</p>
          </div>
        </div>
      )}

      {/* Data Table */}
      {selectedTenantId && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200/90 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Project Name</th>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400 animate-pulse font-medium">
                      Loading projects data...
                    </td>
                  </tr>
                ) : projects.length === 0 ? (
                  /* Empty State */
                  <tr>
                    <td colSpan={4} className="py-16 px-6 text-center">
                      <div className="max-w-sm mx-auto flex flex-col items-center text-center space-y-3">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-200">
                          <Inbox className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">
                          No projects found
                        </h3>
                        <p className="text-xs text-slate-500">
                          Create a project for this tenant to get started.
                        </p>
                        <button
                          onClick={() => {
                            setSelectedProject(null);
                            setFormOpen(true);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> Create Project
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  projects.map((p) => {
                    const initials = p.name.substring(0, 2).toUpperCase();

                    return (
                      <tr 
                        key={p.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Project Name */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                              {initials}
                            </div>
                            <div className="font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors">
                              {p.name}
                            </div>
                          </div>
                        </td>

                        {/* Code */}
                        <td className="py-4 px-4 font-mono text-xs">
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200">
                            {p.code}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : p.status === 'TRIAL' || p.status === 'INACTIVE'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${
                              p.status === 'ACTIVE' ? 'bg-emerald-500' :
                              p.status === 'TRIAL' || p.status === 'INACTIVE' ? 'bg-amber-500' : 'bg-rose-500'
                            }`} />
                            {p.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/projects/${p.id}`)}
                              title="View Project Details"
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => { setSelectedProject(p as any); setFormOpen(true); }}
                              title="Edit Project"
                              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setDeleteTarget(p)}
                              title="Delete Project"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {projects.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>Showing</span>
                <span className="font-bold text-slate-900">
                  {Math.min((page - 1) * pageSize + 1, totalProjects)}
                </span>
                <span>to</span>
                <span className="font-bold text-slate-900">
                  {Math.min(page * pageSize, totalProjects)}
                </span>
                <span>of</span>
                <span className="font-bold text-slate-900">{totalProjects}</span>
                <span>results</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span>Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                    className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-900 outline-none cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <span className="px-3 py-1 font-medium text-slate-900">
                    Page {page} of {totalPages}
                  </span>

                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Project Form Modal */}
      <ProjectForm
        open={formOpen}
        project={selectedProject as any}
        submitting={createMutation.isPending || updateMutation.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Project"
        message={
          <>
            Are you sure you want to deactivate <strong>{deleteTarget?.name}</strong>? This will impact all associated gateways and devices.
          </>
        }
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default ProjectList;
