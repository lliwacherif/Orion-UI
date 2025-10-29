import React, { useState, useRef, KeyboardEvent } from 'react';
import type { Attachment } from '../types/orcha';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import AttachmentChip from './AttachmentChip';

interface MessageInputProps {
  onSendMessage: (message: string, attachments: Attachment[], useRag: boolean) => void;
  disabled?: boolean;
  hasMessages?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled = false, hasMessages = false }) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [useRag, setUseRag] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { language } = useLanguage();
  const t = translations[language].input;

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
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message.trim(), attachments, useRag);
      setMessage('');
      setAttachments([]);
      // Keep useRag state as user might want to use it for multiple messages
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  };

  return (
    <>
      {!hasMessages ? (
        // Centered input for new chat
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
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

            {/* Input area */}
            <div className="flex gap-2 items-end bg-white rounded-2xl shadow-lg border border-gray-200 p-2">
              {/* Attachment button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="flex-shrink-0 p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={t.attachFiles}
                type="button"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
              </button>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="File input"
              />

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={t.placeholder}
                className="flex-1 resize-none border-0 rounded-lg px-4 py-3 focus:outline-none focus:ring-0 transition disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 placeholder-gray-400"
                style={{
                  '--tw-ring-color': 'rgba(59, 130, 246, 0.5)',
                  '--tw-ring-offset-color': 'rgba(16, 185, 129, 0.3)'
                } as React.CSSProperties}
                rows={1}
                disabled={disabled}
                aria-label={t.sendMessage}
              />

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={disabled || (!message.trim() && attachments.length === 0)}
                className="flex-shrink-0 text-white p-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                style={{ backgroundColor: '#1e90ff' }}
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

            <p className="text-xs text-gray-500 mt-3 text-center">
              {t.helpText}
            </p>
          </div>
        </div>
      ) : (
        // Bottom input for existing chat
        <div className="border-t bg-white p-4">
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

          {/* Input area */}
          <div className="flex gap-2 items-end">
            {/* Attachment button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="flex-shrink-0 p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t.attachFiles}
              type="button"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="File input"
            />

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={t.placeholder}
              className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-emerald-400 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              style={{
                '--tw-ring-color': 'rgba(59, 130, 246, 0.5)',
                '--tw-ring-offset-color': 'rgba(16, 185, 129, 0.3)'
              } as React.CSSProperties}
              rows={1}
              disabled={disabled}
              aria-label={t.sendMessage}
            />

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={disabled || (!message.trim() && attachments.length === 0)}
              className="flex-shrink-0 text-white p-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              style={{ backgroundColor: '#1e90ff' }}
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

          <p className="text-xs text-gray-500 mt-2">
            {t.helpText}
          </p>
        </div>
      )}
    </>
  );
};

export default MessageInput;

