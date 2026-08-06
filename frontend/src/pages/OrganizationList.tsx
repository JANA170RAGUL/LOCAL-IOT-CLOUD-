import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Award,
  Users,
  HardDrive,
  Calendar,
  Eye,
  Pencil,
  Trash2,
  ArrowUpDown,
  Layers,
  ShieldCheck,
  Inbox,
  Globe,
  Mail,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  useOrganizationsQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
} from '../features/organizations/hooks/useOrganizations';
import { OrganizationForm } from '../features/organizations/components/OrganizationForm';
import type { Organization } from '../features/organizations/types';

export const OrganizationList: React.FC = () => {
  const navigate = useNavigate();

  // Filter & Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [licenseFilter, setLicenseFilter] = useState('');
  const [activeChip, setActiveChip] = useState<string>('all');

  // Modal States
  const [formOpen, setFormOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Queries & Mutations
  const { data, isLoading, isError, error } = useOrganizationsQuery(page, pageSize, {
    search: search || undefined,
    status: statusFilter || undefined,
    license_type: licenseFilter || undefined,
  });

  const createMutation = useCreateOrganizationMutation();
  const updateMutation = useUpdateOrganizationMutation();
  const deleteMutation = useDeleteOrganizationMutation();

  // Handlers
  const handleCreateClick = () => {
    setSelectedOrg(null);
    setFormOpen(true);
  };

  const handleEditClick = (org: Organization) => {
    setSelectedOrg(org);
    setFormOpen(true);
  };

  const handleDeleteClick = (org: Organization) => {
    setSelectedOrg(org);
    setDeleteConfirmOpen(true);
  };

  const handleFormSubmit = async (values: any) => {
    try {
      if (selectedOrg) {
        await updateMutation.mutateAsync({ id: selectedOrg.id, data: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      setFormOpen(false);
      setSelectedOrg(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedOrg) {
      try {
        await deleteMutation.mutateAsync(selectedOrg.id);
        setDeleteConfirmOpen(false);
        setSelectedOrg(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Quick Filter Chips Handler
  const handleChipClick = (chip: string) => {
    setActiveChip(chip);
    setPage(1);
    if (chip === 'all') {
      setStatusFilter('');
      setLicenseFilter('');
    } else if (chip === 'active') {
      setStatusFilter('ACTIVE');
      setLicenseFilter('');
    } else if (chip === 'suspended') {
      setStatusFilter('SUSPENDED');
      setLicenseFilter('');
    } else if (['Community', 'Professional', 'Enterprise', 'Academic'].includes(chip)) {
      setStatusFilter('');
      setLicenseFilter(chip);
    }
  };

  // KPI Computations from live data
  const orgs = data?.items || [];
  const totalOrgs = data?.total || 0;
  const activeOrgsCount = orgs.filter(o => o.status === 'ACTIVE').length;
  const suspendedOrgsCount = orgs.filter(o => o.status === 'SUSPENDED' || o.status === 'EXPIRED').length;
  const communityCount = orgs.filter(o => o.license_type === 'Community').length;
  const enterpriseCount = orgs.filter(o => o.license_type === 'Enterprise').length;

  const totalPages = Math.ceil(totalOrgs / pageSize) || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Light Enterprise Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Organizations
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage your high-level accounts, licensing, and corporate boundaries.
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateClick}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Organization</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Organizations */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Orgs</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {totalOrgs}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Registered on platform
          </p>
        </div>

        {/* Active Organizations */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Active Orgs</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            {activeOrgsCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Operating normally
          </p>
        </div>

        {/* Suspended / Expired */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Suspended</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600">
            {suspendedOrgsCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Restricted accounts
          </p>
        </div>

        {/* Community Tiers */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Community Tier</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600">
            {communityCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Standard licenses
          </p>
        </div>

        {/* Enterprise Tiers */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Enterprise Tier</span>
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-600">
            {enterpriseCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Premium licenses
          </p>
        </div>
      </div>

      {/* Light Filter Card & Quick Chips */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        
        {/* Search Bar + Select Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search */}
          <div className="sm:col-span-6 relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search code, name, email..."
              className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); setActiveChip(''); }}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">🟢 Active</option>
              <option value="TRIAL">🟠 Trial</option>
              <option value="INACTIVE">🟠 Inactive</option>
              <option value="SUSPENDED">🔴 Suspended</option>
              <option value="EXPIRED">🔴 Expired</option>
            </select>
          </div>

          {/* License Filter Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={licenseFilter}
              onChange={(e) => { setLicenseFilter(e.target.value); setPage(1); setActiveChip(''); }}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
            >
              <option value="">All License Tiers</option>
              <option value="Community">Community</option>
              <option value="Professional">Professional</option>
              <option value="Enterprise">Enterprise</option>
              <option value="Academic">Academic</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Quick Filter:
          </span>

          {[
            { id: 'all', label: 'All Organizations' },
            { id: 'active', label: '🟢 Active' },
            { id: 'suspended', label: '🔴 Suspended' },
            { id: 'Community', label: 'Community' },
            { id: 'Professional', label: 'Professional' },
            { id: 'Enterprise', label: 'Enterprise' },
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
      </div>

      {/* Error Message */}
      {isError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-3">
          <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <div>
            <p className="font-bold">Error Loading Organizations</p>
            <p className="text-xs">{error?.message || 'Failed to fetch organizations from backend.'}</p>
          </div>
        </div>
      )}

      {/* Main Light Data Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/90 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-6">Organization</th>
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">License Tier</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 animate-pulse font-medium">
                    Loading organizations data...
                  </td>
                </tr>
              ) : orgs.length === 0 ? (
                /* Light Empty State Component */
                <tr>
                  <td colSpan={6} className="py-16 px-6 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center text-center space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-200">
                        <Inbox className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        No organizations found
                      </h3>
                      <p className="text-xs text-slate-500">
                        Create a new organization to get started or adjust your filter parameters.
                      </p>
                      <button
                        onClick={handleCreateClick}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Create Organization
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                orgs.map((org) => {
                  const initials = org.name.substring(0, 2).toUpperCase();

                  return (
                    <tr 
                      key={org.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Organization Name & Email */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors">
                              {org.name}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" /> {org.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-4 px-4 font-mono text-xs">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200">
                          {org.code}
                        </span>
                      </td>

                      {/* License Tier */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                          org.license_type === 'Enterprise'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : org.license_type === 'Professional'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : org.license_type === 'Academic'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          <Award className="w-3.5 h-3.5" />
                          {org.license_type}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
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
                      </td>

                      {/* Created Date */}
                      <td className="py-4 px-4 text-xs text-slate-500">
                        {new Date(org.created_at).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/organizations/${org.id}`)}
                            title="View Organization Details"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleEditClick(org)}
                            title="Edit Organization"
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteClick(org)}
                            title="Delete Organization"
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
        {orgs.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>Showing</span>
              <span className="font-bold text-slate-900">
                {Math.min((page - 1) * pageSize + 1, totalOrgs)}
              </span>
              <span>to</span>
              <span className="font-bold text-slate-900">
                {Math.min(page * pageSize, totalOrgs)}
              </span>
              <span>of</span>
              <span className="font-bold text-slate-900">{totalOrgs}</span>
              <span>results</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Page Size Selector */}
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

              {/* Navigation Controls */}
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

      {/* Organization Create/Edit Modal Dialog */}
      <OrganizationForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        organization={selectedOrg}
        submitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Confirm Delete"
        message={
          <>Are you sure you want to delete organization <strong>{selectedOrg?.name}</strong>? This action will soft-deactivate the organization and all its nested tenants.</>
        }
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
};

export default OrganizationList;
