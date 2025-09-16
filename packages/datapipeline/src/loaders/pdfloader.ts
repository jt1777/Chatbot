import { promises as fs } from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';

// Function to detect if PDF is scanned (image-based)
export async function isScannedPDF(pdfPath: string): Promise<boolean> {
  try {
    const dataBuffer = await fs.readFile(pdfPath);
    const { text } = await pdfParse(dataBuffer, {
      pagerender: async (pageData: any) => {
        const items = pageData.getTextContent ? (await pageData.getTextContent()).items : [];
        const strings = items.map((i: any) => (i.str || ''));
        return strings.join('');
      },
    });
    const textContent = (text || '').toString();
    const textLength = textContent.replace(/\s+/g, ' ').trim().length;
    return textLength < 50; // very conservative: only treat as scanned if essentially empty
  } catch (error) {
    console.log(`Could not analyze PDF ${pdfPath}: ${(error as Error).message}`);
    return true; // Assume scanned if we can't analyze
  }
}

export async function convertPDFsToText(pdfDir: string = 'raw', outputDir: string = 'processed'): Promise<string[]> {
  try {
    // Resolve input and output directories
    const inputPath = path.join(__dirname, '../../data', pdfDir);
    const outputPath = path.join(__dirname, '../../data', outputDir);

    // Ensure output directory exists
    await fs.mkdir(outputPath, { recursive: true });

    // Read PDF files from input directory
    const files = await fs.readdir(inputPath);
    const pdfFiles = files.filter(file => file.endsWith('.pdf'));

    if (pdfFiles.length === 0) {
      console.log('No PDF files found in', inputPath);
      return [];
    }

    // Convert each PDF to text
    const textFiles: string[] = [];
    for (const pdfFile of pdfFiles) {
      const pdfPath = path.join(inputPath, pdfFile);
      
      // Check if PDF is scanned
      const isScanned = await isScannedPDF(pdfPath);
      
      if (isScanned) {
        console.log(`⚠️  ${pdfFile} appears to be a scanned PDF. OCR required for text extraction.`);
        console.log(`   Skipping ${pdfFile} - please use external OCR tools to convert to text first.`);
        continue; // Skip this PDF
      }
      
      // Extract text using pdf-parse with improved pagerender
      const dataBuffer = await fs.readFile(pdfPath);
      const { text } = await pdfParse(dataBuffer, {
        pagerender: async (pageData: any) => {
          const items = pageData.getTextContent ? (await pageData.getTextContent()).items : [];
          const strings = items.map((i: any) => (i.str || ''));
          return strings.join('');
        },
      });
      const textContent = (text || '').toString();
      const cleanLen = textContent.replace(/\s+/g, ' ').trim().length;
      if (cleanLen < 50) {
        console.log(`⚠️  ${pdfFile} appears to have no extractable text. Skipping.`);
        continue;
      }
      const outputFile = path.join(outputPath, pdfFile.replace('.pdf', '.txt'));

      // Save as UTF-8 text file with BOM for better Chinese support
      const utf8BOM = '\uFEFF';
      await fs.writeFile(outputFile, utf8BOM + textContent, 'utf8');
      
      // Log Chinese character detection for debugging
      const hasChineseChars = /[\u4e00-\u9fff]/.test(textContent);
      console.log(`✅ Converted ${pdfFile} to ${outputFile} ${hasChineseChars ? '(Chinese text detected)' : '(No Chinese text detected)'}`);
      textFiles.push(outputFile);
    }

    return textFiles;
  } catch (error) {
    console.error('Error converting PDFs to text:', (error as Error).message);
    throw error;
  }
}
