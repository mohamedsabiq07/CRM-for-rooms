import React, { useState } from 'react';
import { Building2, Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('abuthalif');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (cleanUser === 'abuthalif' && cleanPass === '123456789') {
      localStorage.setItem('room_crm_auth', 'true');
      localStorage.setItem('room_crm_username', 'abuthalif');
      setError('');
      onLogin();
    } else {
      setError('Invalid username or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-slate-800 border border-slate-700 rounded-2xl mx-auto flex items-center justify-center text-slate-200 shadow-md mb-3 font-bold">
            <Building2 className="w-7 h-7 text-slate-200" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            RentPulse
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">
            Property & Partition Management
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-slate-200">
          <div className="mb-6">
            <h2 className="text-base font-bold text-slate-900">Sign In to Dashboard</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your property manager credentials to continue
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="abuthalif"
                  className="w-full text-sm pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full text-sm pl-9 pr-10 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition cursor-pointer flex items-center justify-center gap-2 mt-2 shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
              <span>Log In</span>
            </button>
          </form>

          {/* Quick Helper */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Manager: <span className="font-mono text-slate-700 font-semibold">abuthalif</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
