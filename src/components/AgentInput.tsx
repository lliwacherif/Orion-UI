import React, { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface AgentInputProps {
    onSend: (message: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

const AgentInput: React.FC<AgentInputProps> = ({ onSend, placeholder, disabled = false }) => {
    const [message, setMessage] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { language } = useLanguage();

    const handleSend = () => {
        if (message.trim()) {
            onSend(message.trim());
            setMessage('');
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="relative w-full">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 px-4 py-3 transition-all duration-300 focus-within:bg-white/20 focus-within:shadow-xl focus-within:border-white/30">
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => {
                        setMessage(e.target.value);
                        if (textareaRef.current) {
                            textareaRef.current.style.height = 'auto';
                            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || (language === 'en' ? 'Type your request...' : 'Tapez votre demande...')}
                    rows={1}
                    disabled={disabled}
                    className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 resize-none text-gray-800 placeholder-gray-500 text-sm leading-relaxed py-1.5 max-h-[150px] overflow-y-auto custom-scrollbar"
                    style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
                    }}
                />

                <button
                    onClick={handleSend}
                    disabled={disabled || !message.trim()}
                    className="group relative flex-shrink-0 p-2.5 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:shadow-lg hover:from-purple-500 hover:to-indigo-500"
                >
                    <svg className="w-5 h-5 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default AgentInput;
