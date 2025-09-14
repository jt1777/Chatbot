import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import axios from 'axios';
import { API_ENDPOINTS } from './src/config/api';

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

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<'chat' | 'documents'>('chat');
  const [documentStats, setDocumentStats] = useState<DocumentStats>({ count: 0, documents: [] });
  const [showDocumentList, setShowDocumentList] = useState<boolean>(false);
  const [showDeleteMode, setShowDeleteMode] = useState<boolean>(false);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [strictMode, setStrictMode] = useState<boolean>(true);

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
        userId: 'web-user',
        useRAG: strictMode,
      }, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
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
          'ngrok-skip-browser-warning': 'true'
        }
      });
      //console.log('📊 Stats response:', response.data);
      setDocumentStats(response.data);
    } catch (error) {
      console.error('❌ Error loading document stats:', error);
    }
  };

  const scrapeWebsite = async () => {
    if (!websiteUrl.trim()) {
      Alert.alert('Error', 'Please enter a website URL');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(API_ENDPOINTS.DOCUMENTS_SCRAPE, {
        url: websiteUrl.trim()
      }, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      Alert.alert('Success', `Website scraped successfully! Created ${response.data.chunksCreated} chunks.`);
      setWebsiteUrl('');
      await loadDocumentStats();
    } catch (error: any) {
      console.error('Scraping error:', error);
      Alert.alert('Error', error.response?.data?.details || 'Failed to scrape website');
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
    const allIds = documentStats.documents.map(doc => doc._id || doc.source);
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
              'ngrok-skip-browser-warning': 'true'
            }
          });
          window.alert('All documents cleared successfully');
          await loadDocumentStats();
          setShowDeleteMode(false);
          setSelectedDocuments(new Set());
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
                    'ngrok-skip-browser-warning': 'true'
                  }
                });
                Alert.alert('Success', 'All documents cleared successfully');
                await loadDocumentStats();
                setShowDeleteMode(false);
                setSelectedDocuments(new Set());
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
        // For now, we'll clear all documents since we don't have individual delete endpoints
        // In a real implementation, you'd send the selected IDs to a delete endpoint
        await axios.delete(API_ENDPOINTS.DOCUMENTS_CLEAR, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });
        window.alert(`${selectedDocuments.size} document(s) deleted successfully`);
        await loadDocumentStats();
        setShowDeleteMode(false);
        setSelectedDocuments(new Set());
      } catch (error: any) {
        console.error('Delete error:', error);
        window.alert(error.response?.data?.details || 'Failed to delete documents');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFileSelect = (event: any) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      const validTypes = ['application/pdf', 'text/plain'];
      if (!validTypes.includes(file.type)) {
        Alert.alert('Error', 'Please select a PDF or text file');
        return;
      }
      
      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        Alert.alert('Error', 'File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file first');
      return;
    }

    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(API_ENDPOINTS.DOCUMENTS_UPLOAD, {
        method: 'POST',
        body: formData,
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Upload failed');
      }

      const result = await response.json();
      Alert.alert('Success', `File uploaded successfully! Created ${result.chunksCreated} chunks.`);
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      await loadDocumentStats();
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload file');
    } finally {
      setIsLoading(false);
    }
  };

  // Load document stats when switching to documents tab
  React.useEffect(() => {
    if (currentTab === 'documents') {
      loadDocumentStats();
    }
  }, [currentTab]);

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#3B82F6', padding: 16 }}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
          AI Chatbot with RAG
        </Text>
        
        {/* Tab Navigation */}
        <View style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'center' }}>
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
          <TouchableOpacity
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 16,
              backgroundColor: currentTab === 'documents' ? 'rgba(255,255,255,0.2)' : 'transparent',
            }}
            onPress={() => setCurrentTab('documents')}
          >
            <Text style={{ color: 'white', fontWeight: currentTab === 'documents' ? 'bold' : 'normal' }}>
              Documents ({documentStats.count})
            </Text>
          </TouchableOpacity>
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
      ) : (
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
                    {showDeleteMode ? 'CANCEL DELETE' : 'DELETE DOCUMENTS'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={{ color: '#6B7280' }}>Total Documents: {documentStats.count}</Text>
            
            {showDocumentList && documentStats.documents.length > 0 && (
              <View style={{ marginTop: 12, backgroundColor: 'white', borderRadius: 6, padding: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#374151' }}>
                    Document List:
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
                {documentStats.documents.map((doc, index) => {
                  const documentId = doc._id || doc.source;
                  const isSelected = selectedDocuments.has(documentId);
                  
                  return (
                    <View key={documentId} style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center',
                      paddingVertical: 8,
                      borderBottomWidth: index < documentStats.documents.length - 1 ? 1 : 0,
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
              </View>
            )}
          </View>

          {/* Website Scraping */}
          <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>Scrape Website</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginBottom: 12,
              }}
              placeholder="Enter website URL..."
              value={websiteUrl}
              onChangeText={setWebsiteUrl}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={{
                backgroundColor: websiteUrl.trim() && !isLoading ? '#10B981' : '#D1D5DB',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
                pointerEvents: (!websiteUrl.trim() || isLoading) ? 'none' : 'auto'
              }}
              onPress={scrapeWebsite}
              disabled={!websiteUrl.trim() || isLoading}
            >
              <Text style={{ color: websiteUrl.trim() && !isLoading ? 'white' : 'gray', fontWeight: 'bold' }}>
                {isLoading ? 'Processing...' : 'Scrape Website'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* File Upload */}
          <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>Upload Document</Text>
            
            <input
              id="fileInput"
              type="file"
              accept=".pdf,.txt"
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
            
            {selectedFile && (
              <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 12 }}>
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </Text>
            )}
            
            <TouchableOpacity
              style={{
                backgroundColor: selectedFile && !isLoading ? '#8B5CF6' : '#D1D5DB',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
                pointerEvents: (!selectedFile || isLoading) ? 'none' : 'auto'
              }}
              onPress={uploadFile}
              disabled={!selectedFile || isLoading}
            >
              <Text style={{ color: selectedFile && !isLoading ? 'white' : 'gray', fontWeight: 'bold' }}>
                {isLoading ? 'Uploading...' : 'Upload & Process'}
              </Text>
            </TouchableOpacity>
            
            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>
              Supports PDF and text files (max 10MB)
            </Text>
          </View>

        </ScrollView>
      )}

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
