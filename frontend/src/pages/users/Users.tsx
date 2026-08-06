import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Users as UsersIcon,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Mail,
  User as UserIcon,
  Edit2,
  ShieldOff,
  Eye,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react';
import { userApi } from '@/features/users/api/user';
import type { User } from '@/features/users/types';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

export function Users() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeChip, setActiveChip] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userApi.list({
        search,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        page,
        page_size: 20
      });
      setUsers(data.items);
      setTotalPages(data.total_pages);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter, page]);

  const canManageUsers = currentUser?.role === 'Super Admin' || currentUser?.role === 'Org Admin' || currentUser?.role === 'Admin';

  const handleDisable = async (id: string) => {
    if (confirm('Are you sure you want to disable this user?')) {
      try {
        await userApi.delete(id);
        fetchUsers();
      } catch (error) {
        console.error('Failed to disable user:', error);
      }
    }
  };

  const handleChipClick = (chip: string) => {
    setActiveChip(chip);
    setPage(1);
    if (chip === 'all') { setRoleFilter(''); setStatusFilter(''); }
    else if (chip === 'admins') { setRoleFilter('Super Admin'); setStatusFilter(''); }
    else if (chip === 'active') { setRoleFilter(''); setStatusFilter('ACTIVE'); }
    else if (chip === 'inactive') { setRoleFilter(''); setStatusFilter('INACTIVE'); }
  };

  const totalUsersCount = users.length;
  const activeCount = users.filter(u => u.status === 'ACTIVE').length;
  const adminCount = users.filter(u => u.role.includes('Admin')).length;
  const inactiveCount = users.filter(u => u.status === 'INACTIVE').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <span>Home</span>
        <span>/</span>
        <span>Administration</span>
        <span>/</span>
        <span className="text-[#2563EB] font-bold">Users</span>
      </div>

      {/* Light Enterprise Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100 shrink-0">
            <UsersIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Users
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage platform accounts, roles, and administrative permissions.
            </p>
          </div>
        </div>

        {canManageUsers && (
          <button
            onClick={() => navigate('/users/create')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Accounts</span>
            <UsersIcon className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {totalUsersCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Registered platform users
          </p>
        </div>

        {/* Admin Roles */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Admin Roles</span>
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-600">
            {adminCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Elevated permissions
          </p>
        </div>

        {/* Active Users */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Active Users</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            {activeCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Operational accounts
          </p>
        </div>

        {/* Inactive */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Inactive / Blocked</span>
            <ShieldOff className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600">
            {inactiveCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Disabled access
          </p>
        </div>
      </div>

      {/* Filter Control Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          {/* Search Input */}
          <div className="sm:col-span-6 relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or email..."
              className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all"
            />
          </div>

          {/* Role Filter Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); setActiveChip(''); }}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Org Admin">Org Admin</option>
              <option value="Operator">Operator</option>
              <option value="Viewer">Viewer</option>
              <option value="Developer">Developer</option>
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); setActiveChip(''); }}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">🟢 Active</option>
              <option value="INACTIVE">🔴 Inactive</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Quick Filter:
          </span>

          {[
            { id: 'all', label: 'All Users' },
            { id: 'admins', label: '🛡️ Admins' },
            { id: 'active', label: '🟢 Active' },
            { id: 'inactive', label: '🔴 Inactive' },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => handleChipClick(chip.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeChip === chip.id
                  ? 'bg-[#2563EB] text-white shadow-2xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Light Data Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/90 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-6">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Last Login</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 animate-pulse font-medium">
                    Loading users data...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                /* Empty State Component */
                <tr>
                  <td colSpan={5} className="py-16 px-6 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center text-center space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-200">
                        <Inbox className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        No users found
                      </h3>
                      <p className="text-xs text-slate-500">
                        Add a new user to grant platform access or adjust your search parameters.
                      </p>
                      {canManageUsers && (
                        <button
                          onClick={() => navigate('/users/create')}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> Add User
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const initials = `${user.first_name?.[0] || 'U'}${user.last_name?.[0] || ''}`.toUpperCase();

                  return (
                    <tr 
                      key={user.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* User Identity */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div 
                              onClick={() => navigate(`/users/${user.id}`)}
                              className="font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors cursor-pointer"
                            >
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" /> {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Shield className="w-3 h-3 text-blue-500" />
                          {user.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                          user.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`} />
                          {user.status}
                        </span>
                      </td>

                      {/* Last Login */}
                      <td className="py-4 px-4 text-xs text-slate-500">
                        {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/users/${user.id}`)}
                            title="View User Details"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canManageUsers && (
                            <>
                              <button
                                onClick={() => navigate(`/users/${user.id}/edit`)}
                                title="Edit User"
                                className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDisable(user.id)}
                                title="Disable User"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                              >
                                <ShieldOff className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {users.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>Showing Page</span>
              <span className="font-bold text-slate-900">{page}</span>
              <span>of</span>
              <span className="font-bold text-slate-900">{totalPages}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="px-3 py-1 font-medium text-slate-900">
                Page {page} of {totalPages}
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default Users;
