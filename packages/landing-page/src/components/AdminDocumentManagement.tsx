'use client'

import { useState } from 'react'
import { 
  DocumentTextIcon, 
  PlusIcon, 
  TrashIcon, 
  CogIcon,
  ArrowUpTrayIcon,
  GlobeAltIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface Document {
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
  documents: Document[];
}

interface AdminDocumentManagementProps {
  documentStats: DocumentStats;
  onFileUpload: (files: File[]) => Promise<void>;
  onWebScrape: (urls: string[]) => Promise<void>;
  onDeleteDocument: (documentId: string) => Promise<void>;
  onDeleteSelected: (documentIds: string[]) => Promise<void>;
  onClearAll: () => Promise<void>;
}

export default function AdminDocumentManagement({
  documentStats,
  onFileUpload,
  onWebScrape,
  onDeleteDocument,
  onDeleteSelected,
  onClearAll,
}: AdminDocumentManagementProps) {
  const [showUpload, setShowUpload] = useState(false)
  const [showWebScrape, setShowWebScrape] = useState(false)
  const [showDeleteMode, setShowDeleteMode] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())
  const [urlInput, setUrlInput] = useState('')
  const [websiteUrls, setWebsiteUrls] = useState<string[]>([])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      try {
        await onFileUpload(Array.from(event.target.files))
        setShowUpload(false)
      } catch (error) {
        console.error('File upload failed:', error)
        alert('File upload failed. Please try again.')
      }
    }
  }

  const handleAddUrl = () => {
    if (urlInput.trim()) {
      setWebsiteUrls([...websiteUrls, urlInput.trim()])
      setUrlInput('')
    }
  }

  const handleRemoveUrl = (index: number) => {
    setWebsiteUrls(websiteUrls.filter((_, i) => i !== index))
  }

  const handleScrapeWebsites = async () => {
    if (websiteUrls.length > 0) {
      try {
        await onWebScrape(websiteUrls)
        setWebsiteUrls([])
        setShowWebScrape(false)
      } catch (error) {
        console.error('Web scraping failed:', error)
        alert('Web scraping failed. Please try again.')
      }
    }
  }

  const handleSelectDocument = (documentId: string) => {
    const newSelected = new Set(selectedDocuments)
    if (newSelected.has(documentId)) {
      newSelected.delete(documentId)
    } else {
      newSelected.add(documentId)
    }
    setSelectedDocuments(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedDocuments.size === documentStats.documents.length) {
      setSelectedDocuments(new Set())
    } else {
      setSelectedDocuments(new Set(documentStats.documents.map(doc => doc._id || doc.source)))
    }
  }

  const handleDeleteSelected = async () => {
    try {
      await onDeleteSelected(Array.from(selectedDocuments))
      setSelectedDocuments(new Set())
      setShowDeleteMode(false)
    } catch (error) {
      console.error('Delete selected failed:', error)
      alert('Delete failed. Please try again.')
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
        <p className="text-gray-600">Upload and manage your knowledge base documents</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">{documentStats.count}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ArrowUpTrayIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Uploaded Files</p>
              <p className="text-2xl font-bold text-gray-900">
                {documentStats.documents.filter(doc => doc.type === 'upload').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <GlobeAltIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Web Pages</p>
              <p className="text-2xl font-bold text-gray-900">
                {documentStats.documents.filter(doc => doc.type === 'web').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => setShowUpload(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Upload Files
        </button>
        
        <button
          onClick={() => setShowWebScrape(true)}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <GlobeAltIcon className="h-5 w-5 mr-2" />
          Scrape Websites
        </button>
        
        <button
          onClick={() => setShowDeleteMode(!showDeleteMode)}
          className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
            showDeleteMode 
              ? 'bg-red-600 text-white hover:bg-red-700' 
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          <TrashIcon className="h-5 w-5 mr-2" />
          {showDeleteMode ? 'Cancel Delete' : 'Delete Mode'}
        </button>
        
        {showDeleteMode && selectedDocuments.size > 0 && (
          <button
            onClick={handleDeleteSelected}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <TrashIcon className="h-5 w-5 mr-2" />
            Delete Selected ({selectedDocuments.size})
          </button>
        )}
      </div>

      {/* File Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Upload Files</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Select files to upload</p>
              <input
                type="file"
                multiple
                accept=".pdf,.txt,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
              >
                Choose Files
              </label>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowUpload(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Web Scrape Modal */}
      {showWebScrape && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Scrape Websites</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL
                </label>
                <div className="flex">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    onClick={handleAddUrl}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700"
                  >
                    Add
                  </button>
                </div>
              </div>
              
              {websiteUrls.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">URLs to scrape:</p>
                  <div className="space-y-2">
                    {websiteUrls.map((url, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm text-gray-600 truncate">{url}</span>
                        <button
                          onClick={() => handleRemoveUrl(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6 space-x-2">
              <button
                onClick={() => {
                  setShowWebScrape(false)
                  setWebsiteUrls([])
                  setUrlInput('')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleScrapeWebsites}
                disabled={websiteUrls.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Scrape Websites
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
            {showDeleteMode && (
              <button
                onClick={handleSelectAll}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                {selectedDocuments.size === documentStats.documents.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {documentStats.documents.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p>No documents uploaded yet</p>
              <p className="text-sm">Upload files or scrape websites to get started</p>
            </div>
          ) : (
            documentStats.documents.map((document) => (
              <div key={document._id || document.source} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {showDeleteMode && (
                      <button
                        onClick={() => handleSelectDocument(document._id || document.source)}
                        className={`mr-3 w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedDocuments.has(document._id || document.source)
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedDocuments.has(document._id || document.source) && (
                          <CheckIcon className="h-3 w-3" />
                        )}
                      </button>
                    )}
                    
                    <div>
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900">
                          {document.filename || document.source}
                        </span>
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          document.type === 'upload' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {document.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Uploaded: {new Date(document.uploadDate).toLocaleDateString()} • 
                        Chunks: {document.chunksCount}
                      </p>
                    </div>
                  </div>
                  
                  {!showDeleteMode && (
                    <button
                      onClick={() => onDeleteDocument(document._id || document.source)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
