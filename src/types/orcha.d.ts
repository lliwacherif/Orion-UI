// ORCHA API Type Definitions

export interface Attachment {
  uri: string;
  type: string;
  filename?: string;
  data?: string; // base64 encoded file data
  size?: number; // file size in bytes
}

export interface RouteRequest {
  user_id: string;
  tenant_id?: string;
  message: string;
  attachments?: Attachment[];
  use_rag?: boolean;
}

export interface RouteResponse {
  endpoint: string;
  reason: string;
  prepared_payload: PreparedPayload;
  status?: string;
  ocr_queued?: boolean;
  job_ids?: string[];
  [key: string]: any; // Allow additional fields
}

export interface ConversationHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  user_id: string;
  tenant_id?: string;
  message: string;
  attachments?: Attachment[];
  use_rag?: boolean;
  use_pro_mode?: boolean;
  conversation_history?: ConversationHistoryMessage[];
  conversation_id?: number | null;
}

export interface Context {
  source?: string;
  doc_id?: string;
  text?: string;
  chunk?: string;
  content?: string;
  score?: number;
}

export interface TokenUsage {
  current_usage: number;
  tokens_added: number;
  reset_at: string;
  tracking_enabled: boolean;
  time_until_reset: string;
}

export interface ChatResponse {
  status?: 'ok' | 'error' | 'ocr_queued';
  message?: string;
  contexts?: Context[];
  model_response?: any;
  error?: string;
  jobs?: string[];
  token_usage?: TokenUsage;
  conversation_id?: number;
  // OpenAI-style response fields
  choices?: Array<{
    index: number;
    message?: {
      role: string;
      content: string;
    };
    delta?: {
      content: string;
    };
  }>;
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  usage?: any;
}

export type PreparedPayload =
  | ChatPayload
  | OCRPayload
  | RAGPayload
  | Record<string, any>;

export interface ChatPayload {
  user_id: string;
  tenant_id?: string;
  message: string;
  session_id?: string;
}

export interface OCRPayload {
  user_id: string;
  tenant_id?: string;
  file_uri: string;
  mode?: string;
  language?: string;
}

export interface RAGPayload {
  user_id: string;
  tenant_id?: string;
  query: string;
  top_k?: number;
  filters?: Record<string, any>;
}

export interface Message {
  id: string;
  type: 'user' | 'assistant' | 'routing' | 'error';
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
  routingData?: RouteResponse;
  contexts?: Context[];
  isLoading?: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  plan_type: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface OCRExtractRequest {
  user_id: string;
  tenant_id?: string;
  image_data: string; // base64 encoded image
  filename: string;
  language: string;
}

export interface OCRExtractResponse {
  status: 'success' | 'error';
  extracted_text?: string;
  lines_count?: number;
  message?: string;
  filename?: string;
  language?: string;
  error?: string;
}

export interface Session {
  user_id: string;
  tenant_id?: string;
  session_id: string;
}

// Database-backed conversation types
export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments: any;
  token_count: number | null;
  model_used: string | null;
  created_at: string;
}

export interface Conversation {
  id: number;
  title: string | null;
  tenant_id: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
  messages?: ChatMessage[];
}

export interface CreateConversationRequest {
  user_id: number;
  title?: string;
  tenant_id?: string;
}

export interface UpdateConversationRequest {
  title: string;
}

// Pulse feature types
export interface Pulse {
  content: string;
  generated_at: string;
  next_generation: string;
  conversations_analyzed: number;
  messages_analyzed: number;
}

export interface PulseResponse {
  status: 'ok' | 'error';
  pulse?: Pulse;
  message?: string;
}

// Web Search feature types
export interface WebSearchRequest {
  user_id: string;
  tenant_id?: string;
  query: string;
  max_results?: number;
  conversation_id?: number | null;
}

export interface WebSearchResponse {
  status: 'ok' | 'error';
  message: string;
  conversation_id?: number;
  search_query?: string;
  results_count?: number;
  token_usage?: TokenUsage;
  error?: string;
}

