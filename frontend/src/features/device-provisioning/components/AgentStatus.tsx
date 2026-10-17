import React from 'react';
import {
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Server,
  HardDrive,
  Loader2,
} from 'lucide-react';
import {
  useDeviceAgentQuery,
  useDetectAgentMutation,
} from '../hooks/useDeviceProvisioning';
import dayjs from 'dayjs';

interface AgentStatusProps {
  deviceId: string;
}

export const AgentStatus: React.FC<AgentStatusProps> = ({ deviceId }) => {
  const { data: agent, isLoading } = useDeviceAgentQuery(deviceId);
  const detectMutation = useDetectAgentMutation(deviceId);

  const handleDetect = async () => {
    try {
      await detectMutation.mutateAsync();
    } catch (err) {
      console.error(err);
    }
  };

  const rawStatus = agent?.service_status || agent?.status || (agent?.installed ? 'SSH_CONNECTED' : 'UNKNOWN');
  const isConnected = rawStatus === 'SSH_CONNECTED' || rawStatus === 'RUNNING' || rawStatus === 'ACTIVE';

  const formatStatusText = (statusStr: string) => {
    switch (statusStr.toUpperCase()) {
      case 'SSH_CONNECTED':
        return 'SSH Connected';
      case 'RUNNING':
        return 'Active Running';
      case 'ACTIVE':
        return 'Active';
      case 'INSTALLED':
        return 'Agent Installed';
      default:
        return statusStr;
    }
  };

  const parsePlatform = (raw?: string) => {
    if (!raw) return 'Linux';
    const match = raw.match(/PRETTY_NAME="([^"]+)"/) || raw.match(/NAME="([^"]+)"/);
    if (match && match[1]) {
      return match[1];
    }
    const firstLine = raw.split('\n')[0].replace(/['"]/g, '').trim();
    return firstLine.length > 35 ? firstLine.substring(0, 35) + '...' : firstLine;
  };

  const formattedPlatform = parsePlatform(agent?.platform);
  const displayStatus = formatStatusText(rawStatus);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Step 2 — LocalIoT Agent Status</h3>
            <p className="text-xs text-slate-500">Detect or deploy the edge daemon on the device.</p>
          </div>
        </div>

        {agent && (
          <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black border ${
            isConnected
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-xs'
              : 'bg-amber-100 text-amber-800 border-amber-300 shadow-xs'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'}`} />
            {displayStatus}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-medium">Checking edge agent...</div>
      ) : agent ? (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Status */}
            <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/80 space-y-1 shadow-xs">
              <span className="text-slate-600 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" /> Status
              </span>
              <span className={`text-sm font-extrabold block ${isConnected ? 'text-emerald-700' : 'text-amber-700'}`}>
                {displayStatus}
              </span>
            </div>

            {/* Version */}
            <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/80 space-y-1 shadow-xs">
              <span className="text-slate-600 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-slate-500" /> Version
              </span>
              <span className="text-sm font-extrabold font-mono text-slate-900 block">
                {agent.agent_version || '1.0.0-edge'}
              </span>
            </div>

            {/* Platform & Architecture */}
            <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/80 space-y-1 shadow-xs">
              <span className="text-slate-600 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-slate-500" /> Platform / Arch
              </span>
              <span className="text-xs font-bold font-mono text-slate-900 block truncate" title={`${formattedPlatform} / ${agent.architecture || 'aarch64'}`}>
                {formattedPlatform} <span className="text-blue-600 font-black">/ {agent.architecture || 'aarch64'}</span>
              </span>
            </div>

            {/* Last Seen */}
            <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/80 space-y-1 shadow-xs">
              <span className="text-slate-600 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> Last Seen
              </span>
              <span className="text-xs font-bold text-slate-900 block">
                {agent.last_seen || agent.last_seen_at ? dayjs(agent.last_seen || agent.last_seen_at).format('DD MMM YYYY HH:mm') : 'Just now'}
              </span>
            </div>

          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleDetect}
              disabled={detectMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {detectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-indigo-600" />}
              <span>{detectMutation.isPending ? 'Detecting...' : 'Detect Agent'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-slate-50 rounded-xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <div>
            <p className="text-xs font-bold text-slate-700">No Edge Agent Detected</p>
            <p className="text-[11px] text-slate-500">Run agent detection to discover or initialize the daemon on the remote target.</p>
          </div>
          <button
            onClick={handleDetect}
            disabled={detectMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            {detectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>{detectMutation.isPending ? 'Detecting...' : 'Detect Agent'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
