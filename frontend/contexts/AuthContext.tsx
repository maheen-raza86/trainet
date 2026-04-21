'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, User, LoginData, SignupData } from '@/lib/api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Clear every piece of auth state from storage */
function clearAuthStorage() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // NOTE: do NOT remove 'redirect_after_login' here — it must survive the
  // login() call so the post-login redirect useEffect can consume it.
  sessionStorage.clear();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token and user from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      }
    } catch {
      // Corrupted storage — clear it
      clearAuthStorage();
    }
    setIsLoading(false);
  }, []);

  const login = async (data: LoginData) => {
    // Always clear stale state before a new login so a previous user's
    // token never bleeds into the new session.
    clearAuthStorage();
    setToken(null);
    setUser(null);

    try {
      const response = await authAPI.login(data);

      if (response.success && response.data) {
        const { accessToken, user: userData } = response.data;
        setToken(accessToken);
        setUser(userData);
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('[AuthContext] login error:', error);
      // Re-throw so the login page can display the real message
      throw error;
    }
  };

  const signup = async (data: SignupData) => {
    try {
      const response = await authAPI.signup(data);
      if (!response.success) {
        throw new Error(response.message || 'Signup failed');
      }
    } catch (error: any) {
      console.error('[AuthContext] signup error:', error);
      throw error;
    }
  };

  const logout = () => {
    // Clear React state
    setToken(null);
    setUser(null);
    // Clear all storage
    clearAuthStorage();
    // Also tell the backend to sign out from Supabase (fire-and-forget)
    authAPI.logout().catch(() => { /* non-blocking */ });
  };

  const setUserWithStorage = (userData: User | null) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('user');
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    signup,
    logout,
    setUser: setUserWithStorage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
