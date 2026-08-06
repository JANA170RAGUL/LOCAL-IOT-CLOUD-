import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../../../features/settings/api/settings';
import {
  Building2,
  Clock,
  Globe,
  DollarSign,
  Calendar,
  Save,
  ChevronDown
} from 'lucide-react';

interface GeneralSettingsData {
  companyName: string;
  timezone: string;
  language: string;
  currency: string;
  dateFormat: string;
}

export default function GeneralSettingsForm() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm<GeneralSettingsData>();

  const { data, isLoading } = useQuery({
    queryKey: ['settings', 'general'],
    queryFn: () => settingsApi.getCategorySettings('general')
  });

  useEffect(() => {
    if (data) {
      reset({
        companyName: data.companyName || '',
        timezone: data.timezone || 'UTC',
        language: data.language || 'en',
        currency: data.currency || 'USD',
        dateFormat: data.dateFormat || 'YYYY-MM-DD',
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (settings: GeneralSettingsData) => settingsApi.updateCategorySettings('general', { settings }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'general'] });
    }
  });

  const onSubmit = (formData: GeneralSettingsData) => {
    mutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400 animate-pulse font-medium">
        Loading general configuration...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      
      {/* Header */}
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900">
          General Information
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Basic localization and instance metadata configuration for your platform.
        </p>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Company Name */}
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Company / Organization Name
          </label>
          <div className="relative flex items-center">
            <Building2 className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              {...register('companyName')}
              placeholder="e.g. Local IoT Cloud Corp"
              className="w-full h-[48px] pl-10 pr-4 bg-white border border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
            />
          </div>
        </div>

        {/* Timezone */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Timezone
          </label>
          <div className="relative flex items-center">
            <Clock className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              {...register('timezone')}
              className="w-full h-[48px] pl-10 pr-8 bg-white border border-[#DCE3EA] rounded-[10px] text-sm font-medium text-slate-900 appearance-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
            >
              <option value="UTC">UTC (Universal Coordinated Time)</option>
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            </select>
            <ChevronDown className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Language */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Language
          </label>
          <div className="relative flex items-center">
            <Globe className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              {...register('language')}
              className="w-full h-[48px] pl-10 pr-8 bg-white border border-[#DCE3EA] rounded-[10px] text-sm font-medium text-slate-900 appearance-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
            >
              <option value="en">English (US)</option>
              <option value="es">Spanish (Español)</option>
              <option value="fr">French (Français)</option>
              <option value="de">German (Deutsch)</option>
            </select>
            <ChevronDown className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Currency */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Default Currency
          </label>
          <div className="relative flex items-center">
            <DollarSign className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              {...register('currency')}
              placeholder="USD"
              className="w-full h-[48px] pl-10 pr-4 bg-white border border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all uppercase"
            />
          </div>
        </div>

        {/* Date Format */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Date Format
          </label>
          <div className="relative flex items-center">
            <Calendar className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              {...register('dateFormat')}
              className="w-full h-[48px] pl-10 pr-8 bg-white border border-[#DCE3EA] rounded-[10px] text-sm font-medium text-slate-900 appearance-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (UK/EU)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
            </select>
            <ChevronDown className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-xs hover:shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{mutation.isPending ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

    </form>
  );
}
