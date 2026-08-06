import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Cpu,
  X,
  User,
  Tag,
  Wifi,
  Network,
  Cpu as CpuIcon,
  Radio,
  FileText,
  ChevronDown
} from 'lucide-react';
import type { GatewayBase } from '../types';

const schema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters').max(20, 'Code too long'),
  name: z.string().min(3, 'Name must be at least 3 characters').max(150, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional().or(z.literal('')),
  protocol: z.enum(['MQTT', 'HTTP', 'COAP', 'WEBSOCKET', 'MODBUS', 'OPC_UA']),
  ip_address: z.string().max(45).optional().or(z.literal('')),
  mac_address: z.string().max(17).optional().or(z.literal('')),
  firmware_version: z.string().max(50).optional().or(z.literal('')),
  mqtt_topic: z.string().max(255).optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED']),
});

type FormValues = z.infer<typeof schema>;

interface GatewayFormProps {
  open: boolean;
  gateway?: Partial<GatewayBase> | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
}

export const GatewayForm: React.FC<GatewayFormProps> = ({
  open,
  gateway,
  submitting = false,
  onClose,
  onSubmit,
}) => {
  const isEdit = !!(gateway && gateway.code);

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
      description: '',
      protocol: 'MQTT',
      ip_address: '',
      mac_address: '',
      firmware_version: '',
      mqtt_topic: '',
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      gateway
        ? {
            code: gateway.code ?? '',
            name: gateway.name ?? '',
            description: gateway.description ?? '',
            protocol: (gateway.protocol as any) ?? 'MQTT',
            ip_address: gateway.ip_address ?? '',
            mac_address: gateway.mac_address ?? '',
            firmware_version: gateway.firmware_version ?? '',
            mqtt_topic: gateway.mqtt_topic ?? '',
            status: ((gateway as any).status as any) ?? 'ACTIVE',
          }
        : {
            code: '',
            name: '',
            description: '',
            protocol: 'MQTT',
            ip_address: '',
            mac_address: '',
            firmware_version: '',
            mqtt_topic: '',
            status: 'ACTIVE',
          }
    );
  }, [open, gateway, reset]);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gateway-modal-title"
    >
      {/* Modal Container */}
      <div className="relative w-full max-w-[720px] max-h-[90vh] bg-white rounded-[16px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 font-sans text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100 shadow-xs">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 id="gateway-modal-title" className="text-xl font-bold text-slate-900 tracking-tight">
                {isEdit ? 'Edit Gateway' : 'Create Gateway'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure physical gateway hardware and connection protocol settings.
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
        <form id="gateway-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC] space-y-5">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Code */}
            <Controller
              name="code"
              control={control}
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Gateway Code <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Tag className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      {...field}
                      type="text"
                      disabled={isEdit}
                      placeholder="e.g. GTW_MAIN_01"
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
                    Gateway Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      {...field}
                      type="text"
                      placeholder="Enter gateway name"
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

            {/* Protocol */}
            <Controller
              name="protocol"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Protocol <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Wifi className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select
                      {...field}
                      className="w-full h-[48px] pl-10 pr-8 bg-white border border-[#DCE3EA] rounded-[10px] text-sm font-medium text-slate-900 appearance-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
                    >
                      <option value="MQTT">MQTT (Pub/Sub)</option>
                      <option value="HTTP">HTTP (REST)</option>
                      <option value="COAP">CoAP</option>
                      <option value="WEBSOCKET">WebSocket</option>
                      <option value="MODBUS">Modbus RTU/TCP</option>
                      <option value="OPC_UA">OPC UA</option>
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
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Status <span className="text-rose-500">*</span>
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

            {/* IP Address */}
            <Controller
              name="ip_address"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    IP Address
                  </label>
                  <div className="relative flex items-center">
                    <Network className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      {...field}
                      type="text"
                      placeholder="e.g. 192.168.1.100"
                      className="w-full h-[48px] pl-10 pr-4 bg-white border border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all font-mono"
                    />
                  </div>
                </div>
              )}
            />

            {/* MAC Address */}
            <Controller
              name="mac_address"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    MAC Address
                  </label>
                  <div className="relative flex items-center">
                    <Tag className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      {...field}
                      type="text"
                      placeholder="e.g. 00:1B:44:11:3A:B7"
                      className="w-full h-[48px] pl-10 pr-4 bg-white border border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all font-mono"
                    />
                  </div>
                </div>
              )}
            />

            {/* Firmware Version */}
            <Controller
              name="firmware_version"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Firmware Version
                  </label>
                  <div className="relative flex items-center">
                    <CpuIcon className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      {...field}
                      type="text"
                      placeholder="e.g. v2.4.1-build"
                      className="w-full h-[48px] pl-10 pr-4 bg-white border border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                    />
                  </div>
                </div>
              )}
            />

            {/* MQTT Topic */}
            <Controller
              name="mqtt_topic"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    MQTT Topic
                  </label>
                  <div className="relative flex items-center">
                    <Radio className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      {...field}
                      type="text"
                      placeholder="e.g. sensors/telemetry/v1"
                      className="w-full h-[48px] pl-10 pr-4 bg-white border border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all font-mono"
                    />
                  </div>
                </div>
              )}
            />
          </div>

          {/* Description */}
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Description
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <textarea
                    {...field}
                    rows={3}
                    placeholder="Describe gateway location and physical sensor scope..."
                    className="w-full pl-10 pr-4 pt-3 pb-3 bg-white border border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all resize-none min-h-[90px]"
                  />
                </div>
              </div>
            )}
          />

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
            form="gateway-form"
            disabled={submitting}
            className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Cpu className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Gateway'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
