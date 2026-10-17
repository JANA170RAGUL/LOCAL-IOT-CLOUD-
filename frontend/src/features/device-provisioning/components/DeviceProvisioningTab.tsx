import React from 'react';
import { ConnectionConfiguration } from './ConnectionConfiguration';
import { AgentStatus } from './AgentStatus';
import { HardwareDiscovery } from './HardwareDiscovery';
import { ProvisioningStatus } from './ProvisioningStatus';
import { Radio } from 'lucide-react';

interface DeviceProvisioningTabProps {
  deviceId: string;
}

export const DeviceProvisioningTab: React.FC<DeviceProvisioningTabProps> = ({ deviceId }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-400 animate-pulse" />
            Device Provisioning & Hardware Discovery
          </h2>
          <p className="text-xs text-slate-300">
            Configure remote SSH connection, detect edge daemon, scan attached sensor buses, and execute full device provisioning.
          </p>
        </div>
      </div>

      {/* Step 1: Connection Configuration */}
      <ConnectionConfiguration deviceId={deviceId} />

      {/* Step 2: Agent Status */}
      <AgentStatus deviceId={deviceId} />

      {/* Step 3: Hardware Discovery */}
      <HardwareDiscovery deviceId={deviceId} />

      {/* Step 4: Full Provisioning */}
      <ProvisioningStatus deviceId={deviceId} />

    </div>
  );
};
