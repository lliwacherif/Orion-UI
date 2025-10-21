import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Message } from '../types/orcha';

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface ConversationContextType {
  conversations: Conversation[];
  currentConversationId: string | null;
  currentConversation: Conversation | null;
  createNewConversation: () => void;
  switchConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  addMessage: (message: Message) => void;
  updateConversationTitle: (id: string, title: string) => void;
  clearCurrentConversation: () => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

const CONVERSATIONS_STORAGE_KEY = 'aura_conversations';
const CURRENT_CONVERSATION_KEY = 'aura_current_conversation';

interface ConversationProviderProps {
  children: ReactNode;
}

export const ConversationProvider: React.FC<ConversationProviderProps> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Load conversations from localStorage on mount
  useEffect(() => {
    const storedConversations = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    const storedCurrentId = localStorage.getItem(CURRENT_CONVERSATION_KEY);

    if (storedConversations) {
      try {
        const parsed = JSON.parse(storedConversations);
        // Convert date strings back to Date objects
        const conversationsWithDates = parsed.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        setConversations(conversationsWithDates);
        
        // Set current conversation or create new one
        if (storedCurrentId && conversationsWithDates.find((c: Conversation) => c.id === storedCurrentId)) {
          setCurrentConversationId(storedCurrentId);
        } else if (conversationsWithDates.length > 0) {
          setCurrentConversationId(conversationsWithDates[0].id);
        } else {
          // Create first conversation
          const firstConv = createConversation();
          setConversations([firstConv]);
          setCurrentConversationId(firstConv.id);
        }
      } catch (error) {
        console.error('Failed to parse stored conversations:', error);
        // Create new conversation on error
        const firstConv = createConversation();
        setConversations([firstConv]);
        setCurrentConversationId(firstConv.id);
      }
    } else {
      // No stored conversations, create first one
      const firstConv = createConversation();
      setConversations([firstConv]);
      setCurrentConversationId(firstConv.id);
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
    }
  }, [conversations]);

  // Save current conversation ID
  useEffect(() => {
    if (currentConversationId) {
      localStorage.setItem(CURRENT_CONVERSATION_KEY, currentConversationId);
    }
  }, [currentConversationId]);

  const createConversation = (): Conversation => {
    return {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  const createNewConversation = () => {
    const newConv = createConversation();
    setConversations((prev) => [newConv, ...prev]);
    setCurrentConversationId(newConv.id);
  };

  const switchConversation = (id: string) => {
    setCurrentConversationId(id);
  };

  const deleteConversation = (id: string) => {
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      
      // If deleting current conversation, switch to another or create new
      if (id === currentConversationId) {
        if (filtered.length > 0) {
          setCurrentConversationId(filtered[0].id);
        } else {
          const newConv = createConversation();
          setCurrentConversationId(newConv.id);
          return [newConv];
        }
      }
      
      return filtered.length > 0 ? filtered : [createConversation()];
    });
  };

  const addMessage = (message: Message) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === currentConversationId) {
          const updatedMessages = [...conv.messages, message];
          
          // Auto-generate title from first user message
          let title = conv.title;
          if (conv.title === 'New Chat' && message.type === 'user' && message.content) {
            title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
          }
          
          return {
            ...conv,
            messages: updatedMessages,
            title,
            updatedAt: new Date(),
          };
        }
        return conv;
      })
    );
  };

  const updateConversationTitle = (id: string, title: string) => {
    setConversations((prev) =>
      prev.map((conv) => (conv.id === id ? { ...conv, title } : conv))
    );
  };

  const clearCurrentConversation = () => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === currentConversationId
          ? { ...conv, messages: [], updatedAt: new Date() }
          : conv
      )
    );
  };

  const currentConversation = conversations.find((c) => c.id === currentConversationId) || null;

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        currentConversationId,
        currentConversation,
        createNewConversation,
        switchConversation,
        deleteConversation,
        addMessage,
        updateConversationTitle,
        clearCurrentConversation,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = (): ConversationContextType => {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};

