import React, { useState, useEffect, useCallback } from 'react';
import { Activity, X, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getPulse, regeneratePulse } from '../api/orcha';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import type { Pulse } from '../types/orcha';

interface PulseModalProps {
  userId: number;
  isOpen: boolean;
  onClose: () => void;
}

const PulseModal: React.FC<PulseModalProps> = ({ userId, isOpen, onClose }) => {
  const { language } = useLanguage();
  const t = translations[language].pulse;
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPulse = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPulse(userId);
      
      if (response.status === 'ok' && response.pulse) {
        setPulse(response.pulse);
      } else {
        setError(response.message || 'Failed to fetch pulse');
      }
    } catch (err: any) {
      console.error('Error fetching pulse:', err);
      setError(err.response?.data?.message || 'An error occurred while fetching your pulse');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch pulse when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      fetchPulse();
    }
  }, [isOpen, userId, fetchPulse]);

  const handleRegeneratePulse = async () => {
    setRegenerating(true);
    setError(null);
    try {
      const response = await regeneratePulse(userId);
      
      if (response.status === 'ok' && response.pulse) {
        setPulse(response.pulse);
      } else {
        setError(response.message || 'Failed to regenerate pulse');
      }
    } catch (err: any) {
      console.error('Error regenerating pulse:', err);
      setError(err.response?.data?.message || 'An error occurred while regenerating your pulse');
    } finally {
      setRegenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden text-white px-6 py-5 border-b border-white/20 shadow-lg">
          {/* Gradient base (same colors as Pulse button) */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#48d1cc] to-[#1e90ff] pointer-events-none" />

          {/* Glass overlay */}
          <div className="absolute inset-0 bg-white/10 backdrop-blur-xl pointer-events-none" />

          {/* Soft glows */}
          <div className="absolute -top-10 -right-6 w-32 h-32 bg-white/40 rounded-full blur-3xl opacity-70 pointer-events-none" />
          <div className="absolute -bottom-16 left-0 w-48 h-48 bg-[#48d1cc]/40 rounded-full blur-3xl opacity-60 pointer-events-none" />

          {/* Inner content */}
          <div className="relative flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Activity className="w-7 h-7" />
              <h2 className="text-2xl font-bold">{t.title}</h2>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleRegeneratePulse} 
                disabled={regenerating || loading}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                title={t.regenerateTooltip}
              >
                <RefreshCw className={`w-5 h-5 ${regenerating ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={onClose}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition"
                title={t.closeTooltip}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 text-lg">{t.analyzing}</p>
              <p className="text-gray-400 text-sm">{t.analyzingSubtext}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-red-600 text-lg font-medium">{error}</p>
              <button
                onClick={fetchPulse}
                className="mt-4 px-6 py-2 text-white rounded-lg transition hover:opacity-90"
                style={{ backgroundColor: '#1e90ff' }}
              >
                {t.tryAgain}
              </button>
            </div>
          ) : pulse ? (
            <>
              {/* Pulse Content */}
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {pulse.content}
                </ReactMarkdown>
              </div>
              
              {/* Metadata */}
              <div className="mt-8 pt-6 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {t.metadataGenerated}
                  </span>
                  <span className="text-sm text-gray-900 font-medium">
                    {new Date(pulse.generated_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {t.metadataConversations}
                  </span>
                  <span className="text-sm text-gray-900 font-medium">
                    {pulse.conversations_analyzed}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {t.metadataMessages}
                  </span>
                  <span className="text-sm text-gray-900 font-medium">
                    {pulse.messages_analyzed}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {t.metadataNextUpdate}
                  </span>
                  <span className="text-sm text-gray-900 font-medium">
                    {new Date(pulse.next_generation).toLocaleString()}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Activity className="w-16 h-16 text-gray-300" />
              <p className="text-gray-600 text-lg">{t.noPulseData}</p>
              <p className="text-gray-400 text-sm text-center max-w-md">
                {t.noPulseSubtext}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PulseModal;
