import React, { useState, useRef } from 'react';
import type { Attachment } from '../types/orcha';
import { useLanguage } from '../context/LanguageContext';
import AttachmentChip from './AttachmentChip';

interface MessageInputDocProps {
  onSendMessage: (message: string, attachments: Attachment[], useRag: boolean) => void;
  disabled?: boolean;
  hasMessages?: boolean;
}

const MessageInputDoc: React.FC<MessageInputDocProps> = ({ onSendMessage, disabled = false, hasMessages = false }) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [useRag, setUseRag] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { language } = useLanguage();

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
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
      const filePromises = Array.from(files).map(async (file) => {
        const base64Data = await readFileAsBase64(file);
        const attachment: Attachment = {
          uri: URL.createObjectURL(file),
          type: file.type,
          filename: file.name,
          data: base64Data,
          size: file.size,
        };
        return attachment;
      });

      const newAttachments = await Promise.all(filePromises);
      setAttachments((prev) => [...prev, ...newAttachments]);

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
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => {
      const attachment = prev[index];
      if (attachment.uri.startsWith('blob:')) {
        URL.revokeObjectURL(attachment.uri);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message.trim(), attachments, useRag);
      setMessage('');
      setAttachments([]);
    }
  };

  return (
    <div className="border-t bg-white p-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="application/pdf"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="File input"
      />

      {!hasMessages ? (
        // Large upload area (before first message)
        <>
          <div className="mb-4">
            {attachments.length === 0 ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-700">
                      {language === 'en' ? 'Upload PDF Document' : 'Télécharger un document PDF'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {language === 'en' ? 'Click to browse or drag and drop' : 'Cliquez pour parcourir ou glissez-déposez'}
                    </p>
                  </div>
                </div>
              </button>
            ) : (
              <div className="border-2 border-gray-200 rounded-lg p-4">
                <div className="flex flex-wrap gap-2">
                  {attachments.map((attachment, index) => (
                    <AttachmentChip
                      key={index}
                      attachment={attachment}
                      onRemove={() => handleRemoveAttachment(index)}
                    />
                  ))}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + {language === 'en' ? 'Add more files' : 'Ajouter plus de fichiers'}
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={language === 'en' ? 'Ask a question about the document...' : 'Posez une question sur le document...'}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={disabled}
            />

            <button
              onClick={handleSend}
              disabled={disabled || (!message.trim() && attachments.length === 0)}
              className="flex-shrink-0 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {language === 'en' ? 'Analyze' : 'Analyser'}
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-2 text-center">
            {language === 'en'
              ? 'Upload PDFs for AI-powered document analysis'
              : 'Téléchargez des PDFs pour une analyse par IA'}
          </p>
        </>
      ) : (
        // Compact horizontal layout (after first message)
        <div className="flex gap-2 items-center">
          {/* Small upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex-shrink-0 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title={language === 'en' ? 'Upload PDF' : 'Télécharger PDF'}
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </button>

          {/* Attachments (if any) */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment, index) => (
                <AttachmentChip
                  key={index}
                  attachment={attachment}
                  onRemove={() => handleRemoveAttachment(index)}
                />
              ))}
            </div>
          )}

          {/* Text input */}
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={language === 'en' ? 'Ask a question...' : 'Posez une question...'}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={disabled}
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={disabled || (!message.trim() && attachments.length === 0)}
            className="flex-shrink-0 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {language === 'en' ? 'Send' : 'Envoyer'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageInputDoc;

