import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';

interface User {
  email?: string;
  phone?: string;
  orgName?: string;
  orgId: string;
  organizations?: OrganizationMembership[];
}

interface OrganizationMembership {
  orgId: string;
  orgName: string;
  role: 'org_admin' | 'client';
  joinedAt: Date;
}

interface OrganizationInfo {
  name?: string;
  description?: string;
}

interface AdminTabsProps {
  currentTab: 'invites' | 'profile';
  user: User | null;
  inviteEmail: string;
  isCreatingInvite: boolean;
  orgDescription: string;
  isUpdatingDescription: boolean;
  userOrganizations: OrganizationMembership[];
  isSwitchingOrg: boolean;
  onInviteEmailChange: (email: string) => void;
  onCreateInvite: () => void;
  onOrgDescriptionChange: (description: string) => void;
  onUpdateOrganizationDescription: () => void;
  onSwitchOrganization: (orgId: string) => void;
}

export const AdminTabs: React.FC<AdminTabsProps> = ({
  currentTab,
  user,
  inviteEmail,
  isCreatingInvite,
  orgDescription,
  isUpdatingDescription,
  userOrganizations,
  isSwitchingOrg,
  onInviteEmailChange,
  onCreateInvite,
  onOrgDescriptionChange,
  onUpdateOrganizationDescription,
  onSwitchOrganization,
}) => {
  if (currentTab === 'invites') {
    return (
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 }}>
            Invite New Admins
          </Text>
          
          {/* Create Invite Form */}
          <View style={{ 
            backgroundColor: '#F9FAFB', 
            padding: 16, 
            borderRadius: 8, 
            borderWidth: 1, 
            borderColor: '#E5E7EB',
            marginBottom: 16
          }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
              Send Invite
            </Text>
            
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 6,
                padding: 12,
                fontSize: 16,
                backgroundColor: 'white',
                marginBottom: 12
              }}
              placeholder="Enter email address"
              value={inviteEmail}
              onChangeText={onInviteEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TouchableOpacity
              style={{
                backgroundColor: isCreatingInvite ? '#D1D5DB' : '#3B82F6',
                padding: 12,
                borderRadius: 6,
                alignItems: 'center',
                pointerEvents: isCreatingInvite ? 'none' : 'auto'
              }}
              onPress={onCreateInvite}
              disabled={isCreatingInvite}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>
                {isCreatingInvite ? 'Creating Invite...' : 'Create Invite'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={{ 
            backgroundColor: '#EFF6FF', 
            padding: 16, 
            borderRadius: 8, 
            borderLeftWidth: 4, 
            borderLeftColor: '#3B82F6'
          }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1E40AF', marginBottom: 8 }}>
              How it works:
            </Text>
            <Text style={{ fontSize: 14, color: '#1E40AF', lineHeight: 20 }}>
              1. Enter the email address of the person you want to invite{'\n'}
              2. Click "Create Invite" to generate an invite code{'\n'}
              3. Share the invite code with the person{'\n'}
              4. They can use the "Join Organization" tab to enter the code
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  if (currentTab === 'profile') {
    return (
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 }}>
            Organization Profile
          </Text>
          
          {/* Organization Selection */}
          {userOrganizations && userOrganizations.length > 0 && (
            <View style={{ 
              backgroundColor: '#F0F9FF', 
              padding: 16, 
              borderRadius: 8, 
              borderWidth: 1, 
              borderColor: '#0EA5E9',
              marginBottom: 16
            }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#0C4A6E', marginBottom: 12 }}>
                {userOrganizations.length > 1 ? 'Switch Organization' : 'Current Organization'}
              </Text>
              <Text style={{ fontSize: 14, color: '#0369A1', marginBottom: 12 }}>
                You are currently managing: <Text style={{ fontWeight: '600' }}>{user?.orgName}</Text>
              </Text>
              
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {userOrganizations.map((org) => (
                  <TouchableOpacity
                    key={org.orgId}
                    style={{
                      backgroundColor: org.orgId === user?.orgId ? '#0EA5E9' : 'white',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: org.orgId === user?.orgId ? '#0284C7' : '#E5E7EB',
                      opacity: isSwitchingOrg ? 0.5 : 1,
                      pointerEvents: isSwitchingOrg ? 'none' : 'auto'
                    }}
                    onPress={() => onSwitchOrganization(org.orgId)}
                    disabled={isSwitchingOrg}
                  >
                    <Text style={{ 
                      color: org.orgId === user?.orgId ? 'white' : '#374151',
                      fontSize: 12,
                      fontWeight: '500'
                    }}>
                      {org.orgName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {isSwitchingOrg && (
                <Text style={{ fontSize: 12, color: '#0369A1', marginTop: 8, fontStyle: 'italic' }}>
                  Switching organization...
                </Text>
              )}
            </View>
          )}
          
          {/* Organization Info */}
          <View style={{ 
            backgroundColor: '#F9FAFB', 
            padding: 16, 
            borderRadius: 8, 
            borderWidth: 1, 
            borderColor: '#E5E7EB',
            marginBottom: 16
          }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
              Organization Information
            </Text>
            
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280' }}>Organization Name:</Text>
              <Text style={{ fontSize: 16, color: '#1F2937' }}>{user?.orgName || 'Not set'}</Text>
            </View>
            
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280' }}>Organization ID:</Text>
              <Text style={{ fontSize: 14, color: '#6B7280', fontFamily: 'monospace' }}>{user?.orgId}</Text>
            </View>
            
            <View>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280' }}>Admin Email:</Text>
              <Text style={{ fontSize: 16, color: '#1F2937' }}>{user?.email}</Text>
            </View>
          </View>

          {/* Organization Description */}
          <View style={{ 
            backgroundColor: 'white', 
            padding: 16, 
            borderRadius: 8, 
            borderWidth: 1, 
            borderColor: '#E5E7EB'
          }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
              Organization Description
            </Text>
            
            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 12 }}>
              Provide a description of your organization that will be visible to clients.
            </Text>
            
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 6,
                padding: 12,
                fontSize: 16,
                backgroundColor: '#F9FAFB',
                minHeight: 120,
                textAlignVertical: 'top'
              }}
              placeholder="Enter organization description..."
              value={orgDescription}
              onChangeText={onOrgDescriptionChange}
              multiline
              numberOfLines={6}
            />
            
            <TouchableOpacity
              style={{
                backgroundColor: isUpdatingDescription ? '#D1D5DB' : '#10B981',
                padding: 12,
                borderRadius: 6,
                alignItems: 'center',
                marginTop: 12,
                pointerEvents: isUpdatingDescription ? 'none' : 'auto'
              }}
              onPress={onUpdateOrganizationDescription}
              disabled={isUpdatingDescription}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>
                {isUpdatingDescription ? 'Updating...' : 'Update Description'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  return null;
};
