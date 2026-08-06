import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Activity as SensorsIcon,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Radio,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Layers,
  Gauge
} from 'lucide-react';
import { HierarchySelector } from '../components/HierarchySelector';
import type { HierarchySelection } from '../components/HierarchySelector';
import { SensorForm } from '../features/sensors/components/SensorForm';
import { SensorType } from '../features/sensors/types';
import {
  useSensorsQuery,
  useCreateSensorMutation,
  useUpdateSensorMutation,
  useDeleteSensorMutation,
} from '../features/sensors/hooks/useSensors';
import type { SensorSummary } from '../features/sensors/types';

export const SensorList: React.FC = () => {
  const navigate = useNavigate();

  // Hierarchy Selection
  const [selection, setSelection] = useState<HierarchySelection>({
    orgId: '',
    tenantId: '',
    projectId: '',
    gatewayId: '',
    deviceId: '',
  });

  // Table state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [activeChip, setActiveChip] = useState<string>('all');

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<SensorSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SensorSummary | null>(null);

  const { data, isLoading, isError, error } = useSensorsQuery(
    selection.deviceId ?? '',
    page,
    pageSize,
    { search: search || undefined, status: statusFilter || undefined, sensor_type: (typeFilter as SensorType) || undefined }
  );

  const createMutation = useCreateSensorMutation(selection.deviceId ?? '');
  const updateMutation = useUpdateSensorMutation();
  const deleteMutation = useDeleteSensorMutation();

  const handleHierarchyChange = (newSelection: HierarchySelection) => {
    setSelection(newSelection);
    setPage(1);
  };

  const handleFormSubmit = async (values: any) => {
    try {
      if (selectedSensor) {
        await updateMutation.mutateAsync({ id: selectedSensor.id, data: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      setFormOpen(false);
      setSelectedSensor(null);
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
    if (chip === 'all') { setStatusFilter(''); setTypeFilter(''); }
    else if (chip === 'active') { setStatusFilter('ACTIVE'); setTypeFilter(''); }
    else if (chip === 'inactive') { setStatusFilter('INACTIVE'); setTypeFilter(''); }
  };

  const sensorsList = data?.items || [];
  const totalCount = data?.total || 0;
  const activeCount = sensorsList.filter(s => s.status === 'ACTIVE').length;
  const inactiveCount = sensorsList.filter(s => s.status === 'INACTIVE' || s.status === 'SUSPENDED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <span>Home</span>
        <span>/</span>
        <span>Infrastructure & Devices</span>
        <span>/</span>
        <span className="text-[#2563EB] font-bold">Sensors</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100 shrink-0">
            <SensorsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Sensors
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage data collection telemetry endpoints and payload units on your devices.
            </p>
          </div>
        </div>

        <button
          disabled={!selection.deviceId}
          onClick={() => {
            if (!selection.deviceId) return;
            setSelectedSensor(null);
            setFormOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Sensor</span>
        </button>
      </div>

      {/* KPI Analytics Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sensors */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Sensors</span>
            <SensorsIcon className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {totalCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Registered device endpoints
          </p>
        </div>

        {/* Active Telemetry */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Active Telemetry</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            {activeCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Streaming sensor metrics
          </p>
        </div>

        {/* Metric Types */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Metric Categories</span>
            <Gauge className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-600">
            {Object.keys(SensorType).length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Configured telemetry types
          </p>
        </div>

        {/* Disabled / Inactive */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Inactive / Suspended</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600">
            {inactiveCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Disabled telemetry keys
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
          <HierarchySelector selection={selection} onChange={handleHierarchyChange} maxDepth="device" variant="dropdown" />
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3 border-t border-slate-100">
          
          {/* Search Input */}
          <div className="sm:col-span-6 relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by code or sensor name..."
              className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); setActiveChip(''); }}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">🟢 Active</option>
              <option value="INACTIVE">🟠 Inactive</option>
              <option value="SUSPENDED">🔴 Suspended</option>
              <option value="TRIAL">🟠 Trial</option>
              <option value="EXPIRED">🔴 Expired</option>
            </select>
          </div>

          {/* Sensor Type Filter */}
          <div className="sm:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); setActiveChip(''); }}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
            >
              <option value="">All Sensor Types</option>
              {Object.values(SensorType).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Quick Filter:
          </span>

          {[
            { id: 'all', label: 'All Sensors' },
            { id: 'active', label: '🟢 Active' },
            { id: 'inactive', label: '🔴 Inactive' },
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

      {/* Select Device Guidance state */}
      {!selection.deviceId && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100">
            <SensorsIcon className="w-8 h-8 text-[#2563EB]" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Select a Device
          </h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Navigate the organization hierarchy above to select a device and manage attached telemetry sensors.
          </p>
        </div>
      )}

      {/* Error state */}
      {selection.deviceId && isError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          <p className="font-bold">Error Loading Sensors</p>
          <p className="text-xs">{error?.message || 'Failed to load sensors.'}</p>
        </div>
      )}

      {/* Main Data Table */}
      {selection.deviceId && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200/90 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Sensor Code</th>
                  <th className="py-3.5 px-4">Sensor Name</th>
                  <th className="py-3.5 px-4">Metric Type</th>
                  <th className="py-3.5 px-4">Unit</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 animate-pulse font-medium">
                      Loading sensors data...
                    </td>
                  </tr>
                ) : sensorsList.length === 0 ? (
                  /* Empty state inside table */
                  <tr>
                    <td colSpan={6} className="py-16 px-6 text-center">
                      <div className="max-w-sm mx-auto flex flex-col items-center text-center space-y-3">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-200">
                          <Inbox className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">
                          No sensors found
                        </h3>
                        <p className="text-xs text-slate-500">
                          Register a new telemetry sensor endpoint under this device.
                        </p>
                        <button
                          onClick={() => {
                            setSelectedSensor(null);
                            setFormOpen(true);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> New Sensor
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sensorsList.map((row) => (
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

                      {/* Metric Type */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                          <Radio className="w-3 h-3 text-indigo-500" />
                          {row.sensor_type}
                        </span>
                      </td>

                      {/* Unit */}
                      <td className="py-4 px-4">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                          {row.unit || '—'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                          row.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : row.status === 'TRIAL' || row.status === 'INACTIVE'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            row.status === 'ACTIVE' ? 'bg-emerald-500' :
                            row.status === 'TRIAL' || row.status === 'INACTIVE' ? 'bg-amber-500' : 'bg-rose-500'
                          }`} />
                          {row.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/sensors/${row.id}`)}
                            title="View Sensor Details"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => { setSelectedSensor(row); setFormOpen(true); }}
                            title="Edit Sensor"
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeleteTarget(row)}
                            title="Delete Sensor"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {sensorsList.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
              <div>
                Showing <span className="font-bold text-slate-900">{sensorsList.length}</span> of <span className="font-bold text-slate-900">{totalCount}</span> sensors
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
                  Page {page}
                </span>
                <button
                  disabled={sensorsList.length < pageSize}
                  onClick={() => setPage(page + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Dialog */}
      <SensorForm
        open={formOpen}
        sensor={selectedSensor as any}
        submitting={createMutation.isPending || updateMutation.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Delete Sensor
            </h3>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete <strong className="text-slate-900">{deleteTarget.name}</strong>?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
