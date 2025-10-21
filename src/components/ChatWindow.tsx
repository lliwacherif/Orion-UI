import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { v4 as uuidv4 } from 'uuid';
import { useSession } from '../context/SessionContext';
import { useLanguage } from '../context/LanguageContext';
import { useConversation } from '../context/ConversationContext';
import { useModel } from '../context/ModelContext';
import { translations } from '../translations';
import { chat } from '../api/orcha';
import type { Message, Attachment, ChatRequest } from '../types/orcha';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import MessageInputDoc from './MessageInputDoc';
import MessageInputVision from './MessageInputVision';
import ChatSidebar from './ChatSidebar';
import ModelSelector from './ModelSelector';

const ChatWindow: React.FC = () => {
  const { session, logout } = useSession();
  const { language, toggleLanguage } = useLanguage();
  const { currentConversation, addMessage, clearCurrentConversation } = useConversation();
  const { currentModel } = useModel();
  const t = translations[language].chat;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const messages = currentConversation?.messages || [];

  // React Query mutation for chat
  const chatMutation = useMutation(
    (payload: ChatRequest) => chat(payload),
    {
      onSuccess: (data) => {
        console.log('✅ Chat mutation success, full response:', JSON.stringify(data, null, 2));
        console.log('Response status:', data.status);
        console.log('Response message:', data.message);
        console.log('Response error:', data.error);
        
        // Extract content from multiple possible response shapes (OpenAI-style, custom, etc.)
        const extractAssistantContent = (resp: any): string | undefined => {
          if (!resp) return undefined;
          
          // Direct message field
          if (typeof resp.message === 'string') return resp.message;
          
          // OpenAI chat.completion style
          const choice0 = Array.isArray(resp.choices) ? resp.choices[0] : undefined;
          const fromChoices = choice0?.message?.content ?? choice0?.delta?.content;
          if (typeof fromChoices === 'string') return fromChoices;
          
          // Some APIs return output_text or nested output.text
          if (typeof resp.output_text === 'string') return resp.output_text;
          if (typeof resp.output?.text === 'string') return resp.output.text;
          
          // Check if the response itself is a string (some APIs return just the content)
          if (typeof resp === 'string') return resp;
          
          // Check for nested content in various possible structures
          if (resp.content && typeof resp.content === 'string') return resp.content;
          if (resp.text && typeof resp.text === 'string') return resp.text;
          if (resp.data && typeof resp.data === 'string') return resp.data;
          
          return undefined;
        };

        const content = extractAssistantContent(data);

        // Handle successful responses
        if ((data.status === 'ok' || !(data as any).status) && (data.message || content)) {
          // Add assistant response message
          const assistantMessage: Message = {
            id: uuidv4(),
            type: 'assistant',
            content: data.message || (content as string),
            timestamp: new Date(),
            contexts: data.contexts,
          };
          addMessage(assistantMessage);
        }
        // Handle OpenAI-style responses (no status field, has choices array)
        else if (Array.isArray((data as any).choices) && (data as any).choices.length > 0 && content) {
          const assistantMessage: Message = {
            id: uuidv4(),
            type: 'assistant',
            content: content as string,
            timestamp: new Date(),
            contexts: data.contexts,
          };
          addMessage(assistantMessage);
        }
        // Handle any response with content (fallback for various formats)
        else if (content) {
          console.log('📝 Using fallback content extraction:', content);
          const assistantMessage: Message = {
            id: uuidv4(),
            type: 'assistant',
            content: content as string,
            timestamp: new Date(),
            contexts: data.contexts,
          };
          addMessage(assistantMessage);
        } 
        // Handle OCR queued
        else if (data.status === 'ocr_queued' && data.jobs) {
          const ocrMessage: Message = {
            id: uuidv4(),
            type: 'assistant',
            content: `Processing attachments: ${data.jobs.join(', ')}`,
            timestamp: new Date(),
          };
          addMessage(ocrMessage);
        } 
        // Handle explicit errors from backend
        else if (data.status === 'error' && data.error) {
          const errorMessage: Message = {
            id: uuidv4(),
            type: 'error',
            content: data.error,
            timestamp: new Date(),
          };
          addMessage(errorMessage);
        }
        // Fallback: if we got a response but message is missing
        else {
          console.warn('⚠️ Unexpected response format:', data);
          const errorMessage: Message = {
            id: uuidv4(),
            type: 'error',
            content: 'Received response but message format is unexpected. Check console for details.',
            timestamp: new Date(),
          };
          addMessage(errorMessage);
        }
      },
      onError: (error: any) => {
        console.error('❌ Chat mutation error:', error);
        console.error('Error response:', error.response?.data);
        
        // Add error message
        const errorMessage: Message = {
          id: uuidv4(),
          type: 'error',
          content: `${translations[language].assistant.errorTitle}: ${error.response?.data?.detail || error.message || 'Failed to send message'}`,
          timestamp: new Date(),
        };
        addMessage(errorMessage);
      },
    }
  );

  const handleSendMessage = (message: string, attachments: Attachment[], useRag: boolean) => {
    if (!session) return;

    // Build conversation history from last 2 messages (1 user + 1 assistant)
    const conversationHistory = messages
      .filter((msg) => msg.type === 'user' || msg.type === 'assistant')
      .slice(-2) // Get the last 2 messages
      .map((msg) => ({
        role: msg.type as 'user' | 'assistant',
        content: msg.content,
      }));

    // Add user message to chat
    const userMessage: Message = {
      id: uuidv4(),
      type: 'user',
      content: message,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };
    addMessage(userMessage);

    // Prepare chat request with conversation history
    const chatRequest: ChatRequest = {
      user_id: session.user_id,
      tenant_id: session.tenant_id,
      message,
      attachments: attachments.length > 0 ? attachments : undefined,
      use_rag: useRag,
      conversation_history: conversationHistory.length > 0 ? conversationHistory : undefined,
    };

    console.log('📤 Sending chat request:', {
      message,
      historyCount: conversationHistory.length,
      history: conversationHistory,
      attachmentCount: attachments.length,
      attachments: attachments.map(a => ({
        filename: a.filename,
        type: a.type,
        size: a.size,
        hasData: !!a.data,
        dataLength: a.data?.length || 0
      })),
      useRag
    });

    // Call ORCHA chat endpoint
    chatMutation.mutate(chatRequest);
  };

  const handleClearChat = () => {
    if (window.confirm(t.clearConfirm)) {
      clearCurrentConversation();
    }
  };

  return (
    <>
      {/* Sidebar */}
      <ChatSidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Main Content */}
      <div
        className={`h-screen flex flex-col bg-white transition-all duration-300 ${
          isSidebarOpen ? 'md:ml-64' : 'ml-0'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-400 text-white px-6 py-4 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <ModelSelector />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <p className="font-medium">{session?.user_id}</p>
              {session?.tenant_id && (
                <p className="text-blue-100 text-xs">{t.tenant}: {session.tenant_id}</p>
              )}
            </div>
            <div className="flex gap-2">
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="px-3 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg transition text-sm font-medium"
                aria-label="Toggle language"
                title={language === 'en' ? 'Switch to French' : 'Passer à l\'anglais'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3c4.97 0 9 4.03 9 9s-4.03 9-9 9-9-4.03-9-9 4.03-9 9-9zm0 0c3 0 5 4.5 5 9s-2 9-5 9-5-4.5-5-9 2-9 5-9zm-9 9h18" />
                </svg>
              </button>
              <button
                onClick={handleClearChat}
                className="px-3 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg transition text-sm"
                aria-label="Clear chat history"
              >
                {t.clearButton}
              </button>
              <button
                onClick={logout}
                className="px-3 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg transition text-sm"
                aria-label={t.logoutButton}
                title={t.logoutButton}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border-b border-blue-100 px-6 py-3">
        <div className="flex items-start gap-2 text-sm">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-blue-900 font-medium">
              {language === 'en' ? 'AI-Powered Chat by VAERDIA' : 'Chat IA par VAERDIA'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} isLoading={chatMutation.isLoading} />

      {/* Input - Render different input based on model */}
      {currentModel === 'doc' ? (
        <MessageInputDoc
          onSendMessage={handleSendMessage}
          disabled={chatMutation.isLoading}
          hasMessages={messages.length > 0}
        />
      ) : currentModel === 'vision' ? (
        <MessageInputVision
          onSendMessage={handleSendMessage}
          disabled={chatMutation.isLoading}
          hasMessages={messages.length > 0}
        />
      ) : (
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={chatMutation.isLoading}
        />
      )}
      </div>
    </>
  );
};

export default ChatWindow;

