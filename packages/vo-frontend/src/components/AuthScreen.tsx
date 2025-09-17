import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

interface Organization {
  orgId: string;
  name: string;
  adminCount: number;
}

interface AuthScreenProps {
  onAuthSuccess: (token: string, user: any) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const { login, isLoading: authContextLoading } = useAuth();
  const [authMode, setAuthMode] = useState<'admin' | 'client'>('client');
  const [adminMode, setAdminMode] = useState<'create' | 'join' | 'login'>('login');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [orgName, setOrgName] = useState<string>('');
  const [inviteCode, setInviteCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isProcessing = isLoading || authContextLoading;

  // Validation helpers
  const isLoginValid = email.trim() && password.trim() && !isProcessing;
  const isRegisterValid = () => {
    if (!email.trim() || !password.trim() || isProcessing) return false;
    if (adminMode === 'create') return orgName.trim();
    if (adminMode === 'join') return inviteCode.trim();
    return true;
  };

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

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/client/token`, {
        phone: phone.trim(),
        orgId: selectedOrgId
      });

      await login(response.data.token, response.data.user);
    } catch (error: any) {
      console.error('Client auth error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Authentication failed');
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

      await login(response.data.token, response.data.user);
    } catch (error: any) {
      console.error('Admin login error:', error);
      const errorMessage = error.response?.data?.error || 'Login failed';
      
      // Provide specific error message for unregistered email
      if (errorMessage === 'Invalid email or password') {
        Alert.alert('Error', 'Please register as an Admin by creating an organization');
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminRegister = async () => {
    console.log('Register button clicked!', { email: email.trim(), password: password.trim(), adminMode });
    
    if (!email.trim() || !password.trim()) {
      console.log('Validation failed: missing email or password');
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    if (password.length < 6) {
      console.log('Validation failed: password too short');
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (adminMode === 'create' && !orgName.trim()) {
      Alert.alert('Error', 'Please enter an organization name');
      return;
    }

    if (adminMode === 'join' && !inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    console.log('Starting registration...');
    setIsLoading(true);
    try {
      if (adminMode === 'create') {
        // Create new organization
        console.log('Creating new organization...');
        const response = await axios.post(`${API_BASE_URL}/api/auth/admin/register`, {
          email: email.trim(),
          password: password.trim(),
          orgName: orgName.trim()
        });

        console.log('Registration successful:', response.data);
        await login(response.data.token, response.data.user);
        Alert.alert('Success', 'Organization and account created successfully!');
      } else {
        // Join existing organization
        console.log('Joining existing organization...');
        const response = await axios.post(`${API_BASE_URL}/api/org/join`, {
          email: email.trim(),
          password: password.trim(),
          inviteCode: inviteCode.trim()
        });

        console.log('Join successful:', response.data);
        await login(response.data.token, response.data.user);
        Alert.alert('Success', 'Successfully joined the organization!');
      }
    } catch (error: any) {
      console.error('Admin registration error:', error);
      const errorMessage = error.response?.data?.error || 'Registration failed';
      
      // Provide specific error message for duplicate organization name
      if (errorMessage === 'Organization name has already been taken') {
        Alert.alert('Error', 'Organization name has already been taken');
      } else if (errorMessage === 'Email and organization has already been created') {
        Alert.alert('Error', 'Email and organization has already been created');
      } else {
        Alert.alert('Error', errorMessage);
      }
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
                editable={!isProcessing}
              />
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: selectedOrgId && phone.trim() && !isProcessing ? '#3B82F6' : '#D1D5DB',
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={handleClientAuth}
                disabled={!selectedOrgId || !phone.trim() || isProcessing}
            >
              <Text style={{ 
                color: selectedOrgId && phone.trim() && !isProcessing ? 'white' : '#6B7280', 
                fontSize: 16, 
                fontWeight: '600' 
              }}>
                {isProcessing ? 'Connecting...' : 'Start Chatting'}
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

            {/* Admin Mode Toggle */}
            <View style={{ 
              flexDirection: 'row', 
              backgroundColor: '#F3F4F6', 
              borderRadius: 10, 
              padding: 4, 
              marginBottom: 20 
            }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: adminMode === 'login' ? 'white' : 'transparent',
                  shadowColor: adminMode === 'login' ? '#000' : 'transparent',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: adminMode === 'login' ? 2 : 0,
                }}
                onPress={() => setAdminMode('login')}
              >
                <Text style={{ 
                  textAlign: 'center', 
                  fontWeight: '600', 
                  color: adminMode === 'login' ? '#1F2937' : '#6B7280' 
                }}>
                  Login
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: adminMode === 'create' ? 'white' : 'transparent',
                  shadowColor: adminMode === 'create' ? '#000' : 'transparent',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: adminMode === 'create' ? 2 : 0,
                }}
                onPress={() => setAdminMode('create')}
              >
                <Text style={{ 
                  textAlign: 'center', 
                  fontWeight: '600', 
                  color: adminMode === 'create' ? '#1F2937' : '#6B7280' 
                }}>
                  Create Organization
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: adminMode === 'join' ? 'white' : 'transparent',
                  shadowColor: adminMode === 'join' ? '#000' : 'transparent',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: adminMode === 'join' ? 2 : 0,
                }}
                onPress={() => setAdminMode('join')}
              >
                <Text style={{ 
                  textAlign: 'center', 
                  fontWeight: '600', 
                  color: adminMode === 'join' ? '#1F2937' : '#6B7280' 
                }}>
                  Join Organization
                </Text>
              </TouchableOpacity>
            </View>

            {/* Email Input - Show for all tabs */}
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
                editable={!isProcessing}
              />
            </View>

            {/* Password Input - Show for all tabs */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                Password (min 6 characters)
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
                editable={!isProcessing}
              />
            </View>

            {/* Organization Name Input (Create Mode) */}
            {adminMode === 'create' && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                  Organization Name
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
                  placeholder="XYZ Organization"
                  value={orgName}
                  onChangeText={setOrgName}
                  editable={!isProcessing}
                />
              </View>
            )}

            {/* Invite Code Input (Join Mode) */}
            {adminMode === 'join' && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                  Invite Code
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
                  placeholder="ABC12345"
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  autoCapitalize="characters"
                  editable={!isProcessing}
                />
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                  Get this code from your organization admin
                </Text>
              </View>
            )}

            {/* Action Button - Single button per tab */}
            <View>
              {adminMode === 'login' && (
                <TouchableOpacity
                  style={{
                    backgroundColor: isLoginValid ? '#3B82F6' : '#D1D5DB',
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={handleAdminLogin}
                  disabled={!isLoginValid}
                >
                  <Text style={{ 
                    color: isLoginValid ? 'white' : '#6B7280', 
                    fontSize: 16, 
                    fontWeight: '600' 
                  }}>
                    {isProcessing ? 'Signing In...' : 'Login'}
                  </Text>
                </TouchableOpacity>
              )}

              {adminMode === 'create' && (
                <TouchableOpacity
                  style={{
                    backgroundColor: isRegisterValid() ? '#10B981' : '#D1D5DB',
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={handleAdminRegister}
                  disabled={!isRegisterValid()}
                >
                  <Text style={{ 
                    color: isRegisterValid() ? 'white' : '#6B7280', 
                    fontSize: 16, 
                    fontWeight: '600' 
                  }}>
                    {isProcessing ? 'Creating...' : 'Create Org'}
                  </Text>
                </TouchableOpacity>
              )}

              {adminMode === 'join' && (
                <TouchableOpacity
                  style={{
                    backgroundColor: isRegisterValid() ? '#10B981' : '#D1D5DB',
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={handleAdminRegister}
                  disabled={!isRegisterValid()}
                >
                  <Text style={{ 
                    color: isRegisterValid() ? 'white' : '#6B7280', 
                    fontSize: 16, 
                    fontWeight: '600' 
                  }}>
                    {isProcessing ? 'Joining...' : 'Join Org'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 12 }}>
              {adminMode === 'login' && 'Sign in to an existing organization'}
              {adminMode === 'create' && 'Create a new organization with you as admin'}
              {adminMode === 'join' && 'Join an existing organization using an invite code'}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
