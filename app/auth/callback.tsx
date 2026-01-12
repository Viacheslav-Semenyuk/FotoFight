import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Platform } from 'react-native';
import { supabase } from '../../services/supabase';
import { authService } from '../../services/authService';
import * as SecureStore from 'expo-secure-store';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // For web, Supabase automatically processes hash fragments
        // But we need to extract and set the session manually
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const hash = window.location.hash;
          
          if (hash && hash.includes('access_token')) {
            // Extract access_token and refresh_token from hash
            const hashParams = new URLSearchParams(hash.substring(1)); // Remove #
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');

            if (accessToken && refreshToken) {
              console.log('Setting session from hash tokens');
              
              // Set the session with tokens from URL
              const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (sessionError) {
                console.error('Error setting session:', sessionError);
                router.replace('/login');
                return;
              }

              if (sessionData.session && sessionData.user) {
                console.log('Session set successfully, user:', sessionData.user.email);
                
                // Ensure user profile exists
                await authService.ensureUserProfile(sessionData.user);
                
                // Get returnTo from storage (web: localStorage, native: SecureStore)
                let returnTo = '/(tabs)/feed';
                let preselectedChallengeId: string | null = null;
                
                if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
                  returnTo = window.localStorage.getItem('auth_returnTo') || '/(tabs)/feed';
                  preselectedChallengeId = window.localStorage.getItem('auth_preselectedChallengeId');
                  window.localStorage.removeItem('auth_returnTo');
                  window.localStorage.removeItem('auth_preselectedChallengeId');
                } else {
                  // Native platforms
                  const storedReturnTo = await SecureStore.getItemAsync('auth_returnTo');
                  returnTo = storedReturnTo || '/(tabs)/feed';
                  preselectedChallengeId = await SecureStore.getItemAsync('auth_preselectedChallengeId');
                  await SecureStore.deleteItemAsync('auth_returnTo');
                  if (preselectedChallengeId) {
                    await SecureStore.deleteItemAsync('auth_preselectedChallengeId');
                  }
                }
                
                // Clear the hash from URL
                window.history.replaceState(null, '', window.location.pathname);
                
                // Small delay to ensure state is updated
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Redirect to the page user came from
                if (returnTo === '/(tabs)/camera' && preselectedChallengeId) {
                  router.replace({
                    pathname: returnTo,
                    params: { preselectedChallengeId }
                  });
                } else {
                  router.replace(returnTo as any);
                }
                return;
              } else {
                console.error('No session or user after setSession');
                router.replace('/login');
                return;
              }
            } else {
              console.error('Missing tokens in hash:', { accessToken: !!accessToken, refreshToken: !!refreshToken });
            }
          }
        }

        // Fallback: try to get existing session (for cases where Supabase auto-processed it)
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          router.replace('/login');
          return;
        }

        if (data.session) {
          console.log('Found existing session');
          
          // Ensure user profile exists
          if (data.session.user) {
            await authService.ensureUserProfile(data.session.user);
          }
          
          // Get returnTo from storage (web: localStorage, native: SecureStore)
          let returnTo = '/(tabs)/feed';
          let preselectedChallengeId: string | null = null;
          
          if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
            returnTo = window.localStorage.getItem('auth_returnTo') || '/(tabs)/feed';
            preselectedChallengeId = window.localStorage.getItem('auth_preselectedChallengeId');
            window.localStorage.removeItem('auth_returnTo');
            window.localStorage.removeItem('auth_preselectedChallengeId');
          } else {
            // Native platforms
            const storedReturnTo = await SecureStore.getItemAsync('auth_returnTo');
            returnTo = storedReturnTo || '/(tabs)/feed';
            preselectedChallengeId = await SecureStore.getItemAsync('auth_preselectedChallengeId');
            await SecureStore.deleteItemAsync('auth_returnTo');
            if (preselectedChallengeId) {
              await SecureStore.deleteItemAsync('auth_preselectedChallengeId');
            }
          }
          
          // Redirect to the page user came from
          if (returnTo === '/(tabs)/camera' && preselectedChallengeId) {
            router.replace({
              pathname: returnTo,
              params: { preselectedChallengeId }
            });
          } else {
            router.replace(returnTo as any);
          }
        } else {
          console.error('No session found');
          router.replace('/login');
        }
      } catch (error) {
        console.error('Error handling callback:', error);
        router.replace('/login');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#000" />
      <Text style={styles.text}>Completing sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
