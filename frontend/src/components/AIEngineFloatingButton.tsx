import React from 'react';
import { useNavigate } from 'react-router';
import { Sparkles, Brain, Lock, ChevronRight } from 'lucide-react';
import { useLicenseStatus } from '../features/settings/api/license';

export const AIEngineFloatingButton: React.FC = () => {
  const navigate = useNavigate();
  const { data: licenseData } = useLicenseStatus();
  
  // Check if license is active/enabled
  const isEnabled = licenseData?.status === 'ACTIVE' || licenseData?.status === 'VALID';

  const handleClick = () => {
    navigate('/ai-engine');
  };

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[9999] font-sans">
      <button
        onClick={handleClick}
        title="Open AI Decision Engine"
        className="relative group flex items-center gap-2.5 px-4 py-1.5 bg-slate-950/90 hover:bg-slate-900 border border-blue-500/50 hover:border-cyan-400 rounded-full shadow-[0_0_25px_rgba(37,99,235,0.45)] hover:shadow-[0_0_35px_rgba(6,182,212,0.65)] backdrop-blur-md transition-all duration-300 cursor-pointer"
      >
        {/* Futuristic Glowing Aura Ring */}
        <div className={`absolute -inset-1 rounded-full bg-gradient-to-r ${
          isEnabled 
            ? 'from-blue-600 via-cyan-400 to-indigo-600' 
            : 'from-amber-600 via-rose-500 to-purple-600'
        } opacity-60 blur-xs animate-pulse group-hover:opacity-100 transition-all`} />

        {/* Inner Badge Icon */}
        <div className={`relative w-7 h-7 rounded-full ${
          isEnabled
            ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white'
            : 'bg-slate-900 text-rose-400 border border-rose-500/50'
        } flex items-center justify-center shadow-inner shrink-0`}>
          {isEnabled ? (
            <Brain className="w-4 h-4 text-cyan-100" />
          ) : (
            <Lock className="w-4 h-4 text-rose-400" />
          )}

          {/* Glowing Active Dot */}
          <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
            isEnabled 
              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]' 
              : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)]'
          }`} />
        </div>

        {/* Button Label */}
        <div className="relative flex items-center gap-2">
          <span className="text-xs font-black tracking-wider uppercase bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            AI Engine
          </span>

          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full border ${
            isEnabled
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
          }`}>
            {isEnabled ? 'Ready' : 'Locked'}
          </span>

          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
        </div>
      </button>
    </div>
  );
};
