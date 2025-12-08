import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface DocumentCanvasProps {
  content: string;
  onClose: () => void;
  onContentChange?: (newContent: string) => void;
}

const DocumentCanvas: React.FC<DocumentCanvasProps> = ({ content, onClose, onContentChange }) => {
  const { language } = useLanguage();
  const [editableContent, setEditableContent] = useState(content);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditableContent(content);
  }, [content]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editableContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableContent(e.target.value);
    if (onContentChange) {
      onContentChange(e.target.value);
    }
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    if (!isEditing && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-white md:border-l border-gray-200 rounded-t-3xl md:rounded-none shadow-2xl md:shadow-none">
      {/* Mobile drag handle */}
      <div className="md:hidden pt-3 pb-2 bg-white rounded-t-3xl flex justify-center">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900">
              Orion Canvas
            </h3>
            <p className="text-xs md:text-sm text-gray-500 hidden sm:block">
              {language === 'en' ? 'View and edit the extracted content' : 'Voir et modifier le contenu extrait'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Edit/View Toggle */}
          <button
            onClick={toggleEdit}
            className={`px-2 md:px-4 py-1.5 md:py-2 rounded-lg text-sm md:text-base font-medium transition-all ${isEditing
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {isEditing
              ? (language === 'en' ? 'View' : 'Voir')
              : (language === 'en' ? 'Edit' : 'Éditer')
            }
          </button>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="px-2 md:px-4 py-1.5 md:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm md:text-base font-medium transition-colors flex items-center gap-1 md:gap-2"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-600 hidden sm:inline">
                  {language === 'en' ? 'Copied!' : 'Copié!'}
                </span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">{language === 'en' ? 'Copy' : 'Copier'}</span>
              </>
            )}
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1.5 md:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={language === 'en' ? 'Close canvas' : 'Fermer le canvas'}
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6">
        <div className="max-w-4xl mx-auto">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={editableContent}
              onChange={handleContentChange}
              className="w-full min-h-[calc(100vh-250px)] p-3 md:p-6 bg-white rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none font-sans text-gray-800 leading-relaxed text-sm md:text-base"
              style={{ fontSize: '14px', lineHeight: '1.7' }}
              placeholder={language === 'en' ? 'Enter your text here...' : 'Entrez votre texte ici...'}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-8">
              <div className="prose prose-sm md:prose-lg max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed text-sm md:text-base" style={{ fontSize: '14px', lineHeight: '1.7' }}>
                  {editableContent}
                </pre>
              </div>
            </div>
          )}

          {/* Word count */}
          <div className="mt-3 md:mt-4 text-xs md:text-sm text-gray-500 text-right">
            {language === 'en' ? 'Words:' : 'Mots:'} {editableContent.split(/\s+/).filter(word => word.length > 0).length} |
            {language === 'en' ? ' Characters:' : ' Caractères:'} {editableContent.length}
          </div>
        </div>
      </div>

      {/* Footer with formatting tips */}
      <div className="px-3 md:px-6 py-2 md:py-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center hidden md:block">
          {isEditing
            ? (language === 'en'
              ? 'Tip: You can edit the text above. Changes are automatically saved.'
              : 'Astuce: Vous pouvez modifier le texte ci-dessus. Les modifications sont automatiquement enregistrées.')
            : (language === 'en'
              ? 'Click "Edit" to modify the document content.'
              : 'Cliquez sur "Éditer" pour modifier le contenu du document.')
          }
        </p>
      </div>
    </div>
  );
};

export default DocumentCanvas;
