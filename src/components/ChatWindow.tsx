import React, { useState, useEffect } from 'react';
import { useMutation } from 'react-query';
import { useSession } from '../context/SessionContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useConversation } from '../context/ConversationContext';
import { useModel } from '../context/ModelContext';
import { chat, webSearch } from '../api/orcha';
import type { Attachment, ChatRequest, TokenUsage, WebSearchRequest, ChatMessage } from '../types/orcha';
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
import PlanWithAgent from './PlanWithAgent';
import AgentTaskScheduler from './AgentTaskScheduler';

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
    addMessage
  } = useConversation();
  const { currentModel, isAgentMode, isProMode } = useModel();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [showPulseModal, setShowPulseModal] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [canvasContent, setCanvasContent] = useState('');
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [agentInstructions, setAgentInstructions] = useState('');
  const [agentNotification, setAgentNotification] = useState<AgentNotificationData | null>(null);
  const [prefilledQuestion, setPrefilledQuestion] = useState('');

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
  }, [showCanvas, isSidebarOpen]);

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

    // Handle OpenCare model - attach documentation
    let finalAttachments = [...attachments];
    let finalMessage = message;

    if (currentModel === 'opencare') {
      try {
        console.log('📄 OpenCare model detected - loading documentation...');
        // Read OpenCare document from public assets
        const response = await fetch('/assets/ContextDocs/OpenCare document.txt');
        const base64Content = await response.text();

        // Create attachment for OpenCare documentation
        const openCareAttachment: Attachment = {
          uri: 'OpenCare Documentation.pdf',
          type: 'application/pdf',
          filename: 'OpenCare Documentation.pdf',
          data: base64Content.trim() // Remove any whitespace
        };

        // Add OpenCare document as first attachment
        finalAttachments = [openCareAttachment, ...attachments];

        // Prepend system instruction to the message
        finalMessage = `Based on the OpenCare documentation provided, please answer the following user question accurately and comprehensively:\n\n${message}`;

        console.log('✅ OpenCare documentation attached successfully');
      } catch (error) {
        console.error('❌ Failed to load OpenCare documentation:', error);
        // Continue without the document if it fails to load
      }
    }

    // Prepare chat request with conversation_id
    const chatRequest: ChatRequest = {
      user_id: user.id.toString(),
      tenant_id: session.tenant_id,
      message: finalMessage,
      attachments: finalAttachments.length > 0 ? finalAttachments : undefined,
      use_rag: useRag,
      use_pro_mode: isProMode,
      conversation_id: currentConversationId, // Include conversation_id for database persistence
      conversation_history: [], // Let backend load from database
    };

    console.log('📤 Sending chat request:', {
      user_id: user.id,
      conversation_id: currentConversationId,
      message: finalMessage.substring(0, 100) + '...', // Truncate for logging
      attachmentCount: finalAttachments.length,
      useRag,
      useProMode: isProMode,
      isFirstMessage,
      shouldAutoName,
      isOpenCare: currentModel === 'opencare'
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

    // Optimistically add user message to UI
    const tempMessage: ChatMessage = {
      id: -Date.now(), // Temporary negative ID to avoid collision
      role: 'user',
      content: message,
      attachments: attachments,
      token_count: null,
      model_used: null,
      created_at: new Date().toISOString()
    };
    addMessage(tempMessage);

    // Call ORCHA chat endpoint
    chatMutation.mutate(chatRequest);
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

  // Handle predefined question selection from OpenCare
  const handleQuestionSelect = (question: string) => {
    setPrefilledQuestion(question);
  };

  // Clear prefilled question after it's been used
  const handlePrefilledQuestionUsed = () => {
    setPrefilledQuestion('');
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
        className={`h-screen flex flex-col bg-white transition-all duration-300 relative ${isSidebarOpen ? 'md:ml-64' : 'ml-0'
          }`}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Hamburger menu - only show when sidebar is closed */}
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  style={{ color: '#003A70' }}
                  aria-label="Open sidebar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              <ModelSelector />
            </div>
            <div className="flex items-center gap-2">
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition text-sm font-medium hover:bg-gray-100"
                style={{ color: '#003A70' }}
                aria-label="Toggle language"
                title={language === 'en' ? 'Switch to French' : 'Passer à l\'anglais'}
              >
                <span className="text-sm font-semibold">{language === 'en' ? 'English' : 'Français'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Info banner - Floating Capsule Style */}
        {tokenUsage && tokenUsage.tracking_enabled && (
          <div className="absolute top-20 right-6 z-10 pointer-events-none">
            <div className="flex items-center justify-end">
              {/* Token Usage Badge - Glassy Style */}
              <div className="group relative px-4 py-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-md border border-blue-200/50 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl pointer-events-auto">
                <div className="flex items-center gap-2 relative z-10">
                  <svg className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                    {tokenUsage.current_usage.toLocaleString()}
                  </span>
                  {tokenUsage.tokens_added > 0 && (
                    <span className="text-xs text-green-600 font-medium bg-green-50/50 px-1.5 py-0.5 rounded-full border border-green-200/50">
                      +{tokenUsage.tokens_added}
                    </span>
                  )}
                </div>
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        )}

        {/* Render different interface based on model */}
        {currentModel === 'ocr' ? (
          <OCRExtractor />
        ) : isAgentMode ? (
          /* Agent Mode Layout */
          <div className="flex-1 overflow-hidden relative p-6 bg-gradient-to-br from-gray-50 to-blue-50/30">
            {/* Agent Mode Header */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
              <div className="px-6 py-2 bg-white/30 backdrop-blur-xl border border-white/40 rounded-full shadow-lg flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                <span className="font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Agent Mode
                </span>
              </div>
            </div>

            {/* 50/50 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full pt-12">
              {/* Left Column: Plan With Agent */}
              <div className="h-full overflow-hidden">
                <PlanWithAgent />
              </div>

              {/* Right Column: Schedule a Task */}
              <div className="h-full overflow-hidden">
                <AgentTaskScheduler />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden relative">
            {/* Chat section - takes full width on mobile, partial on desktop when canvas is shown */}
            <div className={`flex flex-col transition-all duration-500 ease-in-out overflow-hidden ${showCanvas ? 'w-full md:w-2/5' : 'w-full'
              }`}>
              {/* Messages */}
              <MessageList
                messages={messages}
                isLoading={chatMutation.isLoading || searchMutation.isLoading}
                onRegenerateMessage={handleRegenerateMessage}
                onQuestionSelect={handleQuestionSelect}
              />

              {/* Input */}
              <div className="absolute bottom-0 left-0 right-0 z-10 md:z-20 pointer-events-none">
                <div className="pointer-events-auto">
                  <MessageInput
                    onSendMessage={handleSendMessage}
                    onScheduleAgent={handleScheduleAgent}
                    onWebSearch={handleWebSearch}
                    disabled={chatMutation.isLoading || searchMutation.isLoading}
                    hasMessages={messages.length > 0}
                    prefilledMessage={prefilledQuestion}
                    onPrefilledMessageUsed={handlePrefilledQuestionUsed}
                  />
                </div>
              </div>
            </div>

            {/* Mobile backdrop overlay */}
            {showCanvas && (
              <div
                className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
                onClick={handleCloseCanvas}
              />
            )}

            {/* Canvas section - bottom drawer on mobile, slides in from right on desktop */}
            <div className={`
            flex flex-col transition-all duration-500 ease-in-out overflow-hidden
            md:relative md:flex-col
            fixed inset-x-0 bottom-0 z-50
            ${showCanvas ? 'md:w-3/5' : 'md:w-0'}
            ${showCanvas ? 'h-[85vh] md:h-full' : 'h-0'}
          `}>
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

