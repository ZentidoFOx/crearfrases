"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI, User, LoginCredentials, RegisterData } from '@/lib/api/auth'
import { TokenManager } from '@/lib/utils/token-manager'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check authentication status on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = useCallback(async () => {
    try {
      const token = TokenManager.getAccessToken()
      
      if (!token) {
        setIsLoading(false)
        return
      }

      // Get user from localStorage first (faster UX)
      const cachedUser = TokenManager.getUser()
      if (cachedUser) {
        setUser(cachedUser)
      }

      // Verify token and get fresh user data
      const response = await authAPI.me()
      setUser(response.data)
      TokenManager.saveUser(response.data)
      
    } catch (error) {
      console.error('Auth check failed:', error)
      // Token might be invalid or expired
      TokenManager.clearAll()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const response = await authAPI.login(credentials)
      
      console.log('Login response:', response)

      if (response.success && response.data) {
        // Save tokens
        TokenManager.saveTokens(response.data.access_token, response.data.refresh_token)
        
        // Save user
        TokenManager.saveUser(response.data.user)
        setUser(response.data.user)

        console.log('Login successful, redirecting to /')
        
        // Force a hard navigation to ensure middleware picks up the cookie
        window.location.href = '/'
      } else {
        throw new Error('Login failed: No data received')
      }
    } catch (error: any) {
      console.error('Login failed:', error)
      throw error
    }
  }, [router])

  const register = useCallback(async (data: RegisterData) => {
    try {
      const response = await authAPI.register(data)
      
      console.log('Register response:', response)

      if (response.success && response.data) {
        // Save tokens
        TokenManager.saveTokens(response.data.access_token, response.data.refresh_token)
        
        // Save user
        TokenManager.saveUser(response.data.user)
        setUser(response.data.user)

        console.log('Registration successful, redirecting to /')
        
        // Force a hard navigation to ensure middleware picks up the cookie
        window.location.href = '/'
      } else {
        throw new Error('Registration failed: No data received')
      }
    } catch (error: any) {
      console.error('Registration failed:', error)
      throw error
    }
  }, [router])

  const logout = useCallback(async () => {
    try {
      // Call logout endpoint
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local data regardless of API call result
      TokenManager.clearAll()
      setUser(null)
      router.push('/login')
    }
  }, [router])

  const refreshUser = useCallback(async () => {
    try {
      const response = await authAPI.getProfile()
      setUser(response.data)
      TokenManager.saveUser(response.data)
    } catch (error) {
      console.error('Refresh user failed:', error)
    }
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading: isLoading,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
