import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from 'react-query';
import type { Attachment, OCRExtractRequest } from '../types/orcha';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { useModel } from '../context/ModelContext';
import { translations } from '../translations';
import { extractOCRText } from '../api/orcha';
import AttachmentChip from './AttachmentChip';

interface MessageInputProps {
  onSendMessage: (message: string, attachments: Attachment[], useRag: boolean) => void;
  onScheduleAgent?: (instructions: string, isSearch?: boolean) => void;
  onWebSearch?: (query: string) => void;
  disabled?: boolean;
  hasMessages?: boolean;
  prefilledMessage?: string;
  onPrefilledMessageUsed?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, onScheduleAgent, onWebSearch, disabled = false, hasMessages = false, prefilledMessage = '', onPrefilledMessageUsed }) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [useRag] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [ocrMode, setOcrMode] = useState(false);
  const [agentMode, setAgentMode] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [agentSearchMode, setAgentSearchMode] = useState(false);
  const [extractedOCRText, setExtractedOCRText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ocrFileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();
  const { user } = useAuth();
  const { session } = useSession();
  const { isProMode } = useModel();
  const t = translations[language].input;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAttachmentMenu(false);
      }
    };

    if (showAttachmentMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAttachmentMenu]);

  // Handle prefilled message from predefined questions
  useEffect(() => {
    if (prefilledMessage) {
      setMessage(prefilledMessage);
      // Focus the textarea
      textareaRef.current?.focus();
      // Auto-resize textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
      }
      // Notify parent that we've used the prefilled message
      onPrefilledMessageUsed?.();
    }
  }, [prefilledMessage, onPrefilledMessageUsed]);

  // OCR extraction mutation
  const ocrMutation = useMutation(
    async (payload: OCRExtractRequest) => extractOCRText(payload),
    {
      onSuccess: (data) => {
        if (data.status === 'success' && data.extracted_text) {
          setExtractedOCRText(data.extracted_text);
          console.log('✅ OCR extraction successful');
        } else {
          console.error('❌ OCR extraction failed:', data.error);
          alert(language === 'en' ? 'Failed to extract text from image' : 'Échec de l\'extraction du texte de l\'image');
          setOcrMode(false);
          setExtractedOCRText('');
        }
      },
      onError: (error: any) => {
        console.error('OCR extraction error:', error);
        alert(language === 'en' ? 'Failed to extract text from image' : 'Échec de l\'extraction du texte de l\'image');
        setOcrMode(false);
        setExtractedOCRText('');
      },
    }
  );

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      // Read files and convert to base64
      const filePromises = Array.from(files).map(async (file) => {
        const base64Data = await readFileAsBase64(file);
        const attachment: Attachment = {
          uri: URL.createObjectURL(file), // For preview in UI
          type: file.type,
          filename: file.name,
          data: base64Data, // Base64 encoded file data
          size: file.size,
        };
        return attachment;
      });

      const newAttachments = await Promise.all(filePromises);
      setAttachments((prev) => [...prev, ...newAttachments]);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      console.log('📎 Files attached:', newAttachments.map(a => ({
        name: a.filename,
        size: a.size,
        type: a.type,
        hasData: !!a.data,
        dataLength: a.data?.length || 0
      })));
    } catch (error) {
      console.error('Error reading files:', error);
      alert('Failed to read files. Please try again.');
    }

    setShowAttachmentMenu(false);
  };

  const handleOCRFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (only images for OCR)
    if (!file.type.startsWith('image/')) {
      alert(language === 'en' ? 'Please select an image file' : 'Veuillez sélectionner un fichier image');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert(language === 'en' ? 'File size must be less than 10MB' : 'La taille du fichier doit être inférieure à 10 Mo');
      return;
    }

    try {
      // Convert image to base64
      const base64Image = await readFileAsBase64(file);

      // Prepare OCR request
      const ocrRequest: OCRExtractRequest = {
        user_id: user?.id?.toString() || '',
        tenant_id: session?.tenant_id,
        image_data: base64Image,
        filename: file.name,
        language: 'en' // Default to English
      };

      // Call OCR extraction
      ocrMutation.mutate(ocrRequest);
    } catch (error) {
      console.error('Failed to process image:', error);
      alert(language === 'en' ? 'Failed to process image' : 'Échec du traitement de l\'image');
    }

    // Reset file input
    if (ocrFileInputRef.current) {
      ocrFileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => {
      // Clean up object URL to prevent memory leaks
      const attachment = prev[index];
      if (attachment.uri.startsWith('blob:')) {
        URL.revokeObjectURL(attachment.uri);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSend = () => {
    const messageToSend = message.trim();

    // If Search mode is active, trigger web search
    if (searchMode && messageToSend && onWebSearch) {
      onWebSearch(messageToSend);
      setMessage('');
      setSearchMode(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      return;
    }

    // If Agent mode is active, trigger schedule modal
    if (agentMode && messageToSend && onScheduleAgent) {
      onScheduleAgent(messageToSend, agentSearchMode);
      setMessage('');
      setAgentMode(false);
      setAgentSearchMode(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      return;
    }

    // If OCR mode is active and we have extracted text, send it with the message
    if (ocrMode && extractedOCRText) {
      const combinedMessage = messageToSend
        ? `${messageToSend}\n\n[Extracted Text]:\n${extractedOCRText}`
        : extractedOCRText;

      onSendMessage(combinedMessage, [], useRag);
      setMessage('');
      setOcrMode(false);
      setExtractedOCRText('');
    } else if (messageToSend || attachments.length > 0) {
      onSendMessage(messageToSend, attachments, useRag);
      setMessage('');
      setAttachments([]);
    }

    // Keep useRag state as user might want to use it for multiple messages

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };


  const handleAttachDocumentClick = () => {
    fileInputRef.current?.click();
    setShowAttachmentMenu(false);
  };

  const handleOCRClick = () => {
    setOcrMode(true);
    setAgentMode(false);
    setSearchMode(false);
    setShowAttachmentMenu(false);
    // Clear any existing attachments when switching to OCR mode
    setAttachments([]);
  };

  const handleAgentClick = () => {
    setAgentMode(true);
    setOcrMode(false);
    setSearchMode(false);
    setShowAttachmentMenu(false);
    // Clear any existing attachments when switching to Agent mode
    setAttachments([]);
  };

  const handleSearchClick = () => {
    setSearchMode(true);
    setOcrMode(false);
    setAgentMode(false);
    setShowAttachmentMenu(false);
    // Clear any existing attachments when switching to Search mode
    setAttachments([]);
  };

  const handleCancelOCR = () => {
    setOcrMode(false);
    setExtractedOCRText('');
  };

  const handleCancelAgent = () => {
    setAgentMode(false);
  };

  const handleCancelSearch = () => {
    setSearchMode(false);
  };

  return (
    <>
      {!hasMessages ? (
        // Centered input for new chat
        <div className="flex-1 flex flex-col items-center justify-start pt-32 px-8 pb-8">
          {/* Centered input */}
          <div className="w-full max-w-2xl">
            {/* Attachments display */}
            {attachments.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2 justify-center">
                {attachments.map((attachment, index) => (
                  <AttachmentChip
                    key={index}
                    attachment={attachment}
                    onRemove={() => handleRemoveAttachment(index)}
                  />
                ))}
              </div>
            )}

            {/* Search Mode Indicator */}
            {searchMode && (
              <div className="mb-4 flex items-center justify-center gap-2">
                <div className="group relative flex items-center gap-2 bg-gradient-to-r from-sky-400/20 to-blue-500/20 backdrop-blur-md border border-white/30 px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <span className="font-medium bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">{language === 'en' ? 'Search' : 'Rechercher'}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-400/10 to-blue-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <button
                  onClick={handleCancelSearch}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Agent Mode Indicator */}
            {agentMode && (
              <div className="mb-4 flex items-center justify-center gap-2">
                <div className="group relative flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-indigo-600/20 backdrop-blur-md border border-white/30 px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Agent</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-600/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <button
                  onClick={() => setAgentSearchMode(!agentSearchMode)}
                  className={`p-2 rounded-full transition backdrop-blur-md border shadow-lg ${agentSearchMode
                    ? 'bg-sky-500/80 text-white border-white/30'
                    : 'bg-white/20 text-gray-500 hover:bg-white/30 border-white/30'
                    }`}
                  title={language === 'en' ? 'Toggle web search for scheduled task' : 'Basculer la recherche Web pour la tâche planifiée'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </button>
                <button
                  onClick={handleCancelAgent}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* OCR Mode Indicator */}
            {ocrMode && (
              <div className="mb-4 flex items-center justify-center gap-2">
                <div className="group relative flex items-center gap-2 bg-gradient-to-r from-green-600/20 to-emerald-500/20 backdrop-blur-md border border-white/30 px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">OCR</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-emerald-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  {ocrMutation.isLoading && (
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  {extractedOCRText && !ocrMutation.isLoading && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                {!extractedOCRText && !ocrMutation.isLoading && (
                  <button
                    onClick={() => ocrFileInputRef.current?.click()}
                    disabled={disabled || ocrMutation.isLoading}
                    className="group relative flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 text-gray-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span className="text-sm font-medium">
                      {language === 'en' ? 'Attach Document' : 'Joindre un Document'}
                    </span>
                  </button>
                )}
                <button
                  onClick={handleCancelOCR}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Pro Mode Indicator - Centered (New Chat) */}
            {isProMode && (
              <div className="mb-4 flex items-center justify-center">
                <div 
                  className="group relative flex items-center gap-2 bg-gradient-to-r from-amber-400/20 to-orange-500/20 backdrop-blur-md border border-amber-300/40 px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                  title={language === 'en' ? 'Uses Bytez Cloud (Qwen 7B). Unlimited text, higher quality.' : 'Utilise Bytez Cloud (Qwen 7B). Texte illimité, qualité supérieure.'}
                >
                  {/* Cloud icon */}
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                  <span className="font-semibold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                    AURA Pro
                  </span>
                  {/* Animated glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 to-orange-500/10 rounded-full blur-lg opacity-50 animate-pulse" />
                  {/* Sparkle indicator */}
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                </div>
              </div>
            )}

            {/* Input area */}
            <div className="flex items-center gap-3 bg-white/20 backdrop-blur-lg rounded-full shadow-2xl border border-white/30 px-5 py-3 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]">
              {/* Plus icon and input */}
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex items-center" ref={menuRef}>
                  <button
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    disabled={disabled}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    aria-label={language === 'en' ? 'Attachment options' : 'Options de pièce jointe'}
                    type="button"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showAttachmentMenu && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-white/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 py-1 z-50 overflow-hidden">
                      <button
                        onClick={handleAttachDocumentClick}
                        className="w-full px-4 py-3 text-left hover:bg-white/40 transition-colors flex items-center gap-3 text-gray-700"
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="font-medium">
                          {language === 'en' ? 'Attach document or image' : 'Joindre un document ou une image'}
                        </span>
                      </button>
                      <button
                        onClick={handleOCRClick}
                        className="w-full px-4 py-3 text-left hover:bg-white/40 transition-colors flex items-center gap-3 text-gray-700"
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-medium">OCR</span>
                      </button>
                      <button
                        onClick={handleAgentClick}
                        className="w-full px-4 py-3 text-left hover:bg-white/40 transition-colors flex items-center gap-3 text-gray-700">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">
                          {language === 'en' ? 'Agent' : 'Agent'}
                        </span>
                      </button>
                      <button
                        onClick={handleSearchClick}
                        className="w-full px-4 py-3 text-left hover:bg-white/40 transition-colors flex items-center gap-3 text-gray-700"
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <span className="font-medium">
                          {language === 'en' ? 'Search' : 'Rechercher'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Hidden file inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  aria-label="File input"
                />
                <input
                  ref={ocrFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleOCRFileSelect}
                  className="hidden"
                  aria-label="OCR file input"
                />

                {/* Textarea Input */}
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    // Auto-resize textarea with gooey effect
                    if (textareaRef.current) {
                      textareaRef.current.style.height = 'auto';
                      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={searchMode
                    ? (language === 'en' ? 'Search the web...' : 'Rechercher sur le Web...')
                    : agentMode
                      ? agentSearchMode
                        ? (language === 'en' ? 'Schedule a web search query...' : 'Planifier une recherche Web...')
                        : (language === 'en' ? 'Ask the agent to do stuff for you...' : 'Demandez à l\'agent de faire quelque chose pour vous...')
                      : (language === 'en' ? 'search for anything' : 'rechercher n\'importe quoi')
                  }
                  rows={1}
                  className="flex-1 border-0 focus:outline-none focus:ring-0 resize-none disabled:bg-gray-100/50 disabled:cursor-not-allowed text-gray-700 placeholder-gray-400 bg-transparent text-sm leading-relaxed py-1.5 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] max-h-[200px] overflow-y-auto"
                  disabled={disabled || ocrMutation.isLoading}
                  aria-label={t.sendMessage}
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
                  }}
                />
              </div>

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={disabled || (!message.trim() && attachments.length === 0 && (!ocrMode || !extractedOCRText)) || ocrMutation.isLoading}
                className="group relative flex-shrink-0 text-white p-3 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-lg border border-white/25 shadow-lg shadow-cyan-900/30 bg-gradient-to-r from-[#00bcd4]/85 to-[#0097a7]/85 hover:from-[#00bcd4] hover:to-[#0097a7] overflow-hidden"
                aria-label={t.sendMessage}
                type="button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>


          </div>
        </div>
      ) : (
        // Bottom input for existing chat
        <div className="p-4">
          {/* Attachments display */}
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((attachment, index) => (
                <AttachmentChip
                  key={index}
                  attachment={attachment}
                  onRemove={() => handleRemoveAttachment(index)}
                />
              ))}
            </div>
          )}

          {/* Search Mode Indicator */}
          {searchMode && (
            <div className="mb-3 flex items-center gap-2">
              <div className="group relative flex items-center gap-2 bg-gradient-to-r from-sky-400/20 to-blue-500/20 backdrop-blur-md border border-white/30 px-4 py-2 rounded-full text-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span className="font-medium bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">{language === 'en' ? 'Search' : 'Rechercher'}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-sky-400/10 to-blue-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <button
                onClick={handleCancelSearch}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Agent Mode Indicator */}
          {agentMode && (
            <div className="mb-3 flex items-center gap-2">
              <div className="group relative flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-indigo-600/20 backdrop-blur-md border border-white/30 px-4 py-2 rounded-full text-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Agent</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-600/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <button
                onClick={() => setAgentSearchMode(!agentSearchMode)}
                className={`p-1.5 rounded-full transition backdrop-blur-md border shadow-lg ${agentSearchMode
                  ? 'bg-sky-500/80 text-white border-white/30'
                  : 'bg-white/20 text-gray-500 hover:bg-white/30 border-white/30'
                  }`}
                title={language === 'en' ? 'Toggle web search for scheduled task' : 'Basculer la recherche Web pour la tâche planifiée'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </button>
              <button
                onClick={handleCancelAgent}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* OCR Mode Indicator */}
          {ocrMode && (
            <div className="mb-3 flex items-center gap-2">
              <div className="group relative flex items-center gap-2 bg-gradient-to-r from-green-600/20 to-emerald-500/20 backdrop-blur-md border border-white/30 px-4 py-2 rounded-full text-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">OCR</span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-emerald-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                {ocrMutation.isLoading && (
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                {extractedOCRText && !ocrMutation.isLoading && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              {!extractedOCRText && !ocrMutation.isLoading && (
                <button
                  onClick={() => ocrFileInputRef.current?.click()}
                  disabled={disabled || ocrMutation.isLoading}
                  className="group relative flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-md border border-white/30 text-gray-700 rounded-full text-sm shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="font-medium">
                    {language === 'en' ? 'Attach Document' : 'Joindre un Document'}
                  </span>
                </button>
              )}
              <button
                onClick={handleCancelOCR}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Pro Mode Indicator - Bottom (Existing Chat) */}
          {isProMode && (
            <div className="mb-3 flex items-center">
              <div 
                className="group relative flex items-center gap-2 bg-gradient-to-r from-amber-400/20 to-orange-500/20 backdrop-blur-md border border-amber-300/40 px-3 py-1.5 rounded-full text-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                title={language === 'en' ? 'Uses Bytez Cloud (Qwen 7B). Unlimited text, higher quality.' : 'Utilise Bytez Cloud (Qwen 7B). Texte illimité, qualité supérieure.'}
              >
                {/* Cloud icon */}
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
                <span className="font-semibold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                  AURA Pro
                </span>
                {/* Animated glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 to-orange-500/10 rounded-full blur-lg opacity-50 animate-pulse" />
                {/* Sparkle indicator */}
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="flex items-center gap-3 bg-white/20 backdrop-blur-lg rounded-full shadow-2xl border border-white/30 px-5 py-3 max-w-4xl mx-auto transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]">
            {/* Plus icon and input */}
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex items-center" ref={menuRef}>
                <button
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                  disabled={disabled}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  aria-label={language === 'en' ? 'Attachment options' : 'Options de pièce jointe'}
                  type="button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showAttachmentMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-white/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 py-1 z-50 overflow-hidden">
                    <button
                      onClick={handleAttachDocumentClick}
                      className="w-full px-4 py-3 text-left hover:bg-white/40 transition-colors flex items-center gap-3 text-gray-700"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="font-medium">
                        {language === 'en' ? 'Attach document or image' : 'Joindre un document ou une image'}
                      </span>
                    </button>
                    <button
                      onClick={handleOCRClick}
                      className="w-full px-4 py-3 text-left hover:bg-white/40 transition-colors flex items-center gap-3 text-gray-700"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-medium">OCR</span>
                    </button>
                    <button
                      onClick={handleAgentClick}
                      className="w-full px-4 py-3 text-left hover:bg-white/40 transition-colors flex items-center gap-3 text-gray-700"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">
                        {language === 'en' ? 'Agent' : 'Agent'}
                      </span>
                    </button>
                    <button
                      onClick={handleSearchClick}
                      className="w-full px-4 py-3 text-left hover:bg-white/40 transition-colors flex items-center gap-3 text-gray-700"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <span className="font-medium">
                        {language === 'en' ? 'Search' : 'Rechercher'}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="File input"
              />
              <input
                ref={ocrFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleOCRFileSelect}
                className="hidden"
                aria-label="OCR file input"
              />

              {/* Textarea Input */}
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  // Auto-resize textarea with gooey effect
                  if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={searchMode
                  ? (language === 'en' ? 'Search the web...' : 'Rechercher sur le Web...')
                  : agentMode
                    ? agentSearchMode
                      ? (language === 'en' ? 'Schedule a web search query...' : 'Planifier une recherche Web...')
                      : (language === 'en' ? 'Ask the agent to do stuff for you...' : 'Demandez à l\'agent de faire quelque chose pour vous...')
                    : (language === 'en' ? 'search for anything' : 'rechercher n\'importe quoi')
                }
                rows={1}
                className="flex-1 border-0 focus:outline-none focus:ring-0 resize-none disabled:bg-gray-100/50 disabled:cursor-not-allowed text-gray-700 placeholder-gray-400 bg-transparent text-sm leading-relaxed py-1.5 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] max-h-[200px] overflow-y-auto"
                disabled={disabled || ocrMutation.isLoading}
                aria-label={t.sendMessage}
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
                }}
              />
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={disabled || (!message.trim() && attachments.length === 0 && (!ocrMode || !extractedOCRText)) || ocrMutation.isLoading}
              className="group relative flex-shrink-0 text-white p-3 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-lg border border-white/25 shadow-lg shadow-cyan-900/30 bg-gradient-to-r from-[#00bcd4]/85 to-[#0097a7]/85 hover:from-[#00bcd4] hover:to-[#0097a7] overflow-hidden"
              aria-label={t.sendMessage}
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>


        </div>
      )}
    </>
  );
};

export default MessageInput;