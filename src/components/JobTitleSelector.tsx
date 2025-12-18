import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { JobTitle } from '../types/orcha';

interface JobTitleOption {
  value: JobTitle;
  labelEn: string;
  labelFr: string;
  icon: React.ReactNode;
  gradient: string;
  shadowColor: string;
  glowColor: string;
}

const jobTitleOptions: JobTitleOption[] = [
  {
    value: 'Doctor',
    labelEn: 'Doctor',
    labelFr: 'Médecin',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
    gradient: 'from-rose-400/30 via-red-400/25 to-pink-500/30',
    shadowColor: 'shadow-rose-500/30',
    glowColor: 'rgba(244, 63, 94, 0.4)'
  },
  {
    value: 'Lawyer',
    labelEn: 'Lawyer',
    labelFr: 'Avocat',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
      </svg>
    ),
    gradient: 'from-amber-400/30 via-orange-400/25 to-yellow-500/30',
    shadowColor: 'shadow-amber-500/30',
    glowColor: 'rgba(245, 158, 11, 0.4)'
  },
  {
    value: 'Engineer',
    labelEn: 'Engineer',
    labelFr: 'Ingénieur',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
      </svg>
    ),
    gradient: 'from-cyan-400/30 via-blue-400/25 to-teal-500/30',
    shadowColor: 'shadow-cyan-500/30',
    glowColor: 'rgba(6, 182, 212, 0.4)'
  },
  {
    value: 'Accountant',
    labelEn: 'Accountant',
    labelFr: 'Comptable',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V13.5Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0 0 12 2.25Z" />
      </svg>
    ),
    gradient: 'from-emerald-400/30 via-green-400/25 to-lime-500/30',
    shadowColor: 'shadow-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.4)'
  }
];

const JobTitleSelector: React.FC = () => {
  const [selectedTitle, setSelectedTitle] = useState<JobTitle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { updateJobTitle, logout } = useAuth();
  const { language, toggleLanguage } = useLanguage();

  const handleSelect = (title: JobTitle) => {
    setSelectedTitle(title);
    setError('');
  };

  const handleConfirm = async () => {
    if (!selectedTitle) {
      setError(language === 'en' ? 'Please select your job title' : 'Veuillez sélectionner votre titre de poste');
      return;
    }

    setLoading(true);
    setError('');

    const result = await updateJobTitle(selectedTitle);

    setLoading(false);

    if (!result.success) {
      setError(result.error || (language === 'en' ? 'Failed to update job title' : 'Échec de la mise à jour du titre de poste'));
    }
    // If successful, AuthContext will update and user will be redirected
  };

  return (
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
      <div className="relative w-[90vw] sm:w-[85vw] md:w-[75vw] lg:w-[60vw] xl:w-[520px] max-w-[520px] px-4 sm:px-0">
        {/* Blue shadow underneath the card */}
        <div className="absolute inset-0 translate-y-4 transform rounded-3xl bg-blue-500/35 blur-xl"></div>

        {/* Card */}
        <div className="relative w-full overflow-hidden rounded-3xl bg-white/95 backdrop-blur-sm shadow-2xl">
          {/* Spiral Image: Positioned in bottom left */}
          <img
            src="/assets/spiral.png"
            alt="Spiral"
            className="absolute -bottom-20 -left-20 h-48 w-48 opacity-30"
          />

          {/* Card Content */}
          <div className="relative z-10 p-6 sm:p-8 md:p-10">
            <h2 className="mb-2 text-center text-2xl sm:text-3xl font-bold" style={{ color: '#558EFA' }}>
              {language === 'en' ? 'What\'s Your Profession?' : 'Quelle est votre profession?'}
            </h2>
            <p className="mb-6 sm:mb-8 text-center text-gray-600 text-sm">
              {language === 'en'
                ? 'Select your job title to personalize your experience'
                : 'Sélectionnez votre titre de poste pour personnaliser votre expérience'}
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                ⚠️ {error}
              </div>
            )}

            {/* Job Title Capsules Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {jobTitleOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  disabled={loading}
                  className={`
                    group relative p-5 rounded-2xl backdrop-blur-md border-2 transition-all duration-300
                    ${selectedTitle === option.value
                      ? `bg-gradient-to-br ${option.gradient} border-white/60 scale-105 ${option.shadowColor} shadow-xl`
                      : 'bg-white/40 border-white/30 hover:border-white/50 hover:bg-white/60 shadow-lg hover:shadow-xl'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  style={{
                    boxShadow: selectedTitle === option.value
                      ? `0 8px 32px ${option.glowColor}, inset 0 1px 0 rgba(255,255,255,0.4)`
                      : '0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.4)'
                  }}
                >
                  {/* Glow effect for selected */}
                  {selectedTitle === option.value && (
                    <div
                      className="absolute inset-0 rounded-2xl blur-xl opacity-40 -z-10"
                      style={{ backgroundColor: option.glowColor }}
                    />
                  )}

                  {/* Selection indicator */}
                  <div className={`
                    absolute top-3 right-3 w-5 h-5 rounded-full border-2 transition-all duration-300
                    ${selectedTitle === option.value
                      ? 'border-white bg-white/80'
                      : 'border-gray-300 bg-white/50'
                    }
                  `}>
                    {selectedTitle === option.value && (
                      <svg className="w-full h-full text-green-500 p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  {/* Icon */}
                  <div className={`
                    mb-3 transition-all duration-300
                    ${selectedTitle === option.value ? 'text-gray-800 scale-110' : 'text-gray-600 group-hover:text-gray-800 group-hover:scale-105'}
                  `}>
                    {option.icon}
                  </div>

                  {/* Label */}
                  <span className={`
                    font-semibold text-sm transition-colors duration-300
                    ${selectedTitle === option.value ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'}
                  `}>
                    {language === 'en' ? option.labelEn : option.labelFr}
                  </span>

                  {/* Glass shine effect */}
                  <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
                  </div>
                </button>
              ))}
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              disabled={loading || !selectedTitle}
              className="w-full rounded-lg bg-gradient-to-r from-green-400 to-cyan-500 py-3 px-4 text-base font-medium text-white shadow-sm hover:from-green-500 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {language === 'en' ? 'Setting up...' : 'Configuration...'}
                </span>
              ) : (
                language === 'en' ? 'Continue' : 'Continuer'
              )}
            </button>

            {/* Logout link */}
            <div className="text-center text-sm text-gray-600 mt-4">
              <button
                onClick={logout}
                className="font-medium text-gray-500 hover:text-gray-700 transition-colors underline"
                type="button"
                disabled={loading}
              >
                {language === 'en' ? 'Log out' : 'Se déconnecter'}
              </button>
            </div>
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

export default JobTitleSelector;

