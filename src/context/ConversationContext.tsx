// @refresh reset
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  createConversation,
  getUserConversations,
  getConversationDetails,
  updateConversation,
  deleteConversation as deleteConversationAPI
} from '../api/orcha';
import type { Conversation, ChatMessage, CreateConversationRequest, UpdateConversationRequest } from '../types/orcha';

interface ConversationContextType {
  conversations: Conversation[];
  currentConversationId: number | null;
  currentConversation: Conversation | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  createNewConversation: () => Promise<number | null>;
  switchConversation: (id: number) => Promise<void>;
  deleteConversation: (id: number) => Promise<void>;
  updateConversationTitle: (id: number, title: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
  refreshMessages: () => Promise<void>;
  clearCurrentConversation: () => void;
  addMessage: (message: ChatMessage) => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

interface ConversationProviderProps {
  children: ReactNode;
}

export const ConversationProvider: React.FC<ConversationProviderProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousConversationIdRef = useRef<number | null>(null);

  const refreshConversations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Fetching conversations for user:', user.id);
      const fetchedConversations = await getUserConversations(user.id);
      console.log('✅ Conversations fetched:', fetchedConversations);

      // Store the current conversation ID before updating
      const previousConversationId = currentConversationId;

      setConversations(fetchedConversations);

      // Only auto-select first conversation if there's no current conversation
      // This prevents switching away from the current conversation after sending a message
      if (!previousConversationId && fetchedConversations.length > 0) {
        console.log('📌 No current conversation, selecting first one:', fetchedConversations[0].id);
        setCurrentConversationId(fetchedConversations[0].id);
      } else if (previousConversationId) {
        console.log('📌 Keeping current conversation:', previousConversationId);
        // Verify the current conversation still exists in the fetched list
        const conversationExists = fetchedConversations.some(c => c.id === previousConversationId);
        if (!conversationExists && fetchedConversations.length > 0) {
          console.log('⚠️ Current conversation no longer exists, selecting first one');
          setCurrentConversationId(fetchedConversations[0].id);
        }
      }
    } catch (err) {
      console.error('❌ Failed to refresh conversations:', err);
      // Don't set error for now, just log it - this might be expected if backend is not running
      console.log('⚠️ Backend might not be running, continuing with empty conversations');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [user, currentConversationId]);

  const loadConversationMessages = useCallback(async () => {
    if (!user || !currentConversationId) return;

    setLoading(true);
    setError(null);
    try {
      const conversationDetails = await getConversationDetails(user.id, currentConversationId);
      setMessages(conversationDetails.messages || []);
    } catch (err) {
      console.error('❌ Failed to load conversation messages:', err);
      // Don't set error for now, just log it - this might be expected if backend is not running
      console.log('⚠️ Backend might not be running, continuing with empty messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [user, currentConversationId]);

  // Load conversations when user changes
  useEffect(() => {
    if (authLoading) return; // Wait for auth to finish loading

    if (user) {
      refreshConversations();
    } else {
      // Clear state when user logs out
      setConversations([]);
      setCurrentConversationId(null);
      setMessages([]);
    }
  }, [user, authLoading, refreshConversations]);

  // Load messages when conversation changes
  useEffect(() => {
    if (authLoading) return; // Wait for auth to finish loading

    // Only reload messages if the conversation ID actually changed
    if (user && currentConversationId) {
      if (previousConversationIdRef.current !== currentConversationId) {
        console.log('🔄 Conversation changed, loading messages:', currentConversationId);
        previousConversationIdRef.current = currentConversationId;
        loadConversationMessages();
      } else {
        console.log('📌 Same conversation, skipping message reload');
      }
    } else {
      previousConversationIdRef.current = null;
      setMessages([]);
    }
  }, [user, currentConversationId, authLoading, loadConversationMessages]);

  const createNewConversation = useCallback(async () => {
    if (!user) return null;

    setLoading(true);
    setError(null);
    try {
      const payload: CreateConversationRequest = {
        user_id: user.id,
        title: 'New Chat',
        tenant_id: undefined // You can add tenant_id if needed
      };

      const newConversation = await createConversation(payload);
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversationId(newConversation.id);
      setMessages([]);
      return newConversation.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
      console.error('Failed to create conversation:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const switchConversation = useCallback(async (id: number) => {
    setCurrentConversationId(id);
  }, []);

  const deleteConversation = useCallback(async (id: number) => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      await deleteConversationAPI(user.id, id);
      setConversations(prev => prev.filter(c => c.id !== id));

      // If deleting current conversation, switch to another or create new
      if (id === currentConversationId) {
        const remainingConversations = conversations.filter(c => c.id !== id);
        if (remainingConversations.length > 0) {
          setCurrentConversationId(remainingConversations[0].id);
        } else {
          await createNewConversation();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete conversation');
      console.error('Failed to delete conversation:', err);
    } finally {
      setLoading(false);
    }
  }, [user, currentConversationId, conversations, createNewConversation]);

  const updateConversationTitle = useCallback(async (id: number, title: string) => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const payload: UpdateConversationRequest = { title };
      const updatedConversation = await updateConversation(user.id, id, payload);

      setConversations(prev =>
        prev.map(conv => conv.id === id ? updatedConversation : conv)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update conversation title');
      console.error('Failed to update conversation title:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const clearCurrentConversation = useCallback(() => {
    setMessages([]);
  }, []);

  const refreshMessages = useCallback(async () => {
    console.log('🔄 Manually refreshing messages for current conversation');
    await loadConversationMessages();
  }, [loadConversationMessages]);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const currentConversation = conversations.find(c => c.id === currentConversationId) || null;

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        currentConversationId,
        currentConversation,
        messages,
        loading,
        error,
        createNewConversation,
        switchConversation,
        deleteConversation,
        updateConversationTitle,
        refreshConversations,
        refreshMessages,
        clearCurrentConversation,
        addMessage,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useConversation = (): ConversationContextType => {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};


