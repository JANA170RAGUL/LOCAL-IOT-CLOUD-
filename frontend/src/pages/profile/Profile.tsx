import React, { useState, useEffect } from 'react';
import { Shield, Key, Save, User as UserIcon, Mail, Phone, Lock } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { userApi } from '@/features/users/api/user';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import type { User, ChangePasswordRequest } from '@/features/users/types';
import { NotificationPreferences } from './components/NotificationPreferences';
import { NotificationHistory } from './components/NotificationHistory';

export function Profile() {
  const { user: authUser } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [passwordData, setPasswordData] = useState<ChangePasswordRequest>({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState(false);

  useEffect(() => {
    userApi.getMe()
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(false);
    setPwdLoading(true);

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPwdError("New passwords do not match.");
      setPwdLoading(false);
      return;
    }

    try {
      await userApi.changePassword(passwordData);
      setPwdSuccess(true);
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      setPwdError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setPwdLoading(false);
    }
  };

  if (loading || !profile) return (
    <div className="p-8 text-center text-slate-500 font-medium animate-pulse">
      Loading profile...
    </div>
  );

  const initials = `${profile.first_name?.[0] || 'U'}${profile.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-sans text-slate-800 animate-in fade-in duration-300">
      <PageHeader 
        title="My Profile" 
        description="Manage your account settings, personal details, and preferences."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Avatar & Summary Card */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col items-center text-center shadow-xs">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-md mb-4 ring-4 ring-blue-50">
              {initials}
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {profile.first_name} {profile.last_name}
            </h2>
            <p className="text-slate-500 text-sm mb-4">
              {profile.email}
            </p>
            
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#2563EB] border border-blue-200">
              <Shield className="w-3.5 h-3.5 mr-1.5" />
              {profile.role}
            </span>
          </div>
        </div>

        {/* Right Column: Information & Actions */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          
          {/* Personal Information Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <UserIcon className="w-5 h-5 text-[#2563EB]" />
              <h3 className="text-lg font-semibold text-slate-900">
                Personal Information
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  First Name
                </p>
                <p className="text-sm font-medium text-slate-900">
                  {profile.first_name}
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Last Name
                </p>
                <p className="text-sm font-medium text-slate-900">
                  {profile.last_name}
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 inline" /> Email Address
                </p>
                <p className="text-sm font-medium text-slate-900 truncate">
                  {profile.email}
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 inline" /> Phone Number
                </p>
                <p className="text-sm font-medium text-slate-900">
                  {profile.phone || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <Key className="w-5 h-5 text-[#2563EB]" />
              <h3 className="text-lg font-semibold text-slate-900">
                Change Password
              </h3>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              {pwdError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium">
                  {pwdError}
                </div>
              )}
              {pwdSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
                  Password updated successfully!
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Current Password
                </label>
                <input
                  required
                  type="password"
                  value={passwordData.current_password}
                  onChange={e => setPasswordData({...passwordData, current_password: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-4 focus:ring-blue-50 focus:border-[#2563EB] focus:bg-white transition-all outline-none"
                  placeholder="Enter current password"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> New Password
                </label>
                <input
                  required
                  type="password"
                  value={passwordData.new_password}
                  onChange={e => setPasswordData({...passwordData, new_password: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-4 focus:ring-blue-50 focus:border-[#2563EB] focus:bg-white transition-all outline-none"
                  minLength={8}
                  placeholder="At least 8 characters"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Confirm New Password
                </label>
                <input
                  required
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={e => setPasswordData({...passwordData, confirm_password: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-4 focus:ring-blue-50 focus:border-[#2563EB] focus:bg-white transition-all outline-none"
                  minLength={8}
                  placeholder="Re-enter new password"
                />
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {pwdLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
          
          {/* Notification Preferences */}
          <div>
            <NotificationPreferences />
          </div>

          {/* Notification History */}
          <div>
            <NotificationHistory />
          </div>

        </div>
      </div>
    </div>
  );
}
