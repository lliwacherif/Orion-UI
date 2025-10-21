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
  conversation_history?: ConversationHistoryMessage[];
}

export interface Context {
  source?: string;
  doc_id?: string;
  text?: string;
  chunk?: string;
  content?: string;
  score?: number;
}

export interface ChatResponse {
  status?: 'ok' | 'error' | 'ocr_queued';
  message?: string;
  contexts?: Context[];
  model_response?: any;
  error?: string;
  jobs?: string[];
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

export interface Session {
  user_id: string;
  tenant_id?: string;
  session_id: string;
}

