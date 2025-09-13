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

interface DocumentStats {
  count: number;
  types: Record<string, number>;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<'chat' | 'documents'>('chat');
  const [documentStats, setDocumentStats] = useState<DocumentStats>({ count: 0, types: {} });
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
      console.log('🔍 Loading document stats from:', API_ENDPOINTS.DOCUMENTS_STATS);
      const response = await axios.get(API_ENDPOINTS.DOCUMENTS_STATS);
      console.log('📊 Stats response:', response.data);
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

  const clearAllDocuments = async () => {
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
              await axios.delete(API_ENDPOINTS.DOCUMENTS_CLEAR);
              Alert.alert('Success', 'All documents cleared successfully');
              await loadDocumentStats();
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
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>Knowledge Base</Text>
            <Text style={{ color: '#6B7280' }}>Total Documents: {documentStats.count}</Text>
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

          {/* Management Actions */}
          <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>Manage Documents</Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#EF4444',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={clearAllDocuments}
              disabled={isLoading}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>
                Clear All Documents
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Input - Only show on chat tab */}
      {currentTab === 'chat' && (
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
            }}
            onPress={sendMessage}
            disabled={!input.trim() || isLoading}
          >
            <Text style={{ color: input.trim() && !isLoading ? 'white' : 'gray', fontWeight: 'bold' }}>
              Send
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      <StatusBar style="auto" />
    </View>
  );
}
