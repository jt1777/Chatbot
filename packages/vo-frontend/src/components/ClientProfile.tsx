import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

interface User {
  email?: string;
  phone?: string;
  orgName?: string;
  orgId: string;
}

interface OrganizationInfo {
  name?: string;
  description?: string;
}

interface Organization {
  orgId: string;
  name: string;
  adminCount: number;
  isPublic?: boolean;
}

interface ClientProfileProps {
  user: User | null;
  clientOrgInfo: OrganizationInfo | null;
  onRefreshOrgInfo?: () => void;
}

export const ClientProfile: React.FC<ClientProfileProps> = ({
  user,
  clientOrgInfo,
  onRefreshOrgInfo,
}) => {
  const { login } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Organization[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

  const searchOrganizations = async () => {
    setIsSearching(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/orgs`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        }
      });

      const allOrgs = response.data;
      console.log('All organizations:', allOrgs);
      console.log('Search query:', searchQuery);
      
      const filtered = allOrgs.filter((org: Organization) => {
        const isPublic = org.isPublic !== false; // Default to true if not specified
        
        // If search query is empty, show all public organizations
        if (!searchQuery.trim()) {
          return isPublic;
        }
        
        // If search query exists, filter by name and public status
        const nameMatch = org.name.toLowerCase().includes(searchQuery.toLowerCase());
        console.log(`Org: ${org.name}, isPublic: ${org.isPublic}, nameMatch: ${nameMatch}`);
        return nameMatch && isPublic;
      });
      
      console.log('Filtered results:', filtered);
      setSearchResults(filtered);
      setShowSearchResults(true);
    } catch (error: any) {
      console.error('Error searching organizations:', error);
      Alert.alert('Error', 'Failed to search organizations');
    } finally {
      setIsSearching(false);
    }
  };

  const joinOrganization = async (orgId: string, orgName: string) => {
    console.log('joinOrganization called with:', { orgId, orgName });
    
    // Show confirmation toast
    Toast.show({
      type: 'info',
      text1: 'Join Organization',
      text2: `Joining "${orgName}"...`,
      visibilityTime: 2000,
    });

    try {
      // Debug: Check what's in AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('All AsyncStorage keys:', allKeys);
      
      // Get the auth token from AsyncStorage
      const token = await AsyncStorage.getItem('auth_token');
      console.log('Token found:', !!token);
      console.log('Token value:', token ? token.substring(0, 20) + '...' : 'null');
      
      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Authentication token not found. Please log in again.',
          visibilityTime: 3000,
        });
        return;
      }

      console.log('Making API call to join organization...');
      const response = await axios.post(`${API_BASE_URL}/api/client/join-organization`, {
        orgId: orgId
      }, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('API response:', response.data);

      // Update the user data and token using AuthContext
      await login(response.data.token, response.data.user);

      // Refresh organization info
      if (onRefreshOrgInfo) {
        console.log('Calling onRefreshOrgInfo...');
        onRefreshOrgInfo();
      }

      Toast.show({
        type: 'success',
        text1: 'Success!',
        text2: `You have successfully joined "${orgName}"`,
        visibilityTime: 4000,
      });
    } catch (error: any) {
      console.error('Error joining organization:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.error || 'Failed to join organization',
        visibilityTime: 4000,
      });
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      {/* Organization Search Section */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 }}>
          Search Organizations
        </Text>
        
        {/* Search Input */}
        <View style={{ 
          backgroundColor: 'white', 
          padding: 16, 
          borderRadius: 8, 
          borderWidth: 1, 
          borderColor: '#E5E7EB',
          marginBottom: 16
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
            Find Public Organizations
          </Text>
          
          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            <TextInput
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 6,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 16,
                marginRight: 8,
              }}
              placeholder="Search organization name..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={searchOrganizations}
            />
            <TouchableOpacity
              style={{
                backgroundColor: isSearching ? '#D1D5DB' : '#3B82F6',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 6,
                alignItems: 'center',
              }}
              onPress={searchOrganizations}
              disabled={isSearching}
            >
              <Text style={{ 
                color: 'white', 
                fontWeight: '600',
                fontSize: 14
              }}>
                {isSearching ? 'Searching...' : 'Search'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
            Leave blank to find all public organizations
          </Text>
          
        </View>

        {/* Search Results */}
        {showSearchResults && (
          <View style={{ 
            backgroundColor: 'white', 
            borderRadius: 8, 
            borderWidth: 1, 
            borderColor: '#E5E7EB',
            maxHeight: 300
          }}>
            <View style={{ 
              padding: 16, 
              borderBottomWidth: 1, 
              borderBottomColor: '#E5E7EB',
              backgroundColor: '#F9FAFB'
            }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                {searchQuery.trim() ? `Search Results for "${searchQuery}" (${searchResults.length})` : `All Organizations (${searchResults.length})`}
              </Text>
            </View>
            
            <ScrollView style={{ maxHeight: 250 }}>
              {searchResults.length > 0 ? (
                searchResults.map((org) => (
                  <View
                    key={org.orgId}
                    style={{
                      padding: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: '#F3F4F6',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={{ 
                        fontSize: 16, 
                        fontWeight: '600', 
                        color: '#1F2937',
                        marginBottom: 4
                      }}>
                        {org.name}
                      </Text>
                      <Text style={{ 
                        fontSize: 14, 
                        color: '#6B7280'
                      }}>
                        {org.adminCount} admin{org.adminCount !== 1 ? 's' : ''} • Public
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#3B82F6',
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 6,
                        alignItems: 'center',
                        minWidth: 60,
                      }}
                      onPress={() => {
                        console.log('Join button pressed for org:', org.name, org.orgId);
                        joinOrganization(org.orgId, org.name);
                      }}
                    >
                      <Text style={{ 
                        color: 'white', 
                        fontWeight: '600',
                        fontSize: 14
                      }}>
                        Join
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={{ padding: 16, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>
                    {searchQuery.trim() ? `No organizations found matching "${searchQuery}"` : 'No organizations available'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Organization Information Section - Only show if user has joined an organization */}
      {clientOrgInfo && (user as any)?.role !== 'guest' && (
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 }}>
            Organization Information
          </Text>
          
          {/* Organization Description */}
          <View style={{ 
            backgroundColor: 'white', 
            padding: 16, 
            borderRadius: 8, 
            borderWidth: 1, 
            borderColor: '#E5E7EB',
            marginBottom: 16
          }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
              About {clientOrgInfo.name}
            </Text>
            
            {clientOrgInfo.description ? (
              <Text style={{ 
                fontSize: 14, 
                color: '#4B5563', 
                lineHeight: 20,
                textAlign: 'left'
              }}>
                {clientOrgInfo.description}
              </Text>
            ) : (
              <Text style={{ 
                fontSize: 14, 
                color: '#9CA3AF', 
                fontStyle: 'italic',
                textAlign: 'left'
              }}>
                No description available for this organization.
              </Text>
            )}
          </View>

          {/* Organization Details */}
          <View style={{ 
            backgroundColor: '#F9FAFB', 
            padding: 16, 
            borderRadius: 8, 
            borderWidth: 1, 
            borderColor: '#E5E7EB'
          }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
              Organization Details
            </Text>
            
            <View>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280' }}>Organization Name:</Text>
              <Text style={{ fontSize: 16, color: '#1F2937' }}>{clientOrgInfo?.name || user?.orgName || 'Not available'}</Text>
            </View>
          </View>
        </View>
      )}

    </ScrollView>
  );
};
