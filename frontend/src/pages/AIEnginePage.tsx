import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Brain,
  Search,
  Filter,
  Play,
  FlaskConical,
  Rocket,
  FileText,
  Lock,
  Cpu,
  RefreshCw,
  KeyRound,
  ChevronRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Eye,
  CloudSun,
  Bug,
  Wrench,
  ShieldCheck,
  Building2,
  Truck,
  HeartPulse,
  Flame,
  Check,
  SlidersHorizontal,
  ArrowRight,
  HelpCircle,
  Plus
} from 'lucide-react';
import { useLicenseStatus } from '../features/settings/api/license';
import { ALL_AI_ENGINES, type AIEngineItem } from './AIEnginePageData';

export interface AISuiteOption {
  id: string;
  title: string;
  domain: string;
  icon: React.ElementType;
  color: string;
  badge: string;
  description: string;
  engineCount: number;
}

export const AI_SUITES: AISuiteOption[] = [
  { id: 'Agriculture', title: 'Smart Agriculture AI Suite', domain: 'Agriculture', icon: CloudSun, color: 'emerald', badge: '15 Engines', description: 'Pest forecasting, crop disease detection, soil moisture, yield prediction & automated irrigation.', engineCount: 15 },
  { id: 'Industrial', title: 'Industrial & Manufacturing AI', domain: 'Industrial', icon: Wrench, color: 'indigo', badge: '10 Engines', description: 'Machine health, defect detection, quality inspection, OEE analytics, PPE & worker safety.', engineCount: 10 },
  { id: 'Vision', title: 'Computer Vision & Video AI', domain: 'Vision', icon: Eye, color: 'blue', badge: '8 Engines', description: 'Object detection, image classification, SAM2 segmentation, OCR, ArcFace ID & pose tracking.', engineCount: 8 },
  { id: 'Energy', title: 'Energy & Smart Grid AI', domain: 'Energy', icon: Zap, color: 'amber', badge: '5 Engines', description: 'Smart meter analytics, load forecasting, solar irradiance prediction, battery SOH & grid fault.', engineCount: 5 },
  { id: 'Healthcare', title: 'Healthcare & Patient AI', domain: 'Healthcare', icon: HeartPulse, color: 'rose', badge: '5 Engines', description: 'Vital sign monitoring, 1D-ECG arrhythmia detection, 3D fall detection & MedSAM imaging.', engineCount: 5 },
  { id: 'Smart City', title: 'Smart City & Traffic AI', domain: 'Smart City', icon: Building2, color: 'cyan', badge: '5 Engines', description: 'Traffic video analytics, parking detection, ALPR vehicle OCR, air quality & flood GNN.', engineCount: 5 },
  { id: 'Logistics', title: 'Logistics & Fleet AI', domain: 'Logistics', icon: Truck, color: 'purple', badge: '5 Engines', description: 'Fleet telematics, OR-Tools route optimization, ETA prediction & AGV warehouse planner.', engineCount: 5 },
  { id: 'Generative AI', title: 'GenAI & MLOps Suite', domain: 'Generative AI', icon: Sparkles, color: 'blue', badge: '12 Engines', description: 'Llama-3 LLM chat, RAG knowledge base, Document AI, AutoML, Triton deployment & drift.', engineCount: 12 },
];

export const AIEnginePage: React.FC = () => {
  const navigate = useNavigate();
  const { data: licenseData, isLoading: licenseLoading } = useLicenseStatus();
  const isEnabled = licenseData?.status === 'ACTIVE' || licenseData?.status === 'VALID';

  // Customer Selected Suite State
  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(() => {
    return localStorage.getItem('customer_selected_ai_suite') || null;
  });

  // Modal selector for changing suite
  const [showSuiteSelector, setShowSuiteSelector] = useState<boolean>(!selectedSuiteId);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Save selected suite to storage
  const handleSelectSuite = (suiteId: string) => {
    setSelectedSuiteId(suiteId);
    localStorage.setItem('customer_selected_ai_suite', suiteId);
    setShowSuiteSelector(false);
  };

  // Filtered engines for customer's chosen suite
  const customerEngines = useMemo(() => {
    if (!selectedSuiteId || selectedSuiteId === 'all') return ALL_AI_ENGINES;
    
    if (selectedSuiteId === 'Vision') {
      return ALL_AI_ENGINES.filter(e => e.domain === 'Vision' || e.category.includes('Vision'));
    }

    return ALL_AI_ENGINES.filter(e => e.domain === selectedSuiteId);
  }, [selectedSuiteId]);

  // Search & Status filtering over customer engines
  const filteredEngines = useMemo(() => {
    return customerEngines.filter((engine) => {
      const matchesSearch =
        engine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        engine.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        engine.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        engine.deployment.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === 'All' || engine.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [customerEngines, searchQuery, selectedStatus]);

  const activeSuiteObj = AI_SUITES.find(s => s.id === selectedSuiteId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span>Home</span>
          <span>/</span>
          <span>Intelligence & Automation</span>
          <span>/</span>
          <span className="text-[#2563EB] font-bold">AI Engine Choice</span>
        </div>

        {isEnabled && selectedSuiteId && (
          <button
            onClick={() => setShowSuiteSelector(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Switch Industry AI Suite</span>
          </button>
        )}
      </div>

      {/* Large Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-md shrink-0">
            <Brain className="w-6 h-6 text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                AI Engine Selector
              </h1>
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                isEnabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {isEnabled ? '🟢 ENTERPRISE LICENSED' : '🔒 UNLICENSED ENGINE'}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Select the specific AI Engine domain tailored for your customer IoT workspace.
            </p>
          </div>
        </div>

        {isEnabled && activeSuiteObj && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Active Suite</span>
              <span className="text-xs font-bold text-[#2563EB]">{activeSuiteObj.title}</span>
            </div>
            <span className="text-xs font-mono font-bold bg-[#2563EB] text-white px-2 py-0.5 rounded-md">
              {customerEngines.length} Engines
            </span>
          </div>
        )}
      </div>

      {/* License Gated Lock Screen */}
      {!isEnabled && !licenseLoading && (
        <div className="bg-white rounded-2xl border border-rose-200 p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-rose-500/20 blur-md animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shadow-md">
              <Lock className="w-8 h-8 text-rose-600" />
            </div>
          </div>

          <div className="max-w-md space-y-2">
            <h2 className="text-xl font-bold text-slate-900">
              AI Engines Directory Is Locked
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              An active <strong className="text-slate-900">Vyphera Enterprise License</strong> with AI Telemetry Copilot & Vision Module is required to select and deploy AI engine suites.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-sm w-full text-left space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Machine Hardware Fingerprint</span>
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-xs font-mono font-bold text-rose-600 truncate">
              {licenseData?.current_fingerprint || 'FINGERPRINT-NOT-FOUND'}
            </div>
          </div>

          <button
            onClick={() => navigate('/settings')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>Upload License Key in Settings</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Enabled View: Suite Picker Prompt Screen */}
      {isEnabled && showSuiteSelector && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 shadow-xs space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto border border-blue-100 shadow-2xs">
              <Brain className="w-6 h-6 text-[#2563EB]" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Which AI Engine Suite Do You Need?
            </h2>
            <p className="text-xs text-slate-500">
              Tailor your workspace to display only the relevant domain-specific AI engines for your organization.
            </p>
          </div>

          {/* Industry AI Suites Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {AI_SUITES.map((suite) => {
              const Icon = suite.icon;
              const isSelected = selectedSuiteId === suite.id;

              return (
                <button
                  key={suite.id}
                  onClick={() => handleSelectSuite(suite.id)}
                  className={`p-5 rounded-2xl border text-left flex flex-col justify-between space-y-4 transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-md ring-4 ring-blue-100'
                      : 'bg-white text-slate-800 border-slate-200/90 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-[#2563EB]'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {suite.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold leading-snug">
                      {suite.title}
                    </h3>
                    <p className={`text-[11px] mt-1.5 leading-relaxed ${
                      isSelected ? 'text-blue-100' : 'text-slate-500'
                    }`}>
                      {suite.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100/20 text-xs font-bold">
                    <span>Activate Suite</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Option for All 75 Engines */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <button
              onClick={() => handleSelectSuite('all')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <span>View Full Catalog (All 75 AI Engines)</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      )}

      {/* Enabled View: Loaded Customer Engines Grid */}
      {isEnabled && !showSuiteSelector && selectedSuiteId && (
        <div className="space-y-6">

          {/* KPI Analytics Summary Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Loaded AI Engines</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">{customerEngines.length}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Ready for Training</span>
                <div className="text-2xl font-extrabold text-amber-600 mt-1">{customerEngines.filter(e => e.status === 'Ready').length}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Models</span>
                <div className="text-2xl font-extrabold text-emerald-600 mt-1">{customerEngines.filter(e => e.status === 'Running').length}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Catalog Status</span>
                <div className="text-sm font-extrabold text-[#2563EB] mt-1">Pending Training</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${customerEngines.length} ${activeSuiteObj?.title || 'AI'} engines by name or model...`}
                className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Ready">⚪ Ready for Training</option>
                <option value="Training">🟡 Training</option>
                <option value="Running">🟢 Running</option>
                <option value="Stopped">🔴 Stopped</option>
              </select>

              <button
                onClick={() => setShowSuiteSelector(true)}
                className="h-10 px-4 bg-blue-50 hover:bg-blue-100 text-[#2563EB] rounded-xl text-xs font-bold flex items-center gap-2 border border-blue-200 transition-all cursor-pointer shrink-0"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Customize AI Suite</span>
              </button>
            </div>
          </div>

          {/* Engine Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEngines.map((engine) => (
              <div
                key={engine.id}
                onClick={() => navigate(`/ai-engine/${engine.id}`)}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between space-y-4 group cursor-pointer"
              >
                {/* Card Top Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100 shrink-0 font-extrabold text-xs font-mono group-hover:scale-105 transition-transform">
                      #{engine.id}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors leading-tight">
                        {engine.name}
                      </h3>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {engine.category}
                      </span>
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                    engine.status === 'Running'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : engine.status === 'Training'
                      ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      engine.status === 'Running' ? 'bg-emerald-500' : engine.status === 'Training' ? 'bg-amber-500' : 'bg-slate-400'
                    }`} />
                    {engine.status}
                  </span>
                </div>

                {/* Engine Specifications Metadata Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Model Base</span>
                    <span className="font-mono font-bold text-slate-800 text-[11px] truncate block mt-0.5">{engine.model}</span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Accuracy / mAP</span>
                    <span className="font-mono font-bold text-slate-600 text-[11px] block mt-0.5">{engine.accuracy}</span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Inference Speed</span>
                    <span className="font-mono font-bold text-slate-600 text-[11px] block mt-0.5">{engine.latency}</span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Deployment</span>
                    <span className="font-sans font-semibold text-slate-700 text-[10px] truncate block mt-0.5">{engine.deployment}</span>
                  </div>
                </div>

                {/* Dataset & Training Metadata */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-3">
                  <span className="font-mono font-semibold text-slate-600">{engine.datasetVersion}</span>
                  <span>{engine.lastTrained}</span>
                </div>

                {/* Primary Card Action: Configure Fresh Dedicated Page */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/ai-engine/${engine.id}`);
                  }}
                  className="w-full py-2.5 bg-blue-50 hover:bg-[#2563EB] hover:text-white text-[#2563EB] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-blue-200/80 group/btn shadow-2xs"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Configure Engine & Specs</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
};
