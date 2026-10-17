import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Wifi,
  ShieldCheck,
  Zap,
  Trash2,
  Save,
  CheckCircle2,
  XCircle,
  Loader2,
  Lock,
  Server,
  Globe,
} from 'lucide-react';
import {
  useDeviceConnectionQuery,
  useCreateConnectionMutation,
  useUpdateConnectionMutation,
  useDeleteConnectionMutation,
  useTestConnectionMutation,
} from '../hooks/useDeviceProvisioning';
import type { ConnectionTestResponse } from '../types';

interface ConnectionConfigurationProps {
  deviceId: string;
}

export const ConnectionConfiguration: React.FC<ConnectionConfigurationProps> = ({ deviceId }) => {
  const { data: connection, isLoading } = useDeviceConnectionQuery(deviceId);
  const createMutation = useCreateConnectionMutation(deviceId);
  const updateMutation = useUpdateConnectionMutation(deviceId);
  const deleteMutation = useDeleteConnectionMutation(deviceId);
  const testMutation = useTestConnectionMutation(deviceId);

  const [connectionType, setConnectionType] = useState('SSH');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState('pi');
  const [authType, setAuthType] = useState('PASSWORD');
  const [credential, setCredential] = useState('');
  const [verifyHostKey, setVerifyHostKey] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResponse | null>(null);

  useEffect(() => {
    if (connection) {
      setConnectionType(connection.connection_type || 'SSH');
      setHost(connection.host || '');
      setPort(String(connection.port || 22));
      setUsername(connection.username || 'pi');
      setAuthType(connection.authentication_type || 'PASSWORD');
      setVerifyHostKey(connection.host_key_verified ?? false);
    }
  }, [connection]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestResult(null);
    const payload = {
      connection_type: connectionType,
      host,
      port: parseInt(port, 10) || 22,
      username,
      authentication_type: authType,
      credential_ref: credential || undefined,
      host_key_verified: verifyHostKey,
    };

    if (connection) {
      await updateMutation.mutateAsync(payload);
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  const handleTest = async () => {
    setTestResult(null);
    try {
      const res = await testMutation.mutateAsync();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.response?.data?.detail || err.message || 'Connection test failed',
      });
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this connection configuration?')) {
      await deleteMutation.mutateAsync();
      setHost('');
      setCredential('');
      setTestResult(null);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-[#2563EB] rounded-xl border border-blue-100">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Step 1 — Connection Configuration</h3>
            <p className="text-xs text-slate-500">Configure remote SSH access credentials for this target device.</p>
          </div>
        </div>

        {connection && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Configured
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-medium">Loading connection profile...</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Connection Type */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" /> Connection Type
              </label>
              <select
                value={connectionType}
                onChange={(e) => setConnectionType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="SSH">SSH (Secure Shell)</option>
              </select>
            </div>

            {/* Host / IP */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-400" /> Host / IP Address
              </label>
              <input
                type="text"
                placeholder="192.168.1.100"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
              />
            </div>

            {/* Port */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Port</label>
              <input
                type="number"
                placeholder="22"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
              />
            </div>

            {/* Username */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Username</label>
              <input
                type="text"
                placeholder="pi"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
              />
            </div>

            {/* Auth Type */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" /> Authentication
              </label>
              <select
                value={authType}
                onChange={(e) => setAuthType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="PASSWORD">Password</option>
                <option value="KEY">SSH Private Key</option>
              </select>
            </div>

            {/* Credential */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">
                {authType === 'PASSWORD' ? 'Password' : 'Key Path / Private Key'}
              </label>
              <input
                type="password"
                placeholder={connection ? '•••••••••••• (Unchanged)' : 'Enter SSH Password'}
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
              />
            </div>

          </div>

          {/* Verify host key checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id={`verifyHostKey-${deviceId}`}
              checked={verifyHostKey}
              onChange={(e) => setVerifyHostKey(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
            />
            <label htmlFor={`verifyHostKey-${deviceId}`} className="font-medium text-slate-700 cursor-pointer">
              Verify host key
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isSaving ? 'Saving...' : 'Save Connection'}</span>
              </button>

              {connection && (
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {testMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-emerald-600" />}
                  <span>{testMutation.isPending ? 'Testing...' : 'Test Connection'}</span>
                </button>
              )}
            </div>

            {connection && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Connection</span>
              </button>
            )}
          </div>
        </form>
      )}

      {/* Test Connection Output Banner */}
      {testResult && (
        <div className={`p-4 rounded-xl border animate-in fade-in ${
          testResult.success
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2 font-bold text-xs">
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>Connection Test {testResult.success ? 'PASSED — Ready' : 'FAILED'}</span>
          </div>
          <p className="text-xs mt-1 font-mono font-medium">{testResult.message}</p>
          {testResult.latency_ms !== undefined && (
            <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
              Latency: {testResult.latency_ms} ms
            </span>
          )}
        </div>
      )}
    </div>
  );
};
