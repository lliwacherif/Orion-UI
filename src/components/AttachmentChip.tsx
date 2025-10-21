import React from 'react';
import type { Attachment } from '../types/orcha';

interface AttachmentChipProps {
  attachment: Attachment;
  onRemove?: () => void;
  readonly?: boolean;
}

const AttachmentChip: React.FC<AttachmentChipProps> = ({ 
  attachment, 
  onRemove, 
  readonly = false 
}) => {
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return '🖼️';
    } else if (type === 'application/pdf') {
      return '📄';
    }
    return '📎';
  };

  const getFileName = (uri: string) => {
    // Extract filename from URI or use a default name
    try {
      const url = new URL(uri);
      const parts = url.pathname.split('/');
      return parts[parts.length - 1] || 'file';
    } catch {
      return 'file';
    }
  };

  return (
    <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-sm">
      <span>{getFileIcon(attachment.type)}</span>
      <span className="max-w-[150px] truncate">{getFileName(attachment.uri)}</span>
      {!readonly && onRemove && (
        <button
          onClick={onRemove}
          className="hover:bg-indigo-200 rounded-full p-0.5 transition"
          aria-label="Remove attachment"
          type="button"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default AttachmentChip;

