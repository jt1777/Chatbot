import React from 'react';
import { View, Text, StatusBar } from 'react-native';
import Toast from 'react-native-toast-message';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import AuthScreen from './src/components/AuthScreen';
import { Header } from './src/components/Header';
import { ChatInterface } from './src/components/ChatInterface';
import { DocumentManagement } from './src/components/DocumentManagement';
import { AdminTabs } from './src/components/AdminTabs';
import { ClientProfile } from './src/components/ClientProfile';
import { useAppState } from './src/hooks/useAppState';

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
  
  // Use custom hook for all app state management
  const appState = useAppState(token, user?.id, isAdmin, isClient);

  // Destructure the app state for easier access
  const {
    // Tab state
    currentTab,
    clientCurrentTab,
    setCurrentTab,
    setClientCurrentTab,
    
    // Document management
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
    isLoading: documentLoading,
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
    
    // Chat
    messages,
    input,
    isLoading: chatLoading,
    strictMode,
    setInput,
    setStrictMode,
    sendMessage,
    clearChat,
    
    // Organization
    inviteEmail,
    isCreatingInvite,
    activeInvites,
    orgDescription,
    isUpdatingDescription,
    clientOrgInfo,
    userOrganizations,
    isSwitchingOrg,
    setInviteEmail,
    createInvite,
    loadActiveInvites,
    setOrgDescription,
    updateOrganizationDescription,
    loadOrganizationInfo,
    loadClientOrganizationInfo,
    switchOrganization,
    resetAllData,
  } = appState;

  // Reset data when user changes (logout/login)
  React.useEffect(() => {
    if (!user) {
      resetAllData();
    }
  }, [user]);

  // Set default tab for admins to profile
  React.useEffect(() => {
    if (isAdmin && currentTab === 'chat') {
      setCurrentTab('profile');
    }
  }, [isAdmin, currentTab]);

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
      <Header
        user={user}
        isAdmin={isAdmin}
        isClient={isClient}
        currentTab={currentTab}
        clientCurrentTab={clientCurrentTab}
        documentStats={documentStats}
        onLogout={logout}
        onTabChange={setCurrentTab}
        onClientTabChange={setClientCurrentTab}
      />

      {/* Content Area */}
      {(isAdmin ? currentTab === 'chat' : clientCurrentTab === 'chat') ? (
        <ChatInterface
          messages={messages}
          input={input}
          isLoading={chatLoading}
          strictMode={strictMode}
          onInputChange={setInput}
          onSendMessage={sendMessage}
          onClearChat={clearChat}
          onToggleStrictMode={() => setStrictMode(!strictMode)}
        />
      ) : currentTab === 'documents' ? (
        <DocumentManagement
          documentStats={documentStats}
          showDocumentList={showDocumentList}
          showDeleteMode={showDeleteMode}
          selectedDocuments={selectedDocuments}
          currentPage={currentPage}
          totalPages={totalPages}
          startIndex={startIndex}
          endIndex={endIndex}
          paginatedDocuments={paginatedDocuments}
          selectedFiles={selectedFiles}
          urlInput={urlInput}
          websiteUrls={websiteUrls}
          ragConfig={ragConfig}
          showRagConfig={showRagConfig}
          ragConfigLoading={ragConfigLoading}
          isLoading={documentLoading}
          onToggleDocumentList={() => setShowDocumentList(!showDocumentList)}
          onToggleDeleteMode={toggleDeleteMode}
          onSelectAllDocuments={selectAllDocuments}
          onDeleteSelectedDocuments={deleteSelectedDocuments}
          onClearAllDocuments={clearAllDocuments}
          onToggleDocumentSelection={toggleDocumentSelection}
          onGoToPreviousPage={goToPreviousPage}
          onGoToNextPage={goToNextPage}
          onFileSelect={handleFileSelect}
          onRemoveFile={removeFile}
          onUploadFiles={uploadFiles}
          onUrlInputChange={setUrlInput}
          onAddUrl={addUrl}
          onRemoveUrl={removeUrl}
          onScrapeWebsites={scrapeWebsites}
          onRagConfigChange={setRagConfig}
          onToggleRagConfig={() => setShowRagConfig(!showRagConfig)}
          onSaveRagConfig={saveRagConfig}
        />
      ) : (currentTab === 'invites' || currentTab === 'profile') && isAdmin ? (
        <AdminTabs
          currentTab={currentTab}
          user={user}
          inviteEmail={inviteEmail}
          isCreatingInvite={isCreatingInvite}
          orgDescription={orgDescription}
          isUpdatingDescription={isUpdatingDescription}
          userOrganizations={userOrganizations}
          isSwitchingOrg={isSwitchingOrg}
          onInviteEmailChange={setInviteEmail}
          onCreateInvite={createInvite}
          onOrgDescriptionChange={setOrgDescription}
          onUpdateOrganizationDescription={updateOrganizationDescription}
          onSwitchOrganization={switchOrganization}
        />
      ) : (isClient && clientCurrentTab === 'profile') ? (
        <ClientProfile
          user={user}
          clientOrgInfo={clientOrgInfo}
        />
      ) : null}

      <StatusBar barStyle="dark-content" />
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
      <Toast />
    </AuthProvider>
  );
}