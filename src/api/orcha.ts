import axios, { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import type { RouteRequest, RouteResponse, ChatRequest, ChatResponse, OCRExtractRequest, OCRExtractResponse, Conversation, CreateConversationRequest, UpdateConversationRequest, PulseResponse, WebSearchRequest, WebSearchResponse } from '../types/orcha';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 600000, // 10 minutes timeout for VPS (600000ms = 10 min)
});

/**
 * Call the ORCHA chat endpoint to get AI responses from LM Studio.
 * 
 * @param payload - The chat request payload
 * @returns Promise with the chat response including message and optional contexts
 * @throws AxiosError if the request fails
 */
export const chat = async (payload: ChatRequest): Promise<ChatResponse> => {
  try {
    const traceId = uuidv4();

    // Debug: Log the payload being sent including pro mode status
    console.log('📤 CHAT API PAYLOAD:', {
      ...payload,
      message: payload.message?.substring(0, 50) + '...', // Truncate message for logging
      use_pro_mode: payload.use_pro_mode // Explicitly log pro mode
    });

    const response = await api.post<ChatResponse>('/orcha/chat', payload, {
      headers: {
        'x-trace-id': traceId,
      },
    });

    // Debug logging - check console to see actual response
    console.log('🔍 ORCHA Chat Response:', response.data);
    console.log('📝 Status:', response.data.status);
    console.log('💬 Message:', response.data.message);
    console.log('📚 Contexts:', response.data.contexts);
    console.log('🪙 Token Usage:', response.data.token_usage);

    if (response.data.token_usage) {
      console.log('✅ Token usage IS in response:', {
        current: response.data.token_usage.current_usage,
        added: response.data.token_usage.tokens_added,
        enabled: response.data.token_usage.tracking_enabled
      });
    } else {
      console.error('❌ Token usage NOT in response! Backend may not be sending it.');
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('ORCHA chat error:', {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });
    }
    throw error;
  }
};

/**
 * Call the ORCHA routing endpoint to determine which downstream endpoint should handle the request.
 * 
 * @param payload - The routing request payload
 * @returns Promise with the routing response including endpoint, reason, and prepared_payload
 * @throws AxiosError if the request fails
 */
export const route = async (payload: RouteRequest): Promise<RouteResponse> => {
  try {
    const traceId = uuidv4();

    const response = await api.post<RouteResponse>('/orcha/route', payload, {
      headers: {
        'x-trace-id': traceId,
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('ORCHA routing error:', {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });
    }
    throw error;
  }
};

/**
 * TODO: Implement actual file upload endpoint
 * This function should upload a file to your backend and return the file URI
 * that can be used in the attachments array.
 * 
 * Example implementation:
 * 
 * export const uploadFile = async (file: File): Promise<string> => {
 *   const formData = new FormData();
 *   formData.append('file', file);
 *   
 *   const response = await api.post<{ file_uri: string }>('/upload', formData, {
 *     headers: {
 *       'Content-Type': 'multipart/form-data',
 *     },
 *   });
 *   
 *   return response.data.file_uri;
 * };
 */

/**
 * Get current token usage for a user
 * 
 * @param userId - The user ID to check token usage for
 * @returns Promise with the token usage information
 * @throws AxiosError if the request fails
 */
export const getTokenUsage = async (userId: string): Promise<any> => {
  try {
    const response = await api.get(`/tokens/usage/${userId}`);
    console.log('🪙 Token usage fetched:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Token usage fetch error:', {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });
    }
    throw error;
  }
};

/**
 * TODO: Implement function to call the recommended endpoint
 * This function would take the routing response and make an actual call to the
 * recommended endpoint using the prepared payload.
 * 
 * Example implementation:
 * 
 * export const callRecommendedEndpoint = async (
 *   endpoint: string,
 *   payload: any
 * ): Promise<any> => {
 *   const traceId = uuidv4();
 *   
 *   const response = await api.post(endpoint, payload, {
 *     headers: {
 *       'x-trace-id': traceId,
 *     },
 *   });
 *   
 *   return response.data;
 * };
 */

/**
 * Extract text from image using OCR service
 * 
 * @param payload - The OCR extraction request payload
 * @returns Promise with the OCR extraction response including extracted text
 * @throws AxiosError if the request fails
 */
export const extractOCRText = async (payload: OCRExtractRequest): Promise<OCRExtractResponse> => {
  try {
    const traceId = uuidv4();

    const response = await api.post<OCRExtractResponse>('/orcha/ocr/extract', payload, {
      headers: {
        'x-trace-id': traceId,
      },
    });

    console.log('🔍 OCR Extraction Response:', response.data);
    console.log('📝 Status:', response.data.status);
    console.log('📄 Extracted Text:', response.data.extracted_text);
    console.log('📊 Lines Count:', response.data.lines_count);

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('OCR extraction error:', {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });
    }
    throw error;
  }
};

/**
 * Create a new conversation
 * 
 * @param payload - The conversation creation request payload
 * @returns Promise with the created conversation
 * @throws AxiosError if the request fails
 */
export const createConversation = async (payload: CreateConversationRequest): Promise<Conversation> => {
  try {
    const traceId = uuidv4();

    const response = await api.post<Conversation>('/conversations', payload, {
      headers: {
        'x-trace-id': traceId,
      },
    });

    console.log('🔍 Create Conversation Response:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Create conversation error:', {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });
    }
    throw error;
  }
};

/**
 * Get user's conversations
 * 
 * @param userId - The user ID to fetch conversations for
 * @param limit - Maximum number of conversations to return (default: 50)
 * @param offset - Number of conversations to skip (default: 0)
 * @returns Promise with array of conversations
 * @throws AxiosError if the request fails
 */
export const getUserConversations = async (userId: number, limit: number = 50, offset: number = 0): Promise<Conversation[]> => {
  try {
    const traceId = uuidv4();

    const response = await api.get<Conversation[]>(`/conversations/${userId}?limit=${limit}&offset=${offset}`, {
      headers: {
        'x-trace-id': traceId,
      },
    });

    console.log('🔍 Get Conversations Response:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Get conversations error:', {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });
    }
    throw error;
  }
};

/**
 * Get conversation details with messages
 * 
 * @param userId - The user ID
 * @param conversationId - The conversation ID to fetch
 * @returns Promise with conversation details including messages
 * @throws AxiosError if the request fails
 */
export const getConversationDetails = async (userId: number, conversationId: number): Promise<Conversation> => {
  try {
    const traceId = uuidv4();

    const response = await api.get<Conversation>(`/conversations/${userId}/${conversationId}`, {
      headers: {
        'x-trace-id': traceId,
      },
    });

    console.log('🔍 Get Conversation Details Response:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Get conversation details error:', {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });
    }
    throw error;
  }
};

/**
 * Update conversation title
 * 
 * @param userId - The user ID
 * @param conversationId - The conversation ID to update
 * @param payload - The update request payload
 * @returns Promise with updated conversation
 * @throws AxiosError if the request fails
 */
export const updateConversation = async (userId: number, conversationId: number, payload: UpdateConversationRequest): Promise<Conversation> => {
  try {
    const traceId = uuidv4();

    const response = await api.put<Conversation>(`/conversations/${userId}/${conversationId}`, payload, {
      headers: {
        'x-trace-id': traceId,
      },
    });

    console.log('🔍 Update Conversation Response:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Update conversation error:', {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });
    }
    throw error;
  }
};

/**
 * Delete conversation (soft delete)
 * 
 * @param userId - The user ID
 * @param conversationId - The conversation ID to delete
 * @returns Promise with deletion status
 * @throws AxiosError if the request fails
 */
export const deleteConversation = async (userId: number, conversationId: number): Promise<{ status: string; message: string }> => {
  try {
    const traceId = uuidv4();

    const response = await api.delete<{ status: string; message: string }>(`/conversations/${userId}/${conversationId}`, {
      headers: {
        'x-trace-id': traceId,
      },
    });

    console.log('🔍 Delete Conversation Response:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Delete conversation error:', {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });
    }
    throw error;
  }
};

/**
 * Get user's pulse (daily AI-generated conversation summary)
 * 
 * @param userId - The user ID to fetch pulse for
 * @returns Promise with the pulse data
 * @throws AxiosError if the request fails
 */
export const getPulse = async (userId: number): Promise<PulseResponse> => {
  try {
    const traceId = uuidv4();

    const response = await api.get<PulseResponse>(`/pulse/${userId}`, {
      headers: {
        'x-trace-id': traceId,
      },
    });

    console.log('🔍 Get Pulse Response:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Get pulse error:', {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });
    }
    throw error;
  }
};

/**
 * Regenerate user's pulse
 * 
 * @param userId - The user ID to regenerate pulse for
 * @returns Promise with the regenerated pulse data
 * @throws AxiosError if the request fails
 */
export const regeneratePulse = async (userId: number): Promise<PulseResponse> => {
  try {
    const traceId = uuidv4();

    const response = await api.post<PulseResponse>(`/pulse/${userId}/regenerate`, {}, {
      headers: {
        'x-trace-id': traceId,
      },
    });

    console.log('🔍 Regenerate Pulse Response:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Regenerate pulse error:', {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });
    }
    throw error;
  }
};

/**
 * Perform a web search using DuckDuckGo and get AI-refined results
 * 
 * @param payload - The web search request payload
 * @returns Promise with the search response including AI-refined answer
 * @throws AxiosError if the request fails
 */
export const webSearch = async (payload: WebSearchRequest): Promise<WebSearchResponse> => {
  try {
    const traceId = uuidv4();

    const response = await api.post<WebSearchResponse>('/orcha/search', payload, {
      headers: {
        'x-trace-id': traceId,
      },
    });

    console.log('🔍 Web Search Response:', response.data);
    console.log('📝 Status:', response.data.status);
    console.log('💬 Message:', response.data.message);
    console.log('🔎 Search Query:', response.data.search_query);
    console.log('📊 Results Count:', response.data.results_count);
    console.log('🪙 Token Usage:', response.data.token_usage);

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Web search error:', {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });
    }
    throw error;
  }
};

/**
 * Save user memory to backend database
 * 
 * @param userId - The user ID
 * @param content - The memory content to save
 * @param options - Optional fields (title, conversation_id, source, tags)
 * @returns Promise with the save status
 * @throws AxiosError if the request fails
 */
export const saveMemory = async (
  userId: number,
  content: string,
  options?: {
    title?: string | null;
    conversation_id?: number | null;
    source?: 'manual' | 'auto_extraction' | 'import' | 'legacy';
    tags?: string[] | null;
  }
): Promise<{ status: string; message: string; memory_id?: number }> => {
  try {
    const traceId = uuidv4();

    const payload = {
      user_id: userId,
      content: content,
      title: options?.title || null,
      conversation_id: options?.conversation_id || null,
      source: options?.source || 'auto_extraction',
      tags: options?.tags || null
    };

    const response = await api.post<{ status: string; message: string; memory_id?: number }>('/memory', payload, {
      headers: {
        'x-trace-id': traceId,
      },
    });

    console.log('🔍 Save Memory Response:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Save memory error:', {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });
    }
    throw error;
  }
};

/**
 * Get user's stored memories from backend database
 * 
 * @param userId - The user ID
 * @param limit - Maximum number of memories to return (default: 50)
 * @param offset - Number of memories to skip (default: 0)
 * @returns Promise with the memories data (array format)
 * @throws AxiosError if the request fails
 */
export const getMemory = async (
  userId: number,
  limit: number = 50,
  offset: number = 0
): Promise<{
  status: string;
  memories: Array<{
    id: number;
    content: string;
    title?: string | null;
    conversation_id?: number | null;
    source?: string;
    tags?: string[] | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }>;
  total: number;
  limit: number;
  offset: number;
}> => {
  try {
    const traceId = uuidv4();

    const response = await api.get(`/memory/${userId}?limit=${limit}&offset=${offset}`, {
      headers: {
        'x-trace-id': traceId,
      },
    });

    console.log('🔍 Get Memory Response:', response.data);
    console.log(`📊 Total memories: ${response.data.total}`);
    console.log(`📝 Memories in response: ${response.data.memories?.length || 0}`);

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Get memory error:', {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });
    }
    throw error;
  }
};

export default api;

