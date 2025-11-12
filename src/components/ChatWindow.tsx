import React, { useState, useEffect } from 'react';
import { useMutation } from 'react-query';
import { useSession } from '../context/SessionContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useConversation } from '../context/ConversationContext';
import { useModel } from '../context/ModelContext';
import { translations } from '../translations';
import { chat, webSearch } from '../api/orcha';
import type { Attachment, ChatRequest, TokenUsage, WebSearchRequest } from '../types/orcha';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import OCRExtractor from './OCRExtractor';
import ChatSidebar from './ChatSidebar';
import ModelSelector from './ModelSelector';
import PulseButton from './PulseButton';
import PulseModal from './PulseModal';
import DocumentCanvas from './DocumentCanvas';
import AgentScheduleModal, { type AgentTask } from './AgentScheduleModal';
import AgentNotification, { type AgentNotificationData } from './AgentNotification';
import { AgentTaskService } from '../services/agentTaskService';

const ChatWindow: React.FC = () => {
  const { session } = useSession();
  const { user } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const { 
    currentConversationId,
    currentConversation,
    messages, 
    refreshConversations,
    refreshMessages,
    updateConversationTitle,
    clearCurrentConversation 
  } = useConversation();
  const { currentModel } = useModel();
  const t = translations[language].chat;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [showPulseModal, setShowPulseModal] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [canvasContent, setCanvasContent] = useState('');
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [agentInstructions, setAgentInstructions] = useState('');
  const [agentNotification, setAgentNotification] = useState<AgentNotificationData | null>(null);

  console.log('🔍 ChatWindow render:', { 
    user: !!user, 
    session: !!session, 
    currentConversationId, 
    messagesCount: messages.length,
    currentModel 
  });

  // Effect to manage sidebar when canvas opens
  useEffect(() => {
    if (showCanvas && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [showCanvas]);

  // React Query mutation for web search
  const searchMutation = useMutation(
    (payload: WebSearchRequest) => webSearch(payload),
    {
      onSuccess: async (data) => {
        console.log('✅ Web search mutation success');
        console.log('🔍 Search query:', data.search_query);
        console.log('🔍 Results count:', data.results_count);
        
        // Update token usage from search response
        if (data.token_usage && data.token_usage.tracking_enabled) {
          setTokenUsage(data.token_usage);
          console.log(`Tokens used in search: ${data.token_usage.tokens_added}`);
        }

        // Mark this conversation as a search conversation
        if (data.conversation_id) {
          const searchConvs = localStorage.getItem('aura_search_conversations');
          const ids: number[] = searchConvs ? JSON.parse(searchConvs) : [];
          if (!ids.includes(data.conversation_id)) {
            ids.push(data.conversation_id);
            localStorage.setItem('aura_search_conversations', JSON.stringify(ids));
            console.log('🌐 Marked conversation as web search:', data.conversation_id);
          }
        }

        // Refresh conversations to show the new search conversation
        if (data.conversation_id) {
          await refreshConversations();
          await refreshMessages();
        }
      },
      onError: (error: any) => {
        console.error('❌ Web search mutation error:', error);
        refreshConversations();
      },
    }
  );

  // React Query mutation for chat
  const chatMutation = useMutation(
    (payload: ChatRequest) => chat(payload),
    {
      onSuccess: async (data, variables) => {
        console.log('✅ Chat mutation success');
        console.log('🔍 Checking for token_usage in response...');
        console.log('🔍 data.token_usage exists?', !!data.token_usage);
        
        if (data.token_usage) {
          console.log('📊 TOKEN USAGE DATA RECEIVED:');
          console.log('  - tracking_enabled:', data.token_usage.tracking_enabled);
          console.log('  - current_usage:', data.token_usage.current_usage);
          console.log('  - tokens_added:', data.token_usage.tokens_added);
          console.log('  - reset_at:', data.token_usage.reset_at);
          console.log('  - time_until_reset:', data.token_usage.time_until_reset);
        } else {
          console.error('❌ NO TOKEN USAGE DATA IN RESPONSE!');
          console.log('Full response:', JSON.stringify(data, null, 2));
        }
        
        // ✅ Update token usage in real-time (matches backend example)
        if (data.token_usage && data.token_usage.tracking_enabled) {
          console.log('✅ UPDATING TOKEN STATE:', data.token_usage.current_usage);
          setTokenUsage(data.token_usage);
          console.log(`Tokens used this message: ${data.token_usage.tokens_added}`);
          console.log(`Total accumulated: ${data.token_usage.current_usage}`);
        } else {
          console.warn('⚠️ No token usage data in response or tracking disabled');
        }

        // Check if this was a response to a document attachment (PDF only, not OCR)
        const hasDocumentAttachment = variables.attachments?.some(att => att.type === 'application/pdf');
        if (hasDocumentAttachment && data.message) {
          console.log('📄 Document response detected, opening canvas');
          console.log('📄 Attachments:', variables.attachments);
          setCanvasContent(data.message);
          setShowCanvas(true);
          setIsSidebarOpen(false); // Auto-close sidebar when canvas opens
        }

        // Refresh both conversations list and messages after successful chat
        if (data.conversation_id) {
          console.log('🔄 Refreshing conversations list and messages after successful chat');
          await refreshConversations();
          // Manually refresh messages to show the new response
          await refreshMessages();
        }
      },
      onError: (error: any) => {
        console.error('❌ Chat mutation error:', error);
        console.error('Error response:', error.response?.data);
        
        // Refresh conversations to get updated state
        refreshConversations();
      },
    }
  );

  const handleSendMessage = async (message: string, attachments: Attachment[], useRag: boolean) => {
    if (!session || !user) {
      console.error('❌ Cannot send message: No session or user');
      return;
    }

    // Check if this is the first message in the conversation (auto-name)
    const isFirstMessage = messages.length === 0;
    const shouldAutoName = isFirstMessage && currentConversation?.title === 'New Chat';

    // Prepare chat request with conversation_id
    const chatRequest: ChatRequest = {
      user_id: user.id.toString(),
      tenant_id: session.tenant_id,
      message,
      attachments: attachments.length > 0 ? attachments : undefined,
      use_rag: useRag,
      conversation_id: currentConversationId, // Include conversation_id for database persistence
      conversation_history: [], // Let backend load from database
    };

    console.log('📤 Sending chat request:', {
      user_id: user.id,
      conversation_id: currentConversationId,
      message,
      attachmentCount: attachments.length,
      useRag,
      isFirstMessage,
      shouldAutoName
    });

    // If this is the first message, auto-name the conversation
    if (shouldAutoName && currentConversationId) {
      try {
        // Generate a title from the first message (max 50 chars)
        const autoTitle = message.length > 50 
          ? message.substring(0, 47) + '...' 
          : message;
        
        console.log('🏷️ Auto-naming conversation:', autoTitle);
        await updateConversationTitle(currentConversationId, autoTitle);
      } catch (error) {
        console.error('Failed to auto-name conversation:', error);
        // Continue anyway, naming is not critical
      }
    }

    // Call ORCHA chat endpoint
    chatMutation.mutate(chatRequest);
  };

  const handleClearChat = () => {
    if (window.confirm(t.clearConfirm)) {
      clearCurrentConversation();
    }
  };

  // Handle regenerating a message (when user clicks reload icon on assistant message)
  const handleRegenerateMessage = (messageIndex: number) => {
    const message = messages[messageIndex];
    
    // Only regenerate assistant messages
    if (message.role !== 'assistant') {
      console.warn('Can only regenerate assistant messages');
      return;
    }

    // Find the user message that preceded this assistant message
    let userMessageIndex = -1;
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMessageIndex = i;
        break;
      }
    }

    if (userMessageIndex === -1) {
      console.warn('No user message found to regenerate from');
      return;
    }

    const userMessage = messages[userMessageIndex];
    
    // Resend the user message
    console.log('🔄 Regenerating response for message:', userMessage.content);
    handleSendMessage(
      userMessage.content,
      [], // attachments - simplified for now
      false // useRag - use default
    );
  };

  // Canvas handlers
  const handleCloseCanvas = () => {
    setShowCanvas(false);
    setCanvasContent('');
    setIsSidebarOpen(true); // Re-open sidebar when canvas closes
  };

  const handleCanvasContentChange = (newContent: string) => {
    setCanvasContent(newContent);
  };

  // Agent handlers
  const handleScheduleAgent = (instructions: string, isSearch: boolean = false) => {
    setAgentInstructions(instructions);
    setShowAgentModal(true);
    // Store search mode flag temporarily
    sessionStorage.setItem('agent_is_search', isSearch.toString());
  };

  const handleSaveAgentTask = (task: AgentTask) => {
    AgentTaskService.saveTask(task);
    setShowAgentModal(false);
    setAgentInstructions('');
    sessionStorage.removeItem('agent_is_search');
    
    // Show confirmation
    const taskType = task.isSearch 
      ? (language === 'en' ? 'search task' : 'tâche de recherche')
      : (language === 'en' ? 'task' : 'tâche');
    alert(
      language === 'en' 
        ? `Agent ${taskType} "${task.taskName}" scheduled successfully!` 
        : `${taskType} d'agent "${task.taskName}" planifiée avec succès !`
    );
  };

  const handleCloseAgentNotification = () => {
    setAgentNotification(null);
  };

  // Web search handler
  const handleWebSearch = async (query: string) => {
    if (!session || !user) {
      console.error('❌ Cannot perform search: No session or user');
      return;
    }

    // Check if this is the first message in the conversation (auto-name)
    const isFirstMessage = messages.length === 0;
    const shouldAutoName = isFirstMessage && currentConversation?.title === 'New Chat';

    // If this is the first search, auto-name the conversation
    if (shouldAutoName && currentConversationId) {
      try {
        // Generate a title from the search query (max 50 chars)
        const autoTitle = query.length > 50 
          ? query.substring(0, 47) + '...' 
          : query;
        
        console.log('🏷️ Auto-naming search conversation:', autoTitle);
        await updateConversationTitle(currentConversationId, autoTitle);
      } catch (error) {
        console.error('Failed to auto-name search conversation:', error);
        // Continue anyway, naming is not critical
      }
    }

    // Prepare web search request
    const searchRequest: WebSearchRequest = {
      user_id: user.id.toString(),
      tenant_id: session.tenant_id,
      query,
      max_results: 5,
      conversation_id: currentConversationId,
    };

    console.log('🔍 Sending web search request:', {
      user_id: user.id,
      conversation_id: currentConversationId,
      query,
      max_results: 5
    });

    // Call web search endpoint
    searchMutation.mutate(searchRequest);
  };

  return (
    <>
      {/* Sidebar with token tracking */}
      <ChatSidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        tokenUsage={tokenUsage}
      />

      {/* Main Content */}
      <div
        className={`h-screen flex flex-col bg-white transition-all duration-300 ${
          isSidebarOpen ? 'md:ml-64' : 'ml-0'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#48d1cc] to-[#1e90ff] text-white px-6 py-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-lg transition"
              aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <ModelSelector />
          </div>
          <div className="flex gap-2">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="px-3 py-2 rounded-lg transition text-sm font-medium hover:opacity-90"
              style={{ backgroundColor: '#1e90ff' }}
              aria-label="Toggle language"
              title={language === 'en' ? 'Switch to French' : 'Passer à l\'anglais'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3c4.97 0 9 4.03 9 9s-4.03 9-9 9-9-4.03-9-9 4.03-9 9-9zm0 0c3 0 5 4.5 5 9s-2 9-5 9-5-4.5-5-9 2-9 5-9zm-9 9h18" />
              </svg>
            </button>
            <button
              onClick={handleClearChat}
              className="px-3 py-2 rounded-lg transition text-sm hover:opacity-90"
              style={{ backgroundColor: '#1e90ff' }}
              aria-label="Clear chat history"
            >
              {t.clearButton}
            </button>
          </div>
        </div>
      </div>

      {/* Info banner */}
      {tokenUsage && tokenUsage.tracking_enabled && (
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-3">
          <div className="flex items-center justify-end gap-4">
            {/* Token Usage Badge */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-blue-200">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-blue-900">
                {tokenUsage.current_usage.toLocaleString()}
              </span>
              {tokenUsage.tokens_added > 0 && (
                <span className="text-xs text-green-600 font-medium">
                  +{tokenUsage.tokens_added}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Render different interface based on model */}
      {currentModel === 'ocr' ? (
        <OCRExtractor />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Chat section - takes full width when no canvas, or partial width when canvas is shown */}
          <div className={`flex flex-col transition-all duration-500 ease-in-out overflow-hidden ${
            showCanvas ? 'w-2/5' : 'w-full'
          }`}>
            {/* Messages */}
            <MessageList 
              messages={messages} 
              isLoading={chatMutation.isLoading || searchMutation.isLoading}
              onRegenerateMessage={handleRegenerateMessage}
            />

            {/* Input */}
            <MessageInput
              onSendMessage={handleSendMessage}
              onScheduleAgent={handleScheduleAgent}
              onWebSearch={handleWebSearch}
              disabled={chatMutation.isLoading || searchMutation.isLoading}
              hasMessages={messages.length > 0}
            />
          </div>

          {/* Canvas section - slides in from right */}
          <div className={`flex flex-col transition-all duration-500 ease-in-out overflow-hidden ${
            showCanvas ? 'w-3/5' : 'w-0'
          }`}>
            {showCanvas && (
              <DocumentCanvas
                content={canvasContent}
                onClose={handleCloseCanvas}
                onContentChange={handleCanvasContentChange}
              />
            )}
          </div>
        </div>
      )}
      </div>

      {/* Pulse Feature */}
      <PulseButton onClick={() => setShowPulseModal(true)} />
      <PulseModal
        userId={user?.id || 0}
        isOpen={showPulseModal}
        onClose={() => setShowPulseModal(false)}
      />

      {/* Agent Feature */}
      <AgentScheduleModal
        isOpen={showAgentModal}
        onClose={() => {
          setShowAgentModal(false);
          setAgentInstructions('');
          sessionStorage.removeItem('agent_is_search');
        }}
        onSave={handleSaveAgentTask}
        initialInstructions={agentInstructions}
        isSearchMode={sessionStorage.getItem('agent_is_search') === 'true'}
      />
      <AgentNotification
        notification={agentNotification}
        onClose={handleCloseAgentNotification}
      />
    </>
  );
};

export default ChatWindow;

