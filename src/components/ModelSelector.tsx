import React, { useState, useRef, useEffect } from 'react';
import { useModel, ModelType } from '../context/ModelContext';
import { useLanguage } from '../context/LanguageContext';

const ModelSelector: React.FC = () => {
  const { currentModel, setModel } = useModel();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const models = [
    { id: 'chat' as ModelType, name: 'AURA', description: language === 'en' ? 'General chat' : 'Chat général' },
    { id: 'doc' as ModelType, name: 'AURA Doc', description: language === 'en' ? 'Document analysis' : 'Analyse de documents' },
    { id: 'vision' as ModelType, name: 'AURA Vision', description: language === 'en' ? 'Image analysis' : 'Analyse d\'images' },
    { id: 'ocr' as ModelType, name: 'AURA OCR', description: language === 'en' ? 'Text extraction' : 'Extraction de texte' },
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
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition text-white"
        aria-label="Select model"
      >
        <span className="font-semibold">{selectedModel.name}</span>
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
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => handleModelChange(model.id)}
              className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition text-left ${
                currentModel === model.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{model.name}</div>
                <div className="text-xs text-gray-500">{model.description}</div>
              </div>
              {currentModel === model.id && (
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelSelector;

