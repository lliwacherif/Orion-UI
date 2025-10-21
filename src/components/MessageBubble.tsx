import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '../types/orcha';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import AttachmentChip from './AttachmentChip';

interface MessageBubbleProps {
  message: Message;
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
    <div className="my-4">
      <div className="bg-gray-800 text-gray-100 rounded-lg overflow-hidden relative group">
        <div className="bg-gray-700 px-4 py-2 text-xs text-gray-300 font-mono border-b border-gray-600 flex items-center justify-between">
          <span>{language}</span>
          <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-600 rounded text-gray-300 hover:text-white"
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
        <pre className="p-4 overflow-x-auto">
          <code className="text-sm font-mono leading-relaxed whitespace-pre">
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

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.type === 'user';
  const isError = message.type === 'error';
  const isAssistant = message.type === 'assistant';
  const { language } = useLanguage();
  const t = translations[language].assistant;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-indigo-600 text-white rounded-br-md'
              : isError
              ? 'bg-red-50 text-red-800 border border-red-200 rounded-bl-md'
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
          }`}
        >
          {isAssistant ? (
            <div className="prose prose-sm max-w-none">
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
                      <div className="overflow-x-auto my-4">
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
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 border-b border-gray-300">
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return (
                      <td className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                        {children}
                      </td>
                    );
                  },
                  // Style blockquotes
                  blockquote({ children }) {
                    return (
                      <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 text-gray-700 italic">
                        {children}
                      </blockquote>
                    );
                  },
                  // Style lists
                  ul({ children }) {
                    return <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>;
                  },
                  ol({ children }) {
                    return <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>;
                  },
                  // Style headings
                  h1({ children }) {
                    return <h1 className="text-xl font-bold my-3 text-gray-900">{children}</h1>;
                  },
                  h2({ children }) {
                    return <h2 className="text-lg font-semibold my-2 text-gray-900">{children}</h2>;
                  },
                  h3({ children }) {
                    return <h3 className="text-base font-semibold my-2 text-gray-900">{children}</h3>;
                  },
                  // Style paragraphs
                  p({ children }) {
                    return <p className="my-2 leading-relaxed">{children}</p>;
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
          
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {message.attachments.map((attachment, index) => (
                <AttachmentChip 
                  key={index} 
                  attachment={attachment} 
                  readonly 
                />
              ))}
            </div>
          )}
          
          {/* Display sources/contexts if present (RAG) */}
          {isAssistant && message.contexts && message.contexts.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-300">
              <p className="text-xs font-semibold mb-2">{t.sources}</p>
              <div className="flex flex-wrap gap-1.5">
                {message.contexts.map((ctx, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-100 text-indigo-800 text-xs"
                    title={ctx.text || ctx.chunk || ctx.content}
                  >
                    {ctx.source || ctx.doc_id || `Source ${index + 1}`}
                    {ctx.score && (
                      <span className="ml-1 text-indigo-600 font-medium">
                        {(ctx.score * 100).toFixed(0)}%
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <span className="text-xs text-gray-500 mt-1 px-1">
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;

