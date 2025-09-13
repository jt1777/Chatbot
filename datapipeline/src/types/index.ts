export interface Document {
  pageContent: string;
  metadata: {
    source: string;
    type: 'web' | 'pdf';
    [key: string]: any;
  };
}

export interface SplitterOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separators?: string[];
}

export interface ScrapedResult {
  url: string;
  text: string;
}

export interface PipelineOptions {
  clearExisting?: boolean;
  chunkSize?: number;
  chunkOverlap?: number;
  collectionName?: string;
}
