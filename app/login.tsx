import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useResponsive, CONTENT_MAX_WIDTH } from '../hooks/useResponsive';
import * as SecureStore from 'expo-secure-store';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithGoogle, signInWithApple } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string; preselectedChallengeId?: string }>();
  const returnTo = params.returnTo || '/(tabs)/feed';
  const { isDesktop, isTablet } = useResponsive();
  const centerContent = isDesktop || isTablet;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    // Save returnTo for callback (web: localStorage, native: SecureStore)
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('auth_returnTo', returnTo);
      if (params.preselectedChallengeId) {
        window.localStorage.setItem('auth_preselectedChallengeId', params.preselectedChallengeId);
      }
    } else {
      // Native platforms
      await SecureStore.setItemAsync('auth_returnTo', returnTo);
      if (params.preselectedChallengeId) {
        await SecureStore.setItemAsync('auth_preselectedChallengeId', params.preselectedChallengeId);
      }
    }

    const result = await signInWithGoogle();

    if (result.success) {
      // For native platforms, redirect immediately (OAuth completes synchronously)
      if (Platform.OS !== 'web') {
        // Get returnTo from SecureStore
        const storedReturnTo = await SecureStore.getItemAsync('auth_returnTo');
        const storedChallengeId = await SecureStore.getItemAsync('auth_preselectedChallengeId');
        
        // Clear stored values
        await SecureStore.deleteItemAsync('auth_returnTo');
        if (storedChallengeId) {
          await SecureStore.deleteItemAsync('auth_preselectedChallengeId');
        }
        
        const finalReturnTo = storedReturnTo || returnTo;
        if (finalReturnTo === '/(tabs)/camera' && storedChallengeId) {
          router.replace({
            pathname: finalReturnTo,
            params: { preselectedChallengeId: storedChallengeId }
          });
        } else {
          router.replace(finalReturnTo as any);
        }
      }
      // For web, callback will handle redirect
    } else {
      setError(result.error || 'Failed to sign in with Google');
      // Clear stored values on error
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('auth_returnTo');
        window.localStorage.removeItem('auth_preselectedChallengeId');
      } else {
        await SecureStore.deleteItemAsync('auth_returnTo');
        await SecureStore.deleteItemAsync('auth_preselectedChallengeId');
      }
    }

    setLoading(false);
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    setError('');

    // Save returnTo for callback (web: localStorage, native: SecureStore)
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('auth_returnTo', returnTo);
      if (params.preselectedChallengeId) {
        window.localStorage.setItem('auth_preselectedChallengeId', params.preselectedChallengeId);
      }
    } else {
      // Native platforms
      await SecureStore.setItemAsync('auth_returnTo', returnTo);
      if (params.preselectedChallengeId) {
        await SecureStore.setItemAsync('auth_preselectedChallengeId', params.preselectedChallengeId);
      }
    }

    const result = await signInWithApple();

    if (result.success) {
      // For native platforms, redirect immediately (OAuth completes synchronously)
      if (Platform.OS !== 'web') {
        // Get returnTo from SecureStore
        const storedReturnTo = await SecureStore.getItemAsync('auth_returnTo');
        const storedChallengeId = await SecureStore.getItemAsync('auth_preselectedChallengeId');
        
        // Clear stored values
        await SecureStore.deleteItemAsync('auth_returnTo');
        if (storedChallengeId) {
          await SecureStore.deleteItemAsync('auth_preselectedChallengeId');
        }
        
        const finalReturnTo = storedReturnTo || returnTo;
        if (finalReturnTo === '/(tabs)/camera' && storedChallengeId) {
          router.replace({
            pathname: finalReturnTo,
            params: { preselectedChallengeId: storedChallengeId }
          });
        } else {
          router.replace(finalReturnTo as any);
        }
      }
      // For web, callback will handle redirect
    } else {
      setError(result.error || 'Failed to sign in with Apple');
      // Clear stored values on error
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('auth_returnTo');
        window.localStorage.removeItem('auth_preselectedChallengeId');
      } else {
        await SecureStore.deleteItemAsync('auth_returnTo');
        await SecureStore.deleteItemAsync('auth_preselectedChallengeId');
      }
    }

    setLoading(false);
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, centerContent && styles.scrollContentCentered]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Ionicons name="person-outline" size={64} color="#ccc" />
          <Text style={styles.title}>Sign in to continue</Text>
          <Text style={styles.subtitle}>Choose your preferred sign-in method</Text>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.buttonsContainer}>
            <Pressable
              style={[styles.googleButton, loading && styles.buttonDisabled]}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#fff" />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
              )}
            </Pressable>

            {Platform.OS === 'ios' && (
              <Pressable
                style={[styles.appleButton, loading && styles.buttonDisabled]}
                onPress={handleAppleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Ionicons name="logo-apple" size={20} color="#000" />
                    <Text style={styles.appleButtonText}>Continue with Apple</Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  scrollContentCentered: {
    alignItems: 'center',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },
  container: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#262626',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  googleButton: {
    backgroundColor: '#4285F4',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 48,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  appleButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#000',
  },
  appleButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorContainer: {
    backgroundColor: '#fee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fcc',
    width: '100%',
  },
  errorText: {
    color: '#c00',
    fontSize: 14,
    textAlign: 'center',
  },
});
