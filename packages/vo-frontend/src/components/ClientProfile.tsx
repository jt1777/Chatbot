import React from 'react';
import { View, Text, ScrollView } from 'react-native';

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

interface ClientProfileProps {
  user: User | null;
  clientOrgInfo: OrganizationInfo | null;
}

export const ClientProfile: React.FC<ClientProfileProps> = ({
  user,
  clientOrgInfo,
}) => {
  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
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
            About {clientOrgInfo?.name || 'this organization'}
          </Text>
          
          {clientOrgInfo?.description ? (
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
          
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280' }}>Organization Name:</Text>
            <Text style={{ fontSize: 16, color: '#1F2937' }}>{clientOrgInfo?.name || user?.orgName || 'Not available'}</Text>
          </View>
          
          <View>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280' }}>Your Phone:</Text>
            <Text style={{ fontSize: 16, color: '#1F2937' }}>{user?.phone || 'Not available'}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};
