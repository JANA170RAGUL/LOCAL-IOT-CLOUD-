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
  Layers,
  Key,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import { 
  useDeviceDetailsQuery,
  useDeviceCredentialsQuery,
  useCreateDeviceCredentialMutation,
  useRotateDeviceCredentialMutation,
} from '../features/devices/hooks/useDevices';
import { useLatestTelemetryQuery, useTelemetryStream } from '../features/telemetry/hooks/useTelemetry';
import { DeviceCommandsTab } from './DeviceCommandsTab';
import { DeviceProvisioningTab } from '../features/device-provisioning/components/DeviceProvisioningTab';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

export const DeviceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'telemetry' | 'commands' | 'provisioning'>('overview');

  const { data: device, isLoading, isError, error } = useDeviceDetailsQuery(id ?? '');

  // Device Credentials Hooks
  const { data: credentials } = useDeviceCredentialsQuery(id ?? '');
  const createCredMutation = useCreateDeviceCredentialMutation(id ?? '');
  const rotateCredMutation = useRotateDeviceCredentialMutation(id ?? '');

  const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);

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
          <div className="flex flex-wrap items-center gap-3 p-2 rounded-2xl neu-flat">
            {[
              { id: 'overview', label: 'Hardware Overview', icon: Cpu },
              { id: 'telemetry', label: 'Live Telemetry', icon: Activity },
              { id: 'commands', label: 'Command Console', icon: Terminal },
              { id: 'provisioning', label: 'Provisioning', icon: Radio },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all rounded-xl cursor-pointer ${
                    isActive
                      ? 'neu-pressed text-[#2563EB] font-extrabold scale-98'
                      : 'neu-button text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#2563EB]' : 'text-slate-500'}`} />
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

              {/* Device API Credentials Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <Key className="w-4 h-4 text-[#2563EB]" />
                    <span>Device Credentials & API Key</span>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const res = await createCredMutation.mutateAsync('Primary Key');
                        if (res?.api_key) setNewGeneratedKey(res.api_key);
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    disabled={createCredMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#2563EB] rounded-xl text-xs font-bold transition-all cursor-pointer border border-blue-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{createCredMutation.isPending ? 'Generating...' : 'Generate New Key'}</span>
                  </button>
                </div>

                {/* Display newly generated raw key banner if available */}
                {newGeneratedKey && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> Newly Generated API Key
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(newGeneratedKey);
                          setCopiedKeyId('NEW');
                          setTimeout(() => setCopiedKeyId(null), 2000);
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-sans font-semibold transition-all cursor-pointer shadow-xs"
                      >
                        {copiedKeyId === 'NEW' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKeyId === 'NEW' ? 'Copied!' : 'Copy API Key'}</span>
                      </button>
                    </div>
                    <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 flex items-center justify-between">
                      <span className="font-bold select-all">{showSecretKey ? newGeneratedKey : '••••••••••••••••••••••••••••••••'}</span>
                      <button
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        className="ml-2 text-slate-400 hover:text-white p-1 transition-all cursor-pointer"
                        title={showSecretKey ? 'Hide Secret' : 'Show Secret'}
                      >
                        {showSecretKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-emerald-700">
                      <strong>Usage:</strong> Pass this key in device HTTP headers as <code>X-Device-Key: {newGeneratedKey}</code> or use it as your MQTT password.
                    </p>
                  </div>
                )}

                {/* Credentials List */}
                <div className="space-y-2.5 text-xs">
                  {credentials && credentials.length > 0 ? (
                    credentials.map((cred: any) => (
                      <div key={cred.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{cred.name || 'Device Key'}</span>
                            <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md ${cred.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                              {cred.is_active ? 'ACTIVE' : 'REVOKED'}
                            </span>
                          </div>
                          <p className="font-mono text-slate-500 text-[11px]">Key ID: <span className="font-bold text-slate-700">{cred.key_id}</span></p>
                        </div>

                        {cred.is_active && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(cred.key_id);
                                setCopiedKeyId(cred.id);
                                setTimeout(() => setCopiedKeyId(null), 2000);
                              }}
                              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                              title="Copy Key ID"
                            >
                              {copiedKeyId === cred.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                              <span>{copiedKeyId === cred.id ? 'Copied' : 'Copy ID'}</span>
                            </button>

                            <button
                              onClick={async () => {
                                try {
                                  const rotated = await rotateCredMutation.mutateAsync(cred.id);
                                  if (rotated?.api_key) setNewGeneratedKey(rotated.api_key);
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              disabled={rotateCredMutation.isPending}
                              className="px-3 py-1.5 bg-white border border-amber-200 hover:bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                              title="Rotate Key (Revokes current and generates new API key)"
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                              <span>Rotate Key</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl text-slate-500 text-center font-medium">
                      No active credentials recorded for this device. Click <strong className="text-slate-700">"Generate New Key"</strong> above to create an API key.
                    </div>
                  )}
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

          {/* Tab 4: Provisioning */}
          {activeTab === 'provisioning' && (
            <DeviceProvisioningTab deviceId={device.id} />
          )}

        </div>
      )}
    </div>
  );
};
