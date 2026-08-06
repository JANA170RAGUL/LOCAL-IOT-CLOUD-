import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  FolderKanban,
  X,
  User,
  Tag,
  FileText,
  ChevronDown
} from 'lucide-react';
import type { Project } from '../types';

const schema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters').max(20, 'Code too long'),
  name: z.string().min(3, 'Name must be at least 3 characters').max(150, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED']),
});

type FormValues = z.infer<typeof schema>;

interface ProjectFormProps {
  open: boolean;
  project?: Project | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  open,
  project,
  submitting = false,
  onClose,
  onSubmit,
}) => {
  const isEdit = !!project;

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
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      project
        ? {
            code: project.code,
            name: project.name,
            description: project.description ?? '',
            status: project.status as any,
          }
        : { code: '', name: '', description: '', status: 'ACTIVE' }
    );
  }, [open, project, reset]);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
    >
      {/* Modal Container */}
      <div className="relative w-full max-w-[620px] max-h-[90vh] bg-white rounded-[16px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 font-sans text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100 shadow-xs">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <h2 id="project-modal-title" className="text-xl font-bold text-slate-900 tracking-tight">
                {isEdit ? 'Edit Project' : 'Create Project'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure project details and IoT asset scope.
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
        <form id="project-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC] space-y-5">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Code */}
            <Controller
              name="code"
              control={control}
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Project Code <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Tag className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      {...field}
                      type="text"
                      disabled={isEdit}
                      placeholder="e.g. PRJ_01"
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
                    Project Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      {...field}
                      type="text"
                      placeholder="Enter project name"
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
          </div>

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
                    placeholder="Describe the project scope and target gateways..."
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
            form="project-form"
            disabled={submitting}
            className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <FolderKanban className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Project'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
