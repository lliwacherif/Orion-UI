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
import { Clock, Globe, MessageSquare, Menu, Search } from 'lucide-react';

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  tokenUsage?: TokenUsage | null;
}

// User Profile Button Component with Gooey Hover Expansion
interface UserProfileButtonProps {
  user: any;
  language: string;
  tokenUsage: TokenUsage | null;
  onOpenProfile: () => void;
}

const UserProfileButton: React.FC<UserProfileButtonProps> = ({ user, language, tokenUsage, onOpenProfile }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<number | null>(null);
  const [longPressTimeout, setLongPressTimeout] = useState<number | null>(null);

  const handleMouseEnter = () => {
    const timeout = setTimeout(() => {
      setIsExpanded(true);
    }, 1000); // 1 second hover delay
    setHoverTimeout(timeout);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setIsExpanded(false);
  };

  // Mobile long press support
  const handleTouchStart = () => {
    const timeout = setTimeout(() => {
      setIsExpanded(true);
    }, 1000); // 1 second long press
    setLongPressTimeout(timeout);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimeout) {
      clearTimeout(longPressTimeout);
      setLongPressTimeout(null);
    }

    // If not expanded, treat as click to open profile
    if (!isExpanded) {
      e.preventDefault();
      onOpenProfile();
    } else {
      setIsExpanded(false);
    }
  };

  const formatTokens = (count: number) => {
    return count.toLocaleString();
  };

  return (
    <button
      onClick={() => {
        // Only open profile on click if not in expansion state
        if (!isExpanded) {
          onOpenProfile();
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="group relative w-full text-white rounded-full transition-all duration-500 ease-out flex flex-col text-sm shadow-lg hover:shadow-xl backdrop-blur-md border border-white/30 bg-gradient-to-r from-[#7CFC00]/25 via-[#48D1CC]/25 to-[#1E90FF]/25 overflow-hidden"
      style={{
        height: isExpanded ? '140px' : '60px',
        filter: isExpanded ? 'contrast(1.1)' : 'none',
        transition: 'height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.4s ease-out',
      }}
    >
      {/* Gooey effect overlay */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-700"
        style={{
          filter: isExpanded ? 'blur(8px)' : 'blur(0px)',
          opacity: isExpanded ? 0.3 : 0,
          background: 'radial-gradient(circle at center, rgba(72, 209, 204, 0.4), transparent)',
        }}
      />

      {/* Main content */}
      <div className={`relative z-10 px-4 transition-all duration-500 ${isExpanded ? 'py-3' : 'py-3'}`}>
        <div className="flex items-center gap-3">
          <div className={`rounded-full overflow-hidden flex-shrink-0 border-2 border-white/40 bg-white/10 backdrop-blur-sm transition-all duration-500 ${isExpanded ? 'w-12 h-12' : 'w-10 h-10'}`}>
            {user?.full_name || user?.username ? (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center text-sm font-bold">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : (user?.username.charAt(0).toUpperCase() || 'U')}
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center text-sm font-bold">
                U
              </div>
            )}
          </div>
          <div className="flex-1 text-left overflow-hidden">
            <p className="font-semibold truncate bg-gradient-to-r from-white via-white to-sky-100 bg-clip-text text-transparent">
              {user?.full_name || user?.username || 'User'}
            </p>
            <p className={`text-xs text-white/90 truncate transition-opacity duration-300 ${isExpanded ? 'opacity-0' : 'opacity-100'}`}>
              {user?.email || `${user?.username}@example.com`}
            </p>
          </div>
        </div>

        {/* Expanded info - Token Usage */}
        <div
          className="mt-3 space-y-2 transition-all duration-500"
          style={{
            opacity: isExpanded ? 1 : 0,
            transform: isExpanded ? 'translateY(0)' : 'translateY(-10px)',
            maxHeight: isExpanded ? '100px' : '0px',
          }}
        >
          {tokenUsage && tokenUsage.tracking_enabled ? (
            <>
              {/* Divider */}
              <div className="w-full h-px bg-white/20 backdrop-blur-sm" />

              {/* Token info */}
              <div className="bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-white/80">
                      {language === 'en' ? 'Tokens Used' : 'Jetons Utilisés'}
                    </span>
                  </div>
                  <span className="text-sm font-bold bg-gradient-to-r from-emerald-300 to-sky-300 bg-clip-text text-transparent">
                    {formatTokens(tokenUsage.current_usage)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Divider */}
              <div className="w-full h-px bg-white/20 backdrop-blur-sm" />

              <div className="text-center text-xs text-white/60 py-1">
                {language === 'en' ? 'Click to view profile' : 'Cliquez pour voir le profil'}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#7CFC00]/20 via-[#48D1CC]/20 to-[#1E90FF]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </button>
  );
};


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
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  // Toggle search visibility
  const handleToggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      // Clear search when closing
      setSearchQuery('');
    }
  };

  // Auto-focus search input when opened
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        document.getElementById('search-input')?.focus();
      }, 100);
    }
  }, [isSearchOpen]);

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
    } catch (error) {
      console.error('Error parsing search conversations:', error);
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
        className={`fixed left-0 top-0 h-full text-white transition-all duration-300 ease-in-out z-20 flex flex-col ${isOpen ? 'w-64' : 'w-0'
          } overflow-hidden`}
        style={{
          background: 'linear-gradient(to bottom, #003a70 0%, #00294d 50%, #001f3d 100%)'
        }}
      >
        {/* Top Header with Logo and Menu */}
        <div className="p-4 border-b border-white/10 flex-shrink-0 flex items-center justify-between">
          <img
            src="/assets/AURA_Icon.png"
            alt="AURA Logo"
            className="w-10 h-10 object-contain"
          />
          <button
            onClick={onToggle}
            className="p-2 hover:bg-white/10 rounded-lg transition"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat and Search Section */}
        <div className="p-3 border-b border-white/10 flex-shrink-0">
          {/* New Chat + Glassy Search Inline */}
          <div className="flex items-center justify-between gap-2 mb-2">
            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className={`group relative text-white rounded-full transition-all duration-300 flex items-center justify-center gap-2 text-sm font-semibold shadow-lg hover:shadow-xl backdrop-blur-md border border-white/30 bg-gradient-to-r from-[#7CFC00]/25 via-[#48D1CC]/25 to-[#1E90FF]/25 overflow-hidden ${isSearchOpen ? 'w-10 h-10 p-0 flex-shrink-0' : 'flex-1 px-5 py-3'
                }`}
              title={isSearchOpen ? t.newChat : undefined}
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {!isSearchOpen && (
                  <span className="whitespace-nowrap bg-gradient-to-r from-[#7CFC00] via-[#48D1CC] to-[#1E90FF] bg-clip-text text-transparent">
                    {t.newChat}
                  </span>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#7CFC00]/20 via-[#48D1CC]/20 to-[#1E90FF]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Search Button / Inline Glassy Search */}
            <div className={`relative ${isSearchOpen ? 'flex-1' : 'flex-shrink-0'}`}>
              {!isSearchOpen && (
                <button
                  onClick={handleToggleSearch}
                  className="group relative w-10 h-10 p-0 text-white rounded-full transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl backdrop-blur-md border border-white/30 bg-gradient-to-r from-[#7CFC00]/30 via-[#48D1CC]/30 to-[#1E90FF]/30 overflow-hidden"
                  aria-label="Search"
                >
                  <div className="relative z-10 flex items-center justify-center">
                    <Search className="w-4 h-4 flex-shrink-0" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#7CFC00]/30 via-[#48D1CC]/30 to-[#1E90FF]/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}

              {isSearchOpen && (
                <div className="relative w-full">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Search className="w-4 h-4 text-white/60" />
                  </div>
                  <input
                    id="search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={language === 'en' ? 'Search Conversation...' : 'Rechercher une conversation...'}
                    className="w-full bg-white/10 hover:bg-white/15 text-white text-sm rounded-full pl-10 pr-9 py-2.5 placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 backdrop-blur-md border border-white/20 transition-all duration-300"
                    autoFocus={isSearchOpen}
                  />
                  <button
                    onClick={handleToggleSearch}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-6 h-6 flex items-center justify-center transition"
                    aria-label={language === 'en' ? 'Close search' : 'Fermer la recherche'}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chats Section Header */}
        <div className="px-3 pt-4 pb-2 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-400" />
          <span className="text-white font-medium text-sm">{language === 'en' ? 'Chats' : 'Discussions'}</span>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar-dark px-2 py-2">
          {loading ? (
            <div className="text-center text-white/60 text-sm py-8">
              <p>{language === 'en' ? 'Loading conversations...' : 'Chargement des conversations...'}</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-300 text-sm py-8">
              <p>{language === 'en' ? 'Failed to load conversations' : 'Échec du chargement des conversations'}</p>
            </div>
          ) : (
            <>
              {Object.entries(groupedConversations).map(([dateLabel, convs]) => (
                <div key={dateLabel} className="mb-4">
                  <p className="text-xs text-white/50 px-3 py-2 font-medium">{dateLabel}</p>
                  <div className="space-y-0.5">
                    {convs.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => switchConversation(conv.id)}
                        className={`group relative flex items-center gap-2 px-3 py-3 rounded-lg cursor-pointer transition ${conv.id === currentConversationId
                          ? 'bg-white/10 text-white'
                          : 'text-white/80 hover:bg-white/5 hover:text-white'
                          }`}
                      >
                        {/* Web Search Icon */}
                        {isSearchConversation(conv.id) && (
                          <span title={language === 'en' ? 'Web search' : 'Recherche Web'}>
                            <Globe className="w-4 h-4 text-sky-400 flex-shrink-0" />
                          </span>
                        )}

                        {/* Agent Task Icon */}
                        {!isSearchConversation(conv.id) && isAgentTaskConversation(conv.title || '') && (
                          <span title={language === 'en' ? 'Scheduled task' : 'Tâche planifiée'}>
                            <Clock className="w-4 h-4 text-purple-400 flex-shrink-0" />
                          </span>
                        )}

                        {/* Title */}
                        <span className="flex-1 text-sm truncate">{conv.title || 'Untitled Conversation'}</span>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => handleDelete(conv.id, e)}
                          className={`flex-shrink-0 p-1 rounded transition opacity-0 group-hover:opacity-100 ${deletingId === conv.id
                            ? 'text-red-400 hover:text-red-300'
                            : 'text-white/60 hover:text-white'
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
                <div className="text-center text-white/60 text-sm py-8">
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
        <div className="border-t border-white/10 p-4 flex-shrink-0 space-y-4">
          {/* User Profile Button with Gooey Hover Expansion */}
          <UserProfileButton
            user={user}
            language={language}
            tokenUsage={currentTokenUsage}
            onOpenProfile={() => setIsProfileOpen(true)}
          />

          {/* Branding text */}
          <p className="text-xs text-white/60 text-center font-light">
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


    </>
  );
};

export default ChatSidebar;

