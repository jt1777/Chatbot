import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

interface Organization {
  orgId: string;
  name: string;
  adminCount: number;
  isPublic?: boolean;
  userRole?: 'admin' | 'client' | 'guest';
}

interface AuthScreenProps {
  onAuthSuccess: (token: string, user: any) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const { login, loginMultiRole, isLoading: authContextLoading } = useAuth();
  
  // Intercept onAuthSuccess to show organization selection
  const handleAuthSuccess = (token: string, user: any) => {
    handlePostLogin(user);
    onAuthSuccess(token, user);
  };

  // Override the login function to use our custom flow
  const customLogin = async (token: string, user: any) => {
    handlePostLogin(user);
    onAuthSuccess(token, user);
  };
  
  // Unified flow state
  const [authFlow, setAuthFlow] = useState<'login' | 'organizationSelection'>('login');
  const [userData, setUserData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Organization[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  
  const [authMode, setAuthMode] = useState<'admin' | 'client'>('client');
  const [adminMode, setAdminMode] = useState<'create' | 'join' | 'login'>('login');
  const [clientMode, setClientMode] = useState<'guest' | 'register' | 'invitation'>('guest');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [invitePassword, setInvitePassword] = useState<string>('');
  const [inviteConfirmPassword, setInviteConfirmPassword] = useState<string>('');
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
  
  // Client validation helpers
  const isClientGuestValid = !isProcessing; // Guest can always start chatting
  const isClientRegisterValid = clientEmail.trim() && password.trim() && confirmPassword.trim() && password === confirmPassword && !isProcessing;
  const isClientInvitationValid = inviteEmail.trim() && invitePassword.trim() && inviteConfirmPassword.trim() && invitePassword === inviteConfirmPassword && inviteCode.trim() && !isProcessing;

  // Unified multi-role login
  const handleMultiRoleLogin = async (email: string, password: string, preferredOrgId?: string) => {
    try {
      setIsLoading(true);
      await loginMultiRole(email, password, preferredOrgId);
      // The AuthContext will handle the rest
    } catch (error: any) {
      console.error('Multi-role login error:', error);
      Alert.alert('Login Error', error.response?.data?.error || error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced login that works for both admin and client flows
  const handleUnifiedLogin = async (email: string, password: string, preferredOrgId?: string) => {
    try {
      setIsLoading(true);
      await loginMultiRole(email, password, preferredOrgId);
      // The AuthContext will handle the rest
    } catch (error: any) {
      console.error('Unified login error:', error);
      Alert.alert('Login Error', error.response?.data?.error || error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Post-login flow - all users go to organization selection
  const handlePostLogin = (user: any) => {
    setUserData(user);
    setAuthFlow('organizationSelection');
    // Load user's organizations for the "My Organizations" section
    loadUserOrganizations();
  };

  // Load user's organizations for the "My Organizations" section
  const loadUserOrganizations = async () => {
    if (!userData?.accessibleOrgs) return;
    
    const userOrgs: Organization[] = [];
    for (const [orgId, orgAccess] of Object.entries(userData.accessibleOrgs)) {
      const access = orgAccess as any;
      try {
        const response = await axios.get(`${API_BASE_URL}/api/org/${orgId}`);
        if (response.data) {
          userOrgs.push({
            orgId: orgId,
            name: response.data.name,
            adminCount: response.data.adminCount || 0,
            isPublic: response.data.isPublic,
            userRole: access.role
          });
        }
      } catch (error) {
        console.error('Error loading organization details:', error);
      }
    }
    setOrganizations(userOrgs);
  };

  // Search organizations
  const searchOrganizations = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await axios.get(`${API_BASE_URL}/api/orgs/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Load organizations on component mount
  // Organizations are now loaded in OrganizationSelectionScreen after login

  // Handle organization selection
  const handleSelectOrganization = (orgId: string) => {
    // Switch to the selected organization
    // This will be handled by the AuthContext switchOrganization method
    handleAuthSuccess('', userData); // Pass the current user data
  };

  // Handle joining an organization
  const handleJoinOrganization = (orgId: string) => {
    // For now, just show an alert - this will be implemented later
    Alert.alert('Join Organization', `Would you like to join this organization?`);
  };

  // Render unified organization selection screen
  const renderOrganizationSelection = () => {
    const userOrgs = organizations.filter(org => org.userRole);
    const isGuest = userData?.currentRole === 'guest' || userData?.role === 'guest';

    return (
      <ScrollView style={{ flex: 1, padding: 16, backgroundColor: '#F9FAFB' }}>
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 }}>
            Welcome back!
          </Text>
          <Text style={{ fontSize: 16, color: '#6B7280', marginBottom: 24 }}>
            {userData?.email}
          </Text>
        </View>

        {/* Search Organizations */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
            Search Organizations
          </Text>
          <TextInput
            style={{
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#D1D5DB',
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              color: '#1F2937',
            }}
            placeholder="Search for organizations..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              searchOrganizations(text);
            }}
          />
          
          {/* Search Results */}
          {searchQuery.trim() && (
            <View style={{ marginTop: 12 }}>
              {isSearching ? (
                <Text style={{ textAlign: 'center', color: '#6B7280', padding: 16 }}>
                  Searching...
                </Text>
              ) : searchResults.length > 0 ? (
                searchResults.map((org) => (
                  <TouchableOpacity
                    key={org.orgId}
                    style={{
                      backgroundColor: '#FFFFFF',
                      padding: 16,
                      borderRadius: 8,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                    }}
                    onPress={() => handleJoinOrganization(org.orgId)}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 }}>
                      {org.name}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>
                      {org.isPublic ? 'Public' : 'Private'} • {org.adminCount} admins
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={{ textAlign: 'center', color: '#6B7280', padding: 16 }}>
                  No organizations found
                </Text>
              )}
            </View>
          )}
        </View>

        {/* My Organizations */}
        {!isGuest && userOrgs.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
              My Organizations
            </Text>
            {userOrgs.map((org) => (
              <TouchableOpacity
                key={org.orgId}
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: 16,
                  borderRadius: 8,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                }}
                onPress={() => handleSelectOrganization(org.orgId)}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 }}>
                      {org.name}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>
                      {org.isPublic ? 'Public' : 'Private'} • {org.adminCount} admins
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: org.userRole === 'admin' ? '#DC2626' : '#2563EB',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: 'white' }}>
                      {org.userRole?.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={{ marginBottom: 24 }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#3B82F6',
              padding: 16,
              borderRadius: 8,
              marginBottom: 12,
              alignItems: 'center',
            }}
            onPress={() => setAuthMode('admin')}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              Create New Organization
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: '#FFFFFF',
              padding: 16,
              borderRadius: 8,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#D1D5DB',
            }}
            onPress={() => setClientMode('invitation')}
          >
            <Text style={{ color: '#374151', fontSize: 16, fontWeight: '600' }}>
              Join with Invite Code
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
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

  const handleClientGuest = async () => {
    try {
      setIsLoading(true);
      
      // Call the backend to create a proper guest user
      const response = await axios.post(`${API_BASE_URL}/api/auth/guest`, {
        // No organization selection - guest will have no organization initially
      });

      await login(response.data.token, response.data.user);
    } catch (error: any) {
      console.error('Guest access error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to start guest session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientLogin = async () => {
    if (!selectedOrgId) {
      Alert.alert('Error', 'Please select an organization');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/auth/client/token`, {
        phone: phone.trim(),
        orgId: selectedOrgId
      });

      await login(response.data.token, response.data.user);
    } catch (error: any) {
      console.error('Client login error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientRegister = async () => {
    if (!clientEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/auth/client/register`, {
        email: clientEmail.trim(),
        password: password.trim()
      });

      await login(response.data.token, response.data.user);
    } catch (error: any) {
      console.error('Client register error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientInvitation = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    if (!invitePassword.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    if (invitePassword !== inviteConfirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/auth/client/invitation`, {
        email: inviteEmail.trim(),
        password: invitePassword.trim(),
        inviteCode: inviteCode.trim()
      });

      await login(response.data.token, response.data.user);
    } catch (error: any) {
      console.error('Client invitation error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Invitation failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Unified registration function for all user types
  const handleUnifiedRegister = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    if (!confirmPassword.trim() || password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      setIsLoading(true);
      
      // Register as a basic user (client) - they can create/join organizations later
      const response = await axios.post(`${API_BASE_URL}/api/auth/client/register`, {
        email: email.trim(),
        password: password.trim()
      });

      // Use the multi-role login to handle the response
      await handleUnifiedLogin(email.trim(), password.trim());
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error || 'Registration failed';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      await handleMultiRoleLogin(email.trim(), password.trim());
      // After successful login, show organization selection
      // The AuthContext will handle the actual authentication
    } catch (error: any) {
      console.error('Admin login error:', error);
      const errorMessage = error.response?.data?.error || 'Login failed';
      
      // Provide specific error message for unregistered email
      if (errorMessage === 'Invalid email or password') {
        Alert.alert('Error', 'Please register as an Admin by creating an organization');
      } else {
        Alert.alert('Error', errorMessage);
      }
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

  // Show organization selection screen if user is logged in
  if (authFlow === 'organizationSelection') {
    return renderOrganizationSelection();
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ padding: 20 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 30 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 }}>
            Ask Akasha
          </Text>
          <Text style={{ fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 8 }}>
            Cloud Version 0.1
          </Text>
          <Text style={{ fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 8 }}>
          Build a specialized knowledge base.
          </Text>
          <Text style={{ fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 8 }}>
          Analyze using state of the art AI.  
          </Text>
          <Text style={{ fontSize: 16, color: '#6B7280', textAlign: 'center' }}>
          Share with friends and colleagues.  
          </Text>
        </View>

        {/* Single Login Form */}
        <View style={{ marginBottom: 30 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 }}>
            {isRegistering ? 'Create Account' : 'Sign In'}
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
            {isRegistering ? 'Create a new account to get started.' : 'Enter your email and password to access your organizations.'}
          </Text>

          {/* Email Input */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
              Email Address
            </Text>
            <TextInput
              style={{
                backgroundColor: '#F9FAFB',
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                color: '#1F2937',
              }}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isProcessing}
            />
          </View>

          {/* Password Input */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
              Password
            </Text>
            <TextInput
              style={{
                backgroundColor: '#F9FAFB',
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                color: '#1F2937',
              }}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isProcessing}
            />
          </View>

          {/* Confirm Password Input - Only show in register mode */}
          {isRegistering && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                Confirm Password
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#F9FAFB',
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: '#1F2937',
                }}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!isProcessing}
              />
            </View>
          )}

          {/* Login/Register Button */}
          <TouchableOpacity
            style={{
              backgroundColor: (isRegistering ? (email.trim() && password.trim() && confirmPassword.trim() && password === confirmPassword) : isLoginValid) ? '#3B82F6' : '#D1D5DB',
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center',
              marginBottom: 16,
            }}
            onPress={isRegistering ? handleUnifiedRegister : handleAdminLogin}
            disabled={isRegistering ? !(email.trim() && password.trim() && confirmPassword.trim() && password === confirmPassword && !isProcessing) : !isLoginValid}
          >
            <Text style={{ 
              color: (isRegistering ? (email.trim() && password.trim() && confirmPassword.trim() && password === confirmPassword) : isLoginValid) ? 'white' : '#6B7280', 
              fontSize: 16, 
              fontWeight: '600' 
            }}>
              {isProcessing ? (isRegistering ? 'Creating Account...' : 'Signing In...') : (isRegistering ? 'Create Account' : 'Sign In')}
            </Text>
          </TouchableOpacity>

          {/* Guest and Registration Options */}
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}
            </Text>
            
            {/* Login as Guest Button - Only show in login mode */}
            {!isRegistering && (
              <TouchableOpacity
                style={{
                  backgroundColor: '#F3F4F6',
                  padding: 16,
                  borderRadius: 8,
                  marginBottom: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#9CA3AF',
                }}
                onPress={handleClientGuest}
                disabled={isProcessing}
              >
                <Text style={{ color: '#4B5563', fontSize: 16, fontWeight: '600' }}>
                  {isProcessing ? 'Starting Guest Session...' : 'Login as Guest'}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={{
                backgroundColor: '#FFFFFF',
                padding: 16,
                borderRadius: 8,
                marginBottom: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#D1D5DB',
              }}
              onPress={() => {
                setIsRegistering(!isRegistering);
                // Clear form when switching modes
                setEmail('');
                setPassword('');
                setConfirmPassword('');
              }}
            >
              <Text style={{ color: '#374151', fontSize: 16, fontWeight: '600' }}>
                {isRegistering ? 'Sign In Instead' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: '#FFFFFF',
                padding: 16,
                borderRadius: 8,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#D1D5DB',
              }}
              onPress={() => setClientMode('invitation')}
            >
              <Text style={{ color: '#374151', fontSize: 16, fontWeight: '600' }}>
                Join with Invite Code
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Legacy Client Authentication - Hidden */}
        {false && authMode === 'client' && (
          <View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 20 }}>
              Client Access
            </Text>

            {/* Client Tabs */}
            <View style={{ 
              flexDirection: 'row', 
              backgroundColor: '#F3F4F6', 
              borderRadius: 8, 
              padding: 4, 
              marginBottom: 20 
            }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  backgroundColor: clientMode === 'guest' ? 'white' : 'transparent',
                  shadowColor: clientMode === 'guest' ? '#000' : 'transparent',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: clientMode === 'guest' ? 2 : 0,
                }}
                onPress={() => setClientMode('guest')}
              >
                <Text style={{ 
                  textAlign: 'center', 
                  fontWeight: '600', 
                  color: clientMode === 'guest' ? '#1F2937' : '#6B7280' 
                }}>
                  Guest
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  backgroundColor: clientMode === 'register' ? 'white' : 'transparent',
                  shadowColor: clientMode === 'register' ? '#000' : 'transparent',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: clientMode === 'register' ? 2 : 0,
                }}
                onPress={() => setClientMode('register')}
              >
                <Text style={{ 
                  textAlign: 'center', 
                  fontWeight: '600', 
                  color: clientMode === 'register' ? '#1F2937' : '#6B7280' 
                }}>
                  Register
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  backgroundColor: clientMode === 'invitation' ? 'white' : 'transparent',
                  shadowColor: clientMode === 'invitation' ? '#000' : 'transparent',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: clientMode === 'invitation' ? 2 : 0,
                }}
                onPress={() => setClientMode('invitation')}
              >
                <Text style={{ 
                  textAlign: 'center', 
                  fontWeight: '600', 
                  color: clientMode === 'invitation' ? '#1F2937' : '#6B7280' 
                }}>
                  By Invitation
                </Text>
              </TouchableOpacity>
            </View>

            {/* Client Guest Tab */}
            {clientMode === 'guest' && (
              <View>
                <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
                  Start chatting immediately as a guest. You can select an organization after logging in.
                </Text>

                {/* Guest User Display */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                    User Type
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: '#D1D5DB',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      fontSize: 16,
                      backgroundColor: '#F9FAFB',
                      color: '#6B7280',
                    }}
                    value="Guest"
                    editable={false}
                  />
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor: isClientGuestValid ? '#3B82F6' : '#D1D5DB',
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={handleClientGuest}
                  disabled={!isClientGuestValid}
                >
                  <Text style={{ 
                    color: isClientGuestValid ? 'white' : '#6B7280', 
                    fontSize: 16, 
                    fontWeight: '600' 
                  }}>
                    {isProcessing ? 'Starting...' : 'Start Chatting'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Client Register Tab */}
            {clientMode === 'register' && (
              <View>
                <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
                  Create a new account with email and password.
                </Text>

                {/* Email Input */}
                <View style={{ marginBottom: 20 }}>
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
                    placeholder="Enter email address"
                    value={clientEmail}
                    onChangeText={setClientEmail}
                    editable={!isProcessing}
                    keyboardType="email-address"
                    autoCapitalize="none"
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
                    placeholder="Enter password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    editable={!isProcessing}
                  />
                </View>

                {/* Confirm Password Input */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                    Confirm Password
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: password === confirmPassword ? '#D1D5DB' : '#EF4444',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      fontSize: 16,
                    }}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    editable={!isProcessing}
                  />
                  {password !== confirmPassword && confirmPassword.length > 0 && (
                    <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>
                      Passwords do not match
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor: isClientRegisterValid ? '#3B82F6' : '#D1D5DB',
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={handleClientRegister}
                  disabled={!isClientRegisterValid}
                >
                  <Text style={{ 
                    color: isClientRegisterValid ? 'white' : '#6B7280', 
                    fontSize: 16, 
                    fontWeight: '600' 
                  }}>
                    {isProcessing ? 'Registering...' : 'Register & Start Chatting'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Client Invitation Tab */}
            {clientMode === 'invitation' && (
              <View>
                <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
                  Join a private organization using an invite code with email and password.
                </Text>

                {/* Email Input */}
                <View style={{ marginBottom: 20 }}>
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
                    placeholder="Enter email address"
                    value={inviteEmail}
                    onChangeText={setInviteEmail}
                    editable={!isProcessing}
                    keyboardType="email-address"
                    autoCapitalize="none"
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
                    placeholder="Enter password"
                    value={invitePassword}
                    onChangeText={setInvitePassword}
                    secureTextEntry
                    editable={!isProcessing}
                  />
                </View>

                {/* Confirm Password Input */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                    Confirm Password
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: invitePassword === inviteConfirmPassword ? '#D1D5DB' : '#EF4444',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      fontSize: 16,
                    }}
                    placeholder="Confirm password"
                    value={inviteConfirmPassword}
                    onChangeText={setInviteConfirmPassword}
                    secureTextEntry
                    editable={!isProcessing}
                  />
                  {invitePassword !== inviteConfirmPassword && inviteConfirmPassword.length > 0 && (
                    <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>
                      Passwords do not match
                    </Text>
                  )}
                </View>

                {/* Invite Code Input */}
                <View style={{ marginBottom: 20 }}>
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
                    placeholder="Enter invite code"
                    value={inviteCode}
                    onChangeText={setInviteCode}
                    editable={!isProcessing}
                  />
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor: isClientInvitationValid ? '#3B82F6' : '#D1D5DB',
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={handleClientInvitation}
                  disabled={!isClientInvitationValid}
                >
                  <Text style={{ 
                    color: isClientInvitationValid ? 'white' : '#6B7280', 
                    fontSize: 16, 
                    fontWeight: '600' 
                  }}>
                    {isProcessing ? 'Joining...' : 'Join with Invite Code'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Legacy Admin Authentication - Hidden */}
        {false && authMode === 'admin' && (
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
