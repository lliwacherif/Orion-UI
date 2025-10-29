import React, { useState, useRef } from 'react';
import type { Attachment } from '../types/orcha';
import { useLanguage } from '../context/LanguageContext';
import AttachmentChip from './AttachmentChip';

interface MessageInputVisionProps {
  onSendMessage: (message: string, attachments: Attachment[], useRag: boolean) => void;
  disabled?: boolean;
  hasMessages?: boolean;
}

const MessageInputVision: React.FC<MessageInputVisionProps> = ({ onSendMessage, disabled = false, hasMessages = false }) => {
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

      console.log('📎 Images attached:', newAttachments.map(a => ({
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
      console.log('🖼️ Sending vision request:', {
        message: message.trim(),
        attachmentsCount: attachments.length,
        attachments: attachments.map(a => ({
          filename: a.filename,
          type: a.type,
          hasBase64: !!a.data,
          dataLength: a.data?.length || 0
        }))
      });
      
      onSendMessage(message.trim(), attachments, useRag);
      
      // Clear inputs after sending
      setMessage('');
      setAttachments([]);
    }
  };

  return (
    <>
      {/* Hidden file input - available in both modes */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Image input"
      />

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

            {/* Upload area */}
            <div className="mb-4">
              {attachments.length === 0 ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-purple-500 hover:bg-purple-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex flex-col items-center gap-3 text-gray-500">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-700">
                        {language === 'en' ? 'Upload Images' : 'Télécharger des images'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {language === 'en' ? 'Click to browse or drag and drop' : 'Cliquez pour parcourir ou glissez-déposez'}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {language === 'en' ? 'Supported: JPG, PNG, GIF, WebP' : 'Supporté: JPG, PNG, GIF, WebP'}
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
                    className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    + {language === 'en' ? 'Add more images' : 'Ajouter plus d\'images'}
                  </button>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="flex gap-2 bg-white rounded-2xl shadow-lg border border-gray-200 p-2">
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
                placeholder={language === 'en' ? 'Ask about the images...' : 'Posez une question sur les images...'}
                className="flex-1 border-0 rounded-lg px-4 py-3 focus:outline-none focus:ring-0 transition disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 placeholder-gray-400"
                disabled={disabled}
              />

              <button
                onClick={handleSend}
                disabled={disabled || (!message.trim() && attachments.length === 0)}
                className="flex-shrink-0 text-white px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium hover:opacity-90"
                style={{ backgroundColor: '#1e90ff' }}
              >
                {language === 'en' ? 'Analyze' : 'Analyser'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Bottom input for existing chat
        <div className="border-t bg-white p-4">
          {/* Compact horizontal layout (after first message) */}
          <div className="flex gap-2 items-center">
            {/* Small upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="flex-shrink-0 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              title={language === 'en' ? 'Upload Images' : 'Télécharger des images'}
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
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
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={disabled}
            />

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={disabled || (!message.trim() && attachments.length === 0)}
              className="flex-shrink-0 text-white px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium hover:opacity-90"
              style={{ backgroundColor: '#1e90ff' }}
            >
              {language === 'en' ? 'Send' : 'Envoyer'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MessageInputVision;

