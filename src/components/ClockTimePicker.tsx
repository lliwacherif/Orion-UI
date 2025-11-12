import React, { useState } from 'react';
import { Clock } from 'lucide-react';

interface ClockTimePickerProps {
  value: string; // Format: "HH:MM AM/PM"
  onChange: (time: string) => void;
  language: 'en' | 'fr';
}

const ClockTimePicker: React.FC<ClockTimePickerProps> = ({ value, onChange, language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [isPM, setIsPM] = useState(true);

  // Parse current value when opening
  React.useEffect(() => {
    if (isOpen && value) {
      const [time, ampm] = value.split(' ');
      const [hourStr, minuteStr] = time.split(':');
      setSelectedHour(parseInt(hourStr));
      setSelectedMinute(parseInt(minuteStr));
      setIsPM(ampm === 'PM');
    }
  }, [isOpen, value]);

  const handleHourClick = (hour: number) => {
    setSelectedHour(hour);
    setMode('minute');
  };

  const handleMinuteClick = (minute: number) => {
    setSelectedMinute(minute);
    // Auto-close and save after selecting minute
    const timeStr = `${selectedHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
    onChange(timeStr);
    setTimeout(() => setIsOpen(false), 200);
  };

  const renderClockFace = () => {
    const items = mode === 'hour' ? 12 : 60;
    const step = mode === 'hour' ? 1 : 5; // Show minutes in 5-minute intervals
    const radius = 100;
    const centerX = 120;
    const centerY = 120;

    const numbers = [];
    for (let i = 0; i < (mode === 'hour' ? 12 : 12); i++) {
      const value = mode === 'hour' 
        ? (i === 0 ? 12 : i) 
        : i * 5;
      
      const angle = (i * 30 - 90) * (Math.PI / 180); // Start from top (12 o'clock)
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      const isSelected = mode === 'hour' 
        ? value === selectedHour 
        : value === selectedMinute;

      numbers.push(
        <g key={i}>
          <circle
            cx={x}
            cy={y}
            r="20"
            fill={isSelected ? '#7c3aed' : 'transparent'}
            className="cursor-pointer hover:fill-purple-100 transition-colors"
            onClick={() => mode === 'hour' ? handleHourClick(value) : handleMinuteClick(value)}
          />
          <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className={`text-sm font-medium cursor-pointer select-none ${
              isSelected ? 'fill-white' : 'fill-gray-700'
            }`}
            onClick={() => mode === 'hour' ? handleHourClick(value) : handleMinuteClick(value)}
          >
            {value.toString().padStart(2, '0')}
          </text>
        </g>
      );
    }

    return numbers;
  };

  return (
    <div className="relative">
      {/* Display Input */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-sm text-left flex items-center justify-between"
      >
        <span className="font-medium">{value}</span>
        <Clock className="w-4 h-4 text-gray-500" />
      </button>

      {/* Clock Picker Modal - Centered Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[70] flex items-center justify-center p-4" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Clock Modal - Centered */}
          <div 
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl border border-purple-200 z-[71] p-6 w-[320px]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {language === 'en' ? 'Select Time' : 'Sélectionner l\'heure'}
              </h3>
            </div>

            {/* Header with Mode Toggle */}
            <div className="flex items-center justify-between mb-6 bg-purple-50 rounded-xl p-4">
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() => setMode('hour')}
                  className={`px-4 py-2 rounded-lg text-lg font-bold transition ${
                    mode === 'hour' 
                      ? 'bg-purple-600 text-white shadow-md scale-105' 
                      : 'text-gray-600 hover:bg-purple-100'
                  }`}
                >
                  {selectedHour.toString().padStart(2, '0')}
                </button>
                <span className="text-gray-400 text-2xl font-bold">:</span>
                <button
                  type="button"
                  onClick={() => setMode('minute')}
                  className={`px-4 py-2 rounded-lg text-lg font-bold transition ${
                    mode === 'minute' 
                      ? 'bg-purple-600 text-white shadow-md scale-105' 
                      : 'text-gray-600 hover:bg-purple-100'
                  }`}
                >
                  {selectedMinute.toString().padStart(2, '0')}
                </button>
              </div>
              
              {/* AM/PM Toggle */}
              <div className="flex bg-white rounded-lg p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setIsPM(false)}
                  className={`px-3 py-1.5 rounded text-sm font-bold transition ${
                    !isPM 
                      ? 'bg-purple-600 text-white shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setIsPM(true)}
                  className={`px-3 py-1.5 rounded text-sm font-bold transition ${
                    isPM 
                      ? 'bg-purple-600 text-white shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  PM
                </button>
              </div>
            </div>

            {/* Clock Face */}
            <div className="flex justify-center mb-4">
              <svg width="260" height="260" viewBox="0 0 240 240" className="select-none">
                {/* Clock Circle Background */}
                <circle
                  cx="120"
                  cy="120"
                  r="115"
                  fill="#faf5ff"
                />
                
                {/* Clock Circle Border */}
                <circle
                  cx="120"
                  cy="120"
                  r="110"
                  fill="none"
                  stroke="#e9d5ff"
                  strokeWidth="3"
                />
                
                {/* Center Dot */}
                <circle
                  cx="120"
                  cy="120"
                  r="8"
                  fill="#7c3aed"
                  className="drop-shadow-md"
                />
                
                {/* Clock Numbers */}
                {renderClockFace()}
              </svg>
            </div>

            {/* Helper Text */}
            <div className="text-center mb-4">
              <p className="text-sm font-medium text-purple-700">
                {mode === 'hour' 
                  ? (language === 'en' ? '👆 Select hour' : '👆 Sélectionnez l\'heure')
                  : (language === 'en' ? '👆 Select minute' : '👆 Sélectionnez les minutes')
                }
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition"
            >
              {language === 'en' ? 'Close' : 'Fermer'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ClockTimePicker;

