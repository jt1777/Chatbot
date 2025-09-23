import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HeaderProps {
  user: {
    email?: string;
    phone?: string;
    orgName?: string;
    orgId: string;
    role?: string;
    currentRole?: string;
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
  const isGuest = user?.currentRole === 'guest';
  const guestHasOrganization = isGuest && user?.orgName && user?.orgName !== 'No Organization';
  const shouldDisableTabsForGuest = isGuest && !guestHasOrganization;
  const clientHasOrganization = isClient && user?.orgName && user?.orgName !== 'No Organization';
  const shouldDisableTabsForClient = isClient && !clientHasOrganization;
  const shouldDisableTabs = shouldDisableTabsForGuest || shouldDisableTabsForClient;

  return (
    <SafeAreaView style={{ backgroundColor: '#1E3A8A' }}>
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
            Ask Akasha
          </Text>
          <TouchableOpacity
            onPress={onLogout}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 4 }}>
            {isAdmin ? `Admin: ${user?.email}` : `Client: ${(isGuest || user?.currentRole === 'guest' || user?.role === 'guest') ? 'Guest' : (user?.email || user?.phone || 'Guest')}`}
          </Text>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
            Org: {user?.orgName || 'No Organization'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <TouchableOpacity
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 16,
              backgroundColor: (isAdmin ? currentTab === 'search' : clientCurrentTab === 'search') ? 'rgba(255,255,255,0.2)' : 'transparent',
              marginRight: 8,
            }}
            onPress={() => (isAdmin ? onTabChange('search') : onClientTabChange('search'))}
          >
            <Text style={{ color: 'white', fontWeight: (isAdmin ? currentTab === 'search' : clientCurrentTab === 'search') ? 'bold' : 'normal' }}>
              Search
            </Text>
          </TouchableOpacity>

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
                Org Profile
              </Text>
            </TouchableOpacity>
          )}

          {isClient && (
            <TouchableOpacity
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 16,
                backgroundColor: clientCurrentTab === 'organizations' ? 'rgba(255,255,255,0.2)' : 'transparent',
                marginRight: 8,
                opacity: shouldDisableTabs ? 0.5 : 1,
              }}
              onPress={() => {
                if (!shouldDisableTabs) {
                  onClientTabChange('organizations');
                }
              }}
              disabled={shouldDisableTabs}
            >
              <Text
                style={{
                  color: shouldDisableTabs ? 'rgba(255,255,255,0.5)' : 'white',
                  fontWeight: clientCurrentTab === 'organizations' ? 'bold' : 'normal',
                }}
              >
                Org Profile
              </Text>
            </TouchableOpacity>
          )}

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

          <TouchableOpacity
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 16,
              backgroundColor: (isAdmin ? currentTab === 'chat' : clientCurrentTab === 'chat') ? 'rgba(255,255,255,0.2)' : 'transparent',
              marginRight: 8,
              opacity: shouldDisableTabs ? 0.5 : 1,
            }}
            onPress={() => {
              if (!shouldDisableTabs) {
                isAdmin ? onTabChange('chat') : onClientTabChange('chat');
              }
            }}
            disabled={shouldDisableTabs}
          >
            <Text
              style={{
                color: shouldDisableTabs ? 'rgba(255,255,255,0.5)' : 'white',
                fontWeight: (isAdmin ? currentTab === 'chat' : clientCurrentTab === 'chat') ? 'bold' : 'normal',
              }}
            >
              Chat
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};