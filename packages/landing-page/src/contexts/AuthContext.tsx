'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { API_ENDPOINTS, getAuthHeaders } from '../config/api'

interface User {
  id: string;
  email: string;
  orgId: string;
  orgName: string;
  role: 'admin' | 'client' | 'guest';
  currentRole?: 'admin' | 'client' | 'guest';
  currentOrgId?: string;
  accessibleOrgs?: { [orgId: string]: { role: 'admin' | 'client' | 'guest'; orgName: string; orgDescription?: string; isPublic?: boolean } };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, orgName: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  logout: () => void;
  apiCall: (endpoint: string, options?: RequestInit) => Promise<unknown>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for stored token and user data
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Login failed')
      }

      const data = await response.json()
      
      // Store token and user data
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      setToken(data.token)
      setUser(data.user)
      
      return data
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const register = async (email: string, password: string, orgName: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, orgName }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Registration failed')
      }

      const data = await response.json()
      
      // Only store token and user data if token is provided (email verified)
      if (data.token) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        setToken(data.token)
        setUser(data.user)
      }
      
      return data
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.VERIFY_EMAIL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Email verification failed')
      }

      const data = await response.json()
      
      // Store token and user data
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      setToken(data.token)
      setUser(data.user)
      
      return data
    } catch (error) {
      console.error('Email verification error:', error)
      throw error
    }
  }

  const resendVerification = async (email: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.RESEND_VERIFICATION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to resend verification email')
      }

      return await response.json()
    } catch (error) {
      console.error('Resend verification error:', error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    router.push('/admin/login')
  }

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    if (!token) {
      throw new Error('No authentication token')
    }

    const response = await fetch(endpoint, {
      ...options,
      headers: {
        ...getAuthHeaders(token),
        ...options.headers,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, logout user
        console.log('Token expired, logging out user')
        logout()
        throw new Error('Session expired. Please login again.')
      }
      
      let errorMessage = `API call failed: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch {
        // If we can't parse the error, use the default message
      }
      
      throw new Error(errorMessage)
    }

    return response.json()
  }

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    verifyEmail,
    resendVerification,
    logout,
    apiCall,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
