import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types/orcha';
import { useModel } from '../context/ModelContext';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import MessageBubble from './MessageBubble';
import EmptyState from './EmptyState';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onRegenerateMessage?: (messageIndex: number) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading = false, onRegenerateMessage }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentModel } = useModel();
  const { language } = useLanguage();
  const t = translations[language].assistant;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
      {messages.length === 0 && !isLoading && currentModel === 'chat' && (
        <EmptyState />
      )}

      {messages.map((message, index) => (
        <React.Fragment key={message.id}>
          <MessageBubble 
            message={message} 
            onRegenerate={() => onRegenerateMessage?.(index)}
          />
        </React.Fragment>
      ))}

      {isLoading && (
        <div className="flex justify-start mb-4">
          <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
            <div className="flex items-center gap-1">
              <span className="text-gray-700 text-sm font-medium thinking-text">
                {t.thinking}
              </span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;

