export interface Document {
  pageContent: string;
  metadata: {
    source: string;
    type: 'web' | 'pdf' | 'upload';
    [key: string]: any;
  };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  userId?: string;
  useRAG?: boolean;
}

export interface ChatResponse {
  reply: string;
  sources?: string[];
}
