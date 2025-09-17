import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';

interface Document {
  source: string;
  type: 'upload' | 'web';
  uploadDate: string;
  chunksCount: number;
}

interface DocumentStats {
  count: number;
  documents: Document[];
}

interface RAGConfig {
  chunkSize: number;
  chunkOverlap: number;
  similarityThreshold: number;
  ragSearchLimit: number;
  useSemanticSearch: boolean;
}

interface DocumentManagementProps {
  // Document stats and management
  documentStats: DocumentStats;
  showDocumentList: boolean;
  showDeleteMode: boolean;
  selectedDocuments: Set<string>;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  paginatedDocuments: Document[];
  
  // File upload
  selectedFiles: File[];
  
  // Website scraping
  urlInput: string;
  websiteUrls: string[];
  
  // RAG configuration
  ragConfig: RAGConfig;
  showRagConfig: boolean;
  ragConfigLoading: boolean;
  
  // Loading state
  isLoading: boolean;
  
  // Event handlers
  onToggleDocumentList: () => void;
  onToggleDeleteMode: () => void;
  onSelectAllDocuments: () => void;
  onDeleteSelectedDocuments: () => void;
  onClearAllDocuments: () => void;
  onToggleDocumentSelection: (documentId: string) => void;
  onGoToPreviousPage: () => void;
  onGoToNextPage: () => void;
  onFileSelect: (event: any) => void;
  onRemoveFile: (index: number) => void;
  onUploadFiles: () => void;
  onUrlInputChange: (text: string) => void;
  onAddUrl: () => void;
  onRemoveUrl: (index: number) => void;
  onScrapeWebsites: () => void;
  onRagConfigChange: (config: RAGConfig) => void;
  onToggleRagConfig: () => void;
  onSaveRagConfig: () => void;
}

export const DocumentManagement: React.FC<DocumentManagementProps> = ({
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
  onToggleDocumentList,
  onToggleDeleteMode,
  onSelectAllDocuments,
  onDeleteSelectedDocuments,
  onClearAllDocuments,
  onToggleDocumentSelection,
  onGoToPreviousPage,
  onGoToNextPage,
  onFileSelect,
  onRemoveFile,
  onUploadFiles,
  onUrlInputChange,
  onAddUrl,
  onRemoveUrl,
  onScrapeWebsites,
  onRagConfigChange,
  onToggleRagConfig,
  onSaveRagConfig,
}) => {
  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      {/* Document Stats */}
      <View style={{ backgroundColor: '#F3F4F6', padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Knowledge Base</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={onToggleDocumentList}
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
              onPress={onToggleDeleteMode}
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
                    onPress={onSelectAllDocuments}
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
                    onPress={onDeleteSelectedDocuments}
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
                    onPress={onClearAllDocuments}
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
              const documentId = doc.source;
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
                      onPress={() => onToggleDocumentSelection(documentId)}
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
                  onPress={onGoToPreviousPage}
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
                  onPress={onGoToNextPage}
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
          onChange={onFileSelect}
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
                  onPress={() => onRemoveFile(index)}
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
          onPress={onUploadFiles}
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
            onChangeText={onUrlInputChange}
            editable={!isLoading}
            onSubmitEditing={onAddUrl}
          />
          <TouchableOpacity
            onPress={onAddUrl}
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
                  onPress={() => onRemoveUrl(index)}
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
          onPress={onScrapeWebsites}
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
          onPress={onToggleRagConfig}
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
                onChange={(e) => onRagConfigChange({...ragConfig, chunkSize: parseInt(e.target.value)})}
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
                onChange={(e) => onRagConfigChange({...ragConfig, chunkOverlap: parseInt(e.target.value)})}
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
                onChange={(e) => onRagConfigChange({...ragConfig, similarityThreshold: parseFloat(e.target.value)})}
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
                onChange={(e) => onRagConfigChange({...ragConfig, ragSearchLimit: parseInt(e.target.value)})}
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
                  onChange={(e) => onRagConfigChange({...ragConfig, useSemanticSearch: e.target.checked})}
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
              onPress={onSaveRagConfig}
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
  );
};
