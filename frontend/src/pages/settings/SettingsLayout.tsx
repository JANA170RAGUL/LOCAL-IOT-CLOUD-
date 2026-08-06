import React, { useState } from 'react';
import {
  Settings,
  Radio,
  Mail,
  Palette,
  Key,
  Database,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Cpu,
  Lock,
  Globe,
  Save,
  Clock,
  DollarSign,
  ChevronRight
} from 'lucide-react';
import GeneralSettingsForm from './components/GeneralSettingsForm';
import MQTTConfigForm from './components/MQTTConfigForm';
import EmailConfigForm from './components/EmailConfigForm';
import AuditLogTable from './components/AuditLogTable';
import HealthDashboard from './components/HealthDashboard';
import LicenseDashboard from './components/LicenseDashboard';

const tabs = [
  { id: 'general', name: 'General Information', icon: Settings, desc: 'Instance & localization' },
  { id: 'mqtt', name: 'MQTT Broker', icon: Radio, desc: 'Pub/Sub telemetry port' },
  { id: 'email', name: 'SMTP Mailer', icon: Mail, desc: 'Notifications & alerts' },
  { id: 'branding', name: 'Portal Branding', icon: Palette, desc: 'Theme & logos' },
  { id: 'license', name: 'License Status', icon: Key, desc: 'Tier & capabilities' },
  { id: 'backup', name: 'Database Backup', icon: Database, desc: 'Exports & snapshots' },
  { id: 'audit', name: 'Audit Logs', icon: ShieldCheck, desc: 'Security event logs' },
  { id: 'health', name: 'System Health', icon: Activity, desc: 'CPU, RAM & disk' },
];

export default function SettingsLayout() {
  const [activeTab, setActiveTab] = useState('general');

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettingsForm />;
      case 'mqtt':
        return <MQTTConfigForm />;
      case 'email':
        return <EmailConfigForm />;
      case 'audit':
        return <AuditLogTable />;
      case 'health':
        return <HealthDashboard />;
      case 'license':
        return <LicenseDashboard />;
      default:
        return (
          <div className="p-12 text-center text-slate-400 font-medium">
            This settings module is under construction.
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <span>Home</span>
        <span>/</span>
        <span>Administration</span>
        <span>/</span>
        <span className="text-[#2563EB] font-bold">Platform Settings</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100 shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Platform Administration
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage global platform settings, broker configurations, and system health.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* System Status */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>System Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-extrabold text-emerald-600 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            OPERATIONAL
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            All services functioning normally
          </p>
        </div>

        {/* MQTT Broker */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>MQTT Broker</span>
            <Radio className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-extrabold text-blue-600">
            ONLINE :1883
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Telemetry listener connected
          </p>
        </div>

        {/* Active License */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>License Tier</span>
            <Key className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-extrabold text-indigo-600">
            ENTERPRISE
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Unlimited features active
          </p>
        </div>

        {/* Audit Logs */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Audit Logging</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-extrabold text-amber-600">
            ACTIVE
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Security event tracking enabled
          </p>
        </div>
      </div>

      {/* Main Settings Grid (Tabs + Content) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Vertical Tab Bar */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-3 shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">
            Settings Category
          </p>

          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <div className="text-left">
                    <div>{tab.name}</div>
                    <div className={`text-[10px] font-normal ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                      {tab.desc}
                    </div>
                  </div>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-white" />}
              </button>
            );
          })}
        </div>

        {/* Right Active Content Panel */}
        <div className="lg:col-span-9 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          {renderContent()}
        </div>

      </div>

    </div>
  );
}
