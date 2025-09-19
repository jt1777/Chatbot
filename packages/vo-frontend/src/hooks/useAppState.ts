import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDocumentManagement } from './useDocumentManagement';
import { useChat } from './useChat';
import { useOrganization } from './useOrganization';

export const useAppState = (token: string | null, userId: string | undefined, isAdmin: boolean, isClient: boolean, currentRole?: string) => {
  // Tab management
  const [currentTab, setCurrentTab] = useState<'search' | 'chat' | 'documents' | 'organizations'>('search');
  const [clientCurrentTab, setClientCurrentTab] = useState<'search' | 'chat' | 'organizations'>('search');

  // Custom hooks
  const documentManagement = useDocumentManagement(token);
  const chat = useChat(token, userId);
  const organization = useOrganization(token);

  // Load data when switching tabs
  useEffect(() => {
    if (currentTab === 'documents' && currentRole !== 'guest') {
      documentManagement.loadDocumentStats();
      documentManagement.loadRagConfig();
    } else if (currentTab === 'organizations') {
      organization.loadOrganizationInfo();
      organization.loadUserOrganizations();
      organization.loadActiveInvites(); // Load invites in organizations tab now
    }
  }, [currentTab, currentRole]);

  // Load client organization info when switching to client profile
  useEffect(() => {
    //console.log('useAppState useEffect - clientCurrentTab:', clientCurrentTab, 'isClient:', isClient, 'currentRole:', currentRole);
    if (clientCurrentTab === 'organizations' && isClient) {
      //console.log('Loading client organization info...');
      organization.loadClientOrganizationInfo();
    } else {
      //console.log('Skipping client organization info load - not on organizations tab or not a client');
    }
  }, [clientCurrentTab, isClient, currentRole]);

  // Use refs to store the reset functions to avoid dependency issues
  const resetFunctionsRef = useRef({
    resetDocumentData: documentManagement.resetDocumentData,
    resetChatData: chat.resetChatData,
    resetOrganizationData: organization.resetOrganizationData,
  });

  // Update refs when functions change
  resetFunctionsRef.current = {
    resetDocumentData: documentManagement.resetDocumentData,
    resetChatData: chat.resetChatData,
    resetOrganizationData: organization.resetOrganizationData,
  };

  const resetAllData = useCallback(() => {
    resetFunctionsRef.current.resetDocumentData();
    resetFunctionsRef.current.resetChatData();
    resetFunctionsRef.current.resetOrganizationData();
  }, []);


  // Force re-render when documentManagement.isLoading changes
  const [isLoading, setIsLoading] = React.useState(documentManagement.isLoading);
  React.useEffect(() => {
    setIsLoading(documentManagement.isLoading);
  }, [documentManagement.isLoading]);

  return {
    // Tab state
    currentTab,
    clientCurrentTab,
    setCurrentTab,
    setClientCurrentTab,

    // Document management - manually include all properties except isLoading
    documentStats: documentManagement.documentStats,
    showDocumentList: documentManagement.showDocumentList,
    showDeleteMode: documentManagement.showDeleteMode,
    selectedDocuments: documentManagement.selectedDocuments,
    currentPage: documentManagement.currentPage,
    totalPages: documentManagement.totalPages,
    startIndex: documentManagement.startIndex,
    endIndex: documentManagement.endIndex,
    paginatedDocuments: documentManagement.paginatedDocuments,
    selectedFiles: documentManagement.selectedFiles,
    urlInput: documentManagement.urlInput,
    websiteUrls: documentManagement.websiteUrls,
    ragConfig: documentManagement.ragConfig,
    showRagConfig: documentManagement.showRagConfig,
    ragConfigLoading: documentManagement.ragConfigLoading,
    setShowDocumentList: documentManagement.setShowDocumentList,
    toggleDeleteMode: documentManagement.toggleDeleteMode,
    selectAllDocuments: documentManagement.selectAllDocuments,
    toggleDocumentSelection: documentManagement.toggleDocumentSelection,
    deleteSelectedDocuments: documentManagement.deleteSelectedDocuments,
    clearAllDocuments: documentManagement.clearAllDocuments,
    goToPage: documentManagement.goToPage,
    goToNextPage: documentManagement.goToNextPage,
    goToPreviousPage: documentManagement.goToPreviousPage,
    handleFileSelect: documentManagement.handleFileSelect,
    removeFile: documentManagement.removeFile,
    uploadFiles: documentManagement.uploadFiles,
    setUrlInput: documentManagement.setUrlInput,
    addUrl: documentManagement.addUrl,
    removeUrl: documentManagement.removeUrl,
    scrapeWebsites: documentManagement.scrapeWebsites,
    setRagConfig: documentManagement.setRagConfig,
    setShowRagConfig: documentManagement.setShowRagConfig,
    saveRagConfig: documentManagement.saveRagConfig,
    loadDocumentStats: documentManagement.loadDocumentStats,
    loadRagConfig: documentManagement.loadRagConfig,
    resetDocumentData: documentManagement.resetDocumentData,

    // Chat
    ...chat,

    // Organization
    ...organization,

    // Reset function
    resetAllData,

    // Override isLoading after all spreads to ensure our tracked value is used
    isLoading,
  };
};
