import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';

const AdminLogin: React.FC = () => {
  const { login } = useAdmin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    const result = await login(username, password);

    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12 overflow-y-auto"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
      }}
    >
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative w-full max-w-md my-auto">
        {/* Admin badge - now inline instead of absolute */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-lg">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            <span className="text-white font-bold text-xs sm:text-sm uppercase tracking-wider">Admin Portal</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
          {/* Logo */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <img
              src="/assets/logo-for-admin.png"
              alt="Orion Admin Logo"
              className="w-24 h-24 sm:w-32 sm:h-32 object-contain"
            />
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-bold text-white text-center mb-1 sm:mb-2">
            Orion Admin
          </h1>
          <p className="text-white/60 text-center text-xs sm:text-sm mb-6 sm:mb-8">
            Sign in to access the admin dashboard
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-2 sm:gap-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-xs sm:text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Username */}
            <div>
              <label className="block text-white/80 text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg sm:rounded-xl text-white text-sm sm:text-base placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-white/80 text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 bg-white/10 border border-white/20 rounded-lg sm:rounded-xl text-white text-sm sm:text-base placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl shadow-lg shadow-amber-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm sm:text-base">Signing in...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Sign in to Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/10">
            <p className="text-white/40 text-[10px] sm:text-xs text-center">
              Orion Admin Dashboard • Secure Access Only
            </p>
          </div>
        </div>

        {/* Back to main app link */}
        <div className="mt-4 sm:mt-6 text-center">
          <a
            href="/"
            className="text-white/60 hover:text-white text-xs sm:text-sm transition inline-flex items-center gap-1"
          >
            ← Back to Orion
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;


