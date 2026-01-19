import { useState, useEffect, useCallback } from 'react';

interface TTSOptions {
    lang?: string;
    pitch?: number;
    rate?: number;
    volume?: number;
}

export const useBrowserTTS = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const synth = window.speechSynthesis;

    useEffect(() => {
        const updateVoices = () => setVoices(synth.getVoices());
        updateVoices();

        if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = updateVoices;
        }
    }, [synth]);

    const speak = useCallback((text: string, options: TTSOptions = {}) => {
        if (!text) return;

        synth.cancel(); // Stop previous speech

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = options.lang || 'en-US';
        utterance.pitch = options.pitch || 1;
        utterance.rate = options.rate || 1;
        utterance.volume = options.volume || 1;

        // Try to select a "Google" voice or best match
        if (voices.length > 0) {
            const matchingVoices = voices.filter(v =>
                v.lang.startsWith(utterance.lang.split('-')[0])
            );
            const bestVoice = matchingVoices.find(v => v.name.includes('Google')) || matchingVoices[0];

            if (bestVoice) {
                utterance.voice = bestVoice;
            }
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e) => {
            console.error('TTS Error:', e);
            setIsSpeaking(false);
        };

        synth.speak(utterance);
    }, [synth, voices]);

    const cancel = useCallback(() => {
        synth.cancel();
        setIsSpeaking(false);
    }, [synth]);

    return { speak, cancel, isSpeaking, voices };
};
