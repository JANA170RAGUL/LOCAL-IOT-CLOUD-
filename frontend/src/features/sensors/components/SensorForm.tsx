import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Activity as SensorsIcon,
  X,
  Tag,
  Radio,
  ChevronDown,
  Gauge,
  Sliders,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { SensorType, MeasurementUnit, DataType } from '../types';
import type { SensorBase } from '../types';

const schema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters').max(20, 'Code too long'),
  name: z.string().min(3, 'Name must be at least 3 characters').max(150, 'Name too long'),
  sensor_type: z.nativeEnum(SensorType),
  unit: z.nativeEnum(MeasurementUnit).nullable().optional(),
  data_type: z.nativeEnum(DataType),

  min_value: z.number().nullable().optional(),
  max_value: z.number().nullable().optional(),
  default_value: z.string().max(255).nullable().optional(),

  sampling_interval: z.number().min(1),
  calibration_offset: z.number(),
  calibration_scale: z.number(),

  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED']),
});

type FormValues = z.infer<typeof schema>;

interface SensorFormProps {
  open: boolean;
  sensor?: Partial<SensorBase> | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
}

export const SensorForm: React.FC<SensorFormProps> = ({
  open,
  sensor,
  submitting = false,
  onClose,
  onSubmit,
}) => {
  const isEdit = !!(sensor && sensor.code);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      code: '',
      name: '',
      sensor_type: SensorType.CUSTOM,
      unit: null,
      data_type: DataType.NUMBER,
      min_value: null,
      max_value: null,
      default_value: '',
      sampling_interval: 5,
      calibration_offset: 0,
      calibration_scale: 1,
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      sensor
        ? {
            code: sensor.code ?? '',
            name: sensor.name ?? '',
            sensor_type: sensor.sensor_type ?? SensorType.CUSTOM,
            unit: sensor.unit ?? null,
            data_type: sensor.data_type ?? DataType.NUMBER,
            min_value: sensor.min_value ?? null,
            max_value: sensor.max_value ?? null,
            default_value: sensor.default_value ?? '',
            sampling_interval: sensor.sampling_interval ?? 5,
            calibration_offset: sensor.calibration_offset ?? 0,
            calibration_scale: sensor.calibration_scale ?? 1,
            status: ((sensor as any).status as any) ?? 'ACTIVE',
          }
        : {
            code: '',
            name: '',
            sensor_type: SensorType.CUSTOM,
            unit: null,
            data_type: DataType.NUMBER,
            min_value: null,
            max_value: null,
            default_value: '',
            sampling_interval: 5,
            calibration_offset: 0,
            calibration_scale: 1,
            status: 'ACTIVE',
          }
    );
  }, [open, sensor, reset]);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sensor-modal-title"
    >
      {/* Modal Container */}
      <div className="relative w-full max-w-[780px] max-h-[90vh] bg-white rounded-[16px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 font-sans text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100 shadow-xs">
              <SensorsIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 id="sensor-modal-title" className="text-xl font-bold text-slate-900 tracking-tight">
                {isEdit ? 'Edit Sensor' : 'Create Sensor'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure telemetry data key, operating limits, and calibration scale.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form id="sensor-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC] space-y-6">
          
          {/* Section 1: General Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/80 pb-2">
              1. General Sensor Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Code */}
              <Controller
                name="code"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Sensor Code <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Tag className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        {...field}
                        type="text"
                        disabled={isEdit}
                        placeholder="e.g. SENS_TEMP_01"
                        className={`w-full h-[48px] pl-10 pr-4 bg-white border ${
                          isEdit ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' :
                          fieldState.error 
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-50' 
                            : 'border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50'
                        } rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all`}
                      />
                    </div>
                    {fieldState.error && !isEdit && (
                      <span className="text-[11px] font-medium text-rose-500">{fieldState.error.message}</span>
                    )}
                  </div>
                )}
              />

              {/* Name */}
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Sensor Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <SensorsIcon className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        {...field}
                        type="text"
                        placeholder="Enter sensor name"
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

              {/* Sensor Type */}
              <Controller
                name="sensor_type"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Sensor Type
                    </label>
                    <div className="relative flex items-center">
                      <Radio className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      <select
                        {...field}
                        className="w-full h-[48px] pl-10 pr-8 bg-white border border-[#DCE3EA] rounded-[10px] text-sm font-medium text-slate-900 appearance-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
                      >
                        {Object.values(SensorType).map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                )}
              />

              {/* Unit */}
              <Controller
                name="unit"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Measurement Unit
                    </label>
                    <div className="relative flex items-center">
                      <Gauge className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      <select
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        className="w-full h-[48px] pl-10 pr-8 bg-white border border-[#DCE3EA] rounded-[10px] text-sm font-medium text-slate-900 appearance-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
                      >
                        <option value="">— None —</option>
                        {Object.entries(MeasurementUnit).map(([key, value]) => (
                          <option key={key} value={value}>{value} ({key})</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                )}
              />

              {/* Status */}
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <div className="sm:col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Lifecycle Status <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <select
                        {...field}
                        className="w-full h-[48px] px-3.5 bg-white border border-[#DCE3EA] rounded-[10px] text-sm font-medium text-slate-900 appearance-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
                      >
                        <option value="ACTIVE">🟢 Active</option>
                        <option value="TRIAL">🟠 Trial</option>
                        <option value="INACTIVE">🟠 Inactive</option>
                        <option value="SUSPENDED">🔴 Disabled (Suspended)</option>
                        <option value="EXPIRED">🔴 Expired</option>
                      </select>
                      <ChevronDown className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                )}
              />
            </div>
          </div>

          {/* Section 2: Operating Limits */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/80 pb-2">
              2. Operating Limits & Values
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Min Value */}
              <Controller
                name="min_value"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Min Value
                    </label>
                    <div className="relative flex items-center">
                      <Minimize2 className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="number"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="e.g. -40"
                        className="w-full h-[48px] pl-10 pr-4 bg-white border border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>
                )}
              />

              {/* Max Value */}
              <Controller
                name="max_value"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Max Value
                    </label>
                    <div className="relative flex items-center">
                      <Maximize2 className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="number"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="e.g. 125"
                        className="w-full h-[48px] pl-10 pr-4 bg-white border border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>
                )}
              />

              {/* Default Value */}
              <Controller
                name="default_value"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Default Value
                    </label>
                    <div className="relative flex items-center">
                      <Sliders className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || '')}
                        placeholder="e.g. 0.0"
                        className="w-full h-[48px] pl-10 pr-4 bg-white border border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>
                )}
              />
            </div>
          </div>

          {/* Section 3: Sampling & Calibration */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/80 pb-2">
              3. Sampling & Calibration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Sampling Interval */}
              <Controller
                name="sampling_interval"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Sampling Interval (s)
                    </label>
                    <input
                      type="number"
                      value={field.value}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      className="w-full h-[48px] px-4 bg-white border border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 rounded-[10px] text-sm text-slate-900 outline-none transition-all font-mono"
                    />
                  </div>
                )}
              />

              {/* Scale Multiplier */}
              <Controller
                name="calibration_scale"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Scale Multiplier
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={field.value}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                      className="w-full h-[48px] px-4 bg-white border border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 rounded-[10px] text-sm text-slate-900 outline-none transition-all font-mono"
                    />
                  </div>
                )}
              />

              {/* Offset Adder */}
              <Controller
                name="calibration_offset"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Offset Adder
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={field.value}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      className="w-full h-[48px] px-4 bg-white border border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 rounded-[10px] text-sm text-slate-900 outline-none transition-all font-mono"
                    />
                  </div>
                )}
              />
            </div>
          </div>

        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-white">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2.5 bg-transparent hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            form="sensor-form"
            disabled={submitting}
            className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <SensorsIcon className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Sensor'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
