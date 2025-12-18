import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const InvitationCode: React.FC = () => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { completeInvitation, logout } = useAuth();
    const { language, toggleLanguage } = useLanguage();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Hardcoded check
        if (code === '12300liwa') {
            // Simulate API call delay
            setTimeout(() => {
                completeInvitation();
                setLoading(false);
            }, 800);
        } else {
            setLoading(false);
            setError(language === 'en' ? 'Invalid invitation code' : 'Code d\'invitation invalide');
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
                            {language === 'en' ? 'Invitation Code' : 'Code d\'invitation'}
                        </h2>
                        <p className="mb-1 text-center text-gray-500 text-sm">
                            {language === 'en' ? 'Step 2 of 3' : 'Étape 2 sur 3'}
                        </p>
                        <p className="mb-6 sm:mb-8 text-center text-gray-600 text-sm">
                            {language === 'en'
                                ? 'Please enter your invitation code to continue.'
                                : 'Veuillez saisir votre code d\'invitation pour continuer.'}
                        </p>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                ⚠️ {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Code Input */}
                            <div>
                                <label htmlFor="code" className="block text-sm font-medium mb-2" style={{ color: '#0EA5E9' }}>
                                    {language === 'en' ? 'Invitation Code' : 'Code d\'invitation'} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="code"
                                    type="text"
                                    name="code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="12345..."
                                    className="block w-full rounded-lg p-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono text-center tracking-widest uppercase"
                                    style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: '#0EA5E9' }}
                                    required
                                    disabled={loading}
                                    autoComplete="off"
                                />
                            </div>

                            {/* Verify Button */}
                            <button
                                type="submit"
                                className="w-full rounded-lg bg-gradient-to-r from-green-400 to-cyan-500 py-3 px-4 text-base font-medium text-white shadow-sm hover:from-green-500 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                disabled={loading}
                            >
                                {loading
                                    ? (language === 'en' ? 'Verifying...' : 'Vérification...')
                                    : (language === 'en' ? 'Verify Code' : 'Vérifier le code')
                                }
                            </button>

                            {/* Logout link */}
                            <div className="text-center text-sm text-gray-600 mt-4">
                                <button
                                    onClick={logout}
                                    className="font-medium text-gray-500 hover:text-gray-700 transition-colors underline"
                                    type="button"
                                >
                                    {language === 'en' ? 'Log out' : 'Se déconnecter'}
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

export default InvitationCode;
