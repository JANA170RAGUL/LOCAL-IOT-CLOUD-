import React, { useState } from 'react';
import {
  FileText,
  Table,
  FileSpreadsheet,
  Activity,
  Cpu,
  ShieldAlert,
  Sparkles,
  Radio,
  LayoutDashboard,
  Filter,
  Calendar,





  Search,
  RefreshCw,
  Lock,
  Download,
  Layers
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { reportsApi, ReportFilter } from '@/features/reports/api/reports';
import { HierarchySelector, HierarchySelection } from '@/components/HierarchySelector';
import { useSnackbar } from 'notistack';
import { useLicenseStatus } from '@/features/settings/api/license';

export const Reports = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReportFilter>({});
  const [selection, setSelection] = useState<HierarchySelection>({
    orgId: '',
    tenantId: '',
    projectId: '',
    gatewayId: '',
    deviceId: '',
  });

  const handleHierarchyChange = (newSelection: HierarchySelection) => {
    setSelection(newSelection);
    setFilters((prev) => ({
      ...prev,
      organization_id: newSelection.orgId || undefined,
      tenant_id: newSelection.tenantId || undefined,
      project_id: newSelection.projectId || undefined,
      gateway_id: newSelection.gatewayId || undefined,
      device_id: newSelection.deviceId || undefined,
    }));
  };

  const handleResetFilters = () => {
    setSelection({
      orgId: '',
      tenantId: '',
      projectId: '',
      gatewayId: '',
      deviceId: '',
    });
    setFilters({});
  };

  const { data: licenseStatus } = useLicenseStatus();
  const isLicensed = licenseStatus ? (licenseStatus.status === 'ACTIVE' && licenseStatus.features?.reports) : true;

  const handleGenerate = async (reportType: string, format: string) => {
    const actionKey = `${reportType}-${format}`;
    const emailRecipient = window.prompt("Enter email address to send report (or leave empty to download in browser only):");

    setIsGenerating(actionKey);
    try {
      await reportsApi.exportReport({
        report_type: reportType,
        format: format,
        filters: filters,
        email_to: emailRecipient || undefined
      });
      enqueueSnackbar(`${reportType.toUpperCase()} report generated${emailRecipient ? ' & emailed' : ''}!`, {
        variant: 'success'
      });
    } catch (error) {
      console.error(error);
      enqueueSnackbar(`Exporting ${reportType} report as ${format.toUpperCase()}...`, { variant: 'info' });
    } finally {
      setIsGenerating(null);
    }
  };

  const reportSections = [
    {
      title: 'Telemetry Analytics',
      type: 'telemetry',
      description: 'Granular sensor time-series data, min/max metrics, averages & anomaly logs.',
      badge: 'Live Sensor Feeds',
      icon: Activity,
      iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-200'
    },
    {
      title: 'Device Inventory & Health',
      type: 'devices',
      description: 'Fleet inventory status, firmware versions, connectivity logs & battery diagnostics.',
      badge: 'Hardware Telemetry',
      icon: Cpu,
      iconColor: 'text-purple-600 bg-purple-50 border-purple-200'
    },
    {
      title: 'Security & Alert Logs',
      type: 'alerts',
      description: 'Critical warning incidents, automated resolution times & security audit events.',
      badge: 'Incident Audits',
      icon: ShieldAlert,
      iconColor: 'text-rose-600 bg-rose-50 border-rose-200'
    },
    {
      title: 'Automation Rules Engine',
      type: 'rules',
      description: 'Trigger statistics, condition match ratios, webhook dispatches & rule health.',
      badge: 'Triggers & Logic',
      icon: Sparkles,
      iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    },
    {
      title: 'Gateway Mesh Status',
      type: 'gateways',
      description: 'Edge gateway connectivity, throughput stats, packet drop rates & uptime data.',
      badge: 'Edge Networks',
      icon: Radio,
      iconColor: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      title: 'Executive Dashboard Snapshot',
      type: 'dashboard',
      description: 'Comprehensive high-level summary of platform KPIs, throughput & active assets.',
      badge: 'KPI Executive Brief',
      icon: LayoutDashboard,
      iconColor: 'text-blue-600 bg-blue-50 border-blue-200'
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans text-slate-800 animate-in fade-in duration-300">

      {/* Header */}
      <PageHeader
        title="Reports Engine"
        description="Generate professional PDF, Excel, and CSV analytics reports."
      />

      {/* Filter Parameters Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#2563EB]" />
            <h2 className="text-base font-semibold text-slate-900">
              Report Scope & Filters
            </h2>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Optional parameters
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#2563EB]" /> Select Organization Scope
            </span>
            <HierarchySelector
              selection={selection}
              onChange={handleHierarchyChange}
              maxDepth="device"
              variant="dropdown"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
            {/* Start Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Start Date
              </label>
              <input
                type="date"
                value={filters.start_date || ''}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-4 focus:ring-blue-50 focus:border-[#2563EB] outline-none transition-all"
              />
            </div>

            {/* End Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> End Date
              </label>
              <input
                type="date"
                value={filters.end_date || ''}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-4 focus:ring-blue-50 focus:border-[#2563EB] outline-none transition-all"
              />
            </div>

            {/* Reset Action */}
            <div className="flex items-end">
              <button
                onClick={handleResetFilters}
                className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border border-slate-200 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-slate-500" /> Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* License Warning Banner if restricted */}
      {!isLicensed && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center justify-between text-amber-800 text-sm font-medium">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-600" />
            <span>Reports Engine is operating in evaluation mode. Upgrade license for full access.</span>
          </div>
        </div>
      )}

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportSections.map((section) => {
          const Icon = section.icon;

          return (
            <div
              key={section.type}
              className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Icon & Title Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${section.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {section.title}
                      </h3>
                      <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        {section.badge}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  {section.description}
                </p>
              </div>

              {/* Action Buttons Row with Crisp Light Styling */}
              <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-slate-100">
                {/* PDF */}
                <button
                  onClick={() => handleGenerate(section.type, 'pdf')}
                  disabled={isGenerating !== null}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-300 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-500" />
                  <span>{isGenerating === `${section.type}-pdf` ? 'Generating...' : 'PDF'}</span>
                </button>

                {/* Excel */}
                <button
                  onClick={() => handleGenerate(section.type, 'excel')}
                  disabled={isGenerating !== null}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{isGenerating === `${section.type}-excel` ? 'Generating...' : 'Excel'}</span>
                </button>

                {/* CSV */}
                <button
                  onClick={() => handleGenerate(section.type, 'csv')}
                  disabled={isGenerating !== null}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  <Table className="w-3.5 h-3.5 text-blue-500" />
                  <span>{isGenerating === `${section.type}-csv` ? 'Generating...' : 'CSV'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Reports;
