import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import { FcGoogle } from 'react-icons/fc';
import { FaMicrosoft } from 'react-icons/fa';

const Login: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const { login } = useSession();
  const { language } = useLanguage();
  const t = translations[language].login;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userId.trim()) {
      login(userId.trim(), tenantId.trim() || undefined);
    }
  };

  return (
    // Main container with background image
    <div 
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundImage: 'url(/assets/background.jpg)',
        backgroundSize: '130%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Logo at the top */}
      <img 
        src="/assets/AURA_Icon.png" 
        alt="Aura Logo" 
        className="absolute top-8 sm:top-12 z-20 h-12 w-12 sm:h-14 sm:w-14 object-contain" 
      />

      {/* Blue shadow effect container */}
      <div className="relative w-[90vw] sm:w-[85vw] md:w-[70vw] lg:w-[50vw] xl:w-[416px] max-w-[416px] px-4 sm:px-0">
        {/* Blue shadow underneath the card */}
        <div className="absolute inset-0 translate-y-4 transform rounded-3xl bg-blue-500/35 blur-xl"></div>
        
        {/* Login Card */}
        <div className="relative w-full overflow-hidden rounded-3xl bg-white/95 backdrop-blur-sm shadow-2xl">
          
          {/* Mask Image: Positioned in bottom left */}
          <img
            src="/assets/mask.png"
            alt="Decorative mask"
            className="absolute h-64 w-64 opacity-40 z-0"
            style={{ left: '-15%', bottom: 0 }}
          />

          {/* Card Content */}
          <div className="relative z-10 p-6 sm:p-8 md:p-10">
            <h2 className="mb-6 sm:mb-8 text-center text-2xl sm:text-3xl font-bold" style={{ color: '#003A70' }}>
              Welcome
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* User ID Input */}
              <div>
                <label htmlFor="userId" className="block text-sm font-medium mb-2" style={{ color: '#0EA5E9' }}>
                  {t.userIdLabel}
                </label>
                <input
                  type="text"
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder={t.userIdPlaceholder}
                  className="block w-full rounded-lg p-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: '#0EA5E9' }}
                  required
                  aria-required="true"
                />
              </div>

              {/* Tenant ID Input */}
              <div>
                <label htmlFor="tenantId" className="block text-sm font-medium mb-2" style={{ color: '#0EA5E9' }}>
                  {t.tenantIdLabel} <span className="text-gray-400 text-xs">({t.tenantIdOptional})</span>
                </label>
                <input
                  type="text"
                  id="tenantId"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  placeholder={t.tenantIdPlaceholder}
                  className="block w-full rounded-lg p-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: '#0EA5E9' }}
                />
              </div>

              {/* Continue Button */}
              <button
                type="submit"
                className="w-full rounded-lg bg-gradient-to-r from-green-400 to-cyan-500 py-3 px-4 text-base font-medium text-white shadow-sm hover:from-green-500 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all"
              >
                {t.continueButton}
              </button>

              {/* Sign up link */}
              <p className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Sign up
                </a>
              </p>
            </form>

            {/* "OR" Separator */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-3 text-gray-400">OR</span>
              </div>
            </div>

            {/* Social Logins */}
            <div className="space-y-3">
              {/* Google Button */}
              <button 
                type="button"
                className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white py-3 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <span className="mr-3">
                  <FcGoogle size={20} />
                </span>
                Continue with Google
              </button>

              {/* Microsoft Button */}
              <button 
                type="button"
                className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white py-3 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <span className="mr-3">
                  <FaMicrosoft size={20} color="#0078D4" />
                </span>
                Continue with Microsoft Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Text */}
      <div className="absolute bottom-4 sm:bottom-8 text-xs font-medium tracking-wider" style={{ color: '#003A70' }}>
        POWERED BY VAERDIA
      </div>
    </div>
  );
};

export default Login;
