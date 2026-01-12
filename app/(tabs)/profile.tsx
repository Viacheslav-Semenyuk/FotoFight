import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  useWindowDimensions,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { userService, photoService, User, Photo } from '../../services';
import { useResponsive, CONTENT_MAX_WIDTH } from '../../hooks/useResponsive';
import { useAuth } from '../../contexts/AuthContext';
import FeedImage from '../../components/FeedImage';
import * as SecureStore from 'expo-secure-store';

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFeedView, setShowFeedView] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState('');
  const [gridWidth, setGridWidth] = useState(0);
  const { isDesktop, isTablet } = useResponsive();
  const centerContent = isDesktop || isTablet;
  const { width } = useWindowDimensions();
  const { signOut, user: authUser, loading: authLoading, signInWithGoogle, signInWithApple } = useAuth();
  const router = useRouter();
  
  const numColumns = 3;
  const gap = 2;
  // Use actual grid width if available, otherwise fallback to container width
  const containerWidth = gridWidth > 0 ? gridWidth : (centerContent ? Math.min(width, CONTENT_MAX_WIDTH) : width);
  // Calculate photo size more precisely, accounting for gaps between items
  // Use Math.floor to avoid fractional pixels that can cause layout issues
  const photoSize = containerWidth > 0 ? Math.floor((containerWidth - gap * (numColumns - 1)) / numColumns) : 0;

  // Load user and photos when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        // Check if user is authenticated
        if (!authUser) {
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        
        // Load current user
        const userResponse = await userService.getCurrentUser();
        if (userResponse.success && userResponse.data) {
          setUser(userResponse.data);
        }
        
        // Load user's photos
        const photosResponse = await photoService.getMyPhotos();
        if (photosResponse.success && photosResponse.data) {
          // Ensure photos is an array
          const photosArray = Array.isArray(photosResponse.data) ? photosResponse.data : [];
          setPhotos(photosArray);
        } else {
          // Set empty array if no photos or error
          setPhotos([]);
        }
        
        setIsLoading(false);
      };
      
      loadData();
    }, [authUser])
  );

  const formatTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleSignOut = async () => {
    await signOut();
    // Stay on profile page - it will show login buttons when not authenticated
  };

  // Show loading while checking auth
  if (authLoading || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setSignInError('');

    // Save returnTo for callback (web: localStorage, native: SecureStore)
    const returnTo = '/(tabs)/profile';
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('auth_returnTo', returnTo);
    } else {
      await SecureStore.setItemAsync('auth_returnTo', returnTo);
    }

    const result = await signInWithGoogle();
    if (!result.success) {
      setSignInError(result.error || 'Failed to sign in with Google');
      // Clear stored values on error
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('auth_returnTo');
      } else {
        await SecureStore.deleteItemAsync('auth_returnTo');
      }
    }
    // For web, callback will handle redirect
    // For native, redirect is handled in login.tsx or callback
    setSigningIn(false);
  };

  const handleAppleSignIn = async () => {
    setSigningIn(true);
    setSignInError('');

    // Save returnTo for callback (web: localStorage, native: SecureStore)
    const returnTo = '/(tabs)/profile';
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('auth_returnTo', returnTo);
    } else {
      await SecureStore.setItemAsync('auth_returnTo', returnTo);
    }

    const result = await signInWithApple();
    if (!result.success) {
      setSignInError(result.error || 'Failed to sign in with Apple');
      // Clear stored values on error
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('auth_returnTo');
      } else {
        await SecureStore.deleteItemAsync('auth_returnTo');
      }
    }
    // For web, callback will handle redirect
    // For native, redirect is handled in login.tsx or callback
    setSigningIn(false);
  };

  // If not authenticated, show login buttons
  if (!authUser) {

    return (
      <View style={styles.authRequiredContainer}>
        <Ionicons name="person-outline" size={64} color="#ccc" />
        <Text style={styles.authRequiredTitle}>Sign in to continue</Text>
        
        {signInError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{signInError}</Text>
          </View>
        ) : null}

        <View style={styles.authButtonsContainer}>
          <Pressable
            style={[styles.googleButton, signingIn && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={signingIn}
          >
            {signingIn ? (
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
              style={[styles.appleButton, signingIn && styles.buttonDisabled]}
              onPress={handleAppleSignIn}
              disabled={signingIn}
            >
              {signingIn ? (
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
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Error loading profile</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={[styles.container, centerContent && styles.containerDesktop]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={[styles.header, centerContent && styles.headerDesktop]}>
          <View style={[styles.avatar, !user.avatarUrl && styles.avatarWithText]}>
            {user.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarText}>
                {user.username.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.username}>{user.username}</Text>
            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.points}</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.challengesCompleted}</Text>
                <Text style={styles.statLabel}>Challenges</Text>
              </View>
            </View>
          </View>
          {authUser && (
            <Pressable style={styles.signOutButton} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={24} color="#666" />
            </Pressable>
          )}
        </View>

        {/* View Toggle */}
        <View style={styles.viewToggle}>
          <Pressable
            style={[styles.toggleButton, !showFeedView && styles.toggleButtonActive]}
            onPress={() => setShowFeedView(false)}
          >
            <Ionicons name="grid" size={20} color={!showFeedView ? '#000' : '#999'} />
          </Pressable>
          <Pressable
            style={[styles.toggleButton, showFeedView && styles.toggleButtonActive]}
            onPress={() => setShowFeedView(true)}
          >
            <Ionicons name="list" size={20} color={showFeedView ? '#000' : '#999'} />
          </Pressable>
        </View>

        {/* Empty State */}
        {!photos || !Array.isArray(photos) || photos.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="camera-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No photos yet</Text>
            <Text style={styles.emptyStateSubtext}>Complete challenges to see your photos here</Text>
          </View>
        ) : !showFeedView ? (
          /* Photo Grid */
          <View 
            style={styles.photosGrid}
            onLayout={(event) => {
              const { width: layoutWidth } = event.nativeEvent.layout;
              if (layoutWidth > 0 && layoutWidth !== gridWidth) {
                setGridWidth(layoutWidth);
              }
            }}
          >
            {photos.map((photo, index) => {
              const isLastInRow = (index + 1) % numColumns === 0;
              return (
                <Pressable
                  key={photo.id}
                  style={[
                    styles.photoContainer,
                    {
                      width: photoSize,
                      height: photoSize,
                      flexBasis: photoSize,
                      flexGrow: 0,
                      flexShrink: 0,
                      marginRight: isLastInRow ? 0 : gap,
                      marginBottom: gap,
                    },
                  ]}
                  onPress={() => setShowFeedView(true)}
                >
                  <Image
                    source={{ uri: photo.uri }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                  <View style={styles.pointsBadge}>
                    <Text style={styles.pointsBadgeText}>{photo.challengePoints} pts</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          /* Feed View */
          <View style={styles.feedView}>
            {photos.map((photo) => (
              <View key={photo.id} style={styles.feedPost}>
                {/* Header */}
                <View style={styles.feedPostHeader}>
                  <View style={styles.feedUserInfo}>
                    <View style={[styles.feedAvatar, !user.avatarUrl && styles.feedAvatarWithText]}>
                      {user.avatarUrl ? (
                        <Image
                          source={{ uri: user.avatarUrl }}
                          style={styles.feedAvatarImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.feedAvatarText}>
                          {user.username.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.feedUsername}>{user.username}</Text>
                  </View>
                  <Text style={styles.feedTimeAgo}>{formatTime(photo.timestamp)}</Text>
                </View>

                {/* Photo */}
                <FeedImage uri={photo.uri} aspectRatio={photo.aspectRatio} />

                {/* Footer */}
                <View style={styles.feedPostFooter}>
                  <Text style={styles.feedChallengeText}>
                    {photo.challengeTitle}
                  </Text>
                  <Text style={styles.feedPointsText}>
                    +{photo.challengePoints} pts
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  container: {
    flex: 1,
    width: '100%',
  },
  containerDesktop: {
    alignSelf: 'center',
    maxWidth: CONTENT_MAX_WIDTH,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  authRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    paddingHorizontal: 32,
  },
  authRequiredTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#262626',
    marginTop: 16,
    marginBottom: 8,
  },
  authRequiredText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  authButtonsContainer: {
    width: '100%',
    maxWidth: 300,
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
    maxWidth: 300,
  },
  errorText: {
    color: '#c00',
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerDesktop: {
    borderBottomWidth: 0,
  },
  signOutButton: {
    padding: 8,
    marginLeft: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarWithText: {
    backgroundColor: '#000',
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#262626',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#262626',
  },
  statLabel: {
    fontSize: 11,
    color: '#8e8e8e',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#bbb',
    marginTop: 4,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  photoContainer: {
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  pointsBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pointsBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  viewToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  toggleButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  toggleButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  feedView: {
    backgroundColor: '#fff',
  },
  feedPost: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  feedPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  feedUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    overflow: 'hidden',
  },
  feedAvatarImage: {
    width: '100%',
    height: '100%',
  },
  feedAvatarWithText: {
    backgroundColor: '#000',
  },
  feedAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10,
  },
  feedUsername: {
    fontSize: 12,
    fontWeight: '600',
    color: '#262626',
  },
  feedTimeAgo: {
    fontSize: 10,
    color: '#8e8e8e',
  },
  feedPostFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  feedChallengeText: {
    fontSize: 12,
    color: '#262626',
  },
  feedPointsText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
  },
});
