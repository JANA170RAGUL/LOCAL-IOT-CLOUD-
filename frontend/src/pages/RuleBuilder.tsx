import React, { useState } from 'react';
import {
  Sliders as Tune,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Tag,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Layers,
  ShieldAlert
} from 'lucide-react';
import { HierarchySelector, type HierarchySelection } from '../components/HierarchySelector';
import { RuleForm } from '../features/rules/components/RuleForm';
import { useRulesQuery, useCreateRuleMutation, useUpdateRuleMutation } from '../features/rules/hooks/useRules';
import type { RuleFilterParams, BackendRule } from '../features/rules/types';

export const RuleBuilder: React.FC = () => {
  const [selection, setSelection] = useState<HierarchySelection>({
    orgId: '',
    tenantId: '',
    projectId: '',
    gatewayId: '',
  });

  const selectedProjectId = selection.projectId;
  
  const [filters, setFilters] = useState<RuleFilterParams>({
    page: 1,
    page_size: 10,
  });

  const [activeChip, setActiveChip] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BackendRule | undefined>();

  const { data, isLoading } = useRulesQuery(selectedProjectId, filters);
  const createMutation = useCreateRuleMutation();
  const updateMutation = useUpdateRuleMutation();

  const handleOpenCreate = () => {
    setEditingRule(undefined);
    setFormOpen(true);
  };

  const handleOpenEdit = (rule: BackendRule) => {
    setEditingRule(rule);
    setFormOpen(true);
  };

  const handleFormSubmit = (formData: any) => {
    if (editingRule) {
      updateMutation.mutate({ ruleId: editingRule.id, data: formData });
    } else {
      createMutation.mutate({ projectId: selectedProjectId, data: formData });
    }
  };

  const handleChipClick = (chip: string) => {
    setActiveChip(chip);
    if (chip === 'all') setFilters({ ...filters, enabled: undefined, status: undefined, page: 1 });
    else if (chip === 'enabled') setFilters({ ...filters, enabled: true, status: undefined, page: 1 });
    else if (chip === 'disabled') setFilters({ ...filters, enabled: false, status: undefined, page: 1 });
    else if (chip === 'critical') setFilters({ ...filters, status: 'CRITICAL', page: 1 });
  };

  const rulesList = data?.items || [];
  const totalCount = data?.total || 0;
  const enabledCount = rulesList.filter(r => r.enabled).length;
  const criticalCount = rulesList.filter(r => r.severity === 'CRITICAL' || (r.severity as string) === 'EMERGENCY').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <span>Home</span>
        <span>/</span>
        <span>Monitoring</span>
        <span>/</span>
        <span className="text-[#2563EB] font-bold">Rule Builder</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100 shrink-0">
            <Zap className="w-6 h-6 text-[#2563EB]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Rule Builder
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Automate actions, webhooks, and incident alerts based on live telemetry data.
            </p>
          </div>
        </div>

        <button
          disabled={!selectedProjectId}
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Rule</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Rules */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Automation Rules</span>
            <Zap className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {totalCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Configured telemetry rules
          </p>
        </div>

        {/* Enabled Rules */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Active Triggers</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            {enabledCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Enabled threshold triggers
          </p>
        </div>

        {/* Critical Severity */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Critical Severity</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600">
            {criticalCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            High priority alarm rules
          </p>
        </div>

        {/* Automations Active */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Automations Active</span>
            <Tune className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-600">
            {rulesList.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Active project scope rules
          </p>
        </div>
      </div>

      {/* Hierarchy Selector & Filter Control Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        
        {/* Cascading Hierarchy Selector */}
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#2563EB]" /> Hierarchy Scope Selection
          </div>
          <HierarchySelector
            selection={selection}
            onChange={setSelection}
            maxDepth="project"
            variant="dropdown"
          />
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3 border-t border-slate-100">
          
          {/* Search Input */}
          <div className="sm:col-span-6 relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined, page: 1 })}
              placeholder="Search by code or rule name..."
              className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined, page: 1 })}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">🟢 Active</option>
              <option value="INACTIVE">🔴 Inactive</option>
              <option value="CRITICAL">🔥 Critical</option>
            </select>
          </div>

          {/* Enabled Filter */}
          <div className="sm:col-span-3">
            <select
              value={filters.enabled === true ? 'true' : filters.enabled === false ? 'false' : ''}
              onChange={(e) => {
                const val = e.target.value;
                setFilters({
                  ...filters,
                  enabled: val === 'true' ? true : val === 'false' ? false : undefined,
                  page: 1
                });
              }}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
            >
              <option value="">All Rules</option>
              <option value="true">🟢 Enabled</option>
              <option value="false">🔴 Disabled</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Quick Filter:
          </span>

          {[
            { id: 'all', label: 'All Rules' },
            { id: 'enabled', label: '🟢 Enabled' },
            { id: 'disabled', label: '🔴 Disabled' },
            { id: 'critical', label: '🔥 Critical' },
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

      {/* Select Project Guidance state */}
      {!selectedProjectId && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100">
            <Zap className="w-8 h-8 text-[#2563EB]" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Select a Project
          </h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Navigate the organization hierarchy above to select a project and configure telemetry automation rules.
          </p>
        </div>
      )}

      {/* Main Data Table */}
      {selectedProjectId && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200/90 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Rule Code</th>
                  <th className="py-3.5 px-4">Rule Name</th>
                  <th className="py-3.5 px-4">Condition & Threshold</th>
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 animate-pulse font-medium">
                      Loading automation rules...
                    </td>
                  </tr>
                ) : rulesList.length === 0 ? (
                  /* Empty state inside table */
                  <tr>
                    <td colSpan={6} className="py-16 px-6 text-center">
                      <div className="max-w-sm mx-auto flex flex-col items-center text-center space-y-3">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-200">
                          <Inbox className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">
                          No Rules Found
                        </h3>
                        <p className="text-xs text-slate-500">
                          Create an automation rule to trigger alerts and webhooks when telemetry thresholds are breached.
                        </p>
                        <button
                          onClick={handleOpenCreate}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> Add Rule
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rulesList.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                      
                      {/* Code */}
                      <td className="py-4 px-6">
                        <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-200/80 px-2.5 py-1 rounded-md">
                          {row.code}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-4 px-4 font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors">
                        {row.name}
                      </td>

                      {/* Condition & Threshold */}
                      <td className="py-4 px-4">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md text-xs font-mono text-slate-800">
                          <span className="font-semibold text-indigo-600">{row.condition}</span>
                          <span className="font-bold text-slate-900">{row.threshold}</span>
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase ${
                          row.severity === 'CRITICAL' || (row.severity as string) === 'EMERGENCY'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : row.severity === 'WARNING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {row.severity}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                          row.enabled
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${row.enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {row.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleOpenEdit(row)}
                          title="Edit Rule"
                          className="p-1.5 text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {rulesList.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
              <div>
                Showing <span className="font-bold text-slate-900">{rulesList.length}</span> of <span className="font-bold text-slate-900">{totalCount}</span> rules
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={(filters.page || 1) <= 1}
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-3 py-1 font-medium text-slate-900">
                  Page {filters.page || 1}
                </span>

                <button
                  disabled={rulesList.length < (filters.page_size || 10)}
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {formOpen && (
        <RuleForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
          initialData={editingRule}
          title={editingRule ? 'Edit Rule' : 'Create Rule'}
        />
      )}

    </div>
  );
};
