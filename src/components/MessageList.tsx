import React, { useEffect, useRef } from 'react';
import type { Message } from '../types/orcha';
import { useModel } from '../context/ModelContext';
import MessageBubble from './MessageBubble';
import RoutingMessage from './RoutingMessage';
import EmptyState from './EmptyState';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading = false }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentModel } = useModel();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
      {messages.length === 0 && !isLoading && currentModel === 'chat' && (
        <EmptyState />
      )}

      {messages.map((message) => (
        <React.Fragment key={message.id}>
          {message.type === 'routing' ? (
            <RoutingMessage message={message} />
          ) : (
            <MessageBubble message={message} />
          )}
        </React.Fragment>
      ))}

      {isLoading && (
        <div className="flex justify-start mb-4">
          <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;

