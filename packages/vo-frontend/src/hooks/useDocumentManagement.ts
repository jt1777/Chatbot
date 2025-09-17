import { useState, useCallback } from 'react';
import axios from 'axios';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';

interface DocumentRecord {
  _id?: string;
  source: string;
  type: 'upload' | 'web';
  filename?: string;
  url?: string;
  uploadDate: string;
  chunksCount: number;
}

interface DocumentStats {
  count: number;
  documents: DocumentRecord[];
}

interface RAGConfig {
  chunkSize: number;
  chunkOverlap: number;
  similarityThreshold: number;
  useSemanticSearch: boolean;
  ragSearchLimit: number;
}

export const useDocumentManagement = (token: string | null) => {
  // Document stats and management
  const [documentStats, setDocumentStats] = useState<DocumentStats>({ count: 0, documents: [] });
  const [showDocumentList, setShowDocumentList] = useState<boolean>(false);
  const [showDeleteMode, setShowDeleteMode] = useState<boolean>(false);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(5);

  // File upload
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Website scraping
  const [urlInput, setUrlInput] = useState<string>('');
  const [websiteUrls, setWebsiteUrls] = useState<string[]>([]);

  // RAG configuration
  const [ragConfig, setRagConfig] = useState<RAGConfig>({
    chunkSize: 1000,
    chunkOverlap: 200,
    similarityThreshold: 0.7,
    useSemanticSearch: false,
    ragSearchLimit: 10
  });
  const [showRagConfig, setShowRagConfig] = useState(false);
  const [ragConfigLoading, setRagConfigLoading] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Pagination helpers
  const totalPages = Math.ceil(documentStats.documents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDocuments = documentStats.documents.slice(startIndex, endIndex);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const loadDocumentStats = useCallback(async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.DOCUMENTS_STATS, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}`
        }
      });
      setDocumentStats(response.data);
      setCurrentPage(1); // Reset to first page when loading new stats
    } catch (error) {
      console.error('❌ Error loading document stats:', error);
    }
  }, [token]);

  const loadRagConfig = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/config/rag`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}`
        }
      });
      setRagConfig(response.data);
    } catch (error) {
      console.error('Error loading RAG config:', error);
    }
  }, [token]);

  const saveRagConfig = useCallback(async () => {
    setRagConfigLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/config/rag`, ragConfig, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error saving RAG config:', error);
    } finally {
      setRagConfigLoading(false);
    }
  }, [ragConfig, token]);

  const toggleDeleteMode = useCallback(() => {
    setShowDeleteMode(prev => !prev);
    if (showDeleteMode) {
      setSelectedDocuments(new Set());
    }
  }, [showDeleteMode]);

  const selectAllDocuments = useCallback(() => {
    const allDocumentIds = new Set(paginatedDocuments.map(doc => doc.source));
    setSelectedDocuments(allDocumentIds);
  }, [paginatedDocuments]);

  const toggleDocumentSelection = useCallback((documentId: string) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  }, []);

  const deleteSelectedDocuments = useCallback(async () => {
    if (selectedDocuments.size === 0) return;

    setIsLoading(true);
    try {
      const documentsToDelete = Array.from(selectedDocuments);
      await axios.post(`${API_BASE_URL}/api/documents/delete`, {
        documentIds: documentsToDelete
      }, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}`
        }
      });

      setSelectedDocuments(new Set());
      await loadDocumentStats();
    } catch (error) {
      console.error('Error deleting documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDocuments, token, loadDocumentStats]);

  const clearAllDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/documents/clear`, {}, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}`
        }
      });
      await loadDocumentStats();
    } catch (error) {
      console.error('Error clearing documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token, loadDocumentStats]);

  const handleFileSelect = useCallback((event: any) => {
    const files = Array.from(event.target.files) as File[];
    setSelectedFiles(files);
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const uploadFiles = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      await axios.post(`${API_BASE_URL}/api/documents/upload`, formData, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setSelectedFiles([]);
      await loadDocumentStats();
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFiles, token, loadDocumentStats]);

  const addUrl = useCallback(() => {
    if (urlInput.trim() && !websiteUrls.includes(urlInput.trim())) {
      setWebsiteUrls(prev => [...prev, urlInput.trim()]);
      setUrlInput('');
    }
  }, [urlInput, websiteUrls]);

  const removeUrl = useCallback((index: number) => {
    setWebsiteUrls(prev => prev.filter((_, i) => i !== index));
  }, []);

  const scrapeWebsites = useCallback(async () => {
    if (websiteUrls.length === 0) return;

    setIsLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/documents/scrape`, {
        urls: websiteUrls
      }, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}`
        }
      });

      setWebsiteUrls([]);
      await loadDocumentStats();
    } catch (error) {
      console.error('Error scraping websites:', error);
    } finally {
      setIsLoading(false);
    }
  }, [websiteUrls, token, loadDocumentStats]);

  return {
    // State
    documentStats,
    showDocumentList,
    showDeleteMode,
    selectedDocuments,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    paginatedDocuments,
    selectedFiles,
    urlInput,
    websiteUrls,
    ragConfig,
    showRagConfig,
    ragConfigLoading,
    isLoading,

    // Actions
    setShowDocumentList,
    toggleDeleteMode,
    selectAllDocuments,
    toggleDocumentSelection,
    deleteSelectedDocuments,
    clearAllDocuments,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    handleFileSelect,
    removeFile,
    uploadFiles,
    setUrlInput,
    addUrl,
    removeUrl,
    scrapeWebsites,
    setRagConfig,
    setShowRagConfig,
    saveRagConfig,
    loadDocumentStats,
    loadRagConfig,
  };
};
