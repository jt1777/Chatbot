import * as cheerio from 'cheerio';
import { promises as fs } from 'fs';
import * as path from 'path';
import { ScrapedResult } from '../types';

// Function to scrape a single URL and extract text
export async function scrapeWebsite(url: string): Promise<ScrapedResult> {
  try {
    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();

    // Load HTML into Cheerio
    const $ = cheerio.load(html);

    // Remove unwanted elements (scripts, styles, etc.)
    $('script, style, nav, footer, header').remove();

    // Extract text from relevant elements (e.g., paragraphs, headings)
    const text = $('p, h1, h2, h3, h4, h5, h6')
      .map((i, el) => $(el).text().trim())
      .get()
      .filter(text => text.length > 0) // Remove empty strings
      .join('\n\n'); // Separate sections with double newlines

    return { url, text };
  } catch (error) {
    console.error(`Error scraping ${url}:`, (error as Error).message);
    return { url, text: '' };
  }
}

// Function to scrape multiple URLs and save to a text file
export async function scrapeAndSave(urls: string[], outputFile: string): Promise<void> {
  try {
    // Ensure the data/raw directory exists
    const dataRawDir = path.join(__dirname, '../../data/raw');
    await fs.mkdir(dataRawDir, { recursive: true });

    // Scrape all URLs concurrently
    const results = await Promise.all(urls.map(url => scrapeWebsite(url)));

    // Combine all text with metadata (URL as source)
    let combinedText = '';
    for (const result of results) {
      if (result.text) {
        combinedText += `Source: ${result.url}\n${result.text}\n\n`;
      }
    }

    // Create full path to the output file in data/raw directory
    const fullOutputPath = path.join(dataRawDir, outputFile);
    
    // Check for Chinese text detection
    const hasChineseChars = /[\u4e00-\u9fff]/.test(combinedText);
    
    // Save to text file
    await fs.writeFile(fullOutputPath, combinedText, 'utf8');
    console.log(`Data saved to ${fullOutputPath} ${hasChineseChars ? '(Chinese text detected)' : ''}`);
  } catch (error) {
    console.error('Error during scraping or saving:', (error as Error).message);
    throw error;
  }
}
