import axios, { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import type { RouteRequest, RouteResponse, ChatRequest, ChatResponse } from '../types/orcha';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
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

export default api;

