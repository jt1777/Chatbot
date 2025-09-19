import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

export const useOrganization = (token: string | null) => {
  const { updateUser, token: authToken, user } = useAuth();
  
  // Invite management state
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'client'>('admin');
  const [isCreatingInvite, setIsCreatingInvite] = useState<boolean>(false);
  const [activeInvites, setActiveInvites] = useState<any[]>([]);

  // Organization description state
  const [orgDescription, setOrgDescription] = useState<string>('');
  const [isUpdatingDescription, setIsUpdatingDescription] = useState<boolean>(false);
  const [clientOrgInfo, setClientOrgInfo] = useState<any>(null);

  // Organization switching state
  const [userOrganizations, setUserOrganizations] = useState<any[]>([]);
  const [isSwitchingOrg, setIsSwitchingOrg] = useState<boolean>(false);

  // Organization visibility state
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState<boolean>(false);

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
        role: inviteRole
      }, {
        headers: { 
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${authToken}` 
        }
      });

      // Show persistent success toast with invite code
      Toast.show({
        type: 'success',
        text1: 'Invite Created!',
        text2: `Invite code: ${response.data.inviteCode}`,
        visibilityTime: 0, // 0 means persistent until manually closed
        autoHide: false, // Don't auto-hide
        props: {
          inviteCode: response.data.inviteCode
        }
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
  }, [inviteEmail, inviteRole, authToken]);

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
    // Skip API call for guests
    if ((user as any)?.currentRole === 'guest' || !authToken) {
      //console.log('Skipping organization info load for guest user');
      return;
    }

    {/*console.log('🔄 Loading organization info for user:', {
      userId: user?.id,
      currentOrgId: user?.currentOrgId,
      orgId: user?.orgId,
      currentRole: user?.currentRole
    });*/}

    try {
      const response = await axios.get(`${API_BASE_URL}/api/org/info`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      {/*console.log('🔄 Organization info response:', {
        name: response.data.name,
        description: response.data.description,
        isPublic: response.data.isPublic
      });*/}
      
      setOrgDescription(response.data.description || '');
      setIsPublic(response.data.isPublic !== undefined ? response.data.isPublic : true);
    } catch (error) {
      console.error('Error loading organization info:', error);
    }
  }, [authToken, user]);

  // Clear organization data when user changes (e.g., after login/logout)
  useEffect(() => {
    if (!user || !authToken) {
      setOrgDescription('');
      setClientOrgInfo(null);
      setIsPublic(true);
    }
  }, [user, authToken]);

  // Clear organization data when switching organizations
  useEffect(() => {
    if (user && authToken) {
      console.log('🔄 Organization switched, clearing description. New currentOrgId:', user?.currentOrgId);
      // Clear description when currentOrgId changes to avoid showing old organization's data
      setOrgDescription('');
    }
  }, [user?.currentOrgId]);

  // Refresh organization description when user's current organization changes
  useEffect(() => {
    if ((user?.currentOrgId || user?.orgId) && authToken) {
      // Clear the description first to avoid showing old organization's description
      setOrgDescription('');
      loadOrganizationInfo();
    }
  }, [user?.currentOrgId, user?.orgId, authToken, loadOrganizationInfo]);


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
      
      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Organization description updated',
        visibilityTime: 3000,
      });
    } catch (error) {
      console.error('Error updating organization description:', error);
      
      // Show error toast
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update organization description',
        visibilityTime: 4000,
      });
    } finally {
      setIsUpdatingDescription(false);
    }
  }, [orgDescription, authToken, loadOrganizationInfo]);

  const loadClientOrganizationInfo = useCallback(async () => {
    //console.log('loadClientOrganizationInfo called with authToken:', !!authToken, 'user role:', (user as any)?.currentRole);
    
    // Skip API call if no auth token
    if (!authToken) {
      console.log('Skipping client organization info load - no auth token');
      setClientOrgInfo(null);
      return;
    }
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/org/info`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${authToken}`
        }
      });
      //console.log('Client organization info loaded successfully:', response.data);
      setClientOrgInfo(response.data);
    } catch (error: any) {
      console.error('Error loading client organization info:', error);
      
      // If user doesn't have an organization yet (403 error), set default values
      if (error.response?.status === 403) {
        console.log('Setting default values for 403 error');
        setClientOrgInfo({
          name: 'No Organization',
          description: 'You can join an organization using the search above.'
        });
      }
    }
  }, [authToken, user]);

  const loadUserOrganizations = useCallback(async () => {
    // Skip API call for guests
    if ((user as any)?.currentRole === 'guest' || !authToken) {
      console.log('Skipping user organizations load for guest user');
      return;
    }

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
  }, [authToken, user]);

  const switchOrganization = useCallback(async (orgId: string) => {
    console.log('🔄 Switching to organization:', orgId);
    setIsSwitchingOrg(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/multi-role/switch-organization`, {
        orgId
      }, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('🔄 Switch organization response:', response.data);

      // Update the token and user info
      await updateUser(response.data.token, response.data.user);
      
      console.log('🔄 User updated after switch:', {
        currentOrgId: response.data.user.currentOrgId,
        currentRole: response.data.user.currentRole,
        orgName: response.data.user.orgName
      });
      
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


  const togglePublicPrivate = useCallback(async () => {
    setIsUpdatingVisibility(true);
    try {
      const newVisibility = !isPublic;
      await axios.put(`${API_BASE_URL}/api/org/visibility`, {
        isPublic: newVisibility
      }, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${authToken}`
        }
      });

      setIsPublic(newVisibility);
      
      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Visibility Updated!',
        text2: `Organization is now ${newVisibility ? 'Public' : 'Private'}`,
        visibilityTime: 3000,
      });
    } catch (error: any) {
      console.error('Error updating organization visibility:', error);
      
      // Show error toast
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.response?.data?.error || 'Failed to update organization visibility',
        visibilityTime: 4000,
      });
    } finally {
      setIsUpdatingVisibility(false);
    }
  }, [isPublic, authToken]);

  return {
    // State
    inviteEmail,
    inviteRole,
    isCreatingInvite,
    activeInvites,
    orgDescription,
    isUpdatingDescription,
    clientOrgInfo,
    userOrganizations,
    isSwitchingOrg,
    isPublic,
    isUpdatingVisibility,

    // Actions
    setInviteEmail,
    setInviteRole,
    createInvite,
    loadActiveInvites,
    setOrgDescription,
    updateOrganizationDescription,
    loadOrganizationInfo,
    loadClientOrganizationInfo,
    loadUserOrganizations,
    switchOrganization,
    togglePublicPrivate,
    resetOrganizationData,
  };
};
