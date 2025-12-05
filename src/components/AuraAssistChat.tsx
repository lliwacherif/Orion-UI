import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSession } from '../context/SessionContext';
import { translations } from '../translations';
import { chat } from '../api/orcha';
import type { ChatRequest } from '../types/orcha';

// Data collection stages
type CollectionStage = 'welcome' | 'name' | 'age' | 'gender' | 'nationality' | 'location' | 'extracting' | 'complete';

// Message types for translation keys
type MessageKey = 
  | 'welcome' 
  | 'greeting' 
  | 'askName' 
  | 'askAge' 
  | 'askGender' 
  | 'askNationality' 
  | 'askLocation' 
  | 'thankYou' 
  | 'extractionComplete'
  | 'error'
  | 'custom';

interface CollectedData {
  name: string;
  age: string;
  gender: string;
  nationality: string;
  location: string;
}

interface AuraAssistMessage {
  id: string;
  role: 'user' | 'assistant';
  messageKey?: MessageKey; // For translatable assistant messages
  content?: string; // For user messages or custom content (like AI extraction result)
  timestamp: Date;
}

const AuraAssistChat: React.FC = () => {
  const { user } = useAuth();
  const { session } = useSession();
  const { language } = useLanguage();
  const [messages, setMessages] = useState<AuraAssistMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [stage, setStage] = useState<CollectionStage>('welcome');
  const [collectedData, setCollectedData] = useState<CollectedData>({
    name: '',
    age: '',
    gender: '',
    nationality: '',
    location: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasInitialized = useRef(false);
  
  const t = translations[language].auraAssist;
  const userName = user?.full_name || user?.username || (language === 'en' ? 'there' : 'toi');

  // Get translated content for a message
  const getMessageContent = useCallback((message: AuraAssistMessage): string => {
    if (message.role === 'user' || message.messageKey === 'custom') {
      return message.content || '';
    }
    
    // Translate based on messageKey
    switch (message.messageKey) {
      case 'welcome':
        return t.welcome.replace('{userName}', userName);
      case 'greeting':
        return t.greeting;
      case 'askName':
        return t.askName;
      case 'askAge':
        return t.askAge;
      case 'askGender':
        return t.askGender;
      case 'askNationality':
        return t.askNationality;
      case 'askLocation':
        return t.askLocation;
      case 'thankYou':
        return t.thankYou;
      case 'extractionComplete':
        return t.extractionComplete;
      case 'error':
        return language === 'en' 
          ? 'Sorry, there was an error processing your data. Please try again.' 
          : 'Désolé, une erreur s\'est produite lors du traitement de vos données. Veuillez réessayer.';
      default:
        return message.content || '';
    }
  }, [t, userName, language]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generate unique ID
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Initialize with welcome message - only once
  useEffect(() => {
    if (hasInitialized.current) return;
    
    if (stage === 'welcome' && messages.length === 0) {
      hasInitialized.current = true;
      
      // Add welcome message
      setMessages([{
        id: generateId(),
        role: 'assistant',
        messageKey: 'welcome',
        timestamp: new Date(),
      }]);
      
      // After a short delay, add greeting
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: generateId(),
          role: 'assistant',
          messageKey: 'greeting',
          timestamp: new Date(),
        }]);
        
        // Then add first question
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: generateId(),
            role: 'assistant',
            messageKey: 'askName',
            timestamp: new Date(),
          }]);
          setStage('name');
        }, 800);
      }, 1000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get next question key based on stage
  const getNextQuestionKey = (currentStage: CollectionStage): MessageKey => {
    switch (currentStage) {
      case 'name': return 'askAge';
      case 'age': return 'askGender';
      case 'gender': return 'askNationality';
      case 'nationality': return 'askLocation';
      case 'location': return 'thankYou';
      default: return 'custom';
    }
  };

  // Get next stage
  const getNextStage = (currentStage: CollectionStage): CollectionStage => {
    switch (currentStage) {
      case 'name': return 'age';
      case 'age': return 'gender';
      case 'gender': return 'nationality';
      case 'nationality': return 'location';
      case 'location': return 'extracting';
      default: return currentStage;
    }
  };

  // Handle data extraction
  const performExtraction = useCallback(async (_data: CollectedData, conversationHistory: AuraAssistMessage[]) => {
    if (!session || !user) return;

    setIsLoading(true);
    
    try {
      // Build conversation history string with translated content
      const historyText = conversationHistory
        .map(msg => {
          const content = msg.role === 'user' ? msg.content : getMessageContent(msg);
          return `${msg.role === 'user' ? 'User' : 'Assistant'}: ${content}`;
        })
        .join('\n');

      // Prepare the extraction request
      const extractionRequest: ChatRequest = {
        user_id: user.id.toString(),
        tenant_id: session.tenant_id,
        message: `${t.extractionSystemPrompt}\n\nConversation History:\n${historyText}`,
        use_rag: false,
        conversation_history: [],
      };

      console.log('🔍 AURA Assist - Sending extraction request...');
      const response = await chat(extractionRequest);
      
      if (response.message) {
        // Add extraction complete message
        setMessages(prev => [...prev, {
          id: generateId(),
          role: 'assistant',
          messageKey: 'extractionComplete',
          timestamp: new Date(),
        }]);
        
        // Add the AI-generated summary after a short delay
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: generateId(),
            role: 'assistant',
            messageKey: 'custom',
            content: response.message || '',
            timestamp: new Date(),
          }]);
          setStage('complete');
        }, 500);
      }
    } catch (error) {
      console.error('❌ AURA Assist extraction error:', error);
      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'assistant',
        messageKey: 'error',
        timestamp: new Date(),
      }]);
      setStage('complete');
    } finally {
      setIsLoading(false);
    }
  }, [session, user, t, getMessageContent]);

  // Handle user input submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading || stage === 'welcome' || stage === 'extracting' || stage === 'complete') {
      return;
    }

    const userMessage: AuraAssistMessage = {
      id: generateId(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    // Update messages with user input
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    // Update collected data based on current stage
    const newCollectedData = { ...collectedData };
    switch (stage) {
      case 'name':
        newCollectedData.name = inputValue.trim();
        break;
      case 'age':
        newCollectedData.age = inputValue.trim();
        break;
      case 'gender':
        newCollectedData.gender = inputValue.trim();
        break;
      case 'nationality':
        newCollectedData.nationality = inputValue.trim();
        break;
      case 'location':
        newCollectedData.location = inputValue.trim();
        break;
    }
    setCollectedData(newCollectedData);
    setInputValue('');

    // Get next stage and question key
    const nextStage = getNextStage(stage);
    const nextQuestionKey = getNextQuestionKey(stage);

    // Add a small delay for natural conversation flow
    setTimeout(() => {
      const assistantMessage: AuraAssistMessage = {
        id: generateId(),
        role: 'assistant',
        messageKey: nextQuestionKey,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setStage(nextStage);

      // If moving to extraction stage, trigger the extraction
      if (nextStage === 'extracting') {
        setTimeout(() => {
          performExtraction(newCollectedData, [...updatedMessages, assistantMessage]);
        }, 1000);
      }
    }, 600);
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Reset conversation
  const handleReset = () => {
    hasInitialized.current = false;
    setMessages([]);
    setStage('welcome');
    setCollectedData({
      name: '',
      age: '',
      gender: '',
      nationality: '',
      location: '',
    });
    
    // Re-trigger initialization
    setTimeout(() => {
      hasInitialized.current = true;
      
      setMessages([{
        id: generateId(),
        role: 'assistant',
        messageKey: 'welcome',
        timestamp: new Date(),
      }]);
      
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: generateId(),
          role: 'assistant',
          messageKey: 'greeting',
          timestamp: new Date(),
        }]);
        
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: generateId(),
            role: 'assistant',
            messageKey: 'askName',
            timestamp: new Date(),
          }]);
          setStage('name');
        }, 800);
      }, 1000);
    }, 100);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-gray-50 via-white to-blue-50/30 relative">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pb-48">
        {messages.length === 0 ? (
          // Centered welcome state (loading)
          <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[400px]">
            <div className="max-w-lg text-center space-y-6 animate-fade-in">
              {/* AURA Assist Icon */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#003A70] to-[#0059b3] flex items-center justify-center shadow-xl">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  {/* Pulse effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#003A70] to-[#0059b3] animate-ping opacity-20"></div>
                </div>
              </div>
              
              {/* Welcome Title */}
              <h1 className="text-2xl font-bold text-[#003A70]">
                {t.welcome.replace('{userName}', userName)}
              </h1>
              
              {/* Subtitle */}
              <p className="text-gray-600 text-sm max-w-md mx-auto">
                {language === 'en' 
                  ? 'I\'ll help collect some basic information from you through a quick conversation.'
                  : 'Je vais vous aider à recueillir quelques informations de base à travers une courte conversation.'}
              </p>
            </div>
          </div>
        ) : (
          // Messages display
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-[#003A70] to-[#0059b3] text-white rounded-br-md'
                      : 'bg-white/80 backdrop-blur-sm text-gray-800 rounded-bl-md border border-gray-100 shadow-sm'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div 
                      className="prose prose-sm max-w-none text-gray-800"
                      dangerouslySetInnerHTML={{ 
                        __html: getMessageContent(message)
                          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#003A70]">$1</strong>')
                          .replace(/\n/g, '<br />') 
                      }}
                    />
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl rounded-bl-md px-4 py-3 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-[#003A70] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-[#003A70] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-[#003A70] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {language === 'en' ? 'Processing...' : 'Traitement...'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Spacer to ensure last message is visible above input */}
            <div className="h-4" />
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="sticky bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-white via-white to-white/80 pt-4 pb-6 px-4 border-t border-gray-100/50">
        <div className="max-w-3xl mx-auto">
          {stage === 'complete' ? (
            // Reset button when conversation is complete
            <div className="flex justify-center">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gradient-to-r from-[#003A70] to-[#0059b3] text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {language === 'en' ? 'Start New Conversation' : 'Nouvelle conversation'}
              </button>
            </div>
          ) : (
            // Input form
            <form onSubmit={handleSubmit} className="relative">
              <div className="flex items-end gap-3 bg-white rounded-2xl border border-gray-200 shadow-lg p-3">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    stage === 'welcome' || stage === 'extracting'
                      ? (language === 'en' ? 'Please wait...' : 'Veuillez patienter...')
                      : (language === 'en' ? 'Type your answer...' : 'Tapez votre réponse...')
                  }
                  disabled={isLoading || stage === 'welcome' || stage === 'extracting'}
                  rows={1}
                  className="flex-1 resize-none bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 text-sm py-2 px-2 max-h-32 disabled:opacity-50"
                  style={{ minHeight: '44px' }}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading || stage === 'welcome' || stage === 'extracting'}
                  className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-r from-[#003A70] to-[#0059b3] text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 disabled:hover:scale-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              
              {/* Progress indicator */}
              <div className="mt-3 flex justify-center">
                <div className="flex items-center gap-2">
                  {['name', 'age', 'gender', 'nationality', 'location'].map((s, idx) => {
                    const dataStages: string[] = ['name', 'age', 'gender', 'nationality', 'location'];
                    const currentStage: string = stage;
                    const currentIdx = dataStages.indexOf(currentStage);
                    const isExtractionPhase = currentStage === 'extracting' || currentStage === 'complete';
                    const isCompleted = (currentIdx !== -1 && idx < currentIdx) || isExtractionPhase;
                    const isCurrent = s === currentStage;
                    
                    return (
                      <React.Fragment key={s}>
                        <div
                          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                            isCompleted
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500 scale-100'
                              : isCurrent
                              ? 'bg-gradient-to-r from-[#003A70] to-[#0059b3] scale-125 animate-pulse'
                              : 'bg-gray-300 scale-100'
                          }`}
                          title={t.dataFields[s as keyof typeof t.dataFields]}
                        />
                        {idx < 4 && (
                          <div
                            className={`w-6 h-0.5 transition-all duration-300 ${
                              isCompleted ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gray-200'
                            }`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuraAssistChat;
