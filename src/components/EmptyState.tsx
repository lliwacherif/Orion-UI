import React, { useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useConversation } from '../context/ConversationContext';

const EmptyState: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { currentConversation } = useConversation();

  // Select greeting based on conversation ID to ensure consistency within a conversation
  const greeting = useMemo(() => {
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
  }, [language, currentConversation?.id, user?.full_name, user?.username]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center space-y-6">
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
          className="text-3xl font-bold"
          style={{ color: '#003A70' }}
        >
          {greeting}
        </h1>
      </div>
    </div>
  );
};

export default EmptyState;

