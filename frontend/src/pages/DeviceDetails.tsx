import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Cpu,
  Tag,
  Wifi,
  Network,
  Radio,
  Clock,
  Wrench,
  Building,
  Hash,
  Activity,
  FileText,
  Terminal,
  Layers
} from 'lucide-react';
import { useDeviceDetailsQuery } from '../features/devices/hooks/useDevices';
import { useLatestTelemetryQuery, useTelemetryStream } from '../features/telemetry/hooks/useTelemetry';
import { DeviceCommandsTab } from './DeviceCommandsTab';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

export const DeviceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'telemetry' | 'commands'>('overview');

  const { data: device, isLoading, isError, error } = useDeviceDetailsQuery(id ?? '');

  // Live Telemetry
  const { data: telemetry } = useLatestTelemetryQuery(id ?? '');
  useTelemetryStream(id ?? '');

  const initials = device?.name ? device.name.substring(0, 2).toUpperCase() : 'DEV';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Breadcrumb & Back Button */}
      <div>
        <button
          onClick={() => navigate('/devices')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer mb-4"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Back to Devices</span>
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Device Profile
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Hardware configuration, live telemetry metrics, and command controls.
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-400 animate-pulse font-medium shadow-xs">
          Loading device profile...
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          <p className="font-bold">Error Loading Device</p>
          <p className="text-xs">{error?.message || 'Failed to load device details.'}</p>
        </div>
      )}

      {/* Content */}
      {device && (
        <div className="space-y-6">
          
          {/* Header Banner Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shadow-sm shrink-0">
                {initials}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {device.name}
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" /> Code: <span className="font-bold text-slate-700">{device.code}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <Radio className="w-3.5 h-3.5 text-blue-500" />
                {device.device_type ? device.device_type.replace('_', ' ') : 'Device'}
              </span>

              <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
                device.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : device.status === 'TRIAL' || device.status === 'INACTIVE'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  device.status === 'ACTIVE' ? 'bg-emerald-500' :
                  device.status === 'TRIAL' || device.status === 'INACTIVE' ? 'bg-amber-500' : 'bg-rose-500'
                }`} />
                {device.status}
              </span>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-2 pt-2 rounded-2xl border border-slate-200/90 shadow-2xs">
            {[
              { id: 'overview', label: 'Hardware Overview', icon: Cpu },
              { id: 'telemetry', label: 'Live Telemetry', icon: Activity },
              { id: 'commands', label: 'Command Console', icon: Terminal },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                    isActive
                      ? 'border-[#2563EB] text-[#2563EB]'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* General Info */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
                    <Cpu className="w-4 h-4 text-[#2563EB]" />
                    <span>General & Gateway Scope</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                        <Tag className="w-3 h-3" /> Device Code
                      </span>
                      <span className="text-sm font-bold text-[#2563EB] font-mono">
                        {device.code}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                        <Layers className="w-3 h-3" /> Parent Gateway ID
                      </span>
                      <span className="text-xs font-mono text-slate-700 truncate">
                        {device.gateway_id}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Last Telemetry Connection
                      </span>
                      <span className="text-sm font-medium text-slate-900">
                        {device.last_seen ? new Date(device.last_seen).toLocaleString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hardware Specs */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
                    <Wrench className="w-4 h-4 text-[#2563EB]" />
                    <span>Hardware Specifications</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                        <Building className="w-3 h-3" /> Manufacturer
                      </span>
                      <span className="text-sm font-medium text-slate-900">
                        {device.manufacturer || '—'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                        <Wrench className="w-3 h-3" /> Model
                      </span>
                      <span className="text-sm font-medium text-slate-900">
                        {device.model || '—'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                        <Hash className="w-3 h-3" /> Serial Number
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-800">
                        {device.serial_number || '—'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Network Specs & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
                    <Network className="w-4 h-4 text-[#2563EB]" />
                    <span>Network Parameters</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider">IP Address</span>
                      <span className="text-sm font-bold font-mono text-slate-900">{device.ip_address || '—'}</span>
                    </div>
                    <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider">MAC Address</span>
                      <span className="text-sm font-bold font-mono text-slate-900">{device.mac_address || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
                    <FileText className="w-4 h-4 text-[#2563EB]" />
                    <span>Description</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {device.description || 'No description provided.'}
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* Tab 2: Telemetry */}
          {activeTab === 'telemetry' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
                <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>Live Streaming Telemetry Metrics</span>
              </div>

              {(!telemetry || telemetry.length === 0) ? (
                <div className="p-8 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-xl border border-slate-200">
                  No live telemetry points received yet for this device.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {telemetry.map((point) => (
                    <div key={point.sensor_code} className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {point.sensor_code}
                      </div>
                      <div className="text-2xl font-extrabold text-[#2563EB] font-mono">
                        {typeof point.value === 'number' ? Number(point.value).toFixed(2) : String(point.value)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Updated {dayjs(point.timestamp).fromNow()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Commands */}
          {activeTab === 'commands' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
              <DeviceCommandsTab deviceId={device.id} />
            </div>
          )}

        </div>
      )}
    </div>
  );
};
