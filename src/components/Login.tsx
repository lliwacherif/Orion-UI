import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="userId" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t.userIdLabel} <span className="text-red-500">{t.required}</span>
            </label>
            <input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder={t.userIdPlaceholder}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              required
              aria-required="true"
            />
          </div>

          <div>
            <label 
              htmlFor="tenantId" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t.tenantIdLabel} <span className="text-gray-400 text-xs">{t.tenantIdOptional}</span>
            </label>
            <input
              id="tenantId"
              type="text"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder={t.tenantIdPlaceholder}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 transition font-medium"
            aria-label="Log in to AURA"
          >
            {t.continueButton}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>{t.demoText}</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

