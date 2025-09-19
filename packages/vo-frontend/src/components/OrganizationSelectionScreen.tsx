import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

interface Organization {
  orgId: string;
  name: string;
  adminCount: number;
  isPublic?: boolean;
  userRole?: 'admin' | 'client' | 'guest';
}

interface OrganizationSelectionScreenProps {
  onOrganizationSelected: () => void;
  onCreateOrganization: () => void;
  onJoinWithInvite: () => void;
}

export const OrganizationSelectionScreen: React.FC<OrganizationSelectionScreenProps> = ({
  onOrganizationSelected,
  onCreateOrganization,
  onJoinWithInvite
}) => {
  const { user, switchOrganization, token, updateUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Organization[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [userOrganizations, setUserOrganizations] = useState<Organization[]>([]);
  const [newOrgName, setNewOrgName] = useState<string>('');
  const [isCreatingOrg, setIsCreatingOrg] = useState<boolean>(false);

  const isGuest = user?.currentRole === 'guest';

  // Load user's organizations
  useEffect(() => {
    loadUserOrganizations();
  }, [user]);

  // Debug rendering
  useEffect(() => {
    console.log('🔍 Rendering check - isGuest:', isGuest, 'userOrganizations.length:', userOrganizations.length, 'userOrganizations:', userOrganizations);
  }, [isGuest, userOrganizations]);

  const loadUserOrganizations = async () => {
    console.log('🔍 loadUserOrganizations called for user:', user?.email, 'currentRole:', user?.currentRole);
    console.log('🔍 user.accessibleOrgs:', user?.accessibleOrgs);
    
    if (!user?.accessibleOrgs) {
      console.log('🔍 No accessibleOrgs found, returning');
      return;
    }
    
    const userOrgs: Organization[] = [];
    for (const [orgId, orgAccess] of Object.entries(user.accessibleOrgs)) {
      const access = orgAccess as any;
      console.log('🔍 Processing org:', orgId, 'access:', access);
      userOrgs.push({
        orgId: orgId,
        name: access.orgName || 'Unknown Organization',
        adminCount: 0, // We don't have this info in accessibleOrgs
        isPublic: access.isPublic || false,
        userRole: access.role
      });
    }
    console.log('🔍 Final userOrgs:', userOrgs);
    setUserOrganizations(userOrgs);
  };

  // Search organizations
  const searchOrganizations = async (query: string) => {
    try {
      setIsSearching(true);
      
      // If no query, show all public organizations
      if (!query.trim()) {
        const response = await axios.get(`${API_BASE_URL}/api/orgs/public`);
        setSearchResults(response.data);
      } else {
        const response = await axios.get(`${API_BASE_URL}/api/orgs/search?q=${encodeURIComponent(query)}`);
        setSearchResults(response.data);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle organization selection
  const handleSelectOrganization = async (orgId: string) => {
    try {
      await switchOrganization(orgId);
      onOrganizationSelected();
    } catch (error) {
      console.error('Error switching organization:', error);
    }
  };

  // Handle organization click - either switch or join based on membership
  const handleOrganizationClick = async (orgId: string) => {
    // Check if user is already a member of this organization
    const isMember = user?.accessibleOrgs && user.accessibleOrgs[orgId];
    
    if (isMember) {
      // User is already a member - switch to this organization
      console.log('🔄 User is already a member, switching to organization:', orgId);
      await handleSelectOrganization(orgId);
    } else {
      // User is not a member - join the organization
      console.log('🔄 User is not a member, joining organization:', orgId);
      await handleJoinOrganization(orgId);
    }
  };

  // Handle joining an organization
  const handleJoinOrganization = async (orgId: string) => {
    //console.log('🔄 Join button clicked for orgId:', orgId);
    const orgName = searchResults.find(org => org.orgId === orgId)?.name || 'this organization';
    //console.log('🔄 Organization name:', orgName);
    //console.log('🔄 Current user:', user);
    //console.log('🔄 Current token:', token);
    
    // Show joining toast and proceed directly
    Toast.show({
      type: 'info',
      text1: 'Joining Organization',
      text2: `Joining ${orgName}...`,
      visibilityTime: 2000,
    });
    
    //console.log('🔄 Making API call...');
    try {
      // Guests now have proper JWT tokens, so they can use the regular client endpoint
      const response = await axios.post(`${API_BASE_URL}/api/client/join-organization`, {
        orgId: orgId
      }, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token || ''}`
        }
      });

      //console.log('🔄 API response:', response.data);

      // Update the user context with the new auth response
      if (response.data.token && response.data.user) {
        //console.log('🔄 Updating user context...');
        await updateUser(response.data.token, response.data.user);
        //console.log('🔄 User context updated successfully');
      }
      
      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Successfully Joined!',
        text2: `Welcome to ${orgName}`,
        visibilityTime: 3000,
      });
      
      //console.log('🔄 Calling onOrganizationSelected...');
      onOrganizationSelected(); // This will close the selection screen
    } catch (error) {
      console.error('❌ Error joining organization:', error);
      
      // Show error toast
      Toast.show({
        type: 'error',
        text1: 'Join Failed',
        text2: 'Failed to join organization. Please try again.',
        visibilityTime: 4000,
      });
    }
  };

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter an organization name',
        visibilityTime: 3000,
      });
      return;
    }

    setIsCreatingOrg(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/org/create-new`, {
        orgName: newOrgName.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update the user context with the new auth response
      if (response.data.token && response.data.user) {
        await updateUser(response.data.token, response.data.user);
      }
      
      Toast.show({
        type: 'success',
        text1: 'Organization Created!',
        text2: `Welcome to ${newOrgName}`,
        visibilityTime: 3000,
      });
      
      setNewOrgName('');
      onOrganizationSelected(); // Close the selection screen
    } catch (error: any) {
      console.error('❌ Error creating organization:', error);
      const errorMessage = error.response?.data?.error || 'Failed to create organization';
      Toast.show({
        type: 'error',
        text1: 'Creation Failed',
        text2: errorMessage,
        visibilityTime: 4000,
      });
    } finally {
      setIsCreatingOrg(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: '#F9FAFB' }}>
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 }}>
          Welcome!
        </Text>
        <Text style={{ fontSize: 16, color: '#6B7280', marginBottom: 24 }}>
          {isGuest ? 'Guest User' : (user?.email || 'No email available')}
        </Text>
      </View>

      {/* Search Organizations */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
          Search Organizations
        </Text>
        <TextInput
          style={{
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#D1D5DB',
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
            color: '#1F2937',
            marginBottom: 12,
          }}
          placeholder="Search for organizations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <TouchableOpacity
          style={{
            backgroundColor: '#3B82F6',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
          }}
          onPress={() => searchOrganizations(searchQuery)}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
            Search
          </Text>
        </TouchableOpacity>
        
        {/* Search Results */}
        {(isSearching || searchResults.length > 0) && (
          <View style={{ marginTop: 12 }}>
            {isSearching ? (
              <Text style={{ textAlign: 'center', color: '#6B7280', padding: 16 }}>
                Searching...
              </Text>
            ) : searchResults.length > 0 ? (
              searchResults.map((org) => (
                <TouchableOpacity
                  key={org.orgId}
                  style={{
                    backgroundColor: '#FFFFFF',
                    padding: 16,
                    borderRadius: 8,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                  }}
                  onPress={() => handleOrganizationClick(org.orgId)}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 }}>
                        {org.name || 'Unnamed Organization'}
                      </Text>
                      <Text style={{ fontSize: 14, color: '#6B7280' }}>
                        {org.isPublic ? 'Public' : 'Private'} • {org.adminCount} admins
                      </Text>
                    </View>
                    {user?.accessibleOrgs && user.accessibleOrgs[org.orgId] && (
                      <View
                        style={{
                          backgroundColor: user.accessibleOrgs[org.orgId].role === 'admin' ? '#DC2626' : '#2563EB',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12,
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: 'white' }}>
                          {user.accessibleOrgs[org.orgId].role.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={{ textAlign: 'center', color: '#6B7280', padding: 16 }}>
                No organizations found
              </Text>
            )}
          </View>
        )}
      </View>

      {/* My Organizations */}
      {!isGuest && userOrganizations.length > 0 && (
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
            My Organizations
          </Text>
          {userOrganizations.map((org) => (
            <TouchableOpacity
              key={org.orgId}
              style={{
                backgroundColor: '#FFFFFF',
                padding: 16,
                borderRadius: 8,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}
              onPress={() => handleSelectOrganization(org.orgId)}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 }}>
                    {org.name || 'Unnamed Organization'}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>
                    {org.isPublic ? 'Public' : 'Private'} • {org.adminCount} admins
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: org.userRole === 'admin' ? '#DC2626' : '#2563EB',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: 'white' }}>
                    {org.userRole?.toUpperCase() || 'USER'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Create Organization - Only show for non-guests */}
      {!isGuest && (
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 }}>
            Create New Organization
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#D1D5DB',
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              backgroundColor: 'white',
              marginBottom: 12,
            }}
            placeholder="Enter organization name"
            value={newOrgName}
            onChangeText={setNewOrgName}
            editable={!isCreatingOrg}
          />
          <TouchableOpacity
            style={{
              backgroundColor: newOrgName.trim() ? '#3B82F6' : '#9CA3AF',
              padding: 16,
              borderRadius: 8,
              alignItems: 'center',
            }}
            onPress={handleCreateOrganization}
            disabled={!newOrgName.trim() || isCreatingOrg}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              {isCreatingOrg ? 'Creating...' : 'Create Organization'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Help Text */}
      <View style={{ backgroundColor: '#F3F4F6', padding: 16, borderRadius: 8 }}>
        <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
          Only registered users may create organizations.
        </Text>
      </View>
    </ScrollView>
  );
};
