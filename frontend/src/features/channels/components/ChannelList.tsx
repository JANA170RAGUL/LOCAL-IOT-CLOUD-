import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Radio,
  Plus,
  Search,
  Lock,
  Building2,
  Eye,
  Activity,
  Layers,
  Inbox,
  Globe,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { channelsApi, Channel } from '../api/channels';

export const ChannelList: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const data = await channelsApi.getChannels();
        setChannels(data);
      } catch (error) {
        console.error("Failed to fetch channels", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChannels();
  }, []);

  const filteredChannels = channels.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          (c.description && c.description.toLowerCase().includes(search.toLowerCase()));
    const matchesVisibility = !visibilityFilter || c.visibility === visibilityFilter;
    return matchesSearch && matchesVisibility;
  });

  const publicCount = channels.filter(c => c.visibility === 'public').length;
  const privateCount = channels.filter(c => c.visibility === 'private').length;
  const enterpriseCount = channels.filter(c => c.visibility === 'enterprise').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Light Enterprise Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100 shrink-0">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Channels
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Configure telemetry channels, field mapping, and API data streams.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/channels/new')}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Channel</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Channels */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Channels</span>
            <Radio className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {channels.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Active telemetry streams
          </p>
        </div>

        {/* Public Channels */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Public Channels</span>
            <Globe className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            {publicCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Open read access
          </p>
        </div>

        {/* Private Channels */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Private Channels</span>
            <Lock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600">
            {privateCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            API key required
          </p>
        </div>

        {/* Enterprise Channels */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Enterprise Channels</span>
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-600">
            {enterpriseCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            JWT & RBAC enforced
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-8 relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search channels by name or description..."
              className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all"
            />
          </div>

          {/* Visibility Filter Dropdown */}
          <div className="sm:col-span-4">
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
            >
              <option value="">All Visibilities</option>
              <option value="public">🌐 Public</option>
              <option value="private">🔒 Private</option>
              <option value="enterprise">🛡️ Enterprise</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-400 animate-pulse font-medium shadow-xs">
          Loading telemetry channels...
        </div>
      ) : filteredChannels.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200/90 p-16 text-center shadow-xs">
          <div className="max-w-sm mx-auto flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100">
              <Radio className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              No channels created yet
            </h3>
            <p className="text-xs text-slate-500">
              Configure your first telemetry channel to start collecting and streaming IoT sensor feeds.
            </p>
            <button
              onClick={() => navigate('/channels/new')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" /> Create Your First Channel
            </button>
          </div>
        </div>
      ) : (
        /* Channels Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChannels.map((channel) => (
            <div
              key={channel.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Title & Badge Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors">
                    {channel.name}
                  </h3>
                  
                  {channel.visibility === 'public' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <Globe className="w-3 h-3 text-emerald-500" /> Public
                    </span>
                  )}
                  {channel.visibility === 'private' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                      <Lock className="w-3 h-3 text-amber-500" /> Private
                    </span>
                  )}
                  {channel.visibility === 'enterprise' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                      <ShieldCheck className="w-3 h-3 text-indigo-500" /> Enterprise
                    </span>
                  )}
                </div>

                <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-4 h-8">
                  {channel.description || 'No description provided for this channel.'}
                </p>
              </div>

              {/* Footer Row */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <Activity className="w-3.5 h-3.5 text-[#2563EB]" />
                  {channel.fields?.length || 0} Fields Configured
                </span>

                <button
                  onClick={() => navigate(`/channels/${channel.id}`)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default ChannelList;
