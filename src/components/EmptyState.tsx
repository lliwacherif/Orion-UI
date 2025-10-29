import React, { useMemo } from 'react';
import { useModel } from '../context/ModelContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useConversation } from '../context/ConversationContext';

const EmptyState: React.FC = () => {
  const { setModel } = useModel();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { currentConversation } = useConversation();

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

  // Select greeting based on conversation ID to ensure consistency within a conversation
  const greeting = useMemo(() => {
    const templates = greetings[language];
    const conversationId = currentConversation?.id?.toString() || '0';
    // Use conversation ID to deterministically select a greeting
    const hash = conversationId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = hash % templates.length;
    // Use full_name if available, otherwise username, otherwise fallback
    const userName = user?.full_name || user?.username || (language === 'en' ? 'there' : 'toi');
    return templates[index](userName);
  }, [language, currentConversation?.id, user?.full_name, user?.username]);

  const models = [
    {
      id: 'doc' as const,
      name: 'AURA Doc',
      icon: '📄',
      description: language === 'en' ? 'Analyze documents and PDFs' : 'Analyser des documents et PDFs',
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      id: 'vision' as const,
      name: 'AURA Vision',
      icon: '👁️',
      description: language === 'en' ? 'Analyze images with AI' : 'Analyser des images avec l\'IA',
      gradient: 'from-purple-500 to-pink-600',
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        {/* Personalized greeting */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {greeting}
          </h2>
        </div>

        {/* Model cards - 60% smaller */}
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => setModel(model.id)}
              className="group relative overflow-hidden bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-transparent hover:shadow-lg transition-all duration-300"
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${model.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="text-3xl mb-2 transform group-hover:scale-110 transition-transform duration-300">
                  {model.icon}
                </div>
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-white mb-1 transition-colors">
                  {model.name}
                </h3>
                <p className="text-xs text-gray-600 group-hover:text-white/90 transition-colors">
                  {model.description}
                </p>
              </div>

              {/* Arrow icon */}
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transform translate-x-1 group-hover:translate-x-0 transition-all duration-300">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Info text */}
        <p className="mt-6 text-xs text-gray-400">
          {language === 'en' 
            ? 'Or start typing below to use the general chat'
            : 'Ou commencez à taper ci-dessous pour utiliser le chat général'}
        </p>
      </div>
    </div>
  );
};

export default EmptyState;

