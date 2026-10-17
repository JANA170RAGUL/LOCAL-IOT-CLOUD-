import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Rocket,
  ShieldCheck,
  Cpu,
  Layers,
  Terminal,
} from 'lucide-react';
import {
  useStartProvisioningMutation,
  useProvisioningJobQuery,
  useDeviceConnectionQuery,
  useDeviceAgentQuery,
  useDeviceHardwareQuery,
} from '../hooks/useDeviceProvisioning';

interface ProvisioningStatusProps {
  deviceId: string;
}

export const ProvisioningStatus: React.FC<ProvisioningStatusProps> = ({ deviceId }) => {
  const { data: connection } = useDeviceConnectionQuery(deviceId);
  const { data: agent } = useDeviceAgentQuery(deviceId);
  const { data: hardware } = useDeviceHardwareQuery(deviceId);

  const startMutation = useStartProvisioningMutation(deviceId);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const { data: job } = useProvisioningJobQuery(deviceId, activeJobId);

  const handleStartProvisioning = async () => {
    try {
      const newJob = await startMutation.mutateAsync();
      if (newJob?.id) {
        setActiveJobId(newJob.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isConnectionOk = !!connection?.is_active;
  const isAgentOk = agent?.status === 'RUNNING';
  const isHardwareOk = (hardware?.length ?? 0) > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Step 4 — Full Provisioning Workflow</h3>
            <p className="text-xs text-slate-500">Run end-to-end automated setup and health validation.</p>
          </div>
        </div>
      </div>

      {/* Summary Readiness Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          isConnectionOk ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Terminal className={`w-4 h-4 ${isConnectionOk ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>Connection</span>
          </div>
          {isConnectionOk ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <span className="text-[11px] font-semibold text-slate-400">Not Ready</span>
          )}
        </div>

        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          isAgentOk ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Cpu className={`w-4 h-4 ${isAgentOk ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>Agent</span>
          </div>
          {isAgentOk ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <span className="text-[11px] font-semibold text-slate-400">Not Detected</span>
          )}
        </div>

        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          isHardwareOk ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Layers className={`w-4 h-4 ${isHardwareOk ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>Hardware ({hardware?.length ?? 0})</span>
          </div>
          {isHardwareOk ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <span className="text-[11px] font-semibold text-slate-400">Not Scanned</span>
          )}
        </div>

      </div>

      {/* Start Button */}
      <div className="flex justify-center pt-2">
        <button
          onClick={handleStartProvisioning}
          disabled={startMutation.isPending || job?.status === 'RUNNING'}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          {startMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-white" />
          )}
          <span>{startMutation.isPending ? 'Initiating Job...' : 'Start Full Provisioning'}</span>
        </button>
      </div>

      {/* Live Job Progress Display */}
      {job && (
        <div className="p-6 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-5 animate-in fade-in">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Provisioning Job: <span className="font-mono text-emerald-400">{job.id.substring(0, 8)}</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Automated provisioning runner state</p>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
              job.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              job.status === 'FAILED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
              'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse'
            }`}>
              {job.status}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono font-semibold">
              <span className="text-slate-400">Progress</span>
              <span className="text-emerald-400">{job.progress_percent}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${job.progress_percent}%` }}
              />
            </div>
          </div>

          {/* Step Timeline */}
          {job.steps && job.steps.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              {job.steps.map((step, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-slate-800 text-xs">
                  <div className="flex items-center gap-2.5 font-medium">
                    {step.status === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {step.status === 'FAILED' && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                    {step.status === 'RUNNING' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />}
                    {step.status === 'PENDING' && <Clock className="w-4 h-4 text-slate-500 shrink-0" />}
                    
                    <span className={step.status === 'SUCCESS' ? 'text-white font-bold' : 'text-slate-300'}>
                      {step.step_name}
                    </span>
                  </div>

                  {step.message && (
                    <span className="text-[11px] font-mono text-slate-400 truncate max-w-xs">
                      {step.message}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {job.error_message && (
            <div className="p-3 bg-rose-950/80 border border-rose-800/80 text-rose-300 rounded-xl text-xs font-mono">
              <strong>Error:</strong> {job.error_message}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
