import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '../types/orcha';
import { useLanguage } from '../context/LanguageContext';

interface MessageBubbleProps {
  message: ChatMessage;
  currentModel?: string;
  onRegenerate?: () => void;
}

// Function to parse markdown bold (**text**) and render as bold
const parseMarkdownBold = (text: string) => {
  const parts: (string | JSX.Element)[] = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;
  let keyCounter = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the bold part
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add bold text
    parts.push(
      <strong key={`bold-${keyCounter++}`} className="font-bold">
        {match[1]}
      </strong>
    );

    lastIndex = regex.lastIndex;
  }

  // Add remaining text after last match
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

// Function to parse markdown italics (*text*) and render as italic
// Note: This should be applied AFTER bold parsing to avoid conflicts with **bold**
const parseMarkdownItalic = (text: string) => {
  const parts: (string | JSX.Element)[] = [];
  // Match single-asterisk italics but avoid matching **bold**
  const regex = /(^|[^*])\*(?!\s)([^*]+?)\*(?!\*)/g;
  let lastIndex = 0;
  let match;
  let keyCounter = 0;

  while ((match = regex.exec(text)) !== null) {
    const pre = text.substring(lastIndex, match.index);
    if (pre) parts.push(pre);

    // match[1] is the preceding char (not an asterisk), keep it
    if (match[1]) {
      parts.push(match[1]);
    }

    // match[2] is the italic content
    parts.push(
      <em key={`italic-${keyCounter++}`} className="italic">
        {match[2]}
      </em>
    );

    // Update lastIndex to after this match
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

// Function to parse markdown code blocks (```language\ncode\n```) and render as code blocks
const parseCodeBlocks = (text: string) => {
  const parts: (string | JSX.Element)[] = [];
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  let keyCounter = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the code block
    if (match.index > lastIndex) {
      const textBefore = text.substring(lastIndex, match.index);
      parts.push(textBefore);
    }

    const language = match[1] || 'text';
    const code = match[2];

    // Add code block with copy button
    parts.push(
      <CodeBlock
        key={`code-${keyCounter++}`}
        language={language}
        code={code}
      />
    );

    lastIndex = regex.lastIndex;
  }

  // Add remaining text after last match
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

// Code block component with copy functionality
const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  return (
    <div className="my-4 -mx-2 sm:mx-0">
      <div className="bg-gray-800 text-gray-100 rounded-lg overflow-hidden relative group">
        <div className="bg-gray-700 px-3 sm:px-4 py-2 text-xs text-gray-300 font-mono border-b border-gray-600 flex items-center justify-between">
          <span className="truncate">{language}</span>
          <button
            onClick={handleCopy}
            className="transition-opacity duration-200 p-1 hover:bg-gray-600 rounded text-gray-300 hover:text-white flex-shrink-0 ml-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            title={copied ? 'Copied!' : 'Copy code'}
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
        <pre className="p-3 sm:p-4 overflow-x-auto">
          <code className="text-xs sm:text-sm font-mono leading-relaxed whitespace-pre">
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
};

// Combined markdown parser: code blocks first, then bold, then italics
const parseMarkdown = (text: string) => {
  const withCodeBlocks = parseCodeBlocks(text);
  const segments = Array.isArray(withCodeBlocks) ? withCodeBlocks : [withCodeBlocks];

  const withBold = segments.reduce<(string | JSX.Element)[]>((acc, segment) => {
    if (typeof segment === 'string') {
      const boldParts = parseMarkdownBold(segment);
      const arr = Array.isArray(boldParts) ? boldParts : [boldParts];
      return acc.concat(arr);
    }
    acc.push(segment);
    return acc;
  }, []);

  const withItalics = withBold.reduce<(string | JSX.Element)[]>((acc, segment) => {
    if (typeof segment === 'string') {
      const italicParts = parseMarkdownItalic(segment);
      const arr = Array.isArray(italicParts) ? italicParts : [italicParts];
      return acc.concat(arr);
    }
    acc.push(segment);
    return acc;
  }, []);

  return withItalics;
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onRegenerate }) => {
  const isUser = message.role === 'user';
  const isError = message.role === 'system'; // Treat system messages as errors for now
  const isAssistant = message.role === 'assistant';
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);

  // Copy message content to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Handle regenerate (reload)
  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate();
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 px-2 sm:px-0 group`}>
      {/* OpenCare Avatar - only for assistant messages */}

      <div className={`max-w-[95%] sm:max-w-[85%] md:max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-3 sm:px-4 py-3 rounded-2xl break-words overflow-hidden ${isUser
            ? 'bg-[#558EFA]/80 text-white rounded-br-md backdrop-blur-md border border-white/20 shadow-lg shadow-blue-900/40 transform transition-transform duration-300 group-hover:-translate-y-0.5'
            : isError
              ? 'bg-red-50 text-red-800 border border-red-200 rounded-bl-md'
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
            }`}
        >
          {isAssistant ? (
            <div className="prose prose-sm max-w-none overflow-hidden">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom code block component with copy button
                  code({ className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : 'text';
                    const inline = !className?.includes('language-');

                    if (!inline) {
                      return (
                        <CodeBlock
                          language={language}
                          code={String(children).replace(/\n$/, '')}
                        />
                      );
                    }

                    return (
                      <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                        {children}
                      </code>
                    );
                  },
                  // Style tables
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto my-4 -mx-2 sm:mx-0">
                        <table className="min-w-full border border-gray-300 rounded-lg">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  thead({ children }) {
                    return <thead className="bg-gray-50">{children}</thead>;
                  },
                  th({ children }) {
                    return (
                      <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-semibold text-gray-900 border-b border-gray-300 break-words">
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return (
                      <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 border-b border-gray-200 break-words">
                        {children}
                      </td>
                    );
                  },
                  // Style blockquotes
                  blockquote({ children }) {
                    return (
                      <blockquote className="border-l-4 border-blue-500 pl-3 sm:pl-4 py-2 my-4 bg-blue-50 text-gray-700 italic break-words">
                        {children}
                      </blockquote>
                    );
                  },
                  // Style lists
                  ul({ children }) {
                    return <ul className="list-disc list-inside my-2 space-y-1 break-words">{children}</ul>;
                  },
                  ol({ children }) {
                    return <ol className="list-decimal list-inside my-2 space-y-1 break-words">{children}</ol>;
                  },
                  li({ children }) {
                    return <li className="break-words">{children}</li>;
                  },
                  // Style headings
                  h1({ children }) {
                    return <h1 className="text-lg sm:text-xl font-bold my-3 text-gray-900 break-words">{children}</h1>;
                  },
                  h2({ children }) {
                    return <h2 className="text-base sm:text-lg font-semibold my-2 text-gray-900 break-words">{children}</h2>;
                  },
                  h3({ children }) {
                    return <h3 className="text-sm sm:text-base font-semibold my-2 text-gray-900 break-words">{children}</h3>;
                  },
                  // Style paragraphs
                  p({ children }) {
                    return <p className="my-2 leading-relaxed break-words">{children}</p>;
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words">
              {parseMarkdown(message.content)}
            </p>
          )}
        </div>

        {/* Action buttons for assistant messages */}
        {isAssistant && (
          <div className="flex items-center gap-2 mt-2">
            {/* Regenerate/Reload button */}
            <button
              onClick={handleRegenerate}
              className="p-1.5 rounded-lg bg-white/40 backdrop-blur-sm border border-white/20 shadow-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-200"
              title={language === 'en' ? 'Regenerate response' : 'Régénérer la réponse'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-white/40 backdrop-blur-sm border border-white/20 shadow-sm text-gray-500 hover:text-green-600 hover:bg-green-50/50 transition-all duration-200"
              title={copied ? (language === 'en' ? 'Copied!' : 'Copié!') : (language === 'en' ? 'Copy message' : 'Copier le message')}
            >
              {copied ? (
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>

            {/* Like button */}
            <button
              onClick={() => setLiked(liked === true ? null : true)}
              className={`p-1.5 rounded-lg backdrop-blur-sm border shadow-sm transition-all duration-200 ${liked === true
                ? 'bg-blue-500/10 border-blue-200/50 text-blue-600'
                : 'bg-white/40 border-white/20 text-gray-500 hover:text-blue-600 hover:bg-blue-50/50'
                }`}
              title={language === 'en' ? 'Like' : 'J\'aime'}
            >
              <svg className="w-4 h-4" fill={liked === true ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </button>

            {/* Dislike button */}
            <button
              onClick={() => setLiked(liked === false ? null : false)}
              className={`p-1.5 rounded-lg backdrop-blur-sm border shadow-sm transition-all duration-200 ${liked === false
                ? 'bg-red-500/10 border-red-200/50 text-red-600'
                : 'bg-white/40 border-white/20 text-gray-500 hover:text-red-600 hover:bg-red-50/50'
                }`}
              title={language === 'en' ? 'Dislike' : 'Je n\'aime pas'}
            >
              <svg className="w-4 h-4" fill={liked === false ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
              </svg>
            </button>
          </div>
        )}

        <span className="text-xs text-gray-500 mt-1 px-1">
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;

