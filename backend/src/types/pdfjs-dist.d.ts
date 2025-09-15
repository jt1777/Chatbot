// src/types/pdfjs-dist.d.ts
declare module 'pdfjs-dist/legacy/build/pdf' {
    export interface PDFDocumentLoadingTask {
      promise: Promise<PDFDocumentProxy>;
    }
    export interface PDFDocumentProxy {
      numPages: number;
      getPage(pageNumber: number): Promise<PDFPageProxy>;
    }
    export interface PDFPageProxy {
      getViewport(params: { scale: number }): PageViewport;
      render(params: RenderParameters): { promise: Promise<void> };
    }
    export interface PageViewport {
      width: number;
      height: number;
    }
    export interface RenderParameters {
      canvasContext: any; // Use any to bypass CanvasRenderingContext2D mismatch
      viewport: PageViewport;
    }
    export const GlobalWorkerOptions: { workerSrc: string };
    export function getDocument(source: { data: Uint8Array; disableFontFace?: boolean }): PDFDocumentLoadingTask;
  }
  
  declare module 'pdfjs-dist/legacy/build/pdf.worker.js';