import React, { useState, useEffect } from 'react';
import { useConversation } from '../context/ConversationContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useModel } from '../context/ModelContext';
import { translations } from '../translations';
import type { TokenUsage } from '../types/orcha';
import UserProfile from './UserProfile';
import { getTokenUsage } from '../api/orcha';
import { AgentTaskService } from '../services/agentTaskService';
import { Clock, Globe } from 'lucide-react';

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  tokenUsage?: TokenUsage | null;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ isOpen, onToggle, tokenUsage }) => {
  const {
    conversations,
    currentConversationId,
    createNewConversation,
    switchConversation,
    deleteConversation,
    loading,
    error,
  } = useConversation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { setModel } = useModel();
  const t = translations[language].sidebar;
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentTokenUsage, setCurrentTokenUsage] = useState<TokenUsage | null>(tokenUsage || null);

  // Update local token usage when prop changes (from chat responses)
  useEffect(() => {
    if (tokenUsage) {
      setCurrentTokenUsage(tokenUsage);
    }
  }, [tokenUsage]);

  // Fetch token usage when profile is opened
  useEffect(() => {
    const fetchTokenUsage = async () => {
      if (!user?.id) return;

      try {
        const response = await getTokenUsage(user.id.toString());
        
        if (response.status === 'ok' && response.tracking_enabled) {
          setCurrentTokenUsage({
            current_usage: response.current_usage || 0,
            tokens_added: 0,
            reset_at: response.reset_at || '',
            tracking_enabled: response.tracking_enabled,
            time_until_reset: response.time_until_reset || ''
          });
        }
      } catch (error) {
        console.error('Failed to fetch token usage:', error);
        // Silently fail - token tracking is optional
      }
    };

    if (isProfileOpen && user?.id) {
      fetchTokenUsage();
    }
  }, [isProfileOpen, user?.id]);

  // Handle creating new conversation and switching to chat mode
  const handleNewChat = async () => {
    await createNewConversation();
    setModel('chat'); // Switch back to chat mode
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingId === id) {
      deleteConversation(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
      // Reset after 3 seconds
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return language === 'en' ? 'Today' : 'Aujourd\'hui';
    } else if (diffInHours < 48) {
      return language === 'en' ? 'Yesterday' : 'Hier';
    } else if (diffInHours < 24 * 7) {
      return language === 'en' ? 'This week' : 'Cette semaine';
    } else {
      return date.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  // Check if a conversation is from an agent task
  const isAgentTaskConversation = (convTitle: string) => {
    const tasks = AgentTaskService.getAllTasks();
    return tasks.some(task => 
      convTitle.includes(task.taskName) || convTitle.includes(task.instructions.substring(0, 50))
    );
  };

  // Check if a conversation is from a web search
  const isSearchConversation = (convId: number) => {
    const searchConvs = localStorage.getItem('aura_search_conversations');
    if (!searchConvs) return false;
    try {
      const ids: number[] = JSON.parse(searchConvs);
      return ids.includes(convId);
    } catch {
      return false;
    }
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv =>
    conv.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group conversations by date
  const groupedConversations = filteredConversations.reduce((groups, conv) => {
    const key = formatDate(conv.updated_at);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(conv);
    return groups;
  }, {} as Record<string, typeof filteredConversations>);

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full text-white transition-all duration-300 ease-in-out z-20 flex flex-col ${
          isOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}
        style={{ backgroundColor: '#003a70' }}
      >
        {/* Header */}
        <div className="p-3 border-b border-gray-700 flex-shrink-0 space-y-2">
          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="w-full text-white hover:bg-gray-800 rounded-lg px-3 py-2.5 transition flex items-center gap-3 text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span>{t.newChat}</span>
          </button>

          {/* Search Input */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'en' ? 'Search chats' : 'Rechercher des chats'}
              className="w-full bg-gray-800 hover:bg-gray-750 text-white text-sm rounded-lg pl-10 pr-3 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-600 transition"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar-dark px-2 py-2">
          {loading ? (
            <div className="text-center text-gray-500 text-sm py-8">
              <p>{language === 'en' ? 'Loading conversations...' : 'Chargement des conversations...'}</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-400 text-sm py-8">
              <p>{language === 'en' ? 'Failed to load conversations' : 'Échec du chargement des conversations'}</p>
            </div>
          ) : (
            <>
              {Object.entries(groupedConversations).map(([dateLabel, convs]) => (
                <div key={dateLabel} className="mb-4">
                  <p className="text-xs text-gray-400 px-3 py-2 font-medium">{dateLabel}</p>
                  <div className="space-y-1">
                    {convs.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => switchConversation(conv.id)}
                        className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition ${
                          conv.id === currentConversationId
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        {/* Web Search Icon */}
                        {isSearchConversation(conv.id) && (
                          <Globe 
                            className="w-4 h-4 text-sky-400 flex-shrink-0" 
                            title={language === 'en' ? 'Web search' : 'Recherche Web'}
                          />
                        )}

                        {/* Agent Task Icon */}
                        {!isSearchConversation(conv.id) && isAgentTaskConversation(conv.title || '') && (
                          <Clock 
                            className="w-4 h-4 text-purple-400 flex-shrink-0" 
                            title={language === 'en' ? 'Scheduled task' : 'Tâche planifiée'}
                          />
                        )}

                        {/* Title */}
                        <span className="flex-1 text-sm truncate">{conv.title || 'Untitled Conversation'}</span>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => handleDelete(conv.id, e)}
                          className={`flex-shrink-0 p-1 rounded transition opacity-0 group-hover:opacity-100 ${
                            deletingId === conv.id
                              ? 'text-red-400 hover:text-red-300'
                              : 'text-gray-400 hover:text-white'
                          }`}
                          title={deletingId === conv.id ? t.confirmDelete : t.deleteChat}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {filteredConversations.length === 0 && !loading && !error && (
                <div className="text-center text-gray-500 text-sm py-8">
                  <p>
                    {searchQuery
                      ? language === 'en'
                        ? 'No chats found'
                        : 'Aucun chat trouvé'
                      : t.noChats}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-3 flex-shrink-0 space-y-3">
          {/* Conversation Count */}
          <p className="text-xs text-gray-400 text-center">
            {searchQuery && filteredConversations.length !== conversations.length
              ? `${filteredConversations.length} / ${conversations.length} ${t.chatCount}`
              : `${conversations.length} ${t.chatCount}`}
          </p>

          {/* User Profile Button */}
          <button
            onClick={() => setIsProfileOpen(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-emerald-400 hover:from-blue-700 hover:to-emerald-500 text-white rounded-lg px-3 py-2.5 transition flex items-center gap-3 text-sm"
          >
            <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : (user?.username.charAt(0).toUpperCase() || 'U')}
            </div>
            <div className="flex-1 text-left overflow-hidden">
              <p className="font-medium truncate">{user?.full_name || user?.username || 'User'}</p>
              <p className="text-xs text-white/80 truncate">@{user?.username || 'username'}</p>
            </div>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>

          {/* Branding text */}
          <p className="text-xs text-gray-400 text-center">
            {language === 'en' ? 'AI-Powered Chat by VAERDIA' : 'Chat IA par VAERDIA'}
          </p>
        </div>
      </div>

      {/* User Profile Modal */}
      <UserProfile 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)}
        tokenUsage={currentTokenUsage}
      />

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
};

export default ChatSidebar;

