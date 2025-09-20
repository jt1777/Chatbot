import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
  onRefreshOrgInfo?: () => void;
}

export const ClientProfile: React.FC<ClientProfileProps> = ({
  user,
  clientOrgInfo,
  onRefreshOrgInfo,
}) => {



  return (
    <LinearGradient
      colors={['#1E3A8A', '#581C87']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <ScrollView style={{ flex: 1, padding: 16 }}>

      {/* Organization Information Section - Show if user has joined an organization */}
      {clientOrgInfo && (
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 16 }}>
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

        </View>
      )}

      </ScrollView>
    </LinearGradient>
  );
};
