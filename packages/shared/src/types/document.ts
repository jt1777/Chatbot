export interface Document {
  pageContent: string;
  metadata: {
    source: string;
    type: 'web' | 'pdf' | 'upload';
    orgId?: string; // Organization ID for multi-tenancy (optional during creation)
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
  orgId: string; // Organization ID for multi-tenancy
  useRAG?: boolean;
}

export interface ChatResponse {
  reply: string;
  sources?: string[];
}
