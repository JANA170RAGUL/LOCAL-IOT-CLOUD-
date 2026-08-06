import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  Plus,
  Trash2,
  Activity,
  BarChart3,
  Wifi,
  Inbox
} from 'lucide-react';
import { WidgetEditor } from '../features/dashboard/builder/WidgetEditor';
import { WidgetRenderer } from '../features/dashboard/widgets';
import type { WidgetConfig } from '../features/dashboard/types';

export const WidgetsPreviewPage: React.FC = () => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    const saved = localStorage.getItem('preview_widgets');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('preview_widgets', JSON.stringify(widgets));
  }, [widgets]);

  const handleSaveWidget = (config: WidgetConfig) => {
    setWidgets((prev) => [...prev, config]);
    setEditorOpen(false);
  };

  const handleDeleteWidget = (id: string) => {
    setWidgets((prev) => prev.filter((widget) => widget.id !== id));
  };

  const liveCount = widgets.filter(w => w.refresh === 'live').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <span>Home</span>
        <span>/</span>
        <span>Monitoring & Visualization</span>
        <span>/</span>
        <span className="text-[#2563EB] font-bold">Widgets</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100 shrink-0">
            <LayoutGrid className="w-6 h-6 text-[#2563EB]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Widgets Library
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Preview and configure autonomous telemetry dashboard widgets.
            </p>
          </div>
        </div>

        <button
          onClick={() => setEditorOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Widget</span>
        </button>
      </div>

      {/* KPI Analytics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Widgets */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Configured Widgets</span>
            <LayoutGrid className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {widgets.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Dashboard component elements
          </p>
        </div>

        {/* Live Streamed */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>WebSocket Live</span>
            <Wifi className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            {liveCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Real-time streaming widgets
          </p>
        </div>

        {/* Visualizations */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Chart Cards</span>
            <BarChart3 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-600">
            {widgets.filter(w => w.type === 'line' || w.type === 'bar').length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Timeseries data components
          </p>
        </div>

        {/* Real-time Status */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Active Sensors</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600">
            {new Set(widgets.map(w => w.sensorCode)).size}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Unique telemetry streams
          </p>
        </div>
      </div>

      {/* Main Widgets Section */}
      {widgets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-16 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100">
            <Inbox className="w-8 h-8 text-[#2563EB]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              No Widgets Added Yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Click &quot;Add Widget&quot; to configure real-time line charts, gauge meters, and telemetry status cards.
            </p>
          </div>
          <button
            onClick={() => setEditorOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Widget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {widgets.map((widget) => (
            <div key={widget.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col h-[380px] overflow-hidden group">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors">
                    {widget.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2563EB] bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md">
                      {widget.type}
                    </span>
                    <span className="text-xs font-mono font-medium text-slate-500">
                      {widget.sensorCode}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteWidget(widget.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                  title="Delete Widget"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Renderer Body */}
              <div className="flex-1 p-4 overflow-hidden bg-white">
                <WidgetRenderer config={widget} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      <WidgetEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveWidget}
      />

    </div>
  );
};
