import React, { useState, useRef, useEffect } from 'react';
import { useModel, ModelType } from '../context/ModelContext';
import { useLanguage } from '../context/LanguageContext';
import { useConversation } from '../context/ConversationContext';
import { useAuth } from '../context/AuthContext';
import { translations } from '../translations';

// Get specialized model name based on user's job title
const getSpecializedModelName = (jobTitle: string | undefined): string => {
  switch (jobTitle) {
    case 'Doctor':
      return 'Orion - Docto';
    case 'Engineer':
      return 'Orion - Archo';
    case 'Lawyer':
      return 'Orion - Themis';
    case 'Accountant':
    default:
      return 'Orion - Chrysus';
  }
};

const ModelSelector: React.FC = () => {
  const { currentModel, setModel, isAgentMode, setAgentMode, isProMode, setProMode } = useModel();
  const { language } = useLanguage();
  const { createNewConversation, clearCurrentConversation } = useConversation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get the specialized model name based on user's job title
  const specializedModelName = getSpecializedModelName(user?.job_title);

  const models = [
    { id: 'chat' as ModelType, name: 'Orion' },
    { id: 'orion-assist' as ModelType, name: specializedModelName },
  ];

  const selectedModel = models.find(m => m.id === currentModel) || models[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleModelChange = async (modelId: ModelType) => {
    setModel(modelId);

    // When switching to Orion Assist, reset to a new empty chat
    if (modelId === 'orion-assist') {
      clearCurrentConversation();
      await createNewConversation();
    }
  };

  const t = translations[language].modelSelector;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-full transition bg-gradient-to-r from-[#558EFA]/85 to-[#0059b3]/85 hover:from-[#558EFA] hover:to-[#0059b3] backdrop-blur-lg border border-white/25 shadow-lg shadow-blue-900/30"
        style={{ color: 'white' }}
        aria-label="Select model"
      >
        <span className="font-semibold text-sm">{selectedModel.name}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 w-56 rounded-xl shadow-2xl z-50 overflow-hidden bg-[#558EFA]/80 backdrop-blur-xl border border-white/15"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/20 flex items-center justify-between">
            <span className="text-white font-semibold text-sm">{t.title}</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Model Options */}
          <div className="p-3 space-y-1">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => handleModelChange(model.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition text-left"
              >
                {/* Model Name */}
                <span className="flex-1 text-white font-medium text-sm">{model.name}</span>

                {/* Radio Button */}
                <div className="flex items-center justify-center">
                  {currentModel === model.id ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-white/60"></div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Orion Pro Toggle (Gemini 2.5) */}
          <div className="px-3 pb-2 pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={() => setProMode(!isProMode)}
              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-left cursor-pointer"
            >
              {/* Left Side: Icon + Label */}
              <div className="flex items-center gap-3">
                {/* Sparkle Icon */}
                <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L13.09 8.26L18.18 9L13.09 9.74L12 16L10.91 9.74L5.82 9L10.91 8.26L12 2Z" />
                  <path d="M6.5 7L7.04 9.54L9.5 10L7.04 10.46L6.5 13L5.96 10.46L3.5 10L5.96 9.54L6.5 7Z" opacity="0.6" />
                  <path d="M17.5 14L18.04 16.54L20.5 17L18.04 17.46L17.5 20L16.96 17.46L14.5 17L16.96 16.54L17.5 14Z" opacity="0.6" />
                </svg>

                {/* Label */}
                <div className="flex flex-col text-left">
                  <span className="text-white font-medium text-sm">
                    Orion Pro
                  </span>
                </div>
              </div>

              {/* Right Side: Switch */}
              <div
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${isProMode ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gray-400/50'
                  }`}
              >
                <span className="sr-only">
                  Use Orion Pro
                </span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isProMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </div>
            </button>
          </div>

          {/* Agent Mode Toggle */}
          <div className="px-3 pb-3">
            <button
              type="button"
              onClick={() => setAgentMode(!isAgentMode)}
              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-left cursor-pointer"
            >
              {/* Left Side: Icon + Label */}
              <div className="flex items-center gap-3">
                {/* Agent Icon */}
                <svg className="w-5 h-5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>

                {/* Label */}
                <div className="flex flex-col text-left">
                  <span className="text-white font-medium text-sm">
                    Agent Mode
                  </span>
                </div>
              </div>

              {/* Right Side: Switch */}
              <div
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${isAgentMode ? 'bg-purple-500' : 'bg-gray-400/50'
                  }`}
              >
                <span className="sr-only">
                  Use Agent Mode
                </span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isAgentMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;

