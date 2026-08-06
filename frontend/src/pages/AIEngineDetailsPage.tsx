import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
  Brain,
  ArrowLeft,
  Play,
  Square,
  Save,
  RefreshCw,
  Cpu,
  Zap,
  ShieldCheck,
  Activity,
  Sliders,
  Database,
  Terminal,
  BellRing,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  Server,
  HardDrive,
  Layers,
  Sparkles,
  ChevronRight,
  SlidersHorizontal,
  Info,
  Check,
  X,
  Code2,
  Radio,
  Clock,
  Rocket,
  FileText,
  UploadCloud
} from 'lucide-react';
import { ALL_AI_ENGINES, type AIEngineItem } from './AIEnginePageData';
import { useLicenseStatus } from '../features/settings/api/license';

export const AIEngineDetailsPage: React.FC = () => {
  const { engineId } = useParams<{ engineId: string }>();
  const navigate = useNavigate();
  const { data: licenseData } = useLicenseStatus();
  const isLicensed = licenseData?.status === 'ACTIVE' || licenseData?.status === 'VALID';

  // Find current engine by ID
  const baseEngine = useMemo(() => {
    const numericId = parseInt(engineId || '1', 10);
    return ALL_AI_ENGINES.find((e) => e.id === numericId) || ALL_AI_ENGINES[0];
  }, [engineId]);

  // Engine state overrides for interactive demo
  const [engineStatus, setEngineStatus] = useState<AIEngineItem['status']>(baseEngine.status);
  const [engineAccuracy, setEngineAccuracy] = useState<string>(baseEngine.accuracy);
  const [engineLatency, setEngineLatency] = useState<string>(baseEngine.latency);
  const [lastTrained, setLastTrained] = useState<string>(baseEngine.lastTrained);
  const [datasetVersion, setDatasetVersion] = useState<string>('v1.0-base');
  const [deploymentTarget, setDeploymentTarget] = useState<string>(baseEngine.deployment);

  // Active workstation tab
  const [activeTab, setActiveTab] = useState<'train' | 'test' | 'deploy' | 'config' | 'inputs' | 'logs'>('train');

  // Training Pipeline State
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingProgress, setTrainingProgress] = useState<number>(0);
  const [trainingEpoch, setTrainingEpoch] = useState<number>(0);
  const [epochsTotal, setEpochsTotal] = useState<number>(50);
  const [selectedDataset, setSelectedDataset] = useState<string>('Custom IoT Telemetry Dataset v1.0');

  // Deployment Pipeline State
  const [isDeploying, setIsDeploying] = useState<boolean>(false);

  // Configuration Form state
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.85);
  const [iouThreshold, setIouThreshold] = useState<number>(0.45);
  const [batchSize, setBatchSize] = useState<number>(8);
  const [precision, setPrecision] = useState<string>('FP16 (TensorRT)');

  // Telemetry stream bindings state
  const [boundDevices, setBoundDevices] = useState<string[]>(['Sensor-Node-01 (Vibration)', 'Telemetry-Stream-North']);
  const [newDeviceName, setNewDeviceName] = useState<string>('');

  // Playground simulator state
  const [testPayload, setTestPayload] = useState<string>(
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        engine_id: baseEngine.id,
        sensor_values: [24.5, 68.2, 1013.2, 0.045],
        raw_stream_active: true,
      },
      null,
      2
    )
  );
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state when engineId changes
  useEffect(() => {
    setEngineStatus(baseEngine.status);
    setEngineAccuracy(baseEngine.accuracy);
    setEngineLatency(baseEngine.latency);
    setLastTrained(baseEngine.lastTrained);
    setDeploymentTarget(baseEngine.deployment);
    setTestResult(null);
    setIsTraining(false);
    setTrainingProgress(0);
  }, [baseEngine]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStartTraining = () => {
    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingEpoch(0);
    setEngineStatus('Training');
    showToast(`Started training model for ${baseEngine.name}...`);

    let progress = 0;
    let epoch = 0;
    const interval = setInterval(() => {
      progress += 10;
      epoch += 5;
      setTrainingProgress(progress);
      setTrainingEpoch(epoch);

      if (progress >= 100) {
        clearInterval(interval);
        setIsTraining(false);
        setEngineStatus('Running');
        setEngineAccuracy('98.6% mAP');
        setEngineLatency('12 ms');
        setLastTrained('Just now');
        setDatasetVersion('v1.2-trained');
        showToast(`🎉 Training Completed! Model ${baseEngine.name} is now Trained & Operational (Accuracy: 98.6% mAP).`);
      }
    }, 400);
  };

  const handleStartDeployment = () => {
    setIsDeploying(true);
    showToast(`Deploying ${baseEngine.name} container to ${deploymentTarget}...`);
    setTimeout(() => {
      setIsDeploying(false);
      setEngineStatus('Running');
      showToast(`🚀 Container artifact successfully deployed to ${deploymentTarget}!`);
    }, 1200);
  };

  const handleSaveConfig = () => {
    showToast(`Configuration saved for ${baseEngine.name}! Hyperparameters updated.`);
  };

  const handleToggleEngine = () => {
    const nextStatus = engineStatus === 'Running' ? 'Stopped' : 'Running';
    setEngineStatus(nextStatus);
    showToast(`Engine ${baseEngine.name} is now ${nextStatus.toUpperCase()}`);
  };

  const handleRunInferenceTest = () => {
    setIsTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setIsTesting(false);
      setTestResult(
        JSON.stringify(
          {
            status: 'SUCCESS',
            engine: baseEngine.name,
            model: baseEngine.model,
            inference_time_ms: engineLatency !== '-' ? parseFloat(engineLatency) : 12,
            confidence_score: (confidenceThreshold * 100).toFixed(1) + '%',
            predictions: [
              { label: `${baseEngine.category} Primary Metric`, score: 0.964, bbox: [120, 45, 340, 290] },
              { label: 'Secondary Parameter Metric', score: 0.882, bbox: [45, 110, 180, 220] }
            ],
            metrics: {
              accuracy_index: engineAccuracy !== 'Not Trained' ? engineAccuracy : 'Untrained Baseline (Simulation)',
              target_hardware: deploymentTarget,
              vram_consumed_mb: 342,
            }
          },
          null,
          2
        )
      );
    }, 600);
  };

  const handleAddDeviceBinding = () => {
    if (!newDeviceName.trim()) return;
    setBoundDevices([...boundDevices, newDeviceName.trim()]);
    setNewDeviceName('');
    showToast(`Device "${newDeviceName}" bound to AI Engine`);
  };

  const handleRemoveDeviceBinding = (name: string) => {
    setBoundDevices(boundDevices.filter((d) => d !== name));
    showToast(`Device binding removed`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Link to="/ai-engine" className="hover:text-[#2563EB] transition-colors">
              AI Engine Directory
            </Link>
            <span>/</span>
            <span className="text-slate-500 font-medium">{baseEngine.domain}</span>
            <span>/</span>
            <span className="text-[#2563EB] font-bold">Engine #{baseEngine.id}</span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => navigate('/ai-engine')}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Back to Engine Directory"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              {baseEngine.name}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${
                engineStatus === 'Running'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : engineStatus === 'Training'
                  ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                  : engineStatus === 'Ready'
                  ? 'bg-blue-50 text-[#2563EB] border-blue-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  engineStatus === 'Running'
                    ? 'bg-emerald-500 animate-pulse'
                    : engineStatus === 'Training'
                    ? 'bg-amber-500 animate-spin'
                    : engineStatus === 'Ready'
                    ? 'bg-[#2563EB]'
                    : 'bg-slate-400'
                }`}
              />
              {engineStatus === 'Ready' ? '⚪ READY FOR TRAINING' : engineStatus}
            </span>
          </div>
        </div>

        {/* Header Quick Controls */}
        <div className="flex items-center gap-3">
          {/* Quick Engine Selector Dropdown */}
          <div className="relative">
            <select
              value={baseEngine.id}
              onChange={(e) => navigate(`/ai-engine/${e.target.value}`)}
              className="h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer shadow-2xs pr-8"
            >
              {ALL_AI_ENGINES.map((e) => (
                <option key={e.id} value={e.id}>
                  #{e.id} - {e.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSaveConfig}
            className="h-10 px-5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-200"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Base Model</span>
          <div className="text-sm font-extrabold text-slate-900 truncate mt-1">{baseEngine.model}</div>
          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">{datasetVersion}</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Accuracy Metric</span>
          <div className="text-sm font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
            {engineAccuracy}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
            {engineAccuracy === 'Not Trained' ? 'Pending Training' : 'Validated'}
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Inference Speed</span>
          <div className="text-sm font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-600" />
            {engineLatency}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
            {engineLatency === '-' ? 'No Run Data' : 'Active Benchmark'}
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Deployment Target</span>
          <div className="text-xs font-extrabold text-slate-800 mt-1 truncate flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-indigo-600" />
            {deploymentTarget}
          </div>
          <span className="text-[11px] text-indigo-600 font-bold mt-0.5 block">Target Configured</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Training Status</span>
          <div className="text-sm font-extrabold text-slate-900 mt-1">{lastTrained}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Custom Pipeline</span>
        </div>
      </div>

      {/* Tabs Navigation Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-2 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'train', label: 'Train Model', icon: Play },
            { id: 'test', label: 'Test Playground', icon: FlaskConical },
            { id: 'deploy', label: 'Deploy Target', icon: Rocket },
            { id: 'config', label: 'Hyperparameters & Tuning', icon: SlidersHorizontal },
            { id: 'inputs', label: 'IoT Stream Bindings', icon: Radio },
            { id: 'logs', label: 'Execution & MLOps Logs', icon: Terminal },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Panels */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        
        {/* =========================================================================
            TAB 1: TRAIN MODEL PIPELINE
            ========================================================================= */}
        {activeTab === 'train' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Train AI Model Workbench</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select dataset, configure training hyperparameters, and train {baseEngine.name}.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">ID #{baseEngine.id}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Training Config Panel */}
              <div className="lg:col-span-2 space-y-5">
                
                {/* Dataset Selector */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Select Training Dataset</span>
                    <Database className="w-4 h-4 text-[#2563EB]" />
                  </label>
                  <select
                    value={selectedDataset}
                    onChange={(e) => setSelectedDataset(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#2563EB]"
                  >
                    <option value="Custom IoT Telemetry Dataset v1.0">Custom IoT Telemetry Dataset v1.0 (Recommended)</option>
                    <option value="Industrial Sensor Logs (50,000 samples)">Industrial Sensor Logs (50,000 samples)</option>
                    <option value="Vision COCO + Custom Annotations">Vision COCO + Custom Annotations</option>
                    <option value="Upload New Custom Dataset ZIP">Upload New Custom Dataset ZIP...</option>
                  </select>
                  <p className="text-[11px] text-slate-500">
                    Training will process samples using transfer learning over base weights ({baseEngine.model}).
                  </p>
                </div>

                {/* Hyperparameters Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Epochs Count</span>
                    <div className="text-base font-extrabold text-slate-900">{epochsTotal} Epochs</div>
                    <span className="text-[11px] text-slate-500">Early stopping at patience=5</span>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Batch Size & LR</span>
                    <div className="text-base font-extrabold text-slate-900">Batch: {batchSize} | LR: 0.001</div>
                    <span className="text-[11px] text-slate-500">AdamW Optimizer</span>
                  </div>
                </div>

                {/* Training Trigger Box */}
                <div className="p-6 border border-blue-200 rounded-2xl bg-blue-50/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Execute Model Training Run</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Click below to start fine-tuning the model weights.
                      </p>
                    </div>

                    <button
                      onClick={handleStartTraining}
                      disabled={isTraining}
                      className="px-6 py-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isTraining ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Training In Progress ({trainingProgress}%)...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-white" />
                          <span>Start Model Training</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Progress Bar */}
                  {isTraining && (
                    <div className="space-y-2 pt-2 animate-in fade-in duration-300">
                      <div className="flex justify-between text-xs font-bold text-slate-800">
                        <span>Epoch {trainingEpoch} / {epochsTotal}</span>
                        <span className="font-mono text-[#2563EB]">{trainingProgress}%</span>
                      </div>
                      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
                          style={{ width: `${trainingProgress}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">
                        [TRAIN] Optimizing loss curve... Loss: {(0.25 - (trainingProgress * 0.002)).toFixed(3)}
                      </p>
                    </div>
                  )}
                </div>

              </div>

              {/* Status & Guidance Sidebar */}
              <div className="space-y-4">
                <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3 shadow-md">
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400 flex items-center justify-between">
                    <span>Training Status</span>
                    <Activity className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{engineStatus}</div>
                    <p className="text-xs text-slate-400 mt-1">
                      {engineAccuracy === 'Not Trained'
                        ? 'No model weights trained yet. Start training to enable predictions.'
                        : 'Model trained & benchmarked successfully.'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-800 text-xs font-mono space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span>Accuracy:</span>
                      <span className="text-cyan-300 font-bold">{engineAccuracy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Latency:</span>
                      <span className="text-emerald-400 font-bold">{engineLatency}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: TEST PLAYGROUND
            ========================================================================= */}
        {activeTab === 'test' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Inference Testing Playground</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Evaluate prediction output, confidence score, and latency on {baseEngine.name}.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input JSON payload editor */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Input Sample Payload (JSON)</span>
                  <Code2 className="w-4 h-4 text-slate-400" />
                </label>
                <textarea
                  rows={10}
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  className="w-full p-3 font-mono text-xs bg-slate-900 text-cyan-300 rounded-xl border border-slate-700 outline-none focus:border-[#2563EB]"
                />
                <button
                  onClick={handleRunInferenceTest}
                  disabled={isTesting}
                  className="w-full py-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing Test Inference...</span>
                    </>
                  ) : (
                    <>
                      <FlaskConical className="w-4 h-4" />
                      <span>Run Test Inference</span>
                    </>
                  )}
                </button>
              </div>

              {/* Output Result JSON Viewer */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Engine Output Response</span>
                  {testResult && <span className="text-xs font-mono text-emerald-600 font-bold">200 OK ({engineLatency !== '-' ? engineLatency : '12 ms'})</span>}
                </label>
                <div className="w-full h-[245px] p-3 font-mono text-xs bg-slate-950 text-emerald-400 rounded-xl border border-slate-800 overflow-y-auto">
                  {testResult ? (
                    <pre className="whitespace-pre-wrap">{testResult}</pre>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center space-y-2">
                      <FlaskConical className="w-8 h-8 opacity-40" />
                      <p className="text-xs">Click "Run Test Inference" to evaluate model predictions</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: DEPLOY TARGET WORKBENCH
            ========================================================================= */}
        {activeTab === 'deploy' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Deployment Target Workbench</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select deployment target hardware node and push compiled container artifacts.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50 space-y-4">
                <label className="text-xs font-bold text-slate-800 block">Select Deployment Target Hardware</label>
                <select
                  value={deploymentTarget}
                  onChange={(e) => setDeploymentTarget(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#2563EB]"
                >
                  <option value="Edge Node">Edge Node (Local Jetson Orin / Industrial IPC)</option>
                  <option value="NVIDIA RTX Cloud">NVIDIA RTX Cloud Cluster</option>
                  <option value="CPU Cluster">CPU Cluster (x86_64 High-Memory Server)</option>
                  <option value="Embedded MCU">Embedded MCU (ESP32-S3 / ARM Cortex-M)</option>
                </select>
                <p className="text-xs text-slate-500">
                  Target environment where container artifact will run.
                </p>

                <button
                  onClick={handleStartDeployment}
                  disabled={isDeploying}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 transition-all"
                >
                  {isDeploying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Deploying Container...</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" />
                      <span>Deploy Model Artifact</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-5 border border-slate-200 rounded-2xl bg-white space-y-3 text-xs">
                <h4 className="font-bold text-slate-800">Deployment Status</h4>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Current Node:</span>
                  <span className="font-bold text-slate-800">{deploymentTarget}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Container Image:</span>
                  <span className="font-mono font-bold text-[#2563EB]">vyphera-{baseEngine.id}:latest</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Health Check:</span>
                  <span className="text-emerald-600 font-bold">🟢 Healthy</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: HYPERPARAMETERS & TUNING
            ========================================================================= */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Engine Tuning & Hyperparameters</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Adjust confidence cutoff, execution batch size, and precision mode.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Confidence Threshold Slider */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">Confidence Cutoff Threshold</label>
                  <span className="text-xs font-mono font-bold text-[#2563EB]">{Math.round(confidenceThreshold * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.99"
                  step="0.01"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                  className="w-full accent-[#2563EB] cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Inferences with confidence below this threshold will be filtered out.
                </p>
              </div>

              {/* IoU / NMS Threshold Slider */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">NMS / IoU Suppression</label>
                  <span className="text-xs font-mono font-bold text-indigo-600">{Math.round(iouThreshold * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={iouThreshold}
                  onChange={(e) => setIouThreshold(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Non-Maximum Suppression threshold for overlapping detections.
                </p>
              </div>

              {/* Batch Size Selection */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <label className="text-xs font-bold text-slate-800 block">Inference Batch Size</label>
                <select
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value, 10))}
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#2563EB]"
                >
                  <option value={1}>1 (Lowest Latency - Stream Mode)</option>
                  <option value={4}>4 (Balanced)</option>
                  <option value={8}>8 (High Throughput)</option>
                  <option value={16}>16 (Batch Telemetry Processing)</option>
                  <option value={32}>32 (Maximum Throughput)</option>
                </select>
              </div>

              {/* Precision Mode Selection */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <label className="text-xs font-bold text-slate-800 block">Precision & Quantization</label>
                <select
                  value={precision}
                  onChange={(e) => setPrecision(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#2563EB]"
                >
                  <option value="FP16 (TensorRT)">FP16 (TensorRT - Recommended)</option>
                  <option value="INT8 Quantized">INT8 Quantized (Ultra Fast)</option>
                  <option value="FP32 Full Precision">FP32 Full Precision (Max Accuracy)</option>
                  <option value="TFLite Micro">TFLite Micro (For MCU Chips)</option>
                </select>
              </div>

            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveConfig}
                className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Apply Hyperparameters</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: IOT STREAM BINDINGS
            ========================================================================= */}
        {activeTab === 'inputs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Bound Devices & Input Telemetry Streams</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Link IoT sensors and MQTT channels directly to {baseEngine.name}.
                </p>
              </div>
            </div>

            {/* Add New Binding Bar */}
            <div className="flex gap-3 max-w-xl">
              <input
                type="text"
                placeholder="Enter Device ID or Sensor Channel Name..."
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                className="flex-1 h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#2563EB]"
              />
              <button
                onClick={handleAddDeviceBinding}
                className="px-4 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Bind Device
              </button>
            </div>

            {/* Active Bindings List */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 text-xs font-bold text-slate-700 flex justify-between items-center">
                <span>Active Bound Telemetry Sources ({boundDevices.length})</span>
                <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {boundDevices.map((device, idx) => (
                  <div key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-semibold text-slate-800">{device}</span>
                      <span className="text-[10px] font-mono bg-blue-50 text-[#2563EB] px-2 py-0.5 rounded-full font-bold">
                        ACTIVE STREAM
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveDeviceBinding(device)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="Unbind"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 6: LIVE EXECUTION & MLOPS LOGS
            ========================================================================= */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Execution & MLOps Logs Console</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Streaming training logs, deployment events, and diagnostic logs for {baseEngine.name}.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                STREAMING LIVE
              </span>
            </div>

            <div className="p-4 bg-slate-950 text-slate-200 font-mono text-xs rounded-xl border border-slate-800 h-[320px] overflow-y-auto space-y-1.5">
              <div className="text-slate-500">[INFO] {new Date().toISOString()} Engine #{baseEngine.id} initialized on {deploymentTarget}</div>
              <div className="text-slate-400">[INFO] Base Architecture: {baseEngine.model} (Precision: {precision})</div>
              {engineStatus === 'Ready' && <div className="text-amber-400">[STATUS] Engine Ready for Training. Waiting for user training run trigger...</div>}
              {engineStatus === 'Training' && <div className="text-amber-400">[TRAIN] Training pipeline in progress... Optimizing weights</div>}
              {engineStatus === 'Running' && <div className="text-emerald-400">[OK] Model trained & running on target node {deploymentTarget}</div>}
              <div className="text-[#2563EB]">[LOGS] Stream active. Zero errors recorded.</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
