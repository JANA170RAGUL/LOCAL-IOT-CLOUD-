import React, { useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Building2,
  X,
  User,
  Tag,
  Mail,
  Phone,
  Globe,
  Settings,
  FileText,
  Award,
  Users,
  HardDrive,
  Calendar,
  Headphones,
  Info,
  CheckCircle2,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import type { Organization } from '../types';

const schema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters').max(20, 'Code too long'),
  name: z.string().min(3, 'Name must be at least 3 characters').max(150, 'Name too long'),
  email: z.string().email('Invalid email address'),
  description: z.string().max(500, 'Description too long').optional().or(z.literal('')),
  phone: z.string().max(20, 'Phone too long').optional().or(z.literal('')),
  website: z.string().max(255, 'Website URL too long').optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED']),
  license_type: z.enum(['Community', 'Professional', 'Enterprise', 'Academic']),
});

type FormValues = z.infer<typeof schema>;

interface OrganizationFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
  organization?: Organization | null;
  submitting?: boolean;
}

const LICENSE_DETAILS: Record<string, {
  name: string;
  description: string;
  maxUsers: string;
  storage: string;
  retention: string;
  support: string;
}> = {
  Community: {
    name: 'Community',
    description: 'Ideal for communities and education institutions.',
    maxUsers: 'Unlimited',
    storage: '5 GB',
    retention: '30 Days',
    support: 'Community',
  },
  Professional: {
    name: 'Professional',
    description: 'Ideal for growing teams and business units.',
    maxUsers: '100 Users',
    storage: '50 GB',
    retention: '1 Year',
    support: 'Priority Email',
  },
  Enterprise: {
    name: 'Enterprise',
    description: 'Full capabilities for mission-critical deployments.',
    maxUsers: 'Unlimited',
    storage: '1 TB',
    retention: '7 Years',
    support: '24/7 Dedicated',
  },
  Academic: {
    name: 'Academic',
    description: 'Tailored for universities and research labs.',
    maxUsers: '500 Users',
    storage: '200 GB',
    retention: '180 Days',
    support: 'Standard Support',
  },
};

export const OrganizationForm: React.FC<OrganizationFormProps> = ({
  open,
  onClose,
  onSubmit,
  organization,
  submitting = false,
}) => {
  const isEdit = !!organization;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, touchedFields, isValidating },
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
      license_type: 'Community',
    },
  });

  const selectedLicense = useWatch({ control, name: 'license_type' }) || 'Community';
  const selectedStatus = useWatch({ control, name: 'status' }) || 'ACTIVE';
  const currentDescription = useWatch({ control, name: 'description' }) || '';

  useEffect(() => {
    if (organization) {
      reset({
        code: organization.code,
        name: organization.name,
        email: organization.email,
        description: organization.description || '',
        phone: organization.phone || '',
        website: organization.website || '',
        status: (organization.status as any) || 'ACTIVE',
        license_type: (organization.license_type as any) || 'Community',
      });
    } else {
      reset({
        code: '',
        name: '',
        email: '',
        description: '',
        phone: '',
        website: '',
        status: 'ACTIVE',
        license_type: 'Community',
      });
    }
  }, [organization, reset, open]);

  if (!open) return null;

  const onFormSubmit = (data: FormValues) => {
    onSubmit(data);
  };

  const licenseInfo = LICENSE_DETAILS[selectedLicense] || LICENSE_DETAILS.Community;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Modal Container */}
      <div className="relative w-full max-w-[900px] max-h-[90vh] bg-white rounded-[16px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 font-sans text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100/60 shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 id="modal-title" className="text-xl font-bold text-slate-900 tracking-tight">
                {isEdit ? 'Edit Organization' : 'Create Organization'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Register a new organization and assign its license.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content (Two-Column Layout) */}
        <form id="org-form" onSubmit={handleSubmit(onFormSubmit)} className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
            
            {/* Left Column (70%) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Section 1: Organization Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Building2 className="w-4 h-4 text-[#2563EB]" />
                  <span>Organization Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <Controller
                    name="name"
                    control={control}
                    render={({ field, fieldState }) => (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          Organization Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <User className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                          <input
                            {...field}
                            type="text"
                            placeholder="Enter organization name"
                            className={`w-full h-[48px] pl-10 pr-10 bg-white border ${
                              fieldState.error 
                                ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-50' 
                                : fieldState.isTouched && !fieldState.error && field.value
                                ? 'border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50'
                                : 'border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50'
                            } rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all`}
                          />
                          {fieldState.isTouched && !fieldState.error && field.value && (
                            <CheckCircle2 className="absolute right-3.5 w-4 h-4 text-emerald-500" />
                          )}
                          {fieldState.error && (
                            <AlertCircle className="absolute right-3.5 w-4 h-4 text-rose-500" />
                          )}
                        </div>
                        {fieldState.error && (
                          <span className="text-[11px] font-medium text-rose-500 flex items-center gap-1">
                            {fieldState.error.message}
                          </span>
                        )}
                      </div>
                    )}
                  />

                  {/* Code */}
                  <Controller
                    name="code"
                    control={control}
                    render={({ field, fieldState }) => (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          Organization Code <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <Tag className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                          <input
                            {...field}
                            type="text"
                            disabled={isEdit}
                            placeholder="Enter organization code"
                            className={`w-full h-[48px] pl-10 pr-10 bg-white border ${
                              isEdit ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' :
                              fieldState.error 
                                ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-50' 
                                : 'border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50'
                            } rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all`}
                          />
                          {!isEdit && fieldState.isTouched && !fieldState.error && field.value && (
                            <CheckCircle2 className="absolute right-3.5 w-4 h-4 text-emerald-500" />
                          )}
                          {!isEdit && fieldState.error && (
                            <AlertCircle className="absolute right-3.5 w-4 h-4 text-rose-500" />
                          )}
                        </div>
                        {fieldState.error && !isEdit && (
                          <span className="text-[11px] font-medium text-rose-500 flex items-center gap-1">
                            {fieldState.error.message}
                          </span>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Section 2: Contact Information */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Users className="w-4 h-4 text-[#2563EB]" />
                  <span>Contact Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <Controller
                    name="email"
                    control={control}
                    render={({ field, fieldState }) => (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          Contact Email <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                          <input
                            {...field}
                            type="email"
                            placeholder="Enter contact email"
                            className={`w-full h-[48px] pl-10 pr-10 bg-white border ${
                              fieldState.error 
                                ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-50' 
                                : 'border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50'
                            } rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all`}
                          />
                          {fieldState.isTouched && !fieldState.error && field.value && (
                            <CheckCircle2 className="absolute right-3.5 w-4 h-4 text-emerald-500" />
                          )}
                          {fieldState.error && (
                            <AlertCircle className="absolute right-3.5 w-4 h-4 text-rose-500" />
                          )}
                        </div>
                        {fieldState.error && (
                          <span className="text-[11px] font-medium text-rose-500 flex items-center gap-1">
                            {fieldState.error.message}
                          </span>
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
                          Contact Phone
                        </label>
                        <div className="relative flex items-center">
                          <Phone className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                          <input
                            {...field}
                            type="text"
                            placeholder="Enter contact phone"
                            className={`w-full h-[48px] pl-10 pr-10 bg-white border ${
                              fieldState.error 
                                ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-50' 
                                : 'border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50'
                            } rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all`}
                          />
                          {fieldState.isTouched && !fieldState.error && field.value && (
                            <CheckCircle2 className="absolute right-3.5 w-4 h-4 text-emerald-500" />
                          )}
                        </div>
                        {fieldState.error && (
                          <span className="text-[11px] font-medium text-rose-500 flex items-center gap-1">
                            {fieldState.error.message}
                          </span>
                        )}
                      </div>
                    )}
                  />

                  {/* Website (Full Width) */}
                  <div className="sm:col-span-2">
                    <Controller
                      name="website"
                      control={control}
                      render={({ field, fieldState }) => (
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
                              className={`w-full h-[48px] pl-10 pr-10 bg-white border ${
                                fieldState.error 
                                  ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-50' 
                                  : 'border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50'
                              } rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all`}
                            />
                            {fieldState.isTouched && !fieldState.error && field.value && (
                              <CheckCircle2 className="absolute right-3.5 w-4 h-4 text-emerald-500" />
                            )}
                          </div>
                          {fieldState.error && (
                            <span className="text-[11px] font-medium text-rose-500 flex items-center gap-1">
                              {fieldState.error.message}
                            </span>
                          )}
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Organization Settings */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Settings className="w-4 h-4 text-[#2563EB]" />
                  <span>Organization Settings</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* License Type */}
                  <Controller
                    name="license_type"
                    control={control}
                    render={({ field }) => (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          License Type <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <Award className="absolute left-3.5 w-4 h-4 text-amber-500 pointer-events-none" />
                          <select
                            {...field}
                            className="w-full h-[48px] pl-10 pr-9 bg-white border border-[#DCE3EA] rounded-[10px] text-sm font-medium text-slate-900 appearance-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
                          >
                            <option value="Community">Community</option>
                            <option value="Professional">Professional</option>
                            <option value="Enterprise">Enterprise</option>
                            <option value="Academic">Academic</option>
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
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          Status <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3.5 flex items-center pointer-events-none">
                            {field.value === 'ACTIVE' && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                            {(field.value === 'TRIAL' || field.value === 'INACTIVE') && <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
                            {(field.value === 'SUSPENDED' || field.value === 'EXPIRED') && <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />}
                          </span>
                          <select
                            {...field}
                            className="w-full h-[48px] pl-9 pr-9 bg-white border border-[#DCE3EA] rounded-[10px] text-sm font-medium text-slate-900 appearance-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
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

              {/* Section 4: Additional Information */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <FileText className="w-4 h-4 text-[#2563EB]" />
                  <span>Additional Information</span>
                </div>

                <Controller
                  name="description"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div className="flex flex-col gap-1.5 relative">
                      <label className="text-xs font-semibold text-slate-700">
                        Description
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                        <textarea
                          {...field}
                          rows={4}
                          placeholder="Describe the organization, department, or institution..."
                          className={`w-full pl-10 pr-4 pt-3 pb-8 bg-white border ${
                            fieldState.error 
                              ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-50' 
                              : 'border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50'
                          } rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all resize-none min-h-[140px]`}
                        />
                        <span className="absolute right-3.5 bottom-3 text-[11px] font-medium text-slate-400 select-none">
                          {currentDescription.length} / 500
                        </span>
                      </div>
                      {fieldState.error && (
                        <span className="text-[11px] font-medium text-rose-500 flex items-center gap-1">
                          {fieldState.error.message}
                        </span>
                      )}
                    </div>
                  )}
                />
              </div>

            </div>

            {/* Right Column: Live License Summary Card (30%) */}
            <div className="lg:col-span-3">
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 space-y-5 sticky top-0">
                
                {/* Header */}
                <div className="flex items-center gap-2 text-[#2563EB] font-bold text-sm border-b border-slate-200/60 pb-3">
                  <Award className="w-4 h-4" />
                  <span>License Summary</span>
                </div>

                {/* Selected Plan Box */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {licenseInfo.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        {licenseInfo.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Specs List */}
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-600 flex items-center gap-2 font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> Max Users
                    </span>
                    <span className="font-bold text-emerald-600">
                      {licenseInfo.maxUsers}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-600 flex items-center gap-2 font-medium">
                      <HardDrive className="w-3.5 h-3.5 text-slate-400" /> Storage
                    </span>
                    <span className="font-bold text-blue-600">
                      {licenseInfo.storage}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-600 flex items-center gap-2 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Data Retention
                    </span>
                    <span className="font-bold text-purple-600">
                      {licenseInfo.retention}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-600 flex items-center gap-2 font-medium">
                      <Headphones className="w-3.5 h-3.5 text-slate-400" /> Support
                    </span>
                    <span className="font-bold text-amber-600">
                      {licenseInfo.support}
                    </span>
                  </div>
                </div>

                {/* Status Preview Card */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Status Preview
                  </span>
                  
                  {selectedStatus === 'ACTIVE' && (
                    <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active
                      </div>
                      <p className="text-[11px] text-emerald-600 mt-0.5">
                        Organization will be active after creation.
                      </p>
                    </div>
                  )}

                  {(selectedStatus === 'TRIAL' || selectedStatus === 'INACTIVE') && (
                    <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
                        <span className="w-2 h-2 rounded-full bg-amber-500" /> {selectedStatus}
                      </div>
                      <p className="text-[11px] text-amber-600 mt-0.5">
                        Organization will require activation.
                      </p>
                    </div>
                  )}

                  {(selectedStatus === 'SUSPENDED' || selectedStatus === 'EXPIRED') && (
                    <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-rose-700">
                        <span className="w-2 h-2 rounded-full bg-rose-500" /> {selectedStatus}
                      </div>
                      <p className="text-[11px] text-rose-600 mt-0.5">
                        Access is restricted for this status.
                      </p>
                    </div>
                  )}
                </div>

                {/* Info Callout */}
                <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-3 flex items-start gap-2 text-[11px] text-blue-700 leading-tight">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>You can update these details later from organization settings.</span>
                </div>

              </div>
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
            form="org-form"
            disabled={submitting}
            className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Building2 className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Organization'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
