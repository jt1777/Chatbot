import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import axios from 'axios';
import { API_ENDPOINTS, API_BASE_URL } from './src/config/api';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import AuthScreen from './src/components/AuthScreen';

interface Message {
  text: string;
  from: 'user' | 'bot';
  timestamp: Date;
  sources?: string[];
}

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

function MainApp() {
  const { user, token, isLoading: authLoading, logout, isAdmin, isClient } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<'chat' | 'documents' | 'invites'>('chat');
  const [documentStats, setDocumentStats] = useState<DocumentStats>({ count: 0, documents: [] });
  const [showDocumentList, setShowDocumentList] = useState<boolean>(false);
  const [showDeleteMode, setShowDeleteMode] = useState<boolean>(false);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());

  // Invite management state
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [isCreatingInvite, setIsCreatingInvite] = useState<boolean>(false);
  const [activeInvites, setActiveInvites] = useState<any[]>([]);

  // RAG Configuration state
  const [ragConfig, setRagConfig] = useState({
    chunkSize: 1000,
    chunkOverlap: 200,
    similarityThreshold: 0.7,
    useSemanticSearch: false,
    ragSearchLimit: 10
  });
  const [showRagConfig, setShowRagConfig] = useState(false);
  const [ragConfigLoading, setRagConfigLoading] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [websiteUrls, setWebsiteUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState<string>('');
  const [strictMode, setStrictMode] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(5);

  // Pagination helpers
  const totalPages = Math.ceil(documentStats.documents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDocuments = documentStats.documents.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      text: input.trim(),
      from: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(API_ENDPOINTS.CHAT, {
        message: userMessage.text,
        userId: user?.id || 'web-user',
        useRAG: strictMode,
      }, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}`
        }
      });

      const botMessage: Message = {
        text: response.data.reply,
        from: 'bot',
        timestamp: new Date(),
        sources: response.data.sources,
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        text: 'Sorry, there was an error connecting to the server. Please try again.',
        from: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocumentStats = async () => {
    try {
      //console.log('🔍 Loading document stats from:', API_ENDPOINTS.DOCUMENTS_STATS);
      const response = await axios.get(API_ENDPOINTS.DOCUMENTS_STATS, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}`
        }
      });
      //console.log('📊 Stats response:', response.data);
      setDocumentStats(response.data);
      setCurrentPage(1); // Reset to first page when loading new stats
    } catch (error) {
      console.error('❌ Error loading document stats:', error);
    }
  };

  // RAG Configuration functions
  const loadRagConfig = async () => {
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
  };

  const createInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setIsCreatingInvite(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/org/invite`, {
        email: inviteEmail.trim(),
        role: 'org_admin'
      }, {
        headers: { 
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}` 
        }
      });

      Alert.alert(
        'Invite Created!', 
        `Invite code: ${response.data.inviteCode}\n\nShare this code with ${inviteEmail} to join your organization.`,
        [
          { text: 'Copy Code', onPress: () => {
            // Copy to clipboard functionality would go here
            console.log('Invite code:', response.data.inviteCode);
          }},
          { text: 'OK' }
        ]
      );
      
      setInviteEmail('');
      loadActiveInvites();
    } catch (error: any) {
      console.error('Error creating invite:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to create invite');
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const loadActiveInvites = async () => {
    try {
      // This would need to be implemented in the backend
      // For now, we'll just show a placeholder
      setActiveInvites([]);
    } catch (error) {
      console.error('Error loading invites:', error);
    }
  };

  const saveRagConfig = async () => {
    setRagConfigLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/config/rag`, ragConfig, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}`
        }
      });

      if (Platform.OS === 'web') {
        window.alert('RAG configuration saved successfully!');
      } else {
        Alert.alert('Success', 'RAG configuration saved successfully!');
      }
      //console.log('RAG config updated:', response.data.config);
    } catch (error: any) {
      console.error('Error saving RAG config:', error);
      const errorMessage = error.response?.data?.error || 'Error saving RAG configuration';
      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setRagConfigLoading(false);
    }
  };

  const scrapeWebsites = async () => {
    if (websiteUrls.length === 0) {
      window.alert('Please add website URLs first');
      return;
    }

    try {
      setIsLoading(true);
      let totalChunks = 0;
      let successCount = 0;
      const errors: string[] = [];

      for (const url of websiteUrls) {
        try {
          const response = await axios.post(API_ENDPOINTS.DOCUMENTS_SCRAPE, {
            url: url
          }, {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              'Authorization': `Bearer ${token}`
            }
          });
          
          totalChunks += response.data.chunksCreated;
          successCount++;
        } catch (error: any) {
          errors.push(`${url}: ${error.response?.data?.details || 'Failed to scrape'}`);
        }
      }

      if (successCount > 0) {
        window.alert(`Successfully scraped ${successCount} website(s)! Created ${totalChunks} total chunks.`);
        setWebsiteUrls([]);
        await loadDocumentStats();
      }

      if (errors.length > 0) {
        window.alert(`Scraping completed with errors:\n${errors.join('\n')}`);
      }
    } catch (error: any) {
      console.error('Scraping error:', error);
      window.alert(error.message || 'Failed to scrape websites');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    
    // For web, use window.confirm instead of Alert.alert which might not work properly
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Are you sure you want to clear all chat messages?');
      if (confirmed) {
        //console.log('Clearing messages...');
        setMessages([]);
        //console.log('Messages cleared');
      }
    } else {
      // Fallback to Alert.alert for mobile
      Alert.alert(
        'Clear Chat',
        'Are you sure you want to clear all chat messages?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: () => {
              setMessages([]);
            }
          }
        ]
      );
    }
  };

  const toggleDeleteMode = () => {
    setShowDeleteMode(!showDeleteMode);
    setSelectedDocuments(new Set());
    setCurrentPage(1); // Reset to first page when switching modes
    if (!showDeleteMode) {
      setShowDocumentList(true); // Auto-show list when entering delete mode
    }
  };

  const toggleDocumentSelection = (documentId: string) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(documentId)) {
      newSelected.delete(documentId);
    } else {
      newSelected.add(documentId);
    }
    setSelectedDocuments(newSelected);
  };

  const selectAllDocuments = () => {
    const allIds = paginatedDocuments.map(doc => doc._id || doc.source);
    setSelectedDocuments(new Set(allIds));
  };

  const clearAllDocuments = async () => {
    // For web, use window.confirm instead of Alert.alert which might not work properly
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Are you sure you want to clear all documents from the knowledge base?');
      if (confirmed) {
        try {
          setIsLoading(true);
          await axios.delete(API_ENDPOINTS.DOCUMENTS_CLEAR, {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              'Authorization': `Bearer ${token}`
            }
          });
          window.alert('All documents cleared successfully');
          await loadDocumentStats();
          setShowDeleteMode(false);
          setSelectedDocuments(new Set());
          setCurrentPage(1); // Reset to first page after clearing
        } catch (error: any) {
          console.error('Clear error:', error);
          window.alert(error.response?.data?.details || 'Failed to clear documents');
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      // Fallback to Alert.alert for mobile
      Alert.alert(
        'Clear All Documents',
        'Are you sure you want to clear all documents from the knowledge base?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: async () => {
              try {
                setIsLoading(true);
                await axios.delete(API_ENDPOINTS.DOCUMENTS_CLEAR, {
                  headers: {
                    'ngrok-skip-browser-warning': 'true',
                    'Authorization': `Bearer ${token}`
                  }
                });
                Alert.alert('Success', 'All documents cleared successfully');
                await loadDocumentStats();
                setShowDeleteMode(false);
                setSelectedDocuments(new Set());
                setCurrentPage(1); // Reset to first page after clearing
              } catch (error: any) {
                console.error('Clear error:', error);
                Alert.alert('Error', error.response?.data?.details || 'Failed to clear documents');
              } finally {
                setIsLoading(false);
              }
            }
          }
        ]
      );
    }
  };

  const deleteSelectedDocuments = async () => {
    if (selectedDocuments.size === 0) {
      window.alert('Please select documents to delete');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to delete ${selectedDocuments.size} selected document(s)?`);
    if (confirmed) {
      try {
        setIsLoading(true);
        // Convert Set to Array for the API call
        const documentIds = Array.from(selectedDocuments);
        
        const response = await axios.delete(API_ENDPOINTS.DOCUMENTS_DELETE, {
          data: { documentIds },
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Authorization': `Bearer ${token}`
          }
        });
        
        window.alert(response.data.message || `${selectedDocuments.size} document(s) deleted successfully`);
        await loadDocumentStats();
        setShowDeleteMode(false);
        setSelectedDocuments(new Set());
        setCurrentPage(1); // Reset to first page after deleting
      } catch (error: any) {
        console.error('Delete error:', error);
        window.alert(error.response?.data?.details || 'Failed to delete documents');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFileSelect = (event: any) => {
    const files = Array.from(event.target.files || []) as File[];
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file: File) => {
      // Check file type
      const validTypes = ['application/pdf', 'text/plain'];
      if (!validTypes.includes(file.type)) {
        errors.push(`${file.name}: Only PDF and text files are allowed`);
        return;
      }
      
      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        errors.push(`${file.name}: File size must be less than 10MB`);
        return;
      }
      
      validFiles.push(file);
    });

    if (errors.length > 0) {
      window.alert(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }

    // Reset file input
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addUrl = () => {
    if (urlInput.trim() && !websiteUrls.includes(urlInput.trim())) {
      setWebsiteUrls(prev => [...prev, urlInput.trim()]);
      setUrlInput('');
    }
  };

  const removeUrl = (index: number) => {
    setWebsiteUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      window.alert('Please select files first');
      return;
    }

    try {
      setIsLoading(true);
      let totalChunks = 0;
      let successCount = 0;
      const errors: string[] = [];

      for (const file of selectedFiles) {
        try {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch(API_ENDPOINTS.DOCUMENTS_UPLOAD, {
            method: 'POST',
            body: formData,
            headers: {
              'ngrok-skip-browser-warning': 'true',
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || 'Upload failed');
          }

          const result = await response.json();
          totalChunks += result.chunksCreated;
          successCount++;
        } catch (error: any) {
          errors.push(`${file.name}: ${error.message}`);
        }
      }

      if (successCount > 0) {
        window.alert(`Successfully uploaded ${successCount} file(s)! Created ${totalChunks} total chunks.`);
        setSelectedFiles([]);
        await loadDocumentStats();
      }

      if (errors.length > 0) {
        window.alert(`Upload completed with errors:\n${errors.join('\n')}`);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      window.alert(error.message || 'Failed to upload files');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when switching tabs
  React.useEffect(() => {
    if (currentTab === 'documents') {
      loadDocumentStats();
      loadRagConfig();
    } else if (currentTab === 'invites') {
      loadActiveInvites();
    }
  }, [currentTab]);

  // Clear and reload document stats when user changes (login/logout)
  React.useEffect(() => {
    if (user) {
      // User logged in - reload data for new user
      if (currentTab === 'documents') {
        loadDocumentStats();
        loadRagConfig();
      }
    } else {
      // User logged out - clear all data
      setDocumentStats({ count: 0, documents: [] });
      setRagConfig({
        chunkSize: 1000,
        chunkOverlap: 200,
        similarityThreshold: 0.7,
        useSemanticSearch: false,
        ragSearchLimit: 10
      });
      setMessages([]);
      setSelectedFiles([]);
      setWebsiteUrls([]);
      setSelectedDocuments(new Set());
      setCurrentPage(1);
    }
  }, [user?.id]); // Watch for user ID changes

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <Text style={{ fontSize: 18, color: '#6B7280' }}>Loading...</Text>
      </View>
    );
  }

  // Show auth screen if not authenticated
  if (!user) {
    return (
      <AuthScreen 
        onAuthSuccess={(token, user) => {
          // This will be handled by the AuthContext
        }}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#3B82F6', padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
            AI Chatbot with RAG
          </Text>
          <TouchableOpacity
            onPress={logout}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* User Info */}
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 12 }}>
          {isAdmin ? `Admin: ${user.email}` : `Client: ${user.phone}`} • Org: {user.orgName || user.orgId}
        </Text>
        
        {/* Tab Navigation */}
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <TouchableOpacity
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 16,
              backgroundColor: currentTab === 'chat' ? 'rgba(255,255,255,0.2)' : 'transparent',
              marginRight: 8,
            }}
            onPress={() => setCurrentTab('chat')}
          >
            <Text style={{ color: 'white', fontWeight: currentTab === 'chat' ? 'bold' : 'normal' }}>
              Chat
            </Text>
          </TouchableOpacity>
          {/* Only show Documents tab for admins */}
          {isAdmin && (
            <TouchableOpacity
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 16,
                backgroundColor: currentTab === 'documents' ? 'rgba(255,255,255,0.2)' : 'transparent',
                marginRight: 8,
              }}
              onPress={() => setCurrentTab('documents')}
            >
              <Text style={{ color: 'white', fontWeight: currentTab === 'documents' ? 'bold' : 'normal' }}>
                Documents ({documentStats.count})
              </Text>
            </TouchableOpacity>
          )}
          {/* Only show Invites tab for admins */}
          {isAdmin && (
            <TouchableOpacity
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 16,
                backgroundColor: currentTab === 'invites' ? 'rgba(255,255,255,0.2)' : 'transparent',
              }}
              onPress={() => setCurrentTab('invites')}
            >
              <Text style={{ color: 'white', fontWeight: currentTab === 'invites' ? 'bold' : 'normal' }}>
                Invites
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content Area */}
      {currentTab === 'chat' ? (
        <>
          {/* Messages */}
          <ScrollView style={{ flex: 1, padding: 16 }}>
            {messages.map((message, index) => (
              <View key={index}>
                <View
                  style={{
                    maxWidth: 280,
                    marginVertical: 8,
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: message.from === 'user' ? '#3B82F6' : '#E5E7EB',
                    alignSelf: message.from === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Text style={{ color: message.from === 'user' ? 'white' : 'black', fontSize: 14 }}>
                    {message.text}
                  </Text>
                  <Text style={{ 
                    color: message.from === 'user' ? '#DBEAFE' : '#6B7280',
                    fontSize: 12,
                    marginTop: 4
                  }}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                  <View style={{ 
                    marginLeft: 8, 
                    marginTop: 4, 
                    padding: 8, 
                    backgroundColor: '#F3F4F6', 
                    borderRadius: 4,
                    alignSelf: 'flex-start',
                    maxWidth: 280
                  }}>
                    <Text style={{ fontSize: 10, color: '#6B7280', fontWeight: 'bold' }}>Sources:</Text>
                    {message.sources.map((source, idx) => (
                      <Text key={idx} style={{ fontSize: 10, color: '#6B7280' }}>• {source}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
            {isLoading && (
              <View style={{ padding: 12, alignSelf: 'flex-start' }}>
                <Text style={{ color: '#6B7280' }}>AI is thinking...</Text>
              </View>
            )}
          </ScrollView>
        </>
      ) : currentTab === 'documents' ? (
        /* Documents Tab */
        <ScrollView style={{ flex: 1, padding: 16 }}>
          {/* Document Stats */}
          <View style={{ backgroundColor: '#F3F4F6', padding: 16, borderRadius: 8, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Knowledge Base</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => setShowDocumentList(!showDocumentList)}
                  style={{
                    backgroundColor: '#3B82F6',
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 6,
                    marginRight: 8
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                    {showDocumentList ? 'HIDE' : 'SHOW'} LIST
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={toggleDeleteMode}
                  style={{
                    backgroundColor: showDeleteMode ? '#DC2626' : '#EF4444',
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 6,
                    pointerEvents: isLoading ? 'none' : 'auto',
                    opacity: isLoading ? 0.5 : 1
                  }}
                  disabled={isLoading}
                >
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                    {showDeleteMode ? 'CANCEL DELETE' : 'DELETE'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={{ color: '#6B7280' }}>Total Documents: {documentStats.count}</Text>
            
            {showDocumentList && documentStats.documents.length > 0 && (
              <View style={{ marginTop: 12, backgroundColor: 'white', borderRadius: 6, padding: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#374151' }}>
                    Document List ({startIndex + 1}-{Math.min(endIndex, documentStats.documents.length)} of {documentStats.documents.length}):
                  </Text>
                  {showDeleteMode && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TouchableOpacity
                        onPress={selectAllDocuments}
                        style={{
                          backgroundColor: '#6B7280',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 4,
                          marginRight: 8
                        }}
                      >
                        <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
                          SELECT ALL
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={deleteSelectedDocuments}
                        style={{
                          backgroundColor: selectedDocuments.size > 0 ? '#DC2626' : '#9CA3AF',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 4,
                          marginRight: 8,
                          pointerEvents: selectedDocuments.size > 0 ? 'auto' : 'none'
                        }}
                        disabled={selectedDocuments.size === 0}
                      >
                        <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
                          DELETE SELECTED ({selectedDocuments.size})
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={clearAllDocuments}
                        style={{
                          backgroundColor: '#EF4444',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 4
                        }}
                      >
                        <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
                          DELETE ALL
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                {paginatedDocuments.map((doc, index) => {
                  const documentId = doc.source; // Use source as the unique identifier for deletion
                  const isSelected = selectedDocuments.has(documentId);
                  
                  return (
                    <View key={documentId} style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center',
                      paddingVertical: 8,
                      borderBottomWidth: index < paginatedDocuments.length - 1 ? 1 : 0,
                      borderBottomColor: '#E5E7EB',
                      backgroundColor: isSelected ? '#FEF2F2' : 'transparent'
                    }}>
                      {showDeleteMode && (
                        <TouchableOpacity
                          onPress={() => toggleDocumentSelection(documentId)}
                          style={{
                            width: 20,
                            height: 20,
                            borderWidth: 2,
                            borderColor: isSelected ? '#DC2626' : '#9CA3AF',
                            borderRadius: 4,
                            backgroundColor: isSelected ? '#DC2626' : 'transparent',
                            marginRight: 12,
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {isSelected && (
                            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
                          )}
                        </TouchableOpacity>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151' }}>
                          {doc.type === 'upload' ? '📄' : '🌐'} {doc.source}
                        </Text>
                        <Text style={{ fontSize: 10, color: '#6B7280' }}>
                          {new Date(doc.uploadDate).toLocaleDateString()} • {doc.chunksCount} chunks
                        </Text>
                      </View>
                    </View>
                  );
                })}
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <View style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginTop: 12, 
                    paddingTop: 12, 
                    borderTopWidth: 1, 
                    borderTopColor: '#E5E7EB' 
                  }}>
                    <TouchableOpacity
                      onPress={goToPreviousPage}
                      style={{
                        backgroundColor: currentPage > 1 ? '#3B82F6' : '#D1D5DB',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 6,
                        pointerEvents: currentPage > 1 ? 'auto' : 'none'
                      }}
                      disabled={currentPage <= 1}
                    >
                      <Text style={{ 
                        color: currentPage > 1 ? 'white' : '#6B7280', 
                        fontSize: 12, 
                        fontWeight: '600' 
                      }}>
                        ← Previous
                      </Text>
                    </TouchableOpacity>
                    
                    <Text style={{ fontSize: 12, color: '#6B7280' }}>
                      Page {currentPage} of {totalPages}
                    </Text>
                    
                    <TouchableOpacity
                      onPress={goToNextPage}
                      style={{
                        backgroundColor: currentPage < totalPages ? '#3B82F6' : '#D1D5DB',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 6,
                        pointerEvents: currentPage < totalPages ? 'auto' : 'none'
                      }}
                      disabled={currentPage >= totalPages}
                    >
                      <Text style={{ 
                        color: currentPage < totalPages ? 'white' : '#6B7280', 
                        fontSize: 12, 
                        fontWeight: '600' 
                      }}>
                        Next →
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* File Upload */}
          <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>Upload Documents</Text>
            
            <input
              id="fileInput"
              type="file"
              accept=".pdf,.txt"
              multiple
              onChange={handleFileSelect}
              style={{
                marginBottom: 12,
                padding: 8,
                border: '1px solid #D1D5DB',
                borderRadius: 4,
                width: '100%'
              }}
              disabled={isLoading}
            />
            
            {/* File List */}
            {selectedFiles.length > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#374151' }}>
                  Selected files ({selectedFiles.length}):
                </Text>
                {selectedFiles.map((file, index) => (
                  <View key={index} style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    backgroundColor: '#F9FAFB', 
                    padding: 8, 
                    borderRadius: 6, 
                    marginBottom: 4 
                  }}>
                    <Text style={{ flex: 1, fontSize: 12, color: '#374151' }}>
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeFile(index)}
                      style={{
                        backgroundColor: '#EF4444',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 4,
                        marginLeft: 8
                      }}
                    >
                      <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            
            <TouchableOpacity
              style={{
                backgroundColor: selectedFiles.length > 0 && !isLoading ? '#8B5CF6' : '#D1D5DB',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
                pointerEvents: (selectedFiles.length === 0 || isLoading) ? 'none' : 'auto'
              }}
              onPress={uploadFiles}
              disabled={selectedFiles.length === 0 || isLoading}
            >
              <Text style={{ color: selectedFiles.length > 0 && !isLoading ? 'white' : 'gray', fontWeight: 'bold' }}>
                {isLoading ? 'Uploading...' : `Upload & Process ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Website Scraping */}
          <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>Scrape Websites</Text>
            
            {/* URL Input */}
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <TextInput
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  marginRight: 8,
                }}
                placeholder="Enter website URL..."
                value={urlInput}
                onChangeText={setUrlInput}
                editable={!isLoading}
                onSubmitEditing={addUrl}
              />
              <TouchableOpacity
                onPress={addUrl}
                style={{
                  backgroundColor: urlInput.trim() && !isLoading ? '#3B82F6' : '#D1D5DB',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  pointerEvents: (!urlInput.trim() || isLoading) ? 'none' : 'auto'
                }}
                disabled={!urlInput.trim() || isLoading}
              >
                <Text style={{ color: urlInput.trim() && !isLoading ? 'white' : 'gray', fontWeight: 'bold' }}>
                  ADD
                </Text>
              </TouchableOpacity>
            </View>

            {/* URL List */}
            {websiteUrls.length > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#374151' }}>
                  URLs to scrape ({websiteUrls.length}):
                </Text>
                {websiteUrls.map((url, index) => (
                  <View key={index} style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    backgroundColor: '#F9FAFB', 
                    padding: 8, 
                    borderRadius: 6, 
                    marginBottom: 4 
                  }}>
                    <Text style={{ flex: 1, fontSize: 12, color: '#374151' }}>{url}</Text>
                    <TouchableOpacity
                      onPress={() => removeUrl(index)}
                      style={{
                        backgroundColor: '#EF4444',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 4,
                        marginLeft: 8
                      }}
                    >
                      <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={{
                backgroundColor: websiteUrls.length > 0 && !isLoading ? '#10B981' : '#D1D5DB',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
                pointerEvents: (websiteUrls.length === 0 || isLoading) ? 'none' : 'auto'
              }}
              onPress={scrapeWebsites}
              disabled={websiteUrls.length === 0 || isLoading}
            >
              <Text style={{ color: websiteUrls.length > 0 && !isLoading ? 'white' : 'gray', fontWeight: 'bold' }}>
                {isLoading ? 'Processing...' : `Scrape ${websiteUrls.length} Website${websiteUrls.length !== 1 ? 's' : ''}`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* RAG Configuration */}
          <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => setShowRagConfig(!showRagConfig)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#374151' }}>
                ⚙️ RAG Configuration
              </Text>
              <Text style={{ fontSize: 16, color: '#6B7280' }}>
                {showRagConfig ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>
            
            {showRagConfig && (
              <View style={{ marginTop: 16 }}>
                {/* Chunk Size */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#374151' }}>
                    Chunk Size: {ragConfig.chunkSize}
                  </Text>
                  <input
                    type="range"
                    min="500"
                    max="3000"
                    step="100"
                    value={ragConfig.chunkSize}
                    onChange={(e) => setRagConfig({...ragConfig, chunkSize: parseInt(e.target.value)})}
                    style={{ width: '100%' }}
                  />
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                    Controls how large each text chunk is (500-3000 characters)
                  </Text>
                </View>

                {/* Chunk Overlap */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#374151' }}>
                    Chunk Overlap: {ragConfig.chunkOverlap}
                  </Text>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="25"
                    value={ragConfig.chunkOverlap}
                    onChange={(e) => setRagConfig({...ragConfig, chunkOverlap: parseInt(e.target.value)})}
                    style={{ width: '100%' }}
                  />
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                    Overlap between chunks to preserve context (50-500 characters)
                  </Text>
                </View>

                {/* Similarity Threshold */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#374151' }}>
                    Similarity Threshold: {ragConfig.similarityThreshold.toFixed(2)}
                  </Text>
                  <input
                    type="range"
                    min="0.5"
                    max="0.9"
                    step="0.05"
                    value={ragConfig.similarityThreshold}
                    onChange={(e) => setRagConfig({...ragConfig, similarityThreshold: parseFloat(e.target.value)})}
                    style={{ width: '100%' }}
                  />
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                    Minimum similarity score for relevant documents (0.5-0.9)
                  </Text>
                </View>

                {/* RAG Search Limit */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#374151' }}>
                    Search Results Limit: {ragConfig.ragSearchLimit}
                  </Text>
                  <input
                    type="range"
                    min="3"
                    max="20"
                    step="1"
                    value={ragConfig.ragSearchLimit}
                    onChange={(e) => setRagConfig({...ragConfig, ragSearchLimit: parseInt(e.target.value)})}
                    style={{ width: '100%' }}
                  />
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                    Maximum number of documents to retrieve (3-20)
                  </Text>
                </View>

                {/* Use Semantic Search */}
                <View style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={ragConfig.useSemanticSearch}
                      onChange={(e) => setRagConfig({...ragConfig, useSemanticSearch: e.target.checked})}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#374151' }}>
                      Use Semantic Search
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                    Enable advanced semantic ranking for better relevance
                  </Text>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  style={{
                    backgroundColor: ragConfigLoading ? '#D1D5DB' : '#10B981',
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                    pointerEvents: ragConfigLoading ? 'none' : 'auto'
                  }}
                  onPress={saveRagConfig}
                  disabled={ragConfigLoading}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>
                    {ragConfigLoading ? 'Saving...' : 'Save Configuration'}
                  </Text>
                </TouchableOpacity>

                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 8, textAlign: 'center' }}>
                  Changes take effect immediately for new queries
                </Text>
              </View>
            )}
          </View>

        </ScrollView>
      ) : currentTab === 'invites' && isAdmin ? (
        /* Invites Tab */
        <ScrollView style={{ flex: 1, padding: 16 }}>
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 }}>
              Invite New Admins
            </Text>
            
            {/* Create Invite Form */}
            <View style={{ 
              backgroundColor: '#F9FAFB', 
              padding: 16, 
              borderRadius: 8, 
              borderWidth: 1, 
              borderColor: '#E5E7EB',
              marginBottom: 16
            }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
                Send Invite
              </Text>
              
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 6,
                  padding: 12,
                  fontSize: 16,
                  backgroundColor: 'white',
                  marginBottom: 12
                }}
                placeholder="Enter email address"
                value={inviteEmail}
                onChangeText={setInviteEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <TouchableOpacity
                style={{
                  backgroundColor: isCreatingInvite ? '#D1D5DB' : '#3B82F6',
                  padding: 12,
                  borderRadius: 6,
                  alignItems: 'center',
                  pointerEvents: isCreatingInvite ? 'none' : 'auto'
                }}
                onPress={createInvite}
                disabled={isCreatingInvite}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>
                  {isCreatingInvite ? 'Creating Invite...' : 'Create Invite'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Instructions */}
            <View style={{ 
              backgroundColor: '#EFF6FF', 
              padding: 16, 
              borderRadius: 8, 
              borderLeftWidth: 4, 
              borderLeftColor: '#3B82F6'
            }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1E40AF', marginBottom: 8 }}>
                How it works:
              </Text>
              <Text style={{ fontSize: 14, color: '#1E40AF', lineHeight: 20 }}>
                1. Enter the email address of the person you want to invite{'\n'}
                2. Click "Create Invite" to generate an invite code{'\n'}
                3. Share the invite code with the person{'\n'}
                4. They can use the "Join Organization" tab to enter the code
              </Text>
            </View>
          </View>
        </ScrollView>
      ) : null}

      {/* Input - Only show on chat tab */}
      {currentTab === 'chat' && (
        <>
          {/* Chat Controls */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            paddingHorizontal: 16, 
            paddingVertical: 8, 
            backgroundColor: '#F9FAFB',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB'
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>
                {strictMode ? '🔒 Strict Mode: Only knowledge base' : '🌐 General Mode: AI + knowledge base'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={clearChat}
                style={{
                  backgroundColor: messages.length === 0 ? '#D1D5DB' : '#EF4444',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  marginRight: 8,
                  opacity: messages.length === 0 ? 0.5 : 1,
                  pointerEvents: messages.length === 0 ? 'none' : 'auto'
                }}
                disabled={messages.length === 0}
              >
                <Text style={{ 
                  color: messages.length === 0 ? '#6B7280' : 'white', 
                  fontSize: 12, 
                  fontWeight: '600' 
                }}>
                  CLEAR CHAT
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setStrictMode(!strictMode)}
                style={{
                  backgroundColor: strictMode ? '#10B981' : '#6B7280',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 4
                }}
              >
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                  {strictMode ? 'STRICT' : 'GENERAL'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            padding: 16, 
            borderTopWidth: 1, 
            borderTopColor: '#E5E7EB' 
          }}>
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: '#D1D5DB',
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 8,
              marginRight: 8,
            }}
            placeholder="Type your message..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={{
              padding: 12,
              borderRadius: 8,
              backgroundColor: input.trim() && !isLoading ? '#3B82F6' : '#D1D5DB',
              pointerEvents: (!input.trim() || isLoading) ? 'none' : 'auto'
            }}
            onPress={sendMessage}
            disabled={!input.trim() || isLoading}
          >
            <Text style={{ color: input.trim() && !isLoading ? 'white' : 'gray', fontWeight: 'bold' }}>
              Send
            </Text>
          </TouchableOpacity>
        </View>
        </>
      )}
      
      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
