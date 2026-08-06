import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Layers,
  X,
  User,
  Tag,
  Mail,
  Phone,
  Globe,
  Settings,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import type { Tenant } from '../types';

const schema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters').max(20, 'Code too long'),
  name: z.string().min(3, 'Name must be at least 3 characters').max(150, 'Name too long'),
  email: z.string().email('Invalid email address'),
  description: z.string().max(500, 'Description too long').optional().or(z.literal('')),
  phone: z.string().max(20, 'Phone too long').optional().or(z.literal('')),
  website: z.string().max(255, 'Website URL too long').optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED']),
});

type FormValues = z.infer<typeof schema>;

interface TenantFormProps {
  open: boolean;
  tenant?: Tenant | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
}

export const TenantForm: React.FC<TenantFormProps> = ({
  open,
  tenant,
  submitting = false,
  onClose,
  onSubmit,
}) => {
  const isEdit = !!tenant;

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
      email: '',
      description: '',
      phone: '',
      website: '',
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      tenant
        ? {
            code: tenant.code,
            name: tenant.name,
            email: tenant.email,
            description: tenant.description ?? '',
            phone: tenant.phone ?? '',
            website: tenant.website ?? '',
            status: tenant.status as any,
          }
        : { code: '', name: '', email: '', description: '', phone: '', website: '', status: 'ACTIVE' }
    );
  }, [open, tenant, reset]);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tenant-modal-title"
    >
      {/* Modal Container */}
      <div className="relative w-full max-w-[680px] max-h-[90vh] bg-white rounded-[16px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 font-sans text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100 shadow-xs">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 id="tenant-modal-title" className="text-xl font-bold text-slate-900 tracking-tight">
                {isEdit ? 'Edit Tenant' : 'Create Tenant'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure workspace tenant details and status.
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
        <form id="tenant-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC] space-y-5">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Code */}
            <Controller
              name="code"
              control={control}
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Tenant Code <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Tag className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      {...field}
                      type="text"
                      disabled={isEdit}
                      placeholder="e.g. TEN_PROD"
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
                    Tenant Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      {...field}
                      type="text"
                      placeholder="Enter tenant name"
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

            {/* Email */}
            <Controller
              name="email"
              control={control}
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Contact Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      {...field}
                      type="email"
                      placeholder="Enter contact email"
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

            {/* Phone */}
            <Controller
              name="phone"
              control={control}
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Phone Number
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      {...field}
                      type="text"
                      placeholder="Enter phone number"
                      className="w-full h-[48px] pl-10 pr-4 bg-white border border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                    />
                  </div>
                </div>
              )}
            />

            {/* Website */}
            <Controller
              name="website"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Website URL
                  </label>
                  <div className="relative flex items-center">
                    <Globe className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      {...field}
                      type="url"
                      placeholder="https://www.example.com"
                      className="w-full h-[48px] pl-10 pr-4 bg-white border border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                    />
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
                    placeholder="Describe the tenant..."
                    className="w-full pl-10 pr-4 pt-3 pb-3 bg-white border border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all resize-none min-h-[100px]"
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
            form="tenant-form"
            disabled={submitting}
            className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Layers className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Tenant'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
