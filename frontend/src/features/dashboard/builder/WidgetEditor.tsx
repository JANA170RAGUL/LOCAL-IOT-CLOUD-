import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  LayoutGrid,
  X,
  Tag,
  Radio,
  Clock,
  Wifi,
  ChevronDown,
  Cpu,
  Search,
  CheckCircle2,
  Check,
  Server
} from 'lucide-react';
import type { WidgetConfig } from '../types';
import { WidgetRegistry } from '../registry/WidgetRegistry';
import { useAllDevicesQuery } from '../../devices/hooks/useDevices';

const widgetSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  type: z.string(),
  deviceId: z.string().min(1, 'Device ID is required'),
  sensorCode: z.string().min(1, 'Sensor code is required'),
  timeRange: z.enum(['15m', '1h', '6h', '24h', '7d']),
  refresh: z.enum(['live', 'static']),
  color: z.string().optional(),
  aggregation: z.string().optional(),
});

export type WidgetFormValues = z.infer<typeof widgetSchema>;

interface WidgetEditorProps {
  open: boolean;
  initialValues?: Partial<WidgetConfig>;
  onClose: () => void;
  onSave: (config: WidgetConfig) => void;
  error?: string | null;
}

const DEFAULT_DEVICES = [
  { id: 'dev-001', code: 'RASP_PI_4B', name: 'Raspberry Pi 4B Gateway Node', status: 'ACTIVE', device_type: 'GATEWAY' },
  { id: 'dev-002', code: 'ESP32_SOIL_01', name: 'ESP32 Soil Moisture Sensor', status: 'ACTIVE', device_type: 'SENSOR' },
  { id: 'dev-003', code: 'ARDUINO_TEMP_02', name: 'Arduino Weather Station', status: 'ACTIVE', device_type: 'WEATHER' },
  { id: 'dev-004', code: 'MODBUS_POWER_01', name: 'Modbus Smart Energy Meter', status: 'ACTIVE', device_type: 'METER' },
];

export const WidgetEditor: React.FC<WidgetEditorProps> = ({
  open,
  initialValues,
  onClose,
  onSave,
  error,
}) => {
  const [deviceSearchTerm, setDeviceSearchTerm] = useState('');
  const [isDeviceDropdownOpen, setIsDeviceDropdownOpen] = useState(false);
  const [autoPastedNotice, setAutoPastedNotice] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: apiDevices } = useAllDevicesQuery(deviceSearchTerm);

  const availableDevices = apiDevices && apiDevices.length > 0 ? apiDevices : DEFAULT_DEVICES;

  const filteredDevices = availableDevices.filter((dev) => {
    const q = deviceSearchTerm.toLowerCase();
    return (
      (dev.name && dev.name.toLowerCase().includes(q)) ||
      (dev.code && dev.code.toLowerCase().includes(q)) ||
      (dev.id && dev.id.toLowerCase().includes(q)) ||
      (dev.device_type && dev.device_type.toLowerCase().includes(q))
    );
  });

  const { control, handleSubmit, reset, setValue, watch } = useForm<WidgetFormValues>({
    resolver: zodResolver(widgetSchema),
    mode: 'onChange',
    defaultValues: {
      id: initialValues?.id || crypto.randomUUID(),
      title: initialValues?.title || 'New Widget',
      type: initialValues?.type || 'line',
      deviceId: initialValues?.deviceId || 'dev-001',
      sensorCode: initialValues?.sensorCode || 'TEMP_001',
      timeRange: initialValues?.timeRange || '1h',
      refresh: initialValues?.refresh || 'live',
      color: initialValues?.color || '#2563EB',
      aggregation: initialValues?.aggregation || 'mean',
    },
  });

  const currentDeviceId = watch('deviceId');

  useEffect(() => {
    if (open) {
      reset({
        id: initialValues?.id || crypto.randomUUID(),
        title: initialValues?.title || 'New Widget',
        type: initialValues?.type || 'line',
        deviceId: initialValues?.deviceId || 'dev-001',
        sensorCode: initialValues?.sensorCode || 'TEMP_001',
        timeRange: initialValues?.timeRange || '1h',
        refresh: initialValues?.refresh || 'live',
        color: initialValues?.color || '#2563EB',
        aggregation: initialValues?.aggregation || 'mean',
      });
      setAutoPastedNotice(null);
    }
  }, [open, initialValues, reset]);

  // Click outside listener for device dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDeviceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectDevice = (dev: any) => {
    const selectedId = dev.id || dev.code;
    setValue('deviceId', selectedId, { shouldValidate: true, shouldDirty: true });
    
    // Auto populate sensor code default if available
    if (dev.code) {
      setValue('sensorCode', `${dev.code}_TEMP`, { shouldValidate: true });
    }

    setAutoPastedNotice(`Device "${dev.name || dev.code}" (${selectedId}) selected and auto-pasted!`);
    setIsDeviceDropdownOpen(false);

    setTimeout(() => {
      setAutoPastedNotice(null);
    }, 4000);
  };

  const onSubmit = (data: WidgetFormValues) => {
    onSave(data as WidgetConfig);
  };

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="widget-modal-title"
    >
      {/* Modal Container */}
      <div className="relative w-full max-w-[700px] max-h-[90vh] bg-white rounded-[16px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 font-sans text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100 shadow-xs">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div>
              <h2 id="widget-modal-title" className="text-xl font-bold text-slate-900 tracking-tight">
                {initialValues?.id ? 'Edit Widget' : 'Add Widget'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure telemetry data source, chart visualization type, and refresh stream.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="px-6 pt-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Scrollable Form Content */}
        <form id="widget-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC] space-y-5">
          
          {/* Top Form Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Widget Title */}
            <Controller
              name="title"
              control={control}
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Widget Title <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Tag className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      {...field}
                      type="text"
                      placeholder="e.g. Temperature Stream"
                      className={`w-full h-[48px] pl-10 pr-4 bg-white border ${
                        fieldState.error 
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-50' 
                          : 'border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50'
                      } rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all`}
                    />
                  </div>
                  {fieldState.error && (
                    <span className="text-[11px] font-medium text-rose-500">{fieldState.error.message}</span>
                  )}
                </div>
              )}
            />

            {/* Widget Type */}
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Widget Type <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <LayoutGrid className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select
                      {...field}
                      className="w-full h-[48px] pl-10 pr-8 bg-white border border-[#DCE3EA] rounded-[10px] text-sm font-medium text-slate-900 appearance-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
                    >
                      {WidgetRegistry.getAll().map((manifest) => (
                        <option key={manifest.type} value={manifest.type}>
                          {manifest.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}
            />

          </div>

          {/* SEARCH & SELECT DEVICE DROPDOWN SECTION */}
          <div className="space-y-1.5" ref={dropdownRef}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-[#2563EB]" />
                Select Registered Device
              </label>
              <span className="text-[11px] font-semibold text-blue-600">
                Click dropdown to search available nodes
              </span>
            </div>

            <div className="relative">
              {/* Trigger Input Dropdown Header */}
              <button
                type="button"
                onClick={() => setIsDeviceDropdownOpen(!isDeviceDropdownOpen)}
                className="w-full h-[48px] px-3.5 bg-white border border-[#DCE3EA] hover:border-[#2563EB] rounded-[10px] flex items-center justify-between text-left transition-all cursor-pointer neu-flat-sm"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <Cpu className="w-4 h-4 text-blue-600 shrink-0" />
                  {currentDeviceId ? (
                    <span className="text-sm font-bold text-slate-900 truncate">
                      {availableDevices.find((d) => (d.id === currentDeviceId || d.code === currentDeviceId))?.name || currentDeviceId}
                      <span className="ml-2 font-mono text-xs text-slate-400">({currentDeviceId})</span>
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">Choose a device from list...</span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDeviceDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Floating Dropdown List */}
              {isDeviceDropdownOpen && (
                <div className="absolute top-[52px] left-0 right-0 z-[10000] bg-white rounded-xl border border-slate-200 shadow-2xl p-2.5 space-y-2 animate-in fade-in duration-150">
                  
                  {/* Search Bar inside Dropdown */}
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={deviceSearchTerm}
                      onChange={(e) => setDeviceSearchTerm(e.target.value)}
                      placeholder="Search device by name, code, or ID..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>

                  {/* Filtered Devices List */}
                  <div className="max-h-[180px] overflow-y-auto space-y-1">
                    {filteredDevices.length > 0 ? (
                      filteredDevices.map((dev) => {
                        const isSelected = currentDeviceId === dev.id || currentDeviceId === dev.code;
                        return (
                          <div
                            key={dev.id}
                            onClick={() => handleSelectDevice(dev)}
                            className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors text-xs ${
                              isSelected ? 'bg-blue-50 text-[#2563EB] font-bold' : 'hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{dev.name}</span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                                  {dev.code}
                                </span>
                              </div>
                              <div className="text-[11px] font-mono text-slate-500">
                                Device ID: <span className="font-bold text-blue-600">{dev.id}</span>
                              </div>
                            </div>

                            {isSelected && <Check className="w-4 h-4 text-[#2563EB] shrink-0" />}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-400 font-medium">
                        No devices matching "{deviceSearchTerm}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Auto-Pasted Notice Banner */}
            {autoPastedNotice && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{autoPastedNotice}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Device ID (Auto-Pasted or Editable) */}
            <Controller
              name="deviceId"
              control={control}
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Device ID <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-slate-400 font-normal">(Auto-filled or manual)</span>
                  </label>
                  <div className="relative flex items-center">
                    <Cpu className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      {...field}
                      type="text"
                      placeholder="e.g. dev-001 or UUID"
                      className={`w-full h-[48px] pl-10 pr-4 bg-white border ${
                        fieldState.error 
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-50' 
                          : 'border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50'
                      } rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all font-mono`}
                    />
                  </div>
                  {fieldState.error && (
                    <span className="text-[11px] font-medium text-rose-500">{fieldState.error.message}</span>
                  )}
                </div>
              )}
            />

            {/* Sensor Code */}
            <Controller
              name="sensorCode"
              control={control}
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Sensor Code <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Radio className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      {...field}
                      type="text"
                      placeholder="e.g. TEMP_01"
                      className={`w-full h-[48px] pl-10 pr-4 bg-white border ${
                        fieldState.error 
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-50' 
                          : 'border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50'
                      } rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all font-mono`}
                    />
                  </div>
                  {fieldState.error && (
                    <span className="text-[11px] font-medium text-rose-500">{fieldState.error.message}</span>
                  )}
                </div>
              )}
            />

            {/* Time Range */}
            <Controller
              name="timeRange"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Time Range
                  </label>
                  <div className="relative flex items-center">
                    <Clock className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select
                      {...field}
                      className="w-full h-[48px] pl-10 pr-8 bg-white border border-[#DCE3EA] rounded-[10px] text-sm font-medium text-slate-900 appearance-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
                    >
                      <option value="15m">Last 15 minutes</option>
                      <option value="1h">Last 1 hour</option>
                      <option value="6h">Last 6 hours</option>
                      <option value="24h">Last 24 hours</option>
                      <option value="7d">Last 7 days</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}
            />

            {/* Update Mode */}
            <Controller
              name="refresh"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Update Mode
                  </label>
                  <div className="relative flex items-center">
                    <Wifi className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select
                      {...field}
                      className="w-full h-[48px] pl-10 pr-8 bg-white border border-[#DCE3EA] rounded-[10px] text-sm font-medium text-slate-900 appearance-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
                    >
                      <option value="live">🟢 Live Stream (WebSocket)</option>
                      <option value="static">⚪ Static Snapshot</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}
            />

          </div>

        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-transparent hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold transition-all cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            form="widget-form"
            className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Save Widget</span>
          </button>
        </div>

      </div>
    </div>
  );
};
