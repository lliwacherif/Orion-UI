import React, { useState } from 'react';
import { useConversation } from '../context/ConversationContext';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ isOpen, onToggle }) => {
  const {
    conversations,
    currentConversationId,
    createNewConversation,
    switchConversation,
    deleteConversation,
  } = useConversation();
  const { language } = useLanguage();
  const t = translations[language].sidebar;
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDelete = (id: string, e: React.MouseEvent) => {
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

  const formatDate = (date: Date) => {
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

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group conversations by date
  const groupedConversations = filteredConversations.reduce((groups, conv) => {
    const key = formatDate(conv.updatedAt);
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
        className={`fixed left-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 ease-in-out z-20 flex flex-col ${
          isOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}
      >
        {/* Header */}
        <div className="p-3 border-b border-gray-700 flex-shrink-0 space-y-2">
          {/* New Chat Button */}
          <button
            onClick={createNewConversation}
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
                    {/* Title */}
                    <span className="flex-1 text-sm truncate">{conv.title}</span>

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

          {filteredConversations.length === 0 && (
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
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-3 flex-shrink-0">
          <p className="text-xs text-gray-400 text-center">
            {searchQuery && filteredConversations.length !== conversations.length
              ? `${filteredConversations.length} / ${conversations.length} ${t.chatCount}`
              : `${conversations.length} ${t.chatCount}`}
          </p>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`fixed top-20 z-30 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg shadow-lg transition-all duration-300 ${
          isOpen ? 'left-[272px]' : 'left-2'
        }`}
        aria-label={isOpen ? t.closeSidebar : t.openSidebar}
        title={isOpen ? t.closeSidebar : t.openSidebar}
      >
        <svg
          className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-0' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

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

