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

  // Load user's organizations
  useEffect(() => {
    loadUserOrganizations();
  }, [user]);

  const loadUserOrganizations = async () => {
    if (!user?.accessibleOrgs) return;
    
    const userOrgs: Organization[] = [];
    for (const [orgId, orgAccess] of Object.entries(user.accessibleOrgs)) {
      const access = orgAccess as any;
      userOrgs.push({
        orgId: orgId,
        name: access.orgName || 'Unknown Organization',
        adminCount: 0, // We don't have this info in accessibleOrgs
        isPublic: access.isPublic || false,
        userRole: access.role
      });
    }
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

  // Handle joining an organization
  const handleJoinOrganization = async (orgId: string) => {
    console.log('🔄 Join button clicked for orgId:', orgId);
    const orgName = searchResults.find(org => org.orgId === orgId)?.name || 'this organization';
    console.log('🔄 Organization name:', orgName);
    console.log('🔄 Current user:', user);
    console.log('🔄 Current token:', token);
    
    // Show joining toast and proceed directly
    Toast.show({
      type: 'info',
      text1: 'Joining Organization',
      text2: `Joining ${orgName}...`,
      visibilityTime: 2000,
    });
    
    console.log('🔄 Making API call...');
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

      console.log('🔄 API response:', response.data);

      // Update the user context with the new auth response
      if (response.data.token && response.data.user) {
        console.log('🔄 Updating user context...');
        await updateUser(response.data.token, response.data.user);
        console.log('🔄 User context updated successfully');
      }
      
      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Successfully Joined!',
        text2: `Welcome to ${orgName}`,
        visibilityTime: 3000,
      });
      
      console.log('🔄 Calling onOrganizationSelected...');
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

  const isGuest = user?.currentRole === 'guest' || user?.role === 'guest';

  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: '#F9FAFB' }}>
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 }}>
          Welcome back!
        </Text>
        <Text style={{ fontSize: 16, color: '#6B7280', marginBottom: 24 }}>
          {user?.email || 'No email available'}
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
                  onPress={() => handleJoinOrganization(org.orgId)}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 }}>
                    {org.name || 'Unnamed Organization'}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>
                    {org.isPublic ? 'Public' : 'Private'} • {org.adminCount} admins
                  </Text>
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

      {/* Action Buttons - Only show for non-guests */}
      {!isGuest && (
        <View style={{ marginBottom: 24 }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#3B82F6',
              padding: 16,
              borderRadius: 8,
              marginBottom: 12,
              alignItems: 'center',
            }}
            onPress={onCreateOrganization}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              Create New Organization
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Help Text */}
      <View style={{ backgroundColor: '#F3F4F6', padding: 16, borderRadius: 8 }}>
        <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
          You can create organizations if you do not find one that matches your requirements.
        </Text>
      </View>
    </ScrollView>
  );
};
