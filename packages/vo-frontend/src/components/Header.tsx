import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface HeaderProps {
  user: {
    email?: string;
    phone?: string;
    orgName?: string;
    orgId: string;
  } | null;
  isAdmin: boolean;
  isClient: boolean;
  currentTab: 'chat' | 'documents' | 'invites' | 'profile';
  clientCurrentTab: 'chat' | 'profile';
  documentStats: { count: number };
  onLogout: () => void;
  onTabChange: (tab: 'chat' | 'documents' | 'invites' | 'profile') => void;
  onClientTabChange: (tab: 'chat' | 'profile') => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isAdmin,
  isClient,
  currentTab,
  clientCurrentTab,
  documentStats,
  onLogout,
  onTabChange,
  onClientTabChange,
}) => {
  return (
    <View style={{ backgroundColor: '#3B82F6', padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
          Ask Akasha
        </Text>
        <TouchableOpacity
          onPress={onLogout}
          style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* User Info */}
      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 12 }}>
        {isAdmin ? `Admin: ${user?.email}` : `Client: ${user?.phone}`} • Org: {user?.orgName || user?.orgId}
      </Text>
      
      {/* Tab Navigation */}
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <TouchableOpacity
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 16,
            backgroundColor: (isAdmin ? currentTab === 'chat' : clientCurrentTab === 'chat') ? 'rgba(255,255,255,0.2)' : 'transparent',
            marginRight: 8,
          }}
          onPress={() => isAdmin ? onTabChange('chat') : onClientTabChange('chat')}
        >
          <Text style={{ color: 'white', fontWeight: (isAdmin ? currentTab === 'chat' : clientCurrentTab === 'chat') ? 'bold' : 'normal' }}>
            Chat
          </Text>
        </TouchableOpacity>
        
        {/* Only show Documents tab for admins */}
        {isAdmin && (
          <TouchableOpacity
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 16,
              backgroundColor: currentTab === 'documents' ? 'rgba(255,255,255,0.2)' : 'transparent',
              marginRight: 8,
            }}
            onPress={() => onTabChange('documents')}
          >
            <Text style={{ color: 'white', fontWeight: currentTab === 'documents' ? 'bold' : 'normal' }}>
              Documents ({documentStats.count})
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Only show Invites tab for admins */}
        {isAdmin && (
          <TouchableOpacity
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 16,
              backgroundColor: currentTab === 'invites' ? 'rgba(255,255,255,0.2)' : 'transparent',
              marginRight: 8,
            }}
            onPress={() => onTabChange('invites')}
          >
            <Text style={{ color: 'white', fontWeight: currentTab === 'invites' ? 'bold' : 'normal' }}>
              Invites
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Admin Profile tab */}
        {isAdmin && (
          <TouchableOpacity
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 16,
              backgroundColor: currentTab === 'profile' ? 'rgba(255,255,255,0.2)' : 'transparent',
              marginRight: 8,
            }}
            onPress={() => onTabChange('profile')}
          >
            <Text style={{ color: 'white', fontWeight: currentTab === 'profile' ? 'bold' : 'normal' }}>
              Profile
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Client Profile tab */}
        {isClient && (
          <TouchableOpacity
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 16,
              backgroundColor: clientCurrentTab === 'profile' ? 'rgba(255,255,255,0.2)' : 'transparent',
            }}
            onPress={() => onClientTabChange('profile')}
          >
            <Text style={{ color: 'white', fontWeight: clientCurrentTab === 'profile' ? 'bold' : 'normal' }}>
              Profile
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
