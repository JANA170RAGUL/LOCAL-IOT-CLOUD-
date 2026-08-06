import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  UserPlus,
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Key,
  Save,
  ChevronDown,
  CheckSquare,
  Square
} from 'lucide-react';
import { userApi } from '@/features/users/api/user';
import type { UserCreate } from '@/features/users/types';

export function CreateUser() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<UserCreate>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'Viewer',
    password: ''
  });
  
  const [autoGenerate, setAutoGenerate] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const payload = { ...formData };
      let generatedPassword = null;
      if (autoGenerate) {
        generatedPassword = Math.random().toString(36).slice(-10) + 'A!1';
        payload.password = generatedPassword;
      }
      
      await userApi.create(payload);
      
      if (generatedPassword) {
        alert(`User created successfully!\n\nA welcome email has been dispatched with their temporary password.\n\nFor your records, the temporary password is:\n${generatedPassword}`);
      }
      
      navigate('/users');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Back Button & Header */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/users')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer mb-4"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Back to Users</span>
        </button>

        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100 shrink-0">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Create User
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Add a new user account and set platform access privileges.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
            <p className="font-bold">Error Creating User</p>
            <p className="text-xs">{error}</p>
          </div>
        )}

        {/* Personal Information Section Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Personal Information
            </h2>
            <p className="text-xs text-slate-500">
              User identity and contact details.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                First Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <UserIcon className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={e => setFormData({...formData, first_name: e.target.value})}
                  placeholder="Enter first name"
                  className="w-full h-[48px] pl-10 pr-4 bg-white border border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Last Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <UserIcon className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={e => setFormData({...formData, last_name: e.target.value})}
                  placeholder="Enter last name"
                  className="w-full h-[48px] pl-10 pr-4 bg-white border border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="user@organization.com"
                  className="w-full h-[48px] pl-10 pr-4 bg-white border border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Phone Number
              </label>
              <div className="relative flex items-center">
                <Phone className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  placeholder="e.g. +1 (555) 000-0000"
                  className="w-full h-[48px] pl-10 pr-4 bg-white border border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Role & Permissions Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Role & Permissions
            </h2>
            <p className="text-xs text-slate-500">
              Assign platform security role and feature access level.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Platform Role <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <Shield className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
                className="w-full h-[48px] pl-10 pr-8 bg-white border border-[#DCE3EA] rounded-[10px] text-sm font-medium text-slate-900 appearance-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
              >
                <option value="Super Admin">Super Admin (Full Platform Control)</option>
                <option value="Org Admin">Org Admin (Organization Manager)</option>
                <option value="Operator">Operator (Device & Gateway Operator)</option>
                <option value="Viewer">Viewer (Read-Only Access)</option>
                <option value="Developer">Developer (API & Webhook Access)</option>
              </select>
              <ChevronDown className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Authentication Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Authentication Credentials
            </h2>
            <p className="text-xs text-slate-500">
              Configure initial password assignment mode.
            </p>
          </div>

          <div className="space-y-4">
            <label 
              onClick={() => setAutoGenerate(!autoGenerate)}
              className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-all select-none"
            >
              {autoGenerate ? (
                <CheckSquare className="w-5 h-5 text-[#2563EB] shrink-0" />
              ) : (
                <Square className="w-5 h-5 text-slate-400 shrink-0" />
              )}
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Auto-generate temporary password & send welcome email
                </p>
                <p className="text-[11px] text-slate-500">
                  A secure random password will be dispatched directly to the user's email.
                </p>
              </div>
            </label>

            {!autoGenerate && (
              <div className="flex flex-col gap-1.5 max-w-md">
                <label className="text-xs font-semibold text-slate-700">
                  Manual Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Key className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    required={!autoGenerate}
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    placeholder="Minimum 8 characters"
                    minLength={8}
                    className="w-full h-[48px] pl-10 pr-4 bg-white border border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/users')}
            disabled={loading}
            className="px-5 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-xs hover:shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Creating...' : 'Create User'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}

export default CreateUser;
