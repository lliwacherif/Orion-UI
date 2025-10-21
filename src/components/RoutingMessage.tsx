import React, { useState } from 'react';
import type { Message } from '../types/orcha';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';

interface RoutingMessageProps {
  message: Message;
}

const RoutingMessage: React.FC<RoutingMessageProps> = ({ message }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { language } = useLanguage();
  const t = translations[language].routing;
  const badges = translations[language].badges;

  if (!message.routingData) {
    return null;
  }

  const { endpoint, reason, prepared_payload, status, ocr_queued, job_ids } = message.routingData;

  // Determine the endpoint type for badge
  const getEndpointBadge = (endpoint: string) => {
    if (endpoint.includes('/ocr')) {
      return { label: badges.ocr, color: 'bg-purple-100 text-purple-800' };
    } else if (endpoint.includes('/rag')) {
      return { label: badges.rag, color: 'bg-green-100 text-green-800' };
    } else if (endpoint.includes('/chat')) {
      return { label: badges.chat, color: 'bg-blue-100 text-blue-800' };
    }
    return { label: badges.api, color: 'bg-gray-100 text-gray-800' };
  };

  const badge = getEndpointBadge(endpoint);

  const handleCopyJSON = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(prepared_payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy JSON:', error);
    }
  };

  const handleCallEndpoint = () => {
    // TODO: Implement actual endpoint call
    // This would use the api.callRecommendedEndpoint function (see src/api/orcha.ts)
    alert(`TODO: Call ${endpoint} with prepared payload.\n\nSee src/api/orcha.ts for implementation guide.`);
  };

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[85%]">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl rounded-bl-md p-4 shadow-sm">
          {/* Header with badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
              {badge.label}
            </span>
            <h3 className="font-semibold text-gray-900 text-sm">{t.title}</h3>
          </div>

          {/* Endpoint */}
          <div className="mb-3">
            <p className="text-xs text-gray-600 mb-1">{t.endpoint}</p>
            <code className="text-sm bg-white px-3 py-1.5 rounded-lg border border-indigo-100 block break-all">
              {endpoint}
            </code>
          </div>

          {/* Reason */}
          <div className="mb-3">
            <p className="text-xs text-gray-600 mb-1">{t.reason}</p>
            <p className="text-sm text-gray-800">{reason}</p>
          </div>

          {/* Status fields if present */}
          {(status || ocr_queued !== undefined || job_ids) && (
            <div className="mb-3 p-3 bg-white rounded-lg border border-indigo-100">
              <p className="text-xs text-gray-600 mb-2">{t.statusInfo}</p>
              {status && (
                <p className="text-sm text-gray-800 mb-1">
                  <span className="font-medium">{t.status}</span> {status}
                </p>
              )}
              {ocr_queued !== undefined && (
                <p className="text-sm text-gray-800 mb-1">
                  <span className="font-medium">{t.ocrQueued}</span> {ocr_queued ? t.yes : t.no}
                </p>
              )}
              {job_ids && job_ids.length > 0 && (
                <p className="text-sm text-gray-800">
                  <span className="font-medium">{t.jobIds}</span> {job_ids.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Prepared Payload */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600">{t.preparedPayload}</p>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyJSON}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  aria-label="Copy JSON to clipboard"
                >
                  {copied ? (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t.copied}
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {t.copy}
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                  aria-label={isExpanded ? 'Collapse payload' : 'Expand payload'}
                >
                  {isExpanded ? t.collapse : t.expand}
                </button>
              </div>
            </div>
            <div className={`bg-gray-900 text-gray-100 p-3 rounded-lg overflow-auto custom-scrollbar ${
              isExpanded ? 'max-h-96' : 'max-h-32'
            }`}>
              <pre className="text-xs">
                {JSON.stringify(prepared_payload, null, 2)}
              </pre>
            </div>
          </div>

          {/* Call Endpoint Button (TODO) */}
          <button
            onClick={handleCallEndpoint}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
            aria-label="Call recommended endpoint"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {t.callEndpoint}
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            {t.demoMode}
          </p>
        </div>
        
        <span className="text-xs text-gray-500 mt-1 px-1 block">
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>
    </div>
  );
};

export default RoutingMessage;

