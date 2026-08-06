import React, { useRef, useState } from 'react';
import {
  ShieldCheck,
  Cpu,
  Key,
  UploadCloud,
  Copy,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  User,
  Award,
  Check,
  X
} from 'lucide-react';
import { useLicenseStatus, useUploadLicense } from '../../../features/settings/api/license';
import { format } from 'date-fns';

export default function LicenseDashboard() {
  const { data: license, isLoading, isError, refetch } = useLicenseStatus();
  const uploadMutation = useUploadLicense();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 animate-pulse font-medium">
        Loading license status & machine fingerprint...
      </div>
    );
  }

  if (isError || !license) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
        <div>
          <p className="font-bold">Failed to Load License Status</p>
          <p className="text-xs">Unable to communicate with local licensing daemon.</p>
        </div>
      </div>
    );
  }

  const isActive = license.status === 'ACTIVE';

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await uploadMutation.mutateAsync(file);
        setToastMessage('License uploaded and activated successfully!');
        setTimeout(() => setToastMessage(null), 4000);
        refetch();
      } catch (err: any) {
        setToastMessage(err.response?.data?.detail || 'Failed to upload license file');
        setTimeout(() => setToastMessage(null), 4000);
      }
    }
  };

  const handleCopyFingerprint = () => {
    navigator.clipboard.writeText(license.current_fingerprint);
    setToastMessage('Machine fingerprint copied to clipboard!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* License Overview Cards Grid */}
      <div>
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3 mb-4">
          <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
          <span>License Overview</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Status */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 shadow-2xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] block mb-2">
              Status
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              {license.status}
            </span>
          </div>

          {/* Customer */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 shadow-2xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] block mb-1">
              Registered Customer
            </span>
            <span className="text-sm font-bold text-slate-900 truncate block">
              {license.customer || 'Unregistered Instance'}
            </span>
          </div>

          {/* Plan */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 shadow-2xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] block mb-1">
              License Plan
            </span>
            <span className="text-sm font-bold text-indigo-600 flex items-center gap-1">
              <Award className="w-4 h-4 text-indigo-500" />
              {license.plan || 'N/A'}
            </span>
          </div>

          {/* Time Remaining */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 shadow-2xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] block mb-1">
              Time Remaining
            </span>
            <span className={`text-sm font-bold ${
              license.expires_in_days < 30 ? 'text-rose-600' : 'text-slate-900'
            }`}>
              {license.expires_in_days >= 0 ? `${license.expires_in_days} Days Remaining` : 'Expired'}
            </span>
          </div>

        </div>
      </div>

      {/* Machine Information Card */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-200/60 pb-3">
          <Cpu className="w-4 h-4 text-[#2563EB]" />
          <span>Machine Hardware Fingerprint</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Fingerprint Display */}
          <div className="lg:col-span-8 space-y-1.5">
            <span className="text-xs font-semibold text-slate-500">
              Server Machine Fingerprint
            </span>
            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl p-3 shadow-2xs">
              <code className="text-xs font-bold font-mono text-[#2563EB] flex-1 break-all select-all">
                {license.current_fingerprint}
              </code>
              <button
                onClick={handleCopyFingerprint}
                title="Copy Fingerprint"
                className="p-1.5 text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 rounded-lg transition-all cursor-pointer shrink-0"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Provide this exact fingerprint to your sales vendor to issue a valid offline license key.
            </p>
          </div>

          {/* Activation & Date Details */}
          <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-3 pt-2 lg:pt-0 lg:border-l lg:border-slate-200 lg:pl-6">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Activation Status
              </span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                license.machine_match ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  license.machine_match ? 'bg-emerald-500' : 'bg-rose-500'
                }`} />
                {license.machine_match ? 'Fingerprint Matched' : 'Fingerprint Mismatch'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Activation Date
              </span>
              <span className="text-xs font-semibold text-slate-700">
                {license.activated_at ? format(new Date(license.activated_at), 'PPP') : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Matrix & Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Feature Matrix */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
            <Key className="w-4 h-4 text-[#2563EB]" />
            <span>Platform Feature Matrix</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
            {license.features && Object.keys(license.features).length > 0 ? (
              <div className="divide-y divide-slate-200/80">
                {Object.entries(license.features).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between px-4 py-3 text-xs font-medium">
                    <span className="font-semibold text-slate-800 capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    
                    {value === true ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-500" /> Enabled
                      </span>
                    ) : value === false ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <X className="w-3 h-3 text-rose-500" /> Disabled
                      </span>
                    ) : (
                      <span className="font-bold text-[#2563EB] font-mono">
                        {value.toString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 font-medium">
                No features loaded.
              </div>
            )}
          </div>
        </div>

        {/* License File Upload Box */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
            <UploadCloud className="w-4 h-4 text-[#2563EB]" />
            <span>License Upload</span>
          </div>

          <div className="border-2 border-dashed border-slate-300 hover:border-[#2563EB] bg-slate-50/60 hover:bg-blue-50/40 rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center space-y-3 min-h-[220px]">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100 shadow-2xs">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-900">
                Upload License File (`.lic`)
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs">
                Upload your vendor `.lic` file to activate or upgrade your platform capabilities.
              </p>
            </div>

            <input
              type="file"
              accept=".lic"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              onClick={handleUploadClick}
              disabled={uploadMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{uploadMutation.isPending ? 'Uploading License...' : 'Browse License File'}</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
