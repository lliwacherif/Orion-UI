import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { language, toggleLanguage } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError(language === 'en' ? 'Passwords do not match' : 'Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      setError(language === 'en' ? 'Password must be at least 6 characters' : 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    const result = await register(
      formData.username,
      formData.email,
      formData.password,
      formData.fullName
    );

    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Registration failed');
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 919-9" />
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

        {/* Register Card */}
        <div className="relative w-full max-h-[90vh] overflow-y-auto overflow-hidden rounded-3xl bg-white/95 backdrop-blur-sm shadow-2xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

          {/* Spiral Image: Positioned in bottom left */}
          <img
            src="/assets/spiral.png"
            alt="Spiral"
            className="absolute -bottom-20 -left-20 h-48 w-48 opacity-30"
          />

          {/* Card Content */}
          <div className="relative z-10 p-6 sm:p-8 md:p-10">
            <h2 className="mb-6 sm:mb-8 text-center text-2xl sm:text-3xl font-bold" style={{ color: '#558EFA' }}>
              {language === 'en' ? 'Create Account' : 'Créer un compte'}
            </h2>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-2" style={{ color: '#0EA5E9' }}>
                  {language === 'en' ? 'Username' : 'Nom d\'utilisateur'} <span className="text-red-500">*</span>
                </label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder={language === 'en' ? 'Choose a username' : 'Choisissez un nom d\'utilisateur'}
                  className="block w-full rounded-lg p-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: '#0EA5E9' }}
                  required
                  minLength={3}
                  disabled={loading}
                />
              </div>

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#0EA5E9' }}>
                  {language === 'en' ? 'Email' : 'Email'} <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={language === 'en' ? 'your@email.com' : 'votre@email.com'}
                  className="block w-full rounded-lg p-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: '#0EA5E9' }}
                  required
                  disabled={loading}
                />
              </div>

              {/* Full Name Input */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium mb-2" style={{ color: '#0EA5E9' }}>
                  {language === 'en' ? 'Full Name' : 'Nom complet'} <span className="text-gray-400 text-xs">({language === 'en' ? 'Optional' : 'Optionnel'})</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder={language === 'en' ? 'John Doe' : 'Jean Dupont'}
                  className="block w-full rounded-lg p-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: '#0EA5E9' }}
                  disabled={loading}
                />
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#0EA5E9' }}>
                  {language === 'en' ? 'Password' : 'Mot de passe'} <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={language === 'en' ? 'At least 6 characters' : 'Au moins 6 caractères'}
                  className="block w-full rounded-lg p-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: '#0EA5E9' }}
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>

              {/* Confirm Password Input */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" style={{ color: '#0EA5E9' }}>
                  {language === 'en' ? 'Confirm Password' : 'Confirmer le mot de passe'} <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder={language === 'en' ? 'Re-enter your password' : 'Ressaisissez votre mot de passe'}
                  className="block w-full rounded-lg p-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: '#0EA5E9' }}
                  required
                  disabled={loading}
                />
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                className="w-full rounded-lg bg-gradient-to-r from-green-400 to-cyan-500 py-3 px-4 text-base font-medium text-white shadow-sm hover:from-green-500 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                disabled={loading}
              >
                {loading
                  ? (language === 'en' ? 'Creating account...' : 'Création du compte...')
                  : (language === 'en' ? 'Create Account' : 'Créer un compte')
                }
              </button>

              {/* Login link */}
              <div className="text-center text-sm text-gray-600 mt-4">
                {language === 'en' ? 'Already have an account?' : 'Vous avez déjà un compte?'}{' '}
                <button
                  onClick={onSwitchToLogin}
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  type="button"
                >
                  {language === 'en' ? 'Login here' : 'Connectez-vous ici'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Footer Text */}
      <div className="absolute bottom-4 sm:bottom-8 text-xs font-medium tracking-wider" style={{ color: '#558EFA' }}>
        POWERED BY CherifCorp Technologies
      </div>
    </div>
  );
};

export default Register;
