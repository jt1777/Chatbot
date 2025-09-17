import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export const useOrganization = (token: string | null) => {
  // Invite management state
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [isCreatingInvite, setIsCreatingInvite] = useState<boolean>(false);
  const [activeInvites, setActiveInvites] = useState<any[]>([]);

  // Organization description state
  const [orgDescription, setOrgDescription] = useState<string>('');
  const [isUpdatingDescription, setIsUpdatingDescription] = useState<boolean>(false);
  const [clientOrgInfo, setClientOrgInfo] = useState<any>(null);

  const createInvite = useCallback(async () => {
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
  }, [inviteEmail, token]);

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
          'Authorization': `Bearer ${token}`
        }
      });
      setOrgDescription(response.data.description || '');
    } catch (error) {
      console.error('Error loading organization info:', error);
    }
  }, [token]);

  const updateOrganizationDescription = useCallback(async () => {
    setIsUpdatingDescription(true);
    try {
      await axios.put(`${API_BASE_URL}/api/org/description`, {
        description: orgDescription
      }, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}`
        }
      });
      await loadOrganizationInfo();
    } catch (error) {
      console.error('Error updating organization description:', error);
    } finally {
      setIsUpdatingDescription(false);
    }
  }, [orgDescription, token, loadOrganizationInfo]);

  const loadClientOrganizationInfo = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/org/info`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}`
        }
      });
      setClientOrgInfo(response.data);
    } catch (error) {
      console.error('Error loading client organization info:', error);
    }
  }, [token]);

  return {
    // State
    inviteEmail,
    isCreatingInvite,
    activeInvites,
    orgDescription,
    isUpdatingDescription,
    clientOrgInfo,

    // Actions
    setInviteEmail,
    createInvite,
    loadActiveInvites,
    setOrgDescription,
    updateOrganizationDescription,
    loadOrganizationInfo,
    loadClientOrganizationInfo,
  };
};
