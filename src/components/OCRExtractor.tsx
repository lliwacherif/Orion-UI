import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from 'react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import { extractOCRText, chat } from '../api/orcha';
import type { OCRExtractRequest, ChatRequest } from '../types/orcha';

const OCRExtractor: React.FC = () => {
  const { user } = useAuth();
  const { session } = useSession();
  const { language } = useLanguage();
  const t = translations[language].ocr;
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [linesCount, setLinesCount] = useState<number>(0);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [documentType, setDocumentType] = useState<string>('other');
  const [cleanedData, setCleanedData] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showRestyleOptions, setShowRestyleOptions] = useState(false);
  const [showTranslateOptions, setShowTranslateOptions] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiModalTitle, setAiModalTitle] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const translateDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRestyleOptions(false);
      }
      if (translateDropdownRef.current && !translateDropdownRef.current.contains(event.target as Node)) {
        setShowTranslateOptions(false);
      }
    };

    if (showRestyleOptions || showTranslateOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRestyleOptions, showTranslateOptions]);

  // Available languages
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'French' },
    { code: 'ar', name: 'Arabic' },
    { code: 'ch', name: 'Chinese' },
    { code: 'es', name: 'Spanish' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' }
  ];

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data URL prefix (data:image/jpeg;base64,)
        const base64String = reader.result?.toString().split(',')[1] || '';
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // OCR extraction mutation
  const ocrMutation = useMutation(
    async (payload: OCRExtractRequest) => extractOCRText(payload),
    {
      onSuccess: (data) => {
        console.log('OCR extraction completed:', data);
        console.log('Data status:', data.status);
        console.log('Extracted text length:', data.extracted_text?.length || 0);
        console.log('Lines count:', data.lines_count);
        
        if (data.status === 'success' && data.extracted_text) {
          setExtractedText(data.extracted_text);
          setLinesCount(data.lines_count || 0);
          console.log('✅ OCR extraction successful - text set');
          
          // If document type is passport or ID card, trigger LLM cleaning
          if (documentType === 'passport' || documentType === 'id_card') {
            handleCleanWithAI(data.extracted_text, documentType);
          }
        } else {
          console.error('❌ OCR extraction failed:', data.error);
        }
      },
      onError: (error: any) => {
        console.error('OCR extraction error:', error);
      },
      onSettled: () => {
        // This runs after both success and error, ensuring loading state is reset
        console.log('OCR mutation settled - loading should be false now');
      },
    }
  );

  // AI processing mutation for summarization and restyling
  const aiMutation = useMutation(
    async (payload: ChatRequest) => chat(payload),
    {
      onSuccess: (data) => {
        if (data.message) {
          setAiResponse(data.message);
          setShowAiModal(true);
        } else {
          console.error('AI processing failed');
        }
      },
      onError: (error: any) => {
        console.error('AI processing error:', error);
      },
    }
  );

  // AI cleaning mutation for passport/ID card extraction
  const cleaningMutation = useMutation(
    async (payload: ChatRequest) => chat(payload),
    {
      onSuccess: (data) => {
        if (data.message) {
          setCleanedData(data.message);
        } else {
          console.error('AI cleaning failed');
        }
      },
      onError: (error: any) => {
        console.error('AI cleaning error:', error);
      },
    }
  );

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(t.fileTypeError);
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert(t.fileSizeError);
      return;
    }

    setSelectedFile(file);
    setExtractedText('');
    setLinesCount(0);
    setCleanedData('');
    setCopied(false);
    setShowRestyleOptions(false);
    setAiResponse('');
    setShowAiModal(false);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Extract text from image
  const handleExtractText = async () => {
    if (!selectedFile || !user || !session) {
      alert(t.selectImageError);
      return;
    }

    try {
      // Convert image to base64
      const base64Image = await fileToBase64(selectedFile);

      // Prepare OCR request
      const ocrRequest: OCRExtractRequest = {
        user_id: user.id.toString(),
        tenant_id: session.tenant_id,
        image_data: base64Image,
        filename: selectedFile.name,
        language: selectedLanguage
      };

      // Call OCR extraction
      ocrMutation.mutate(ocrRequest);
    } catch (error) {
      console.error('Failed to process image:', error);
    }
  };

  // Copy text to clipboard
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  // Clear all
  const handleClear = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setExtractedText('');
    setLinesCount(0);
    setCleanedData('');
    setCopied(false);
    setShowRestyleOptions(false);
    setAiResponse('');
    setShowAiModal(false);
  };

  // Handle AI cleaning for passport/ID card
  const handleCleanWithAI = (text: string, docType: string) => {
    if (!user || !session) return;

    const docTypeText = docType === 'passport' ? 'passport' : 'ID card';
    const cleaningPrompt = `This is a ${docTypeText}. Clean the text and extract the necessary information from it in a representative look:\n\n${text}`;

    const chatRequest: ChatRequest = {
      user_id: user.id.toString(),
      tenant_id: session.tenant_id,
      message: cleaningPrompt,
      use_rag: false,
      conversation_id: null, // Don't save this as a conversation
    };

    cleaningMutation.mutate(chatRequest);
  };

  // Handle AI summarization
  const handleSummarize = () => {
    if (!extractedText || !user || !session) return;

    const chatRequest: ChatRequest = {
      user_id: user.id.toString(),
      tenant_id: session.tenant_id,
      message: `Summarize this text:\n\n${extractedText}`,
      use_rag: false,
      conversation_id: null, // Don't save this as a conversation
    };

    setAiModalTitle('summary'); // Set modal type for styling
    aiMutation.mutate(chatRequest);
  };

  // Handle AI restyling
  const handleRestyle = (style: 'professional' | 'friendly') => {
    if (!extractedText || !user || !session) return;

    const stylePrompt = style === 'professional' 
      ? `Restyle this text with professional style:\n\n${extractedText}`
      : `Restyle this text with friendly style:\n\n${extractedText}`;

    const chatRequest: ChatRequest = {
      user_id: user.id.toString(),
      tenant_id: session.tenant_id,
      message: stylePrompt,
      use_rag: false,
      conversation_id: null, // Don't save this as a conversation
    };

    setAiModalTitle('restyle'); // Set modal type for styling
    aiMutation.mutate(chatRequest);
    setShowRestyleOptions(false);
  };

  // Translate languages
  const translateLanguages = [
    { code: 'fr', name: 'French' },
    { code: 'en', name: 'English' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'es', name: 'Spanish' },
    { code: 'it', name: 'Italian' },
    { code: 'de', name: 'German' },
  ];

  // Handle AI translation
  const handleTranslate = (targetLanguage: string) => {
    if (!extractedText || !user || !session) return;

    const languageName = translateLanguages.find(lang => lang.code === targetLanguage)?.name || targetLanguage;
    const translatePrompt = `Translate this text to ${languageName}:\n\n${extractedText}`;

    const chatRequest: ChatRequest = {
      user_id: user.id.toString(),
      tenant_id: session.tenant_id,
      message: translatePrompt,
      use_rag: false,
      conversation_id: null, // Don't save this as a conversation
    };

    setAiModalTitle('translate'); // Set modal type for styling
    aiMutation.mutate(chatRequest);
    setShowTranslateOptions(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-bold" style={{ color: '#003A70' }}>{t.title}</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Language Selection and Document Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Language Selection */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <label className="block text-sm font-medium mb-2" style={{ color: '#003A70' }}>
              {t.languageDetection}
            </label>
            <select 
              value={selectedLanguage} 
              onChange={(e) => setSelectedLanguage(e.target.value)}
              disabled={ocrMutation.isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[#003A70]"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Document Type Selection */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <label className="block text-sm font-medium mb-2" style={{ color: '#003A70' }}>
              {t.documentType}
            </label>
            <select 
              value={documentType} 
              onChange={(e) => setDocumentType(e.target.value)}
              disabled={ocrMutation.isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[#003A70]"
            >
              <option value="other" className="text-[#003A70]">{t.docTypeOther}</option>
              <option value="passport" className="text-[#003A70]">{t.docTypePassport}</option>
              <option value="id_card" className="text-[#003A70]">{t.docTypeIdCard}</option>
            </select>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col items-center text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={ocrMutation.isLoading}
              id="file-input"
              className="hidden"
            />
            <label 
              htmlFor="file-input" 
              className="w-full max-w-md flex flex-col items-center gap-4 px-8 py-8 border-2 border-dashed border-[#003A70] text-[#003A70] rounded-2xl cursor-pointer hover:bg-[#f0f6fb] transition-all duration-200 font-medium shadow-md bg-white"
            >
              <img 
                src="/assets/upload-button.png" 
                alt={t.chooseImage}
                className="w-40 h-40 object-contain"
              />
              <span className="text-lg">{t.chooseImage}</span>
            </label>
            {selectedFile && (
              <div className="mt-3">
                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {selectedFile.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.imagePreview}</h3>
            <div className="text-center">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-w-full max-h-80 mx-auto rounded-lg shadow-sm border border-gray-200" 
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              console.log('Extract button clicked');
              console.log('OCR mutation loading state:', ocrMutation.isLoading);
              console.log('OCR mutation status:', ocrMutation.status);
              handleExtractText();
            }}
            disabled={!selectedFile || ocrMutation.isLoading}
            className="group relative px-6 py-3 bg-gradient-to-r from-green-600/25 to-emerald-500/25 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 backdrop-blur-md border border-white/30 shadow-lg hover:shadow-xl"
          >
            <div className="relative flex items-center gap-2 z-10">
              {ocrMutation.isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-sm font-medium text-emerald-700">{t.processing}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-sm font-semibold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
                    {t.extractText}
                  </span>
                </>
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-green-400/25 to-emerald-400/25 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          
          {(extractedText || selectedFile) && (
            <button 
              onClick={handleClear} 
              className="group relative px-6 py-3 bg-gradient-to-r from-red-600/25 to-red-500/25 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 backdrop-blur-md border border-white/30 shadow-lg hover:shadow-xl"
            >
              <div className="relative flex items-center gap-2 z-10">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-sm font-semibold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
                  {t.clear}
                </span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-red-400/25 to-red-300/25 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>

        {/* Error Display */}
        {ocrMutation.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800 font-medium">{t.error}:</span>
            </div>
            <p className="text-red-700 mt-1">
              {ocrMutation.error?.response?.data?.error || 
               ocrMutation.error?.response?.data?.detail || 
               t.errorMessage}
            </p>
          </div>
        )}

        {/* Extracted Text Display */}
        {extractedText && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4" style={{ backgroundColor: '#003A70' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-white">{t.extractedText}</h3>
                </div>
                <button
                  onClick={handleCopyText}
                  className={`p-2.5 rounded-full transition-colors duration-200 ${
                    copied ? 'bg-white text-[#003A70]' : 'bg-white/90 text-[#003A70] hover:bg-white'
                  }`}
                  aria-label={copied ? t.copied : t.copy}
                  title={copied ? t.copied : t.copy}
                >
                  {copied ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            {/* Metadata */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex gap-6 text-sm text-gray-600">
                <span className="font-medium">{t.lines}: {linesCount}</span>
                <span className="font-medium">
                  {t.language}: {languages.find(l => l.code === selectedLanguage)?.name}
                </span>
                <span className="font-medium">{t.file}: {selectedFile?.name}</span>
              </div>
            </div>

            {/* Text Display - Black Box Style */}
            <div className="p-6">
              <div className="bg-black text-white rounded-lg p-4 font-mono text-sm leading-relaxed max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap">{extractedText}</pre>
              </div>

              {/* AI Options */}
              <div className="mt-4 flex gap-3 justify-center overflow-visible">
                {/* Summarize Button */}
                <button
                  onClick={handleSummarize}
                  disabled={aiMutation.isLoading}
                  className="group relative px-5 py-2.5 bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-md border border-white/30 rounded-full shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
                >
                  <div className="relative flex items-center gap-2 z-10">
                    {aiMutation.isLoading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="text-sm font-medium text-purple-700">
                          {language === 'en' ? 'Processing...' : 'Traitement...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm font-semibold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">
                          {language === 'en' ? 'Summarize with AI' : 'Résumer avec IA'}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                {/* Restyle Button */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowRestyleOptions(!showRestyleOptions)}
                    disabled={aiMutation.isLoading}
                    className="group relative px-5 py-2.5 bg-gradient-to-r from-green-600/20 to-emerald-600/20 backdrop-blur-md border border-white/30 rounded-full shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
                  >
                    <div className="relative flex items-center gap-2 z-10">
                      <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                      </svg>
                      <span className="text-sm font-semibold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
                        {language === 'en' ? 'Restyle with AI' : 'Restyler avec IA'}
                      </span>
                      <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>

                  {/* Restyle Options Dropdown - Fixed positioning */}
                  {showRestyleOptions && (
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-[60] overflow-visible">
                      <button
                        onClick={() => handleRestyle('professional')}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition text-gray-900 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                        </svg>
                        {language === 'en' ? 'Professional Style' : 'Style Professionnel'}
                      </button>
                      <button
                        onClick={() => handleRestyle('friendly')}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition text-gray-900 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {language === 'en' ? 'Friendly Style' : 'Style Amical'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Translate Button */}
                <div className="relative" ref={translateDropdownRef}>
                  <button
                    onClick={() => setShowTranslateOptions(!showTranslateOptions)}
                    disabled={aiMutation.isLoading}
                    className="group relative px-5 py-2.5 bg-gradient-to-r from-orange-600/20 to-red-600/20 backdrop-blur-md border border-white/30 rounded-full shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
                  >
                    <div className="relative flex items-center gap-2 z-10">
                      <svg className="w-4 h-4 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                      <span className="text-sm font-semibold bg-gradient-to-r from-orange-700 to-red-700 bg-clip-text text-transparent">
                        {language === 'en' ? 'Translate with AI' : 'Traduire avec IA'}
                      </span>
                      <svg className="w-4 h-4 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>

                  {/* Translate Options Dropdown - Fixed positioning */}
                  {showTranslateOptions && (
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-[60] overflow-visible">
                      {translateLanguages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleTranslate(lang.code)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition text-gray-900 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                          </svg>
                          {lang.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Cleaned Data Display */}
        {cleanedData && (documentType === 'passport' || documentType === 'id_card') && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-white">{t.cleanedData}</h3>
                </div>
                {cleaningMutation.isLoading && (
                  <div className="flex items-center gap-2 text-white text-sm">
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{t.cleaningData}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
                <div className="text-gray-800 font-sans leading-relaxed text-sm prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanedData}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Response Modal */}
      {showAiModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black bg-opacity-50 overflow-y-auto">
          <div className={`bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border-4 border-transparent p-1 my-8 ${
            aiModalTitle === 'summary' 
              ? 'bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500' 
              : aiModalTitle === 'restyle'
              ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500'
              : 'bg-gradient-to-r from-orange-400 via-red-500 to-pink-500'
          }`}>
            <div className="bg-white rounded-xl flex flex-col overflow-hidden">
              {/* Header */}
              <div className={`px-6 py-4 flex-shrink-0 ${
                aiModalTitle === 'summary' 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600' 
                  : aiModalTitle === 'restyle'
                  ? 'bg-gradient-to-r from-yellow-600 to-orange-600'
                  : 'bg-gradient-to-r from-orange-600 to-red-600'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      {aiModalTitle === 'summary' ? (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ) : aiModalTitle === 'restyle' ? (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      {aiModalTitle === 'summary' 
                        ? (language === 'en' ? 'AI Summary' : 'Résumé IA')
                        : aiModalTitle === 'restyle'
                        ? (language === 'en' ? 'AI Restyled' : 'Restylé IA')
                        : (language === 'en' ? 'AI Translated' : 'Traduit IA')
                      }
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowAiModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 min-h-0">
                <div className={`rounded-lg p-4 border-l-4 ${
                  aiModalTitle === 'summary' 
                    ? 'bg-emerald-50 border-emerald-500' 
                    : aiModalTitle === 'restyle'
                    ? 'bg-yellow-50 border-yellow-500'
                    : 'bg-orange-50 border-orange-500'
                }`}>
                  <div className="text-gray-800 font-sans leading-relaxed text-sm prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiResponse}</ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className={`px-6 py-4 border-t border-gray-200 flex-shrink-0 ${
                aiModalTitle === 'summary' ? 'bg-emerald-50' : aiModalTitle === 'restyle' ? 'bg-yellow-50' : 'bg-orange-50'
              }`}>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(aiResponse);
                    }}
                    className={`px-4 py-2 rounded-lg hover:opacity-80 transition-colors duration-200 flex items-center gap-2 ${
                      aiModalTitle === 'summary' 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                        : aiModalTitle === 'restyle'
                        ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                        : 'bg-orange-600 text-white hover:bg-orange-700'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {language === 'en' ? 'Copy' : 'Copier'}
                  </button>
                  <button
                    onClick={() => setShowAiModal(false)}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                      aiModalTitle === 'summary' 
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700' 
                        : aiModalTitle === 'restyle'
                        ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white hover:from-yellow-700 hover:to-orange-700'
                        : 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700'
                    }`}
                  >
                    {language === 'en' ? 'Close' : 'Fermer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OCRExtractor;
