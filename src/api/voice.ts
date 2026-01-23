import axios from 'axios';

// Ensure your VITE_API_URL is set in your .env file
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface VoiceResponse {
    status: 'success' | 'error';
    transcription: string; // The text transcribed from audio
    response: string;      // The AI's text response
    audio_url?: string;    // Optional: URL to TTS audio from backend
}

/**
 * Sends an audio blob to the backend for transcription and processing.
 * @param audioBlob The audio recording blob (type: audio/webm)
 */
export const transcribeAudio = async (audioBlob: Blob): Promise<VoiceResponse> => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'mask_audio.webm');

    try {
        const response = await axios.post<VoiceResponse>(`${API_BASE_URL}/voice/transcribe`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 30000, // 30s timeout for longer processing
        });
        return response.data;
    } catch (error) {
        console.error('Error sending voice data:', error);
        throw error;
    }
};

export const generateSpeech = async (text: string): Promise<Blob> => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OpenAI API key not found');
    }

    try {
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini-tts',
                input: text,
                voice: 'coral',
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'TTS generation failed');
        }

        return await response.blob();
    } catch (error) {
        console.error('Error generating speech:', error);
        throw error;
    }
};
