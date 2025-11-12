import React, { useEffect, useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLanguage } from '../context/LanguageContext';

export interface AgentNotificationData {
  id: string;
  taskName: string;
  message: string;
  timestamp: string;
}

interface AgentNotificationProps {
  notification: AgentNotificationData | null;
  onClose: () => void;
}

const AgentNotification: React.FC<AgentNotificationProps> = ({ notification, onClose }) => {
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      console.log('🔔 Showing agent notification:', notification.taskName);
      // Trigger animation after mount
      setTimeout(() => setIsVisible(true), 50);
      
      // Auto-close after 20 seconds (increased from 15)
      const timer = setTimeout(() => {
        console.log('⏰ Auto-closing notification');
        handleClose();
      }, 20000);
      
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [notification]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation to complete
  };

  if (!notification) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] transition-all duration-500 ease-in-out ${
        isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-[120%] opacity-0 scale-95'
      }`}
      style={{ maxWidth: '450px', width: '90vw' }}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-purple-200 overflow-hidden backdrop-blur-sm ring-2 ring-purple-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 text-white px-5 py-4 shadow-lg">
          <div className="flex justify-between items-start gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-9 h-9 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm flex-shrink-0 mt-0.5 animate-pulse">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-purple-100 text-xs font-medium mb-1">
                  {language === 'en' ? 'Agent Task Completed' : 'Tâche d\'Agent Terminée'}
                </p>
                <h3 className="text-lg font-bold truncate">
                  {notification.taskName}
                </h3>
                <p className="text-purple-100 text-xs mt-1">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition flex-shrink-0"
              title={language === 'en' ? 'Close' : 'Fermer'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[400px] overflow-y-auto bg-gradient-to-b from-white to-purple-50">
          <div className="prose prose-sm max-w-none text-gray-700">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {notification.message}
            </ReactMarkdown>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gradient-to-r from-purple-50 to-indigo-50 px-5 py-3 flex justify-between items-center">
          <span className="text-xs text-gray-600 font-medium">
            {language === 'en' ? 'Agent Task Completed' : 'Tâche d\'Agent Terminée'}
          </span>
          <button
            onClick={handleClose}
            className="text-sm text-purple-700 hover:text-purple-800 font-medium transition"
          >
            {language === 'en' ? 'Dismiss' : 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentNotification;

