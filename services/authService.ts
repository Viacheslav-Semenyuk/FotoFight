import { supabase } from './supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Complete the OAuth session for better UX
WebBrowser.maybeCompleteAuthSession();

export interface AuthResponse {
  success: boolean;
  data?: {
    user: SupabaseUser;
    session: Session;
  };
  error?: string;
}

// Get redirect URL based on platform
// IMPORTANT: This URL must be added to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
const getRedirectUrl = () => {
  if (Platform.OS === 'web') {
    // For web, use the current origin with the callback path
    // Make sure this exact URL is added in Supabase Dashboard
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/auth/callback`;
    }
    // Fallback for SSR
    return 'http://localhost:8081/auth/callback';
  }
  // For native, use the app scheme (must match app.json scheme)
  // Make sure this exact URL is added in Supabase Dashboard
  return 'foto-fight://auth/callback';
};

// Helper function to extract tokens from OAuth callback URL
const extractTokensFromUrl = (url: string): { accessToken: string | null; refreshToken: string | null } => {
  // Parse URL - Supabase may use hash fragments (#) instead of query params (?)
  const hashMatch = url.match(/#access_token=([^&]+)&refresh_token=([^&]+)/);
  const queryMatch = url.match(/[?&]access_token=([^&]+)[&]refresh_token=([^&]+)/);
  
  let accessToken: string | null = null;
  let refreshToken: string | null = null;
  
  if (hashMatch) {
    accessToken = decodeURIComponent(hashMatch[1]);
    refreshToken = decodeURIComponent(hashMatch[2]);
  } else if (queryMatch) {
    accessToken = decodeURIComponent(queryMatch[1]);
    refreshToken = decodeURIComponent(queryMatch[2]);
  } else {
    // Try parsing as URL
    try {
      const parsedUrl = new URL(url);
      accessToken = parsedUrl.searchParams.get('access_token') || parsedUrl.hash.match(/access_token=([^&]+)/)?.[1] || null;
      refreshToken = parsedUrl.searchParams.get('refresh_token') || parsedUrl.hash.match(/refresh_token=([^&]+)/)?.[1] || null;
    } catch (e) {
      // URL parsing failed, try manual extraction
      const accessTokenMatch = url.match(/access_token=([^&]+)/);
      const refreshTokenMatch = url.match(/refresh_token=([^&]+)/);
      accessToken = accessTokenMatch ? decodeURIComponent(accessTokenMatch[1]) : null;
      refreshToken = refreshTokenMatch ? decodeURIComponent(refreshTokenMatch[1]) : null;
    }
  }
  
  return { accessToken, refreshToken };
};

export const authService = {
  /**
   * Sign in with Google OAuth
   */
  signInWithGoogle: async (): Promise<AuthResponse> => {
    try {
      const redirectUrl = getRedirectUrl();
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // For native platforms, open the OAuth URL
      if (Platform.OS !== 'web' && data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === 'success') {
          // Extract tokens from the callback URL
          const { accessToken, refreshToken } = extractTokensFromUrl(result.url);

          if (accessToken && refreshToken) {
            // Set the session
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              return {
                success: false,
                error: sessionError.message,
              };
            }

            if (sessionData.user && sessionData.session) {
              // Ensure user profile exists
              await authService.ensureUserProfile(sessionData.user);
              
              return {
                success: true,
                data: {
                  user: sessionData.user,
                  session: sessionData.session,
                },
              };
            }
          }
        }

        return {
          success: false,
          error: 'OAuth authentication was cancelled or failed',
        };
      }

      // For web, Supabase will redirect to the callback URL
      // The callback page will handle the session
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },

  /**
   * Sign in with Apple OAuth
   */
  signInWithApple: async (): Promise<AuthResponse> => {
    try {
      const redirectUrl = getRedirectUrl();
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // For native platforms, open the OAuth URL
      if (Platform.OS !== 'web' && data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === 'success') {
          // Extract tokens from the callback URL
          const { accessToken, refreshToken } = extractTokensFromUrl(result.url);

          if (accessToken && refreshToken) {
            // Set the session
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              return {
                success: false,
                error: sessionError.message,
              };
            }

            if (sessionData.user && sessionData.session) {
              // Ensure user profile exists
              await authService.ensureUserProfile(sessionData.user);
              
              return {
                success: true,
                data: {
                  user: sessionData.user,
                  session: sessionData.session,
                },
              };
            }
          }
        }

        return {
          success: false,
          error: 'OAuth authentication was cancelled or failed',
        };
      }

      // For web, Supabase will redirect to the callback URL
      // The callback page will handle the session
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },

  /**
   * Ensure user profile exists in users table
   */
  ensureUserProfile: async (user: SupabaseUser): Promise<void> => {
    try {
      // Check if user profile exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!existingUser) {
        // Create user profile
        const username = user.user_metadata?.username || 
                        user.user_metadata?.full_name || 
                        user.user_metadata?.name ||
                        user.email?.split('@')[0] || 
                        `user_${user.id.slice(0, 8)}`;

        const { error: profileError } = await supabase.from('users').insert({
          id: user.id,
          username,
          avatar_url: user.user_metadata?.avatar_url || null,
        });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
        }
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
    }
  },

  /**
   * Sign up with email and password (deprecated - kept for backward compatibility)
   */
  signUp: async (email: string, password: string, username: string): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data.user || !data.session) {
        return {
          success: false,
          error: 'Failed to create user',
        };
      }

      // Create user profile in users table
      const { error: profileError } = await supabase.from('users').insert({
        id: data.user.id,
        username,
        avatar_url: null,
      });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        // Don't fail the signup, but log the error
      }

      return {
        success: true,
        data: {
          user: data.user,
          session: data.session,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },

  /**
   * Sign in with email and password
   */
  signIn: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data.user || !data.session) {
        return {
          success: false,
          error: 'Failed to sign in',
        };
      }

      return {
        success: true,
        data: {
          user: data.user,
          session: data.session,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },

  /**
   * Sign out current user
   */
  signOut: async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },

  /**
   * Get current session
   */
  getSession: async (): Promise<Session | null> => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
        return null;
      }
      return data.session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },

  /**
   * Get current user
   */
  getCurrentUser: async (): Promise<SupabaseUser | null> => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error getting user:', error);
        return null;
      }
      return data.user;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },

  /**
   * Reset password
   */
  resetPassword: async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'foto-fight://reset-password',
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
};

export default authService;
