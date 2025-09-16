import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

interface Organization {
  orgId: string;
  name: string;
  adminCount: number;
}

interface AuthScreenProps {
  onAuthSuccess: (token: string, user: any) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<'admin' | 'client'>('client');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load organizations on component mount
  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/orgs`);
      setOrganizations(response.data);
      if (response.data.length > 0) {
        setSelectedOrgId(response.data[0].orgId);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
      Alert.alert('Error', 'Failed to load organizations');
    }
  };

  const handleClientAuth = async () => {
    if (!selectedOrgId) {
      Alert.alert('Error', 'Please select an organization');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/client/token`, {
        phone: phone.trim(),
        orgId: selectedOrgId
      });

      onAuthSuccess(response.data.token, response.data.user);
    } catch (error: any) {
      console.error('Client auth error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/admin/login`, {
        email: email.trim(),
        password: password.trim()
      });

      onAuthSuccess(response.data.token, response.data.user);
    } catch (error: any) {
      console.error('Admin login error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminRegister = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/admin/register`, {
        email: email.trim(),
        password: password.trim()
      });

      onAuthSuccess(response.data.token, response.data.user);
    } catch (error: any) {
      console.error('Admin registration error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ padding: 20 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 30 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 }}>
            AI Chatbot
          </Text>
          <Text style={{ fontSize: 16, color: '#6B7280', textAlign: 'center' }}>
            Organizational Version (VO)
          </Text>
        </View>

        {/* Auth Mode Toggle */}
        <View style={{ 
          flexDirection: 'row', 
          backgroundColor: '#F3F4F6', 
          borderRadius: 12, 
          padding: 4, 
          marginBottom: 30 
        }}>
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: authMode === 'client' ? 'white' : 'transparent',
              shadowColor: authMode === 'client' ? '#000' : 'transparent',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: authMode === 'client' ? 2 : 0,
            }}
            onPress={() => setAuthMode('client')}
          >
            <Text style={{ 
              textAlign: 'center', 
              fontWeight: '600', 
              color: authMode === 'client' ? '#1F2937' : '#6B7280' 
            }}>
              Client Access
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: authMode === 'admin' ? 'white' : 'transparent',
              shadowColor: authMode === 'admin' ? '#000' : 'transparent',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: authMode === 'admin' ? 2 : 0,
            }}
            onPress={() => setAuthMode('admin')}
          >
            <Text style={{ 
              textAlign: 'center', 
              fontWeight: '600', 
              color: authMode === 'admin' ? '#1F2937' : '#6B7280' 
            }}>
              Admin Access
            </Text>
          </TouchableOpacity>
        </View>

        {/* Client Authentication */}
        {authMode === 'client' && (
          <View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 20 }}>
              Client Access
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
              Enter your phone number and select your organization to start chatting.
            </Text>

            {/* Organization Selection */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                Select Organization
              </Text>
              <ScrollView style={{ maxHeight: 150, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8 }}>
                {organizations.map((org) => (
                  <TouchableOpacity
                    key={org.orgId}
                    style={{
                      padding: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: '#E5E7EB',
                      backgroundColor: selectedOrgId === org.orgId ? '#EBF8FF' : 'white',
                    }}
                    onPress={() => setSelectedOrgId(org.orgId)}
                  >
                    <Text style={{ 
                      fontWeight: selectedOrgId === org.orgId ? '600' : '400',
                      color: selectedOrgId === org.orgId ? '#1E40AF' : '#374151'
                    }}>
                      {org.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      {org.adminCount} admin{org.adminCount !== 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Phone Input */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                Phone Number
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  fontSize: 16,
                }}
                placeholder="+1234567890"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: selectedOrgId && phone.trim() && !isLoading ? '#3B82F6' : '#D1D5DB',
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={handleClientAuth}
              disabled={!selectedOrgId || !phone.trim() || isLoading}
            >
              <Text style={{ 
                color: selectedOrgId && phone.trim() && !isLoading ? 'white' : '#6B7280', 
                fontSize: 16, 
                fontWeight: '600' 
              }}>
                {isLoading ? 'Connecting...' : 'Start Chatting'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Admin Authentication */}
        {authMode === 'admin' && (
          <View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 20 }}>
              Admin Access
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
              Sign in to manage documents and configure your organization's knowledge base.
            </Text>

            {/* Email Input */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                Email Address
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  fontSize: 16,
                }}
                placeholder="admin@yourcompany.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            {/* Password Input */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                Password
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  fontSize: 16,
                }}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: email.trim() && password.trim() && !isLoading ? '#3B82F6' : '#D1D5DB',
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                onPress={handleAdminLogin}
                disabled={!email.trim() || !password.trim() || isLoading}
              >
                <Text style={{ 
                  color: email.trim() && password.trim() && !isLoading ? 'white' : '#6B7280', 
                  fontSize: 16, 
                  fontWeight: '600' 
                }}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: email.trim() && password.trim() && !isLoading ? '#10B981' : '#D1D5DB',
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                onPress={handleAdminRegister}
                disabled={!email.trim() || !password.trim() || isLoading}
              >
                <Text style={{ 
                  color: email.trim() && password.trim() && !isLoading ? 'white' : '#6B7280', 
                  fontSize: 16, 
                  fontWeight: '600' 
                }}>
                  {isLoading ? 'Creating...' : 'Register'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 12 }}>
              Register creates a new organization with you as admin
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
