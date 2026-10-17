import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Cloud,
  Lock,
  Eye,
  EyeOff,
  Mail,
  ArrowRight
} from 'lucide-react';
import { login, getMe } from '../features/auth/api/auth';
import { useAuthStore } from '../features/auth/store/useAuthStore';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@localiot.com');
  const [password, setPassword] = useState('Password@123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { access_token, refresh_token } = await login({ email, password });
      useAuthStore.setState({ token: access_token, refreshToken: refresh_token });
      const user = await getMe();
      setAuth(access_token, refresh_token, user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-y-auto overflow-x-hidden bg-slate-950 font-sans text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Bright Matte Finish High-Resolution Background Image */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.15), rgba(15, 23, 42, 0.30)), url('/landing_bg.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          imageRendering: 'crisp-edges',
          filter: 'brightness(1.15) contrast(0.98)',
        }}
      />

      {/* Background Animated Gradient Mesh */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30 mix-blend-screen z-0"
        style={{
          background: `
            radial-gradient(circle at 15% 25%, rgba(99, 102, 241, 0.35) 0%, transparent 45%),
            radial-gradient(circle at 75% 15%, rgba(192, 38, 211, 0.30) 0%, transparent 45%),
            radial-gradient(circle at 85% 75%, rgba(244, 63, 94, 0.25) 0%, transparent 50%),
            radial-gradient(circle at 25% 85%, rgba(251, 113, 133, 0.30) 0%, transparent 45%)
          `,
          backgroundSize: '180% 180%',
          animation: 'gradientFlow 20s ease infiniteAlternate',
        }}
      />

      {/* Grid Overlay Line Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-15 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px',
        }}
      />

      <style>{`
        @keyframes gradientFlow {
          0% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
          100% { background-position: 0% 0%; }
        }
      `}</style>

      {/* Top Header Bar */}
      <header className="relative z-20 flex items-center justify-between w-full max-w-7xl mx-auto mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/30">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Cloud className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <span className="text-xl font-bold tracking-tight text-white !text-white">
            Local IoT Cloud
          </span>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-semibold text-emerald-300 tracking-wide">
            System ● Online
          </span>
        </div>
      </header>

      {/* Main Centered Login Container */}
      <div 
        className="login-transparent relative z-10 w-full max-w-md mx-auto flex-1 flex items-center justify-center py-6 !bg-transparent"
        style={{ backgroundColor: 'transparent' }}
      >
        
        {/* Glassmorphism Login Card */}
        <div className="w-full rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 p-6 sm:p-8 shadow-2xl text-slate-900">
          
          {/* Header Cloud Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 p-0.5 shadow-lg shadow-indigo-500/30">
              <div 
                className="w-full h-full rounded-[14px] flex items-center justify-center !bg-white"
                style={{ backgroundColor: '#ffffff' }}
              >
                <Cloud className="w-7 h-7 text-indigo-600" />
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-extrabold text-center text-slate-900 tracking-tight">
            Welcome Back
          </h2>
          <p className="text-xs sm:text-sm text-center text-slate-500 mt-1 mb-6 font-medium">
            Access your Local IoT Cloud
          </p>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@localiot.com"
                  className="w-full h-11 pl-10 pr-4 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-10 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Options Row */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-600">Remember Me</span>
              </label>

              <a
                href="#"
                onClick={(e) => { e.preventDefault(); alert("Please contact your Platform Super Admin to reset credentials."); }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Forgot Password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 active:scale-[0.99] text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connecting...</span>
                </div>
              ) : (
                <>
                  <span>SIGN IN</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Footer Security Note */}
          <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Secure local authentication</span>
          </div>

        </div>

      </div>

      {/* Footer Copyright */}
      <footer className="relative z-10 w-full text-center py-2 text-[11px] font-medium text-slate-400">
        Version 1.0 • © 2026 Local IoT Cloud Platform
      </footer>

    </div>
  );
};

export default Login;
