import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FcGoogle } from 'react-icons/fc';
import { FaMicrosoft } from 'react-icons/fa';

interface AuthLoginProps {
  onSwitchToRegister: () => void;
}

const AuthLogin: React.FC<AuthLoginProps> = ({ onSwitchToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { language, toggleLanguage } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);

    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    // If successful, the AuthContext will update and user will be redirected
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
      {/* Language Toggle - Top Right */}
      <button
        onClick={toggleLanguage}
        className="absolute top-6 right-6 z-20 p-2.5 bg-gradient-to-r from-blue-500 to-green-400 hover:from-blue-600 hover:to-green-500 rounded-full transition-all shadow-md"
        title={language === 'en' ? 'Switch to French' : 'Passer à l\'anglais'}
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      </button>

      {/* Logo at the top */}
      <img
        src="/assets/orion logo.png"
        alt="Orion Logo"
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
              {language === 'en' ? 'Welcome' : 'Bienvenue'}
            </h2>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Username Input */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-2" style={{ color: '#0EA5E9' }}>
                  {language === 'en' ? 'Username' : 'Nom d\'utilisateur'}
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={language === 'en' ? 'Enter your username' : 'Entrez votre nom d\'utilisateur'}
                  className="block w-full rounded-lg p-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: '#0EA5E9' }}
                  required
                  disabled={loading}
                />
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#0EA5E9' }}>
                  {language === 'en' ? 'Password' : 'Mot de passe'}
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={language === 'en' ? 'Enter your password' : 'Entrez votre mot de passe'}
                  className="block w-full rounded-lg p-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: '#0EA5E9' }}
                  required
                  disabled={loading}
                />
              </div>

              {/* Continue Button */}
              <button
                type="submit"
                className="w-full rounded-lg bg-gradient-to-r from-green-400 to-cyan-500 py-3 px-4 text-base font-medium text-white shadow-sm hover:from-green-500 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading
                  ? (language === 'en' ? 'Signing in...' : 'Connexion...')
                  : (language === 'en' ? 'Continue' : 'Continuer')
                }
              </button>

              {/* Sign up link */}
              <div className="text-center text-sm text-gray-600">
                {language === 'en' ? 'Don\'t have an account?' : 'Pas de compte?'}{' '}
                <button
                  onClick={onSwitchToRegister}
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  type="button"
                >
                  {language === 'en' ? 'Sign up' : 'S\'inscrire'}
                </button>
              </div>
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
        POWERED BY CherifCorp Technologies
      </div>
    </div>
  );
};

export default AuthLogin;
