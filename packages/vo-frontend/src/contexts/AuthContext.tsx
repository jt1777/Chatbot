import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

interface User {
  id: string;
  orgId: string;
  role: 'org_admin' | 'client';
  email?: string;
  phone?: string;
  orgName?: string;
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
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      
      setToken(null);
      setUser(null);
      
      // Remove axios authorization header
      delete axios.defaults.headers.common['Authorization'];
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

  const isAdmin = user?.role === 'org_admin';
  const isClient = user?.role === 'client';

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
    updateUser,
    isAdmin,
    isClient,
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
