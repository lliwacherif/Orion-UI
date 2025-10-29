import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useConversation } from '../context/ConversationContext';
import { getConversationDetails, deleteConversation, getUserConversations } from '../api/orcha';
import { chat } from '../api/orcha';
import type { TokenUsage, ChatMessage } from '../types/orcha';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  tokenUsage?: TokenUsage | null;
}

const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose, tokenUsage }) => {
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const { refreshConversations } = useConversation();
  const [showPersonalityAnalysis, setShowPersonalityAnalysis] = useState(false);
  const [personalityAnalysis, setPersonalityAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analyze personality based on last 3 conversations
  const analyzePersonality = async () => {
    if (!user) return;
    
    setIsAnalyzing(true);
    setShowPersonalityAnalysis(true);
    
    try {
      // Fetch fresh conversations for THIS USER ONLY (don't use cached state)
      console.log('🔍 Fetching conversations for user:', user.id);
      const userConversations = await getUserConversations(user.id);
      console.log('✅ Fetched', userConversations.length, 'conversations for user', user.id);
      
      // Get last 3 conversations sorted by updated_at
      const sortedConversations = userConversations
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 3);
      
      console.log('🧠 Analyzing personality from', sortedConversations.length, 'conversations');
      console.log('📋 Conversation IDs:', sortedConversations.map(c => c.id));
      
      // Fetch messages from each conversation
      const allUserMessages: string[] = [];
      
      for (const conv of sortedConversations) {
        try {
          console.log('📖 Fetching messages from conversation', conv.id, 'for user', user.id);
          const details = await getConversationDetails(user.id, conv.id);
          const userMessages = (details.messages || [])
            .filter((msg: ChatMessage) => msg.role === 'user')
            .map((msg: ChatMessage) => msg.content);
          allUserMessages.push(...userMessages);
        } catch (error) {
          console.error('Failed to fetch conversation', conv.id, error);
        }
      }
      
      console.log('📝 Collected', allUserMessages.length, 'user messages');
      
      if (allUserMessages.length === 0) {
        setPersonalityAnalysis(language === 'en' 
          ? 'Not enough messages to analyze. Start chatting to build your personality profile!'
          : 'Pas assez de messages pour analyser. Commencez à discuter pour créer votre profil de personnalité!');
        setIsAnalyzing(false);
        return;
      }
      
      // Prepare the analysis prompt with user messages
      const messagesText = allUserMessages.join('\n---\n');
      const prompt = `Analyze my personality based on my latest messages sent to you:\n\n${messagesText}`;
      
      // Call chat API for personality analysis
      const response = await chat({
        user_id: user.id.toString(),
        message: prompt,
        conversation_history: [],
      });
      
      console.log('🎯 Personality API Response:', response);
      console.log('📝 Message field:', response.message);
      console.log('🗑️ Temporary conversation ID:', response.conversation_id);
      
      // Extract the message from the response
      const analysisText = response.message || (language === 'en' 
        ? 'No analysis available' 
        : 'Aucune analyse disponible');
      
      console.log('✅ Setting personality analysis:', analysisText);
      setPersonalityAnalysis(analysisText);
      
      // Delete the temporary conversation so it doesn't appear in history
      if (response.conversation_id) {
        try {
          console.log('🗑️ Deleting temporary Memory conversation:', response.conversation_id);
          await deleteConversation(user.id, response.conversation_id);
          console.log('✅ Temporary conversation deleted');
          // Refresh conversations list to remove it from UI
          await refreshConversations();
        } catch (deleteError) {
          console.error('Failed to delete temporary conversation:', deleteError);
          // Non-critical error, continue anyway
        }
      }
    } catch (error) {
      console.error('Personality analysis failed:', error);
      setPersonalityAnalysis(language === 'en'
        ? 'Failed to analyze personality. Please try again.'
        : 'Échec de l\'analyse de personnalité. Veuillez réessayer.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen || !user) return null;

  // Format token count with commas
  const formatTokens = (count: number) => {
    return count.toLocaleString();
  };

  // Format time until reset
  const formatTimeUntilReset = (timeString: string) => {
    if (!timeString) return 'N/A';
    
    // Parse "HH:MM:SS.microseconds" format
    const parts = timeString.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header - Fixed */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-400 text-white px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {language === 'en' ? 'User Profile' : 'Profil Utilisateur'}
              </h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded-lg transition"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            {/* User Avatar */}
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-emerald-400 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Memory Capsule Button */}
            <div className="flex justify-center">
              <button
                onClick={analyzePersonality}
                disabled={isAnalyzing}
                className="group relative px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-md border border-white/30 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {language === 'en' ? 'Memory' : 'Mémoire'}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            </div>

            {/* User Details */}
            <div className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  {language === 'en' ? 'Username' : 'Nom d\'utilisateur'}
                </label>
                <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                  <p className="text-gray-900 font-medium">@{user.username}</p>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  {language === 'en' ? 'Email' : 'Email'}
                </label>
                <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                  <p className="text-gray-900 font-medium">{user.email}</p>
                </div>
              </div>

              {/* Full Name */}
              {user.full_name && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    {language === 'en' ? 'Full Name' : 'Nom complet'}
                  </label>
                  <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                    <p className="text-gray-900 font-medium">{user.full_name}</p>
                  </div>
                </div>
              )}

              {/* Plan Type */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  {language === 'en' ? 'Plan' : 'Plan'}
                </label>
                <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                  <span className="inline-block px-3 py-1 bg-gradient-to-r from-blue-600 to-emerald-400 text-white rounded-full text-sm font-semibold uppercase">
                    {user.plan_type}
                  </span>
                </div>
              </div>

              {/* Session Info */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  {language === 'en' ? 'Session Status' : 'Statut de la Session'}
                </label>
                <div className="bg-green-50 rounded-lg px-4 py-3 border border-green-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <p className="text-green-700 font-medium">
                      {language === 'en' ? 'Active' : 'Active'}
                    </p>
                  </div>
                  
                  {/* Token Usage */}
                  {tokenUsage && tokenUsage.tracking_enabled && (
                    <div className="pt-2 border-t border-green-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {language === 'en' ? 'Tokens Used' : 'Jetons Utilisés'}
                        </span>
                        <span className="font-bold text-green-700">
                          {formatTokens(tokenUsage.current_usage)}
                        </span>
                      </div>
                      {tokenUsage.tokens_added > 0 && (
                        <div className="text-xs text-green-600 mt-1">
                          +{formatTokens(tokenUsage.tokens_added)} {language === 'en' ? 'this conversation' : 'cette conversation'}
                        </div>
                      )}
                      <div className="text-xs text-green-600 mt-1">
                        {language === 'en' ? 'Resets in' : 'Réinitialisation dans'}: {formatTimeUntilReset(tokenUsage.time_until_reset)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-blue-50 rounded-lg px-4 py-3 border border-blue-200">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-blue-700">
                  {language === 'en' 
                    ? 'Your conversations are private and secure.'
                    : 'Vos conversations sont privées et sécurisées.'}
                </p>
              </div>
            </div>
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 space-y-2 flex-shrink-0">
            <button
              onClick={logout}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition font-medium"
            >
              {language === 'en' ? 'Logout' : 'Déconnexion'}
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              {language === 'en' ? 'Close' : 'Fermer'}
            </button>
          </div>
        </div>
      </div>

      {/* Personality Analysis Modal */}
      {showPersonalityAnalysis && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isAnalyzing && setShowPersonalityAnalysis(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden border border-white/50">
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 text-white px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">
                    {language === 'en' ? 'Memory' : 'Mémoire'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowPersonalityAnalysis(false)}
                  disabled={isAnalyzing}
                  className="p-1 hover:bg-white/20 rounded-lg transition disabled:opacity-50"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-12">
                  {/* Thinking Animation */}
                  <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 border-4 border-sky-200 rounded-full" />
                    <div className="absolute inset-0 border-4 border-transparent border-t-sky-500 rounded-full animate-spin" />
                    <div className="absolute inset-2 border-4 border-transparent border-t-blue-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-10 h-10 text-sky-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-sky-700 mb-2">
                    {language === 'en' ? 'Memory loading...' : 'Chargement de la mémoire...'}
                  </p>
                  <p className="text-sm text-sky-600">
                    {language === 'en' ? 'Analyzing your conversation patterns' : 'Analyse de vos conversations'}
                  </p>
                </div>
              ) : (
                <div className="prose prose-sky max-w-none">
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/80">
                    <div className="text-gray-800 leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {personalityAnalysis}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {!isAnalyzing && (
              <div className="bg-white/50 backdrop-blur-sm px-6 py-4 border-t border-white/50 flex-shrink-0">
                <button
                  onClick={() => setShowPersonalityAnalysis(false)}
                  className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white py-2.5 px-4 rounded-xl hover:from-sky-600 hover:to-blue-700 transition font-medium shadow-md"
                >
                  {language === 'en' ? 'Close' : 'Fermer'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default UserProfile;

