import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

export const useOrganization = (token: string | null) => {
  const { updateUser, token: authToken, user } = useAuth();
  
  // Invite management state
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [isCreatingInvite, setIsCreatingInvite] = useState<boolean>(false);
  const [activeInvites, setActiveInvites] = useState<any[]>([]);

  // Organization description state
  const [orgDescription, setOrgDescription] = useState<string>('');
  const [isUpdatingDescription, setIsUpdatingDescription] = useState<boolean>(false);
  const [clientOrgInfo, setClientOrgInfo] = useState<any>(null);

  // Organization switching state
  const [userOrganizations, setUserOrganizations] = useState<any[]>([]);
  const [isSwitchingOrg, setIsSwitchingOrg] = useState<boolean>(false);

  const createInvite = useCallback(async () => {
    if (!inviteEmail.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter an email address',
        visibilityTime: 3000,
      });
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
          'Authorization': `Bearer ${authToken}` 
        }
      });

      // Show success toast with invite code
      Toast.show({
        type: 'success',
        text1: 'Invite Created!',
        text2: `Invite code: ${response.data.inviteCode}`,
        visibilityTime: 6000,
      });
      
      setInviteEmail('');
      loadActiveInvites();
    } catch (error: any) {
      console.error('Error creating invite:', error);
      
      // Show error toast
      Toast.show({
        type: 'error',
        text1: 'Invite Failed',
        text2: error.response?.data?.error || 'Failed to create invite',
        visibilityTime: 4000,
      });
    } finally {
      setIsCreatingInvite(false);
    }
  }, [inviteEmail, authToken]);

  const loadActiveInvites = useCallback(async () => {
    try {
      // This would need to be implemented in the backend
      // For now, we'll just show a placeholder
      setActiveInvites([]);
    } catch (error) {
      console.error('Error loading invites:', error);
    }
  }, []);

  const loadOrganizationInfo = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/org/info`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${authToken}`
        }
      });
      setOrgDescription(response.data.description || '');
    } catch (error) {
      console.error('Error loading organization info:', error);
    }
  }, [authToken]);

  // Refresh organization description when user's current organization changes
  useEffect(() => {
    if (user?.orgId && authToken) {
      loadOrganizationInfo();
    }
  }, [user?.orgId, authToken, loadOrganizationInfo]);

  const updateOrganizationDescription = useCallback(async () => {
    setIsUpdatingDescription(true);
    try {
      await axios.put(`${API_BASE_URL}/api/org/description`, {
        orgDescription: orgDescription
      }, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${authToken}`
        }
      });
      await loadOrganizationInfo();
    } catch (error) {
      console.error('Error updating organization description:', error);
    } finally {
      setIsUpdatingDescription(false);
    }
  }, [orgDescription, authToken, loadOrganizationInfo]);

  const loadClientOrganizationInfo = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/org/info`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${authToken}`
        }
      });
      setClientOrgInfo(response.data);
    } catch (error) {
      console.error('Error loading client organization info:', error);
    }
  }, [authToken]);

  const loadUserOrganizations = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/user/organizations`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${authToken}`
        }
      });
      setUserOrganizations(response.data);
    } catch (error) {
      console.error('❌ Error loading user organizations:', error);
    }
  }, [authToken]);

  const switchOrganization = useCallback(async (orgId: string) => {
    setIsSwitchingOrg(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/user/switch-organization`, {
        orgId
      }, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Update the token and user info
      await updateUser(response.data.token, response.data.user);
      
      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Organization Switched!',
        text2: 'Successfully switched to the selected organization',
        visibilityTime: 3000,
      });
    } catch (error: any) {
      console.error('❌ Error switching organization:', error);
      
      // Show error toast
      Toast.show({
        type: 'error',
        text1: 'Switch Failed',
        text2: error.response?.data?.error || 'Failed to switch organization',
        visibilityTime: 4000,
      });
    } finally {
      setIsSwitchingOrg(false);
    }
  }, [authToken, updateUser]);

  const resetOrganizationData = useCallback(() => {
    setInviteEmail('');
    setIsCreatingInvite(false);
    setActiveInvites([]);
    setOrgDescription('');
    setIsUpdatingDescription(false);
    setClientOrgInfo(null);
    setUserOrganizations([]);
    setIsSwitchingOrg(false);
  }, []);

  return {
    // State
    inviteEmail,
    isCreatingInvite,
    activeInvites,
    orgDescription,
    isUpdatingDescription,
    clientOrgInfo,
    userOrganizations,
    isSwitchingOrg,

    // Actions
    setInviteEmail,
    createInvite,
    loadActiveInvites,
    setOrgDescription,
    updateOrganizationDescription,
    loadOrganizationInfo,
    loadClientOrganizationInfo,
    loadUserOrganizations,
    switchOrganization,
    resetOrganizationData,
  };
};
