import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useConversation } from '../context/ConversationContext';
import { getConversationDetails, deleteConversation, getUserConversations, saveMemory, getMemory, updateUserEmail, updateUserPassword } from '../api/orcha';
import { chat } from '../api/orcha';
import type { TokenUsage, ChatMessage } from '../types/orcha';
import ScheduledTasksManager from './ScheduledTasksManager';
import { Settings, Eye, EyeOff, ArrowLeft, Mail, Lock } from 'lucide-react';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  tokenUsage?: TokenUsage | null;
}

const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose, tokenUsage }) => {
  const { user, logout, refreshUser } = useAuth();
  const { language } = useLanguage();
  const { refreshConversations } = useConversation();
  const [showPersonalityAnalysis, setShowPersonalityAnalysis] = useState(false);
  const [personalityAnalysis, setPersonalityAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showStoredMemory, setShowStoredMemory] = useState(false);
  const [storedMemoryContent, setStoredMemoryContent] = useState<string | null>(null);
  const [isLoadingStoredMemory, setIsLoadingStoredMemory] = useState(false);
  const [memorySearchQuery, setMemorySearchQuery] = useState('');
  const [showScheduledTasks, setShowScheduledTasks] = useState(false);

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'email' | 'password'>('email');
  
  // Email change form
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  
  // Password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Reset settings form when closing
  const handleCloseSettings = () => {
    setShowSettings(false);
    setNewEmail('');
    setEmailPassword('');
    setEmailError('');
    setEmailSuccess('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
  };

  // Handle email change
  const handleEmailChange = async () => {
    if (!user) return;
    
    setEmailError('');
    setEmailSuccess('');
    
    if (!newEmail.trim()) {
      setEmailError(language === 'en' ? 'Please enter a new email' : 'Veuillez entrer un nouvel email');
      return;
    }
    
    if (!emailPassword) {
      setEmailError(language === 'en' ? 'Please enter your current password' : 'Veuillez entrer votre mot de passe actuel');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setEmailError(language === 'en' ? 'Please enter a valid email address' : 'Veuillez entrer une adresse email valide');
      return;
    }
    
    setEmailLoading(true);
    try {
      await updateUserEmail(user.id, newEmail, emailPassword);
      setEmailSuccess(language === 'en' ? 'Email updated successfully!' : 'Email mis à jour avec succès!');
      setNewEmail('');
      setEmailPassword('');
      // Refresh user data
      await refreshUser();
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message;
      setEmailError(message || (language === 'en' ? 'Failed to update email' : 'Échec de la mise à jour de l\'email'));
    } finally {
      setEmailLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (!user) return;
    
    setPasswordError('');
    setPasswordSuccess('');
    
    if (!currentPassword) {
      setPasswordError(language === 'en' ? 'Please enter your current password' : 'Veuillez entrer votre mot de passe actuel');
      return;
    }
    
    if (!newPassword) {
      setPasswordError(language === 'en' ? 'Please enter a new password' : 'Veuillez entrer un nouveau mot de passe');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError(language === 'en' ? 'Password must be at least 6 characters' : 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError(language === 'en' ? 'Passwords do not match' : 'Les mots de passe ne correspondent pas');
      return;
    }
    
    setPasswordLoading(true);
    try {
      await updateUserPassword(user.id, currentPassword, newPassword);
      setPasswordSuccess(language === 'en' ? 'Password updated successfully!' : 'Mot de passe mis à jour avec succès!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message;
      setPasswordError(message || (language === 'en' ? 'Failed to update password' : 'Échec de la mise à jour du mot de passe'));
    } finally {
      setPasswordLoading(false);
    }
  };

  // Load stored memories from database (NEW API format)
  const loadStoredMemory = async () => {
    if (!user) return;

    setIsLoadingStoredMemory(true);
    setShowStoredMemory(true);

    try {
      console.log('🔍 Loading stored memories for user:', user.id);
      const response = await getMemory(user.id);

      // Check if user has any memories (NEW FORMAT - array)
      if (response.memories && response.memories.length > 0) {
        console.log(`✅ Found ${response.total} memories`);

        // Combine all memory contents into one string
        const combinedContent = response.memories
          .map(memory => {
            // Include title if available
            if (memory.title) {
              return `**${memory.title}**\n\n${memory.content}`;
            }
            return memory.content;
          })
          .join('\n\n---\n\n');

        setStoredMemoryContent(combinedContent);

        // Log memory details
        response.memories.forEach((memory, index) => {
          console.log(`Memory ${index + 1}:`, {
            id: memory.id,
            title: memory.title || 'Untitled',
            source: memory.source,
            tags: memory.tags,
            created: memory.created_at
          });
        });
      } else {
        console.log('ℹ️ No stored memories found');
        setStoredMemoryContent(null);
      }
    } catch (error) {
      console.error('Failed to load stored memories:', error);
      setStoredMemoryContent(null);
    } finally {
      setIsLoadingStoredMemory(false);
    }
  };

  // Extract important memories based on last 3 conversations
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

      console.log('🧠 Extracting memory from', sortedConversations.length, 'conversations');
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
          ? 'Not enough messages yet. Start chatting so I can learn about you and remember important details!'
          : 'Pas assez de messages. Commencez à discuter pour que je puisse apprendre à vous connaître!');
        setIsAnalyzing(false);
        return;
      }

      // Prepare the memory extraction prompt with user messages
      const messagesText = allUserMessages.join('\n---\n');
      const prompt = `Based on my recent messages, extract and remember the most important information about me. Focus on key facts, preferences, interests, work, goals, and any other significant details that would be useful to remember in future conversations. Present this as a clear summary of what you've learned about me:\n\n${messagesText}`;

      // Call chat API for memory extraction
      const response = await chat({
        user_id: user.id.toString(),
        message: prompt,
        conversation_history: [],
      });

      console.log('🎯 Memory API Response:', response);
      console.log('📝 Message field:', response.message);
      console.log('🗑️ Temporary conversation ID:', response.conversation_id);

      // Extract the message from the response
      const analysisText = response.message || (language === 'en'
        ? 'No memory available'
        : 'Aucune mémoire disponible');

      console.log('✅ Setting memory:', analysisText);
      setPersonalityAnalysis(analysisText);

      // Save memory to backend database with new format
      try {
        console.log('💾 Saving memory to backend database...');

        // Generate a title from the first line or first 50 chars
        const firstLine = analysisText.split('\n')[0];
        const title = firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine;

        await saveMemory(user.id, analysisText, {
          title: title,
          conversation_id: response.conversation_id || null,
          source: 'auto_extraction',
          tags: ['personality', 'preferences', 'auto-generated']
        });

        console.log('✅ Memory saved to database with metadata');
      } catch (saveError) {
        console.error('Failed to save memory to database:', saveError);
        // Non-critical error, user still sees the memory
      }

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
      console.error('Memory extraction failed:', error);
      setPersonalityAnalysis(language === 'en'
        ? 'Failed to extract memory. Please try again.'
        : 'Échec de l\'extraction de la mémoire. Veuillez réessayer.');
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
          <div className="bg-white px-6 py-4 flex-shrink-0 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold" style={{ color: '#558EFA' }}>
                {showSettings 
                  ? (language === 'en' ? 'Settings' : 'Paramètres')
                  : (language === 'en' ? 'User Profile' : 'Profil Utilisateur')
                }
              </h2>
              <div className="flex items-center gap-2">
                {/* Settings Button - only show when not in settings view */}
                {!showSettings && (
                  <button
                    onClick={() => setShowSettings(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500 hover:text-[#558EFA]"
                    aria-label="Settings"
                    title={language === 'en' ? 'Settings' : 'Paramètres'}
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                )}
                {/* Back Button - only show in settings view */}
                {showSettings && (
                  <button
                    onClick={handleCloseSettings}
                    className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500 hover:text-[#558EFA]"
                    aria-label="Back"
                    title={language === 'en' ? 'Back to profile' : 'Retour au profil'}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 rounded-lg transition text-gray-500"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            {showSettings ? (
              /* ========== SETTINGS VIEW ========== */
              <div className="space-y-6">
                {/* Settings Tabs */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                  <button
                    onClick={() => setSettingsTab('email')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition ${
                      settingsTab === 'email'
                        ? 'bg-white text-[#558EFA] shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    {language === 'en' ? 'Email' : 'Email'}
                  </button>
                  <button
                    onClick={() => setSettingsTab('password')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition ${
                      settingsTab === 'password'
                        ? 'bg-white text-[#558EFA] shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    {language === 'en' ? 'Password' : 'Mot de passe'}
                  </button>
                </div>

                {/* Email Change Tab */}
                {settingsTab === 'email' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-sm text-blue-700">
                        {language === 'en'
                          ? 'Current email: '
                          : 'Email actuel: '}
                        <span className="font-semibold">{user.email}</span>
                      </p>
                    </div>

                    {/* New Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {language === 'en' ? 'New Email' : 'Nouvel Email'}
                      </label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder={language === 'en' ? 'Enter new email' : 'Entrez le nouvel email'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#558EFA] focus:border-transparent outline-none transition"
                      />
                    </div>

                    {/* Current Password for Verification */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {language === 'en' ? 'Current Password' : 'Mot de passe actuel'}
                      </label>
                      <input
                        type="password"
                        value={emailPassword}
                        onChange={(e) => setEmailPassword(e.target.value)}
                        placeholder={language === 'en' ? 'Enter current password to confirm' : 'Entrez le mot de passe pour confirmer'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#558EFA] focus:border-transparent outline-none transition"
                      />
                    </div>

                    {/* Error/Success Messages */}
                    {emailError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                        {emailError}
                      </div>
                    )}
                    {emailSuccess && (
                      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                        {emailSuccess}
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      onClick={handleEmailChange}
                      disabled={emailLoading}
                      className="w-full bg-gradient-to-r from-[#558EFA] to-[#0059b3] text-white py-3 px-4 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {emailLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {language === 'en' ? 'Updating...' : 'Mise à jour...'}
                        </>
                      ) : (
                        <>
                          <Mail className="w-5 h-5" />
                          {language === 'en' ? 'Update Email' : 'Mettre à jour l\'email'}
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Password Change Tab */}
                {settingsTab === 'password' && (
                  <div className="space-y-4">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {language === 'en' ? 'Current Password' : 'Mot de passe actuel'}
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder={language === 'en' ? 'Enter current password' : 'Entrez le mot de passe actuel'}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#558EFA] focus:border-transparent outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {language === 'en' ? 'New Password' : 'Nouveau mot de passe'}
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder={language === 'en' ? 'Enter new password' : 'Entrez le nouveau mot de passe'}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#558EFA] focus:border-transparent outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {language === 'en' ? 'Minimum 6 characters' : 'Minimum 6 caractères'}
                      </p>
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {language === 'en' ? 'Confirm New Password' : 'Confirmer le nouveau mot de passe'}
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={language === 'en' ? 'Confirm new password' : 'Confirmez le nouveau mot de passe'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#558EFA] focus:border-transparent outline-none transition"
                      />
                    </div>

                    {/* Error/Success Messages */}
                    {passwordError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                        {passwordError}
                      </div>
                    )}
                    {passwordSuccess && (
                      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                        {passwordSuccess}
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      onClick={handlePasswordChange}
                      disabled={passwordLoading}
                      className="w-full bg-gradient-to-r from-[#558EFA] to-[#0059b3] text-white py-3 px-4 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {passwordLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {language === 'en' ? 'Updating...' : 'Mise à jour...'}
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5" />
                          {language === 'en' ? 'Update Password' : 'Mettre à jour le mot de passe'}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ========== PROFILE VIEW ========== */
              <>
                {/* User Name Display (Replaces Avatar) */}
                <div className="flex justify-center text-center">
                  <h1 className="text-3xl font-bold text-gray-800">
                    {user.full_name || user.username}
                  </h1>
                </div>

                {/* Memory Capsule Button with Quick Access */}
                <div className="flex justify-center items-center gap-3">
                  {/* Main Memory Button */}
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

                  {/* Quick Access Button - Direct to Stored Memories */}
                  <button
                    onClick={loadStoredMemory}
                    disabled={isLoadingStoredMemory}
                    className="group relative w-12 h-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-md border border-white/30 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    title={language === 'en' ? 'View stored memories' : 'Voir les mémoires stockées'}
                  >
                    <svg className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>

                  {/* Scheduled Tasks Button */}
                  <button
                    onClick={() => setShowScheduledTasks(true)}
                    className="group relative w-12 h-12 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 backdrop-blur-md border border-white/30 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                    title={language === 'en' ? 'View scheduled tasks' : 'Voir les tâches planifiées'}
                  >
                    <svg className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
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

                  {/* Job Title */}
                  {user.job_title && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        {language === 'en' ? 'Job Title' : 'Titre de poste'}
                      </label>
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg px-4 py-3 border border-blue-200">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {user.job_title === 'Doctor' && '🩺'}
                            {user.job_title === 'Lawyer' && '⚖️'}
                            {user.job_title === 'Engineer' && '🔧'}
                            {user.job_title === 'Accountant' && '📊'}
                          </span>
                          <p className="text-gray-900 font-medium">
                            {language === 'en' ? user.job_title : (
                              user.job_title === 'Doctor' ? 'Médecin' :
                              user.job_title === 'Lawyer' ? 'Avocat' :
                              user.job_title === 'Engineer' ? 'Ingénieur' :
                              user.job_title === 'Accountant' ? 'Comptable' : user.job_title
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}



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
              </>
            )}
          </div>

          {/* Footer - Fixed at bottom (hidden in settings view) */}
          {!showSettings && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={logout}
                className="w-full group relative px-6 py-3 bg-gradient-to-r from-red-500/20 to-red-600/20 backdrop-blur-md border border-white/30 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span className="font-semibold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                  {language === 'en' ? 'Logout' : 'Déconnexion'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          )}
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
                    {language === 'en' ? 'Extracting key information about you' : 'Extraction des informations clés'}
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
              <div className="bg-white/50 backdrop-blur-sm px-6 py-4 border-t border-white/50 flex-shrink-0 space-y-2">
                <button
                  onClick={loadStoredMemory}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-2.5 px-4 rounded-xl hover:from-purple-600 hover:to-pink-700 transition font-medium shadow-md flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  {language === 'en' ? 'Show Memory Elements' : 'Afficher les éléments mémorisés'}
                </button>
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

      {/* Stored Memory Elements Modal */}
      {showStoredMemory && (
        <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isLoadingStoredMemory && setShowStoredMemory(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#48d1cc] to-[#1e90ff] text-white px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">
                    {language === 'en' ? 'Memory Elements' : 'Éléments Mémorisés'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowStoredMemory(false)}
                  disabled={isLoadingStoredMemory}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition disabled:opacity-50"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Description */}
              <p className="text-sm text-white/90 mb-4">
                {language === 'en'
                  ? 'Orion tries to remember content from your recent chats, but may forget certain elements over time. Stored elements are never forgotten.'
                  : 'Orion s\'efforce de tenir compte du contenu de vos chats récents, mais peut oublier certains éléments au fil du temps. Les éléments mémorisés ne sont jamais oubliés.'}
                {' '}
                <button className="text-white hover:underline font-medium">
                  {language === 'en' ? 'Learn more' : 'En savoir plus'}
                </button>
              </p>

              {/* Search Bar */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={language === 'en' ? 'Search in memory elements' : 'Rechercher dans les éléments mémorisés'}
                  value={memorySearchQuery}
                  onChange={(e) => setMemorySearchQuery(e.target.value)}
                  className="w-full bg-white/20 backdrop-blur-sm text-white placeholder-white/70 pl-10 pr-4 py-2.5 rounded-lg border border-white/30 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/25 text-sm"
                />
              </div>
            </div>

            {/* Content - Memory items with markdown support */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {isLoadingStoredMemory ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4" />
                  <p className="text-gray-600 font-medium">
                    {language === 'en' ? 'Loading memory elements...' : 'Chargement des éléments...'}
                  </p>
                </div>
              ) : !storedMemoryContent ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-700 text-lg font-semibold mb-2">
                    {language === 'en' ? 'No memory stored yet' : 'Aucune mémoire enregistrée'}
                  </p>
                  <p className="text-gray-600 text-sm max-w-md">
                    {language === 'en'
                      ? 'Generate your first memory using the Memory button, and it will be stored here for future reference.'
                      : 'Générez votre première mémoire en utilisant le bouton Mémoire, elle sera stockée ici pour référence future.'}
                  </p>
                </div>
              ) : (
                <div>
                  {memorySearchQuery && !storedMemoryContent.toLowerCase().includes(memorySearchQuery.toLowerCase()) ? (
                    <div className="text-center py-8 text-gray-600">
                      {language === 'en' ? 'No results found' : 'Aucun résultat trouvé'}
                    </div>
                  ) : (
                    <div className="bg-white text-gray-800 p-6 rounded-lg leading-relaxed shadow-sm border border-gray-200">
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {storedMemoryContent}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Tasks Manager Modal */}
      <ScheduledTasksManager
        isOpen={showScheduledTasks}
        onClose={() => setShowScheduledTasks(false)}
      />
    </>
  );
};

export default UserProfile;

