import React from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Cpu,
  Tag,
  Wifi,
  Network,
  Radio,
  Calendar,
  Clock,
  MapPin,
  FileText
} from 'lucide-react';
import { useGatewayDetailsQuery } from '../features/gateways/hooks/useGateways';

export const GatewayDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: gateway, isLoading, isError, error } = useGatewayDetailsQuery(id ?? '');

  const initials = gateway?.name ? gateway.name.substring(0, 2).toUpperCase() : 'GTW';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Breadcrumb & Back Button */}
      <div>
        <button
          onClick={() => navigate('/gateways')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer mb-4"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Back to Gateways</span>
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Gateway Profile
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Detailed hardware telemetry and connection parameters.
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-400 animate-pulse font-medium shadow-xs">
          Loading gateway details...
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          <p className="font-bold">Error Loading Gateway</p>
          <p className="text-xs">{error?.message || 'Failed to load gateway details.'}</p>
        </div>
      )}

      {/* Detail Content */}
      {gateway && (
        <div className="space-y-6">
          
          {/* Header Banner Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shadow-sm shrink-0">
                {initials}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {gateway.name}
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" /> Code: <span className="font-bold text-slate-700">{gateway.code}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Protocol Badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                <Wifi className="w-3.5 h-3.5 text-blue-500" />
                {gateway.protocol}
              </span>

              {/* Status Badge */}
              <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
                gateway.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : gateway.status === 'TRIAL' || gateway.status === 'INACTIVE'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  gateway.status === 'ACTIVE' ? 'bg-emerald-500' :
                  gateway.status === 'TRIAL' || gateway.status === 'INACTIVE' ? 'bg-amber-500' : 'bg-rose-500'
                }`} />
                {gateway.status}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Identity & Scope */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
                <Cpu className="w-4 h-4 text-[#2563EB]" />
                <span>Identity & Parent Project Scope</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Gateway Code
                  </span>
                  <span className="text-sm font-bold text-[#2563EB] font-mono">
                    {gateway.code}
                  </span>
                </div>

                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Project ID
                  </span>
                  <span className="text-xs font-mono text-slate-700 truncate">
                    {gateway.project_id}
                  </span>
                </div>

                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Physical Location
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {gateway.location || '—'}
                  </span>
                </div>

                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Last Telemetry Sync
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {gateway.last_seen ? new Date(gateway.last_seen).toLocaleString() : 'Never'}
                  </span>
                </div>
              </div>
            </div>

            {/* Connection & Network Specs */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
                <Network className="w-4 h-4 text-[#2563EB]" />
                <span>Connection & Network Specifications</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Network className="w-3 h-3" /> IP Address
                  </span>
                  <span className="text-sm font-bold font-mono text-slate-900">
                    {gateway.ip_address || '—'}
                  </span>
                </div>

                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3 h-3" /> MAC Address
                  </span>
                  <span className="text-sm font-bold font-mono text-slate-900">
                    {gateway.mac_address || '—'}
                  </span>
                </div>

                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Cpu className="w-3 h-3" /> Firmware Version
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {gateway.firmware_version || '—'}
                  </span>
                </div>

                <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Radio className="w-3 h-3" /> MQTT Topic
                  </span>
                  <span className="text-xs font-mono text-indigo-600 truncate">
                    {gateway.mqtt_topic || '—'}
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
              {gateway.description || 'No description provided for this gateway.'}
            </p>
          </div>

        </div>
      )}
    </div>
  );
};
