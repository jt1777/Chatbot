import { useState, useEffect } from 'react';
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
    }
  }, [currentTab, documentManagement, organization]);

  // Load client organization info when switching to client profile
  useEffect(() => {
    if (clientCurrentTab === 'profile') {
      organization.loadClientOrganizationInfo();
    }
  }, [clientCurrentTab, organization]);

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
  };
};
