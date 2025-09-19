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
  currentTab: 'search' | 'chat' | 'documents' | 'organizations';
  clientCurrentTab: 'search' | 'chat' | 'organizations';
  documentStats: { count: number };
  onLogout: () => void;
  onTabChange: (tab: 'search' | 'chat' | 'documents' | 'organizations') => void;
  onClientTabChange: (tab: 'search' | 'chat' | 'organizations') => void;
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
            backgroundColor: (isAdmin ? currentTab === 'search' : clientCurrentTab === 'search') ? 'rgba(255,255,255,0.2)' : 'transparent',
            marginRight: 8,
          }}
          onPress={() => isAdmin ? onTabChange('search') : onClientTabChange('search')}
        >
          <Text style={{ color: 'white', fontWeight: (isAdmin ? currentTab === 'search' : clientCurrentTab === 'search') ? 'bold' : 'normal' }}>
            Search
          </Text>
        </TouchableOpacity>
        
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
        
        {/* Admin Profile tab */}
        {isAdmin && (
          <TouchableOpacity
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 16,
            backgroundColor: currentTab === 'organizations' ? 'rgba(255,255,255,0.2)' : 'transparent',
            marginRight: 8,
          }}
          onPress={() => onTabChange('organizations')}
        >
          <Text style={{ color: 'white', fontWeight: currentTab === 'organizations' ? 'bold' : 'normal' }}>
            Organizations
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
              backgroundColor: clientCurrentTab === 'organizations' ? 'rgba(255,255,255,0.2)' : 'transparent',
            }}
            onPress={() => onClientTabChange('organizations')}
          >
            <Text style={{ color: 'white', fontWeight: clientCurrentTab === 'organizations' ? 'bold' : 'normal' }}>
              Organizations
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
