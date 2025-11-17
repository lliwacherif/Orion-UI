import React, { useState, useRef, useEffect } from 'react';
import { useModel, ModelType } from '../context/ModelContext';
import { useLanguage } from '../context/LanguageContext';

const ModelSelector: React.FC = () => {
  const { currentModel, setModel } = useModel();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isTemporaryMode, setIsTemporaryMode] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const models = [
    { id: 'chat' as ModelType, name: 'AURA' },
    { id: 'ocr' as ModelType, name: 'OCR' },
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

  const handleModelChange = (modelId: ModelType) => {
    setModel(modelId);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-full transition bg-gradient-to-r from-[#003A70]/85 to-[#0059b3]/85 hover:from-[#003A70] hover:to-[#0059b3] backdrop-blur-lg border border-white/25 shadow-lg shadow-blue-900/30"
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
          className="absolute top-full left-0 mt-2 w-56 rounded-xl shadow-2xl z-50 overflow-hidden bg-[#003A70]/80 backdrop-blur-xl border border-white/15"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/20 flex items-center justify-between">
            <span className="text-white font-semibold text-sm">Model</span>
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

          {/* Temporary Chat Toggle */}
          <div className="px-3 pb-3 pt-1">
            <button
              onClick={() => setIsTemporaryMode(!isTemporaryMode)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition text-left"
            >
              {/* Clock Icon */}
              <svg className="w-5 h-5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              
              {/* Label */}
              <span className="flex-1 text-white font-medium text-sm">
                {language === 'en' ? 'Temporary chat' : 'Chat temporaire'}
              </span>
              
              {/* Toggle Switch */}
              <div 
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  isTemporaryMode ? 'bg-emerald-400' : 'bg-white/30'
                }`}
              >
                <div 
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    isTemporaryMode ? 'translate-x-5' : 'translate-x-0'
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

