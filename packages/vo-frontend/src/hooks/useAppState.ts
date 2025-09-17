import { useState, useEffect, useCallback, useRef } from 'react';
import { useDocumentManagement } from './useDocumentManagement';
import { useChat } from './useChat';
import { useOrganization } from './useOrganization';

export const useAppState = (token: string | null, userId: string | undefined, isAdmin: boolean, isClient: boolean) => {
  // Tab management
  const [currentTab, setCurrentTab] = useState<'chat' | 'documents' | 'invites' | 'profile'>('chat');
  const [clientCurrentTab, setClientCurrentTab] = useState<'chat' | 'profile'>('chat');

  // Custom hooks
  const documentManagement = useDocumentManagement(token);
  const chat = useChat(token, userId);
  const organization = useOrganization(token);

  // Load data when switching tabs
  useEffect(() => {
    if (currentTab === 'documents') {
      documentManagement.loadDocumentStats();
      documentManagement.loadRagConfig();
    } else if (currentTab === 'invites') {
      organization.loadActiveInvites();
    } else if (currentTab === 'profile') {
      organization.loadOrganizationInfo();
      organization.loadUserOrganizations();
    }
  }, [currentTab]);

  // Load client organization info when switching to client profile
  useEffect(() => {
    if (clientCurrentTab === 'profile') {
      organization.loadClientOrganizationInfo();
    }
  }, [clientCurrentTab]);

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

  return {
    // Tab state
    currentTab,
    clientCurrentTab,
    setCurrentTab,
    setClientCurrentTab,

    // Document management
    ...documentManagement,

    // Chat
    ...chat,

    // Organization
    ...organization,

    // Reset function
    resetAllData,
  };
};
