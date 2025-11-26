import React, { useMemo, useState, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useConversation } from '../context/ConversationContext';
import { useModel } from '../context/ModelContext';
import { translations } from '../translations';

interface EmptyStateProps {
  onQuestionSelect?: (question: string) => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onQuestionSelect }) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { currentConversation } = useConversation();
  const { currentModel } = useModel();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [longPressIndex, setLongPressIndex] = useState<number | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle touch start for long press detection (mobile)
  const handleTouchStart = useCallback((index: number) => {
    longPressTimerRef.current = setTimeout(() => {
      setLongPressIndex(index);
    }, 1000); // 1 second long press
  }, []);

  // Handle touch end - clear the timer and optionally close expanded
  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Handle touch move - cancel long press if finger moves
  const handleTouchMove = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Close expanded capsule when tapping elsewhere on mobile
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    // Only close if clicking outside a capsule button
    if ((e.target as HTMLElement).closest('button') === null) {
      setLongPressIndex(null);
    }
  }, []);

  // Combined expanded state (either hovered on desktop or long-pressed on mobile)
  const isExpanded = (index: number) => hoveredIndex === index || longPressIndex === index;

  // Select greeting based on conversation ID to ensure consistency within a conversation
  const greeting = useMemo(() => {
    if (currentModel === 'opencare') {
      return translations[language].openCare.welcome;
    }

    // 8 different greeting templates
    const greetings = {
      en: [
        (name: string) => `Hello, ${name}. Ready to dive in?`,
        (name: string) => `Hey ${name}! What can I help you with today?`,
        (name: string) => `Welcome back, ${name}. Let's get started!`,
        (name: string) => `Hi ${name}! What's on your mind?`,
        (name: string) => `Good to see you, ${name}. What shall we explore?`,
        (name: string) => `Hey there, ${name}! Ready to create something amazing?`,
        (name: string) => `${name}, let's make today productive!`,
        (name: string) => `Hi ${name}! I'm here to help. What do you need?`,
      ],
      fr: [
        (name: string) => `Salut, ${name}. Prêt à te lancer ?`,
        (name: string) => `Bonjour ${name} ! Comment puis-je t'aider aujourd'hui ?`,
        (name: string) => `Ravi de te revoir, ${name}. C'est parti !`,
        (name: string) => `Salut ${name} ! Qu'as-tu en tête ?`,
        (name: string) => `Content de te voir, ${name}. Qu'allons-nous explorer ?`,
        (name: string) => `Hey ${name} ! Prêt à créer quelque chose d'incroyable ?`,
        (name: string) => `${name}, rendons cette journée productive !`,
        (name: string) => `Salut ${name} ! Je suis là pour t'aider. De quoi as-tu besoin ?`,
      ],
    };
    const templates = greetings[language];
    const conversationId = currentConversation?.id?.toString() || '0';
    // Use conversation ID to deterministically select a greeting
    const hash = conversationId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = hash % templates.length;
    // Use full_name if available, otherwise username, otherwise fallback
    const userName = user?.full_name || user?.username || (language === 'en' ? 'there' : 'toi');
    return templates[index](userName);
  }, [language, currentConversation?.id, user?.full_name, user?.username, currentModel]);



  // Get OpenCare predefined questions
  const openCareQuestions = currentModel === 'opencare' 
    ? translations[language].openCare.questions 
    : [];

  const handleQuestionClick = (question: string) => {
    if (onQuestionSelect) {
      onQuestionSelect(question);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="max-w-3xl w-full text-center space-y-6">
        {/* AURA Logo */}
        <div className="flex justify-center mb-4">
          <img
            src="/assets/aura_logo2.png"
            alt="AURA Logo"
            className="w-24 h-24 object-contain"
          />
        </div>

        {/* Dynamic Welcome Text - changes with each new chat */}
        <h1
          className={`font-bold ${currentModel === 'opencare' ? 'text-xl leading-relaxed' : 'text-3xl'}`}
          style={{ color: '#003A70' }}
        >
          {greeting}
        </h1>

        {/* OpenCare Predefined Questions */}
        {currentModel === 'opencare' && openCareQuestions.length > 0 && (
          <div 
            className="mt-8 flex flex-wrap justify-center gap-3"
            onClick={handleContainerClick}
          >
            {openCareQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => {
                  // On mobile, if already expanded via long press, clicking sends the question
                  // On desktop, clicking always sends the question
                  if (longPressIndex === index || longPressIndex === null) {
                    handleQuestionClick(question);
                    setLongPressIndex(null);
                  }
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onTouchStart={() => handleTouchStart(index)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
                className="group relative cursor-pointer touch-manipulation"
                style={{
                  zIndex: isExpanded(index) ? 10 : 1,
                }}
              >
                {/* Gooey Capsule */}
                <div
                  className={`
                    relative px-4 py-2.5 
                    bg-white/25 backdrop-blur-xl 
                    border border-white/40 
                    rounded-full 
                    shadow-lg 
                    transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                    hover:bg-white/40 hover:shadow-xl hover:border-white/60
                    overflow-hidden
                    ${isExpanded(index) ? 'scale-105 bg-white/40 shadow-xl border-white/60' : ''}
                  `}
                  style={{
                    maxWidth: isExpanded(index) ? '500px' : '200px',
                    transform: isExpanded(index) 
                      ? 'scale(1.02)' 
                      : (hoveredIndex !== null || longPressIndex !== null) && !isExpanded(index)
                        ? 'translateX(0) scale(0.98)' 
                        : 'scale(1)',
                  }}
                >
                  {/* Inner glow effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded-full transition-opacity duration-300 ${isExpanded(index) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                  
                  {/* Question text */}
                  <span 
                    className={`
                      relative z-10 text-sm font-medium
                      bg-gradient-to-r from-gray-700 to-gray-600 bg-clip-text text-transparent
                      transition-all duration-300
                      ${isExpanded(index) ? 'whitespace-normal' : 'whitespace-nowrap'}
                    `}
                    style={{
                      display: 'block',
                      overflow: isExpanded(index) ? 'visible' : 'hidden',
                      textOverflow: isExpanded(index) ? 'clip' : 'ellipsis',
                      maxWidth: isExpanded(index) ? '100%' : '160px',
                    }}
                  >
                    {question}
                  </span>

                  {/* Blur/glow halo behind on hover/expanded */}
                  <div 
                    className={`
                      absolute inset-0 -z-10 
                      bg-gradient-to-r from-cyan-200/30 via-white/40 to-blue-200/30 
                      rounded-full blur-xl 
                      transition-opacity duration-500
                      ${isExpanded(index) ? 'opacity-100' : 'opacity-0'}
                    `}
                  />
                </div>

                {/* Expand indicator (3 dots) when collapsed */}
                {!isExpanded(index) && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-50 group-hover:opacity-0 transition-opacity">
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default EmptyState;

