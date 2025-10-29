import React from 'react';
import { Activity } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';

interface PulseButtonProps {
  onClick: () => void;
}

const PulseButton: React.FC<PulseButtonProps> = ({ onClick }) => {
  const { language } = useLanguage();
  const t = translations[language].pulse;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-32 right-6 z-40 group"
      title={t.buttonTooltip}
      aria-label={t.buttonTooltip}
    >
      {/* Button */}
      <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#48d1cc] to-[#1e90ff] shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-center group-hover:scale-110">
        <Activity className="w-7 h-7 text-white" />
      </div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
        {t.buttonTooltip}
        <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
      </div>
    </button>
  );
};

export default PulseButton;
