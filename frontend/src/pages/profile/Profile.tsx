import React, { useState, useEffect } from 'react';
import { Shield, Key, Save, User as UserIcon, Bell, History } from 'lucide-react';
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

  if (loading || !profile) return <div className="p-8 text-gray-400">Loading profile...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <PageHeader 
        title="My Profile" 
        description="Manage your account settings and preferences."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="col-span-1 space-y-6">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4">
              {profile.first_name[0]}{profile.last_name[0]}
            </div>
            <h2 className="text-xl font-bold text-white">{profile.first_name} {profile.last_name}</h2>
            <p className="text-gray-400 text-sm mb-4">{profile.email}</p>
            
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
              <Shield className="w-3.5 h-3.5 mr-1.5" />
              {profile.role}
            </span>
          </div>
        </div>

        {/* Right Column: Settings */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
              <UserIcon className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-medium text-white">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400">First Name</p>
                <p className="text-white font-medium">{profile.first_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Last Name</p>
                <p className="text-white font-medium">{profile.last_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Email Address</p>
                <p className="text-white font-medium">{profile.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Phone</p>
                <p className="text-white font-medium">{profile.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
              <Key className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-medium text-white">Change Password</h3>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              {pwdError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm">
                  {pwdError}
                </div>
              )}
              {pwdSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
                  Password updated successfully!
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Current Password</label>
                <input
                  required
                  type="password"
                  value={passwordData.current_password}
                  onChange={e => setPasswordData({...passwordData, current_password: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">New Password</label>
                <input
                  required
                  type="password"
                  value={passwordData.new_password}
                  onChange={e => setPasswordData({...passwordData, new_password: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Confirm New Password</label>
                <input
                  required
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={e => setPasswordData({...passwordData, confirm_password: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                  minLength={8}
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {pwdLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
          
          <div className="mt-6">
            <NotificationPreferences />
          </div>

          <div className="mt-6">
            <NotificationHistory />
          </div>

        </div>
      </div>
    </div>
  );
}
