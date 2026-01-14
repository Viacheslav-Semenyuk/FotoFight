import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

interface AuthContextType {
  user: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithApple: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const initSession = async () => {
      try {
        const currentSession = await authService.getSession();
        setSession(currentSession);
        
        // Only get user if session exists
        if (currentSession) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error initializing session:', error);
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // Listen to auth state changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session) {
          try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
          } catch (error) {
            console.error('Error getting user on auth state change:', error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const result = await authService.signInWithGoogle();
    return {
      success: result.success,
      error: result.error,
    };
  };

  const signInWithApple = async () => {
    const result = await authService.signInWithApple();
    return {
      success: result.success,
      error: result.error,
    };
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
  };

  const deleteAccount = async () => {
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      console.log('AuthContext: Starting account deletion for user:', user.id);
      // Delete user account and all data
      const response = await userService.deleteAccount(user.id);
      console.log('AuthContext: userService.deleteAccount response:', response);
      
      if (!response.success || response.error) {
        return { success: false, error: response.error || 'Failed to delete account' };
      }

      // Sign out the user after account deletion
      console.log('AuthContext: Account deleted, signing out...');
      await authService.signOut();
      setUser(null);
      setSession(null);

      return { success: true };
    } catch (error) {
      console.error('AuthContext: Delete account error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete account',
      };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithApple,
    signOut,
    deleteAccount,
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
