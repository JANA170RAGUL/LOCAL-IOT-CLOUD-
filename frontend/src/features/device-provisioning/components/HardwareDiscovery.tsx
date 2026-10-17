import React, { useState } from 'react';
import {
  Layers,
  Search,
  CheckCircle2,
  Cpu,
  Loader2,
  Inbox,
  ShieldCheck,
  X,
  Info,
  Sliders,
  Zap,
  Tag,
  Check,
} from 'lucide-react';
import {
  useDeviceHardwareQuery,
  useDiscoverHardwareMutation,
  useIdentifyHardwareMutation,
} from '../hooks/useDeviceProvisioning';
import type { HardwareComponent } from '../types';

interface HardwareDiscoveryProps {
  deviceId: string;
}

export const HardwareDiscovery: React.FC<HardwareDiscoveryProps> = ({ deviceId }) => {
  const { data: components, isLoading } = useDeviceHardwareQuery(deviceId);
  const discoverMutation = useDiscoverHardwareMutation(deviceId);
  const identifyMutation = useIdentifyHardwareMutation(deviceId);

  const [selectedComponent, setSelectedComponent] = useState<HardwareComponent | null>(null);

  const handleScan = async () => {
    try {
      await discoverMutation.mutateAsync();
    } catch (err) {
      console.error(err);
    }
  };

  const handleIdentify = async () => {
    try {
      await identifyMutation.mutateAsync();
    } catch (err) {
      console.error(err);
    }
  };

  const getInterfaceBadgeClass = (iface: string) => {
    switch (iface.toUpperCase()) {
      case 'I2C':
      case 'I²C':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'GPIO':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'SPI':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'UART':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'USB':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'CAMERA':
      case 'VIDEO':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (statusStr?: string) => {
    const s = (statusStr || 'DISCOVERED').toUpperCase();
    switch (s) {
      case 'IDENTIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Identified
          </span>
        );
      case 'DETECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Detected
          </span>
        );
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Available
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-700 border border-slate-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Unknown / Raw
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Step 3 — Hardware Discovery & Identification</h3>
            <p className="text-xs text-slate-500">Discover physical Linux interfaces and probe attached IoT components via Driver Registry.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Scan Interfaces Button */}
          <button
            onClick={handleScan}
            disabled={discoverMutation.isPending || identifyMutation.isPending}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            {discoverMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 text-slate-600" />}
            <span>{discoverMutation.isPending ? 'Scanning...' : 'Scan Interfaces (L1)'}</span>
          </button>

          {/* Identify Hardware Button */}
          <button
            onClick={handleIdentify}
            disabled={discoverMutation.isPending || identifyMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            {identifyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{identifyMutation.isPending ? 'Identifying...' : 'Identify Hardware (L2)'}</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-medium">Scanning bus interfaces...</div>
      ) : components && components.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200/90">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Interface</th>
                <th className="py-3 px-4">Component / Hardware Model</th>
                <th className="py-3 px-4">Address / Node</th>
                <th className="py-3 px-4">Manufacturer</th>
                <th className="py-3 px-4">Identification Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {components.map((comp, idx) => {
                const iface = comp.component_type || comp.interface_type || 'SYSTEM';
                const compName = comp.name || comp.component_name || 'Generic Component';
                const addr = comp.address || comp.address_or_pin || '—';
                const manufacturer = comp.manufacturer || 'Broadcom / Linux';
                const statusText = comp.discovery_status || comp.status || 'DISCOVERED';

                return (
                  <tr 
                    key={comp.id || idx} 
                    onClick={() => setSelectedComponent(comp)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-extrabold border ${getInterfaceBadgeClass(iface)}`}>
                        {iface}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{compName}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {addr}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {manufacturer}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(statusText)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer">
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 bg-slate-50 rounded-xl text-center space-y-2">
          <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-semibold text-slate-600">No hardware components discovered yet.</p>
          <p className="text-[11px] text-slate-400">Click <strong>"Scan Interfaces"</strong> or <strong>"Identify Hardware"</strong> above to discover connected nodes.</p>
        </div>
      )}

      {/* COMPONENT DETAIL MODAL */}
      {selectedComponent && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[550px] bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    {selectedComponent.name || selectedComponent.component_name}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono font-semibold">
                    {selectedComponent.component_type || selectedComponent.interface_type} • {selectedComponent.address || '—'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedComponent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Info Grid */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Manufacturer</span>
                  <p className="font-extrabold text-slate-900 mt-0.5">{selectedComponent.manufacturer || 'Broadcom / Linux'}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Driver ID</span>
                  <p className="font-extrabold font-mono text-blue-600 mt-0.5">
                    {selectedComponent.metadata_json?.driver_id || 'generic.driver'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Identification Confidence</span>
                  <p className="font-extrabold text-emerald-700 mt-0.5">
                    {Math.round((selectedComponent.metadata_json?.confidence ?? 0.8) * 100)}%
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Status</span>
                  <div className="mt-1">{getStatusBadge(selectedComponent.discovery_status || selectedComponent.status)}</div>
                </div>
              </div>

              {/* Capabilities list */}
              {selectedComponent.metadata_json?.capabilities && selectedComponent.metadata_json.capabilities.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-slate-600 font-bold uppercase text-[10px] block">Hardware Capabilities</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedComponent.metadata_json.capabilities.map((cap: string, cIdx: number) => (
                      <span key={cIdx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <Check className="w-3 h-3 text-blue-600" />
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Metadata JSON */}
              <div className="space-y-1">
                <span className="text-slate-600 font-bold uppercase text-[10px] block">Metadata & Bus Registers</span>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-[140px]">
                  {JSON.stringify(selectedComponent.metadata_json || {}, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedComponent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
