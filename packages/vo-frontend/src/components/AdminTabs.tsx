import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface User {
  email?: string;
  phone?: string;
  orgName?: string;
  orgId: string; // Legacy field
  organizations?: OrganizationMembership[];
  // Multi-role fields
  currentOrgId?: string;
  currentRole?: 'admin' | 'client' | 'guest';
  accessibleOrgs?: { [orgId: string]: { role: 'admin' | 'client' | 'guest'; orgName: string; orgDescription?: string; isPublic?: boolean } };
}

interface OrganizationMembership {
  orgId: string;
  orgName: string;
  role: 'admin' | 'client' | 'guest';
  joinedAt: Date;
}

interface OrganizationInfo {
  name?: string;
  description?: string;
}

interface AdminTabsProps {
  currentTab: 'invites' | 'organizations';
  user: User | null;
  inviteEmail: string;
  inviteRole: 'admin' | 'client';
  isCreatingInvite: boolean;
  orgDescription: string;
  isUpdatingDescription: boolean;
  userOrganizations: OrganizationMembership[];
  isSwitchingOrg: boolean;
  isPublic: boolean;
  onInviteEmailChange: (email: string) => void;
  onInviteRoleChange: (role: 'admin' | 'client') => void;
  onCreateInvite: () => void;
  onOrgDescriptionChange: (description: string) => void;
  onUpdateOrganizationDescription: () => void;
  onSwitchOrganization: (orgId: string) => void;
  onTogglePublicPrivate: () => void;
}

export const AdminTabs: React.FC<AdminTabsProps> = ({
  currentTab,
  user,
  inviteEmail,
  inviteRole,
  isCreatingInvite,
  orgDescription,
  isUpdatingDescription,
  userOrganizations,
  isSwitchingOrg,
  isPublic,
  onInviteEmailChange,
  onInviteRoleChange,
  onCreateInvite,
  onOrgDescriptionChange,
  onUpdateOrganizationDescription,
  onSwitchOrganization,
  onTogglePublicPrivate,
}) => {
  // Note: Organization switching functionality is handled in the Search tab


  if (currentTab === 'organizations') {
    return (
      <LinearGradient
        colors={['#1E3A8A', '#581C87']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1 }}
      >
        <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 16 }}>
            Organization Profile
          </Text>
          
          {/* Organization Info - moved to top */}
          <View style={{ 
            backgroundColor: '#F9FAFB', 
            padding: 16, 
            borderRadius: 8, 
            borderWidth: 1, 
            borderColor: '#E5E7EB',
            marginBottom: 16
          }}>
            {/*<Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
              Organization Information
            </Text>*/}
            
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280' }}>Name:</Text>
              <Text style={{ fontSize: 16, color: '#1F2937' }}>{user?.orgName || 'Not set'}</Text>
            </View>
            
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280' }}>Identifier:</Text>
              <Text style={{ fontSize: 14, color: '#6B7280', fontFamily: 'monospace' }}>{user?.orgId}</Text>
            </View>
            
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280' }}>Your Role:</Text>
              <Text style={{ fontSize: 16, color: '#1F2937' }}>{user?.currentRole || 'Not set'}</Text>
            </View>

            {/* Public/Private Toggle */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
              marginBottom: 16
            }}>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
                  Visibility
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>
                  {isPublic ? 'Public - Anyone can find and join' : 'Private - Invitation only'}
                </Text>
              </View>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isPublic ? '#10B981' : '#6B7280',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                }}
                onPress={onTogglePublicPrivate}
              >
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                  {isPublic ? 'Public' : 'Private'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Organization Description within the same section */}
            <View>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280', marginBottom: 8 }}>
                Description:
              </Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>
                Provide a description of your organization that will be visible to others.
              </Text>
              
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 6,
                  padding: 12,
                  fontSize: 14,
                  backgroundColor: 'white',
                  minHeight: 80,
                  textAlignVertical: 'top',
                  marginBottom: 12
                }}
                placeholder="Enter organization description..."
                value={orgDescription}
                onChangeText={onOrgDescriptionChange}
                multiline
              />
              
              <TouchableOpacity
                style={{
                  backgroundColor: isUpdatingDescription ? '#D1D5DB' : '#3B82F6',
                  padding: 12,
                  borderRadius: 6,
                  alignItems: 'center',
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
          
          {/* Send Invites Section - moved to bottom */}
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
            
            {/* Role Selection - Admin invite commented out for future implementation */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                User Role
              </Text>
              <View style={{ 
                flexDirection: 'row', 
                backgroundColor: '#F3F4F6', 
                borderRadius: 6, 
                padding: 2 
              }}>
                {/* TODO: Uncomment when admin invite system is ready
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 4,
                    backgroundColor: inviteRole === 'admin' ? 'white' : 'transparent',
                    shadowColor: inviteRole === 'admin' ? '#000' : 'transparent',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: inviteRole === 'admin' ? 2 : 0,
                  }}
                  onPress={() => onInviteRoleChange('admin')}
                >
                  <Text style={{ 
                    textAlign: 'center', 
                    fontWeight: '600', 
                    color: inviteRole === 'admin' ? '#1F2937' : '#6B7280' 
                  }}>
                    Admin
                  </Text>
                </TouchableOpacity>
                */}
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 4,
                    backgroundColor: 'white', // Always active since it's the only option
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                  }}
                  onPress={() => onInviteRoleChange('client')}
                >
                  <Text style={{ 
                    textAlign: 'center', 
                    fontWeight: '600', 
                    color: '#1F2937'
                  }}>
                    Client
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
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
                {isCreatingInvite ? 'Creating Invite...' : 'Create Client Invite'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={{ 
            backgroundColor: '#EFF6FF', 
            padding: 16, 
            borderRadius: 8, 
            borderLeftWidth: 4, 
            borderLeftColor: '#3B82F6',
            marginBottom: 16
          }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1E40AF', marginBottom: 8 }}>
              How it works:
            </Text>
            <Text style={{ fontSize: 14, color: '#1E40AF', lineHeight: 20 }}>
              1. Enter the email address of the person you want to invite as a client{'\n'}
              2. Click "Create Client Invite" to generate an invite code{'\n'}
              3. Share the invite code with the person{'\n'}
              4. They can use the "By Invitation" tab to enter the code and register{'\n'}
              5. Once registered, they'll have client access to your organization
            </Text>
          </View>

        </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  return null;
};
