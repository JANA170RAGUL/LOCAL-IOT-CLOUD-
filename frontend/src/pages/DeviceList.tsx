import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Cpu,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Wifi,
  Radio,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Layers,
  Key,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { HierarchySelector } from '../components/HierarchySelector/HierarchySelector';
import type { HierarchySelection } from '../components/HierarchySelector/HierarchySelector';
import { DeviceForm } from '../features/devices/components/DeviceForm';
import {
  useDevicesQuery,
  useCreateDeviceMutation,
  useUpdateDeviceMutation,
  useDeleteDeviceMutation,
} from '../features/devices/hooks/useDevices';
import type { DeviceSummary } from '../features/devices/types';

export const DeviceList: React.FC = () => {
  const navigate = useNavigate();

  // Hierarchy Selection
  const [selection, setSelection] = useState<HierarchySelection>({
    orgId: '',
    tenantId: '',
    projectId: '',
    gatewayId: '',
    deviceId: '',
  });

  // State
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [activeChip, setActiveChip] = useState('all');

  const [formOpen, setFormOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeviceSummary | null>(null);
  
  // API Key modal state
  const [createdDeviceKey, setCreatedDeviceKey] = useState<{ deviceName: string; code: string; apiKey: string } | null>(null);
  const [showCreatedKey, setShowCreatedKey] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);

  const { data, isLoading, isError, error } = useDevicesQuery(
    selection.gatewayId,
    page,
    pageSize,
    { search: search || undefined, status: statusFilter || undefined, device_type: typeFilter || undefined }
  );

  const createMutation = useCreateDeviceMutation(selection.gatewayId);
  const updateMutation = useUpdateDeviceMutation();
  const deleteMutation = useDeleteDeviceMutation();

  const handleHierarchyChange = (newSelection: HierarchySelection) => {
    setSelection(newSelection);
    setPage(1);
  };

  const handleFormSubmit = async (values: any) => {
    try {
      if (selectedDevice) {
        await updateMutation.mutateAsync({ id: selectedDevice.id, data: values });
      } else {
        const newDevice = await createMutation.mutateAsync(values);
        if (newDevice?.api_key) {
          setCreatedDeviceKey({
            deviceName: newDevice.name,
            code: newDevice.code,
            apiKey: newDevice.api_key
          });
        }
      }
      setFormOpen(false);
      setSelectedDevice(null);
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
    else if (chip === 'sensor_node') { setStatusFilter(''); setTypeFilter('sensor_node'); }
    else if (chip === 'inactive') { setStatusFilter('INACTIVE'); setTypeFilter(''); }
  };

  const devicesList = data?.items || [];
  const totalCount = data?.total || 0;
  const activeCount = devicesList.filter(d => d.status === 'ACTIVE').length;
  const sensorNodeCount = devicesList.filter(d => d.device_type === 'sensor_node').length;
  const inactiveCount = devicesList.filter(d => d.status === 'INACTIVE' || d.status === 'SUSPENDED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <span>Home</span>
        <span>/</span>
        <span>Infrastructure & Devices</span>
        <span>/</span>
        <span className="text-[#2563EB] font-bold">Devices</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100 shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Devices
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage end-devices and IoT nodes registered under gateways.
            </p>
          </div>
        </div>

        <button
          disabled={!selection.gatewayId}
          onClick={() => {
            if (!selection.gatewayId) return;
            setSelectedDevice(null);
            setFormOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Device</span>
        </button>
      </div>

      {/* KPI Analytics Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Devices */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Registered Devices</span>
            <Cpu className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {totalCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Total active gateway end-nodes
          </p>
        </div>

        {/* Active Nodes */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Active Nodes</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            {activeCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Operational streaming devices
          </p>
        </div>

        {/* Sensor Nodes */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Sensor Nodes</span>
            <Radio className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-600">
            {sensorNodeCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Data collection endpoints
          </p>
        </div>

        {/* Offline / Suspended */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Offline / Inactive</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600">
            {inactiveCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Maintenance or offline nodes
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
          <HierarchySelector selection={selection} onChange={handleHierarchyChange} maxDepth="gateway" />
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
              placeholder="Search by code or device name..."
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

          {/* Device Type Filter */}
          <div className="sm:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); setActiveChip(''); }}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
            >
              <option value="">All Device Types</option>
              <option value="sensor_node">⚡ Sensor Node</option>
              <option value="actuator">⚙️ Actuator</option>
              <option value="controller">🎛️ Controller</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Quick Filter:
          </span>

          {[
            { id: 'all', label: 'All Devices' },
            { id: 'active', label: '🟢 Active' },
            { id: 'sensor_node', label: '⚡ Sensor Nodes' },
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

      {/* Select Gateway Guidance state */}
      {!selection.gatewayId && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100">
            <Cpu className="w-8 h-8 text-[#2563EB]" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Select a Gateway
          </h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Navigate the organization hierarchy above to select a gateway and inspect registered end-devices.
          </p>
        </div>
      )}

      {/* Error state */}
      {selection.gatewayId && isError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          <p className="font-bold">Error Loading Devices</p>
          <p className="text-xs">{error?.message || 'Failed to load devices.'}</p>
        </div>
      )}

      {/* Main Data Table */}
      {selection.gatewayId && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200/90 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Device Code</th>
                  <th className="py-3.5 px-4">Device Name</th>
                  <th className="py-3.5 px-4">Device Type</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 animate-pulse font-medium">
                      Loading devices data...
                    </td>
                  </tr>
                ) : devicesList.length === 0 ? (
                  /* Empty state inside table */
                  <tr>
                    <td colSpan={5} className="py-16 px-6 text-center">
                      <div className="max-w-sm mx-auto flex flex-col items-center text-center space-y-3">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-200">
                          <Inbox className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">
                          No devices found
                        </h3>
                        <p className="text-xs text-slate-500">
                          Register a new device under this gateway or adjust your search filters.
                        </p>
                        <button
                          onClick={() => {
                            setSelectedDevice(null);
                            setFormOpen(true);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> New Device
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  devicesList.map((row) => (
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

                      {/* Device Type */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                          <Radio className="w-3 h-3 text-slate-500" />
                          {row.device_type ? row.device_type.replace('_', ' ') : '—'}
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
                            onClick={() => navigate(`/devices/${row.id}`)}
                            title="View Device Details"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => { setSelectedDevice(row); setFormOpen(true); }}
                            title="Edit Device"
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeleteTarget(row)}
                            title="Delete Device"
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
          {devicesList.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
              <div>
                Showing <span className="font-bold text-slate-900">{devicesList.length}</span> of <span className="font-bold text-slate-900">{totalCount}</span> devices
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
                  disabled={devicesList.length < pageSize}
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
      <DeviceForm
        open={formOpen}
        device={selectedDevice as any}
        submitting={createMutation.isPending || updateMutation.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Delete Device
            </h3>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete <strong className="text-slate-900">{deleteTarget.name}</strong>? This action will remove all telemetry channels associated with this device.
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

      {/* Device Created API Key Modal */}
      {createdDeviceKey && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Device Created & Key Generated!
                </h3>
                <p className="text-xs text-slate-500">
                  <strong className="text-slate-700">{createdDeviceKey.deviceName}</strong> ({createdDeviceKey.code}) has been registered.
                </p>
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-600" />
                  Registered Device API Key
                </span>
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                  Save Key
                </span>
              </div>

              <div className="relative flex items-center bg-slate-900 rounded-xl p-3 text-white font-mono text-xs border border-slate-800 shadow-inner">
                <span className="truncate pr-16 select-all font-bold tracking-wide text-emerald-400">
                  {showCreatedKey ? createdDeviceKey.apiKey : '••••••••••••••••••••••••••••••••'}
                </span>
                <div className="absolute right-2 flex items-center gap-1">
                  <button
                    onClick={() => setShowCreatedKey(!showCreatedKey)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                    title={showCreatedKey ? 'Hide Key' : 'Show Key'}
                  >
                    {showCreatedKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdDeviceKey.apiKey);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-xs font-sans font-semibold transition-all cursor-pointer"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-amber-800 leading-relaxed">
                <strong>How to use:</strong> Pass this API Key in your physical device's HTTP headers as <code>X-Device-Key: {createdDeviceKey.apiKey}</code> or as your MQTT broker credential to send telemetry.
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setCreatedDeviceKey(null)}
                className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                Done & Continue
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
