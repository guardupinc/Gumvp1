// ============================================================================
// AUTHENTICATION HOOK
// ============================================================================
// Custom React hook for managing authentication state and operations

import { useState, useEffect } from 'react';
import { api, getStoredUser, setStoredUser, clearAuthData } from '../utils/api';
import type { UserProfile } from '../utils/api';

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we have a stored token
      const token = api.getAccessToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Validate the session with the backend
      const response = await api.getSession();
      
      if (response.success && response.user) {
        setUser(response.user);
        setStoredUser(response.user);
      } else {
        // Invalid session, clear auth data
        clearAuthData();
        setUser(null);
      }
    } catch (err) {
      console.error('Session check error:', err);
      // Clear invalid session
      clearAuthData();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: 'SECURITY_ADMIN' | 'GUARD' | 'COMPANY_ADMIN',
    guardId?: number
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.signUp(email, password, name, role, guardId);

      if (response.success && response.user) {
        // After signup, automatically sign in
        const signInResponse = await api.signIn(email, password);
        
        if (signInResponse.success && signInResponse.user) {
          setUser(signInResponse.user);
          setStoredUser(signInResponse.user);
          return { success: true, user: signInResponse.user };
        }
      }

      throw new Error(response.error || 'Sign up failed');
    } catch (err: any) {
      const errorMessage = err.message || 'Sign up failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.signIn(email, password);

      if (response.success && response.user) {
        setUser(response.user);
        setStoredUser(response.user);
        return { success: true, user: response.user };
      }

      throw new Error(response.error || 'Sign in failed');
    } catch (err: any) {
      const errorMessage = err.message || 'Sign in failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);

      await api.signOut();
      clearAuthData();
      setUser(null);

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Sign out failed';
      setError(errorMessage);
      console.error('Sign out error:', err);
      
      // Even if server sign out fails, clear local data
      clearAuthData();
      setUser(null);
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    checkSession,
    isAuthenticated: user !== null,
  };
}
