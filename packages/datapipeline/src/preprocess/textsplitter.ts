import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document, SplitterOptions } from '../types';

export async function splitDocuments(documents: Document[], options: SplitterOptions = {}): Promise<Document[]> {
  try {
    // Default options for chunking (optimized for both English and Chinese text)
    const defaultOptions: Required<SplitterOptions> = {
      chunkSize: 1000, // Max characters per chunk - good for both languages
      chunkOverlap: 200, // Overlap to preserve context
      separators: [
        '\n\n',  // Paragraph breaks
        '\n',    // Line breaks
        '。',    // Chinese period
        '！',    // Chinese exclamation
        '？',    // Chinese question mark
        '；',    // Chinese semicolon
        '，',    // Chinese comma
        '.',     // English period
        '!',     // English exclamation
        '?',     // English question mark
        ';',     // English semicolon
        ',',     // English comma
        ' ',     // Space
        ''       // Character level (last resort)
      ],
    };

    // Merge provided options with defaults
    const splitterOptions = { ...defaultOptions, ...options };

    // Initialize the text splitter
    const splitter = new RecursiveCharacterTextSplitter(splitterOptions);

    // Split documents into chunks
    const splitDocs = await splitter.splitDocuments(documents);

    // Check for text language in the documents
    const hasChineseText = documents.some(doc => 
      /[\u4e00-\u9fff]/.test(doc.pageContent || '')
    );
    const hasEnglishText = documents.some(doc => 
      /[a-zA-Z]/.test(doc.pageContent || '')
    );

    let languageInfo = '';
    if (hasChineseText && hasEnglishText) {
      languageInfo = '(Bilingual text detected)';
    } else if (hasChineseText) {
      languageInfo = '(Chinese text detected)';
    } else if (hasEnglishText) {
      languageInfo = '(English text detected)';
    }

    console.log(`Split ${documents.length} documents into ${splitDocs.length} chunks ${languageInfo}`);
    return splitDocs;
  } catch (error) {
    console.error('Error splitting documents:', (error as Error).message);
    throw error;
  }
}
