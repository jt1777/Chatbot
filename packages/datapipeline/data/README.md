# Data Directory Structure

This directory contains the data processing pipeline folders:

## 📁 `/raw`
- **Purpose**: Store original files for processing
- **Supported formats**: PDF files, text files
- **Usage**: Place PDFs here that you want to convert to text and add to the knowledge base

## 📁 `/processed` 
- **Purpose**: Store converted text files from PDFs
- **Auto-generated**: Files are automatically created here when PDFs are processed
- **Format**: UTF-8 text files with BOM for Chinese character support

## 🔄 Processing Flow
1. Place PDF files in `/raw/`
2. Run the datapipeline (now integrated into the backend)
3. Text files appear in `/processed/`
4. Content gets chunked and stored in MongoDB Atlas vector database

## 📝 Notes
- The backend API handles file processing automatically
- You can also upload files directly through the frontend
- Website scraping doesn't use these directories (content goes directly to database)
