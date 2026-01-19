import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { transcribeAudio } from '../api/voice';
import { useBrowserTTS } from '../hooks/useBrowserTTS';
import CloudyOrb from './CloudyOrb';

interface VoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type VoiceState = 'listening' | 'processing' | 'speaking' | 'error';

const VoiceModal: React.FC<VoiceModalProps> = ({ isOpen, onClose }) => {
    const { language } = useLanguage();
    const [voiceState, setVoiceState] = useState<VoiceState>('listening');
    const [transcription, setTranscription] = useState<string>('');
    const [response, setResponse] = useState<string>('');
    const [volume, setVolume] = useState<number>(0.5);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number>();
    const recordingTimeoutRef = useRef<any>(null); // Use any to avoid NodeJS vs Window timeout type conflicts

    const { speak, cancel } = useBrowserTTS();

    // Auto-speak response
    useEffect(() => {
        if (voiceState === 'speaking' && response) {
            speak(response, { lang: language === 'fr' ? 'fr-FR' : 'en-US' });
        }
    }, [voiceState, response, language, speak]);

    // Handle open/close lifecycle
    useEffect(() => {
        if (isOpen) {
            startRecording();
        } else {
            stopRecording();
            setVoiceState('listening');
            setTranscription('');
            setResponse('');
            cancel();
        }
        return () => {
            stopRecording();
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isOpen]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Visualization Setup
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
            analyserRef.current.fftSize = 256;

            visualize();

            // Recorder Setup
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                handleProcessing(blob);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setVoiceState('listening');

            // Auto-stop after 5 seconds of recording (Adjust as needed)
            if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
            recordingTimeoutRef.current = setTimeout(() => stopRecording(), 5000);

        } catch (err) {
            console.error('Mic Error:', err);
            setVoiceState('error');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error);
        }
        if (recordingTimeoutRef.current) {
            clearTimeout(recordingTimeoutRef.current);
            recordingTimeoutRef.current = null;
        }
    };

    const handleProcessing = async (blob: Blob) => {
        setVoiceState('processing');
        try {
            const result = await transcribeAudio(blob);
            if (result.status === 'success') {
                setVoiceState('speaking');
                setTranscription(result.transcription);
                setResponse(result.response);
            } else {
                setVoiceState('error');
            }
        } catch (error) {
            console.error(error);
            setVoiceState('error');
        }
    };

    const visualize = () => {
        if (!analyserRef.current) return;
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const analyze = () => {
            animationFrameRef.current = requestAnimationFrame(analyze);
            if (analyserRef.current) {
                analyserRef.current.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
                // Normalize volume for Orb speed (0.2 to ~1.2 range)
                setVolume(0.2 + (sum / bufferLength / 50));
            }
        };
        analyze();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/5 backdrop-blur-sm">
            <div className="relative w-full h-full sm:h-auto sm:max-w-2xl bg-white/40 backdrop-blur-2xl sm:rounded-3xl border border-white/50 shadow-2xl flex flex-col items-center p-8 transition-all duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 bg-white/40 rounded-full hover:bg-white/60 transition-colors"
                >
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-3xl font-light mb-4 text-gray-800">
                    {voiceState === 'listening' && (language === 'en' ? 'Listening...' : 'Écoute...')}
                    {voiceState === 'processing' && (language === 'en' ? 'Thinking...' : 'Réflexion...')}
                    {voiceState === 'speaking' && (language === 'en' ? 'Speaking...' : 'Je parle...')}
                    {voiceState === 'error' && (language === 'en' ? 'Error' : 'Erreur')}
                </h2>

                <div className="relative w-full h-[300px] flex items-center justify-center">
                    <CloudyOrb speed={voiceState === 'speaking' ? 1.5 : volume} />
                </div>

                <div className="text-center space-y-4 w-full">
                    {transcription && <p className="text-slate-600 italic text-lg">"{transcription}"</p>}

                    {response && (
                        <div className="bg-white/60 p-6 rounded-3xl border border-white/50 max-h-60 overflow-y-auto w-full">
                            <p className="text-lg font-medium text-slate-800">{response}</p>
                        </div>
                    )}

                    {(voiceState === 'speaking' || voiceState === 'error' || (voiceState !== 'listening' && voiceState !== 'processing')) && (
                        <div className="pt-4">
                            <button
                                onClick={() => { cancel(); startRecording(); }}
                                className="px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg font-medium transition-all transform hover:scale-105"
                            >
                                {language === 'en' ? 'Tap to speak again' : 'Appuyez pour parler'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VoiceModal;
