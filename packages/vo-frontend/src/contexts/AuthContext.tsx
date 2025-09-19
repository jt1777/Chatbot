import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

interface User {
  id: string;
  orgId: string; // Legacy field for backward compatibility
  role: 'org_admin' | 'client' | 'guest'; // Legacy field for backward compatibility
  email?: string;
  phone?: string;
  orgName?: string;
  // New multi-role fields
  currentOrgId?: string;
  currentRole?: 'admin' | 'client' | 'guest';
  accessibleOrgs?: { [orgId: string]: { role: 'admin' | 'client' | 'guest'; orgName: string; orgDescription?: string; isPublic?: boolean } };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (token: string, user: User) => Promise<void>;
  isAdmin: boolean;
  isClient: boolean;
  // Multi-role methods
  loginMultiRole: (email: string, password: string, preferredOrgId?: string) => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
  getAccessibleOrganizations: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStoredAuth = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Verify token is still valid
        try {
          await axios.post(`${API_BASE_URL}/api/auth/verify`, {}, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
        } catch (error) {
          // Token is invalid, clear stored auth
          await logout();
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load stored auth data on app start
  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  const login = async (newToken: string, newUser: User) => {
    try {
      await AsyncStorage.setItem('auth_token', newToken);
      await AsyncStorage.setItem('auth_user', JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);
      
      // Set default axios authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error) {
      console.error('Error saving auth data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint to clean up guest records
      if (token) {
        try {
          await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'ngrok-skip-browser-warning': 'true'
            }
          });
          //console.log('🗑️ Backend logout completed');
        } catch (error) {
          console.error('Backend logout error (continuing anyway):', error);
          // Continue with frontend cleanup even if backend logout fails
        }
      }

      // Clear frontend storage
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      
      setToken(null);
      setUser(null);
      
      // Remove axios authorization header
      delete axios.defaults.headers.common['Authorization'];
      
      //console.log('✅ Frontend logout completed');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  const updateUser = async (newToken: string, newUser: User) => {
    try {
      await AsyncStorage.setItem('auth_token', newToken);
      await AsyncStorage.setItem('auth_user', JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);
      
      // Update axios authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  // Multi-role login
  const loginMultiRole = useCallback(async (email: string, password: string, preferredOrgId?: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/multi-role/login`, {
        email,
        password,
        preferredOrgId
      });

      const { token: newToken, user: newUser } = response.data;
      await login(newToken, newUser);
    } catch (error: any) {
      console.error('Multi-role login error:', error);
      throw error;
    }
  }, [login]);

  // Switch organization
  const switchOrganization = useCallback(async (orgId: string) => {
    if (!token) {
      throw new Error('No authentication token');
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/multi-role/switch-organization`, {
        orgId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { token: newToken, user: newUser } = response.data;
      await updateUser(newToken, newUser);
    } catch (error: any) {
      console.error('Switch organization error:', error);
      throw error;
    }
  }, [token, updateUser]);

  // Get accessible organizations
  const getAccessibleOrganizations = useCallback(async () => {
    if (!token) {
      throw new Error('No authentication token');
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/multi-role/organizations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Get organizations error:', error);
      throw error;
    }
  }, [token]);

  // Role checking with multi-role support
  const isAdmin = user?.currentRole === 'admin' || user?.role === 'org_admin';
  const isClient = user?.currentRole === 'client' || user?.currentRole === 'guest' || user?.role === 'client' || user?.role === 'guest';

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
    updateUser,
    isAdmin,
    isClient,
    loginMultiRole,
    switchOrganization,
    getAccessibleOrganizations,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
