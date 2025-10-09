'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AdminHeader from '@/components/AdminHeader'
import AdminDocumentManagement from '@/components/AdminDocumentManagement'
import { useAuth } from '@/contexts/AuthContext'
import { API_ENDPOINTS } from '@/config/api'

interface Document {
  _id?: string;
  source: string;
  type: 'upload' | 'web';
  filename?: string;
  url?: string;
  uploadDate: string;
  chunksCount: number;
}

interface ApiDocument {
  _id?: string;
  source: string;
  type: 'upload' | 'web';
  filename?: string;
  url?: string;
  uploadDate?: string;
  createdAt?: string;
  chunksCount?: number;
  chunkCount?: number;
}

interface DocumentsStatsResponse {
  count?: number;
  documents?: ApiDocument[];
}

export default function AdminDocumentsPage() {
  const router = useRouter()
  const { user, token, apiCall, logout: apiLogout } = useAuth()
  const [documentStats, setDocumentStats] = useState({
    count: 0,
    documents: [] as Document[]
  })
  const [isLoading, setIsLoading] = useState(true)

  const loadDocumentStats = useCallback(async () => {
    try {
      setIsLoading(true)
      const stats = await apiCall(API_ENDPOINTS.DOCUMENTS_STATS) as DocumentsStatsResponse
      // Transform the stats to match our interface
      const documents: Document[] = stats.documents?.map((doc: ApiDocument) => ({
        _id: doc._id || doc.source,
        source: doc.source,
        type: doc.type,
        filename: doc.filename,
        url: doc.url,
        uploadDate: doc.uploadDate || doc.createdAt || '',
        chunksCount: (doc.chunksCount ?? doc.chunkCount) ?? 0
      })) || []
      setDocumentStats({
        count: stats.count || 0,
        documents
      })
    } catch (error: unknown) {
      console.error('Failed to load document stats:', error)
      // If it's an authentication error, redirect to login
      if ((error as Error).message.includes('Session expired') || (error as Error).message.includes('No authentication token')) {
        router.push('/admin/login')
        return
      }
      // Set empty stats on other errors
      setDocumentStats({
        count: 0,
        documents: []
      })
    } finally {
      setIsLoading(false)
    }
  }, [apiCall, router])

  useEffect(() => {
    if (!user || !token) {
      // For testing purposes, show a message instead of redirecting immediately
      console.log('No authentication found, redirecting to login')
      router.push('/admin/login')
      return
    }
    
    loadDocumentStats()
  }, [user, token, router, loadDocumentStats])

  const handleFileUpload = async (files: File[]) => {
    try {
      if (!token) {
        throw new Error('No authentication token')
      }

      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch(API_ENDPOINTS.DOCUMENTS_UPLOAD, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin/login')
          throw new Error('Session expired. Please login again.')
        }
        
        const errorData = await response.json()
        throw new Error(errorData.error || `Upload failed: ${response.status}`)
      }

      const result = await response.json()
      console.log('Upload successful:', result)
      
      // Reload document stats to get updated data
      await loadDocumentStats()
    } catch (error: unknown) {
      console.error('Upload error:', error)
      throw error
    }
  }

  const handleWebScrape = async (urls: string[]) => {
    try {
      if (!token) {
        throw new Error('No authentication token')
      }

      // Process each URL individually
      for (const url of urls) {
        const response = await fetch(API_ENDPOINTS.DOCUMENTS_SCRAPE, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        })

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/admin/login')
            throw new Error('Session expired. Please login again.')
          }
          
          const errorData = await response.json()
          throw new Error(errorData.error || `Scraping failed for ${url}: ${response.status}`)
        }

        const result = await response.json()
        console.log(`Scraping successful for ${url}:`, result)
      }
      
      // Reload document stats to get updated data
      await loadDocumentStats()
    } catch (error: unknown) {
      console.error('Scraping error:', error)
      throw error
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await apiCall(API_ENDPOINTS.DOCUMENTS_DELETE, {
        method: 'DELETE',
        body: JSON.stringify({ documentIds: [documentId] }),
      })
      
      console.log('Document deleted successfully:', documentId)
      
      // Reload document stats to get updated data
      await loadDocumentStats()
    } catch (error) {
      console.error('Delete error:', error)
      throw error
    }
  }

  const handleDeleteSelected = async (documentIds: string[]) => {
    try {
      await apiCall(API_ENDPOINTS.DOCUMENTS_DELETE, {
        method: 'DELETE',
        body: JSON.stringify({ documentIds }),
      })
      
      console.log('Documents deleted successfully:', documentIds)
      
      // Reload document stats to get updated data
      await loadDocumentStats()
    } catch (error) {
      console.error('Bulk delete error:', error)
      throw error
    }
  }

  const handleClearAll = async () => {
    try {
      await apiCall(API_ENDPOINTS.DOCUMENTS_CLEAR, {
        method: 'DELETE',
      })
      
      console.log('All documents cleared successfully')
      
      // Reload document stats to get updated data
      await loadDocumentStats()
    } catch (error) {
      console.error('Clear all error:', error)
      throw error
    }
  }

  const handleLogout = () => {
    apiLogout()
    router.push('/admin/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <>
      <AdminHeader 
        user={user}
        documentStats={documentStats}
        onLogout={handleLogout}
      />
      <AdminDocumentManagement
        documentStats={documentStats}
        onFileUpload={handleFileUpload}
        onWebScrape={handleWebScrape}
        onDeleteDocument={handleDeleteDocument}
        onDeleteSelected={handleDeleteSelected}
        onClearAll={handleClearAll}
      />
    </>
  )
}
