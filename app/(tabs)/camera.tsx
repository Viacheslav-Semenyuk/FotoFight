import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  FlatList,
  Platform,
  ActivityIndicator,
  PressableStateCallbackType,
} from 'react-native';

// Extend PressableStateCallbackType to include web-specific 'hovered' property
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

// Inject CSS for web to make camera video use object-fit: contain
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    video {
      object-fit: contain !important;
    }
  `;
  document.head.appendChild(style);
}
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { challengeService, photoService, Challenge } from '../../services';
import { useResponsive, CONTENT_MAX_WIDTH } from '../../hooks/useResponsive';
import { useAuth } from '../../contexts/AuthContext';
import * as SecureStore from 'expo-secure-store';

export default function CameraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ preselectedChallengeId?: string | string[] }>();
  // Handle both string and array (expo-router can pass params as arrays)
  const preselectedChallengeId = Array.isArray(params.preselectedChallengeId) 
    ? params.preselectedChallengeId[0] 
    : params.preselectedChallengeId;
  
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [photoAspectRatio, setPhotoAspectRatio] = useState<number>(1);
  const [photoMirrored, setPhotoMirrored] = useState(false);
  const [showChallengeDropdown, setShowChallengeDropdown] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'loading'; message: string } | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [uncompletedChallenges, setUncompletedChallenges] = useState<Challenge[]>([]);
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const dropdownRef = useRef<View>(null);
  const isTogglingRef = useRef(false);
  const isUpdatingFromDropdownRef = useRef(false);
  const { isDesktop, isTablet } = useResponsive();
  const centerContent = isDesktop || isTablet;
  const isWeb = Platform.OS === 'web';
  const { user: authUser, loading: authLoading, signInWithGoogle, signInWithApple } = useAuth();

  // Load preselected challenge immediately when it changes (works even if user is not authenticated)
  useEffect(() => {
    const loadPreselectedChallenge = async () => {
      // Check if preselectedChallengeId exists and is not empty
      if (preselectedChallengeId && typeof preselectedChallengeId === 'string' && preselectedChallengeId.trim() !== '') {
        const challengeResponse = await challengeService.getChallenge(preselectedChallengeId);
        if (challengeResponse.success && challengeResponse.data) {
          setSelectedChallenge(challengeResponse.data);
        }
      }
    };
    
    loadPreselectedChallenge();
  }, [preselectedChallengeId]);
  
  // Restore preselected challenge in preview mode if it was lost
  useEffect(() => {
    // If we're in preview mode (capturedPhoto exists) and have preselectedChallengeId but no selectedChallenge
    if (capturedPhoto && preselectedChallengeId && typeof preselectedChallengeId === 'string' && preselectedChallengeId.trim() !== '' && !selectedChallenge) {
      challengeService.getChallenge(preselectedChallengeId).then((challengeResponse) => {
        if (challengeResponse.success && challengeResponse.data) {
          setSelectedChallenge(challengeResponse.data);
        }
      });
    }
  }, [capturedPhoto, preselectedChallengeId, selectedChallenge]);

  // Load challenges for the dropdown (only if user is authenticated)
  const loadChallenges = useCallback(async () => {
    // Only load uncompleted challenges if user is authenticated
    if (authUser) {
      const response = await challengeService.getUncompletedChallenges();
      if (response.success && response.data) {
        setUncompletedChallenges(response.data);
      }
    }
    
    // If there's a preselected challenge, ensure it's loaded (works even if not authenticated)
    if (preselectedChallengeId && typeof preselectedChallengeId === 'string' && preselectedChallengeId.trim() !== '') {
      const challengeResponse = await challengeService.getChallenge(preselectedChallengeId);
      if (challengeResponse.success && challengeResponse.data) {
        setSelectedChallenge(challengeResponse.data);
      }
    }
  }, [preselectedChallengeId, authUser]);

  // Track if we're in preview mode to prevent resetting capturedPhoto
  const capturedPhotoRef = useRef<string | null>(null);
  useEffect(() => {
    capturedPhotoRef.current = capturedPhoto;
  }, [capturedPhoto]);

  // Force camera remount on web when facing changes and camera is active
  useEffect(() => {
    if (isWeb && isCameraActive && cameraKey > 0) {
      // Key will be incremented by toggleCameraFacing, this ensures remount happens
    }
  }, [facing, isWeb, isCameraActive, cameraKey]);

  // Control camera activation based on screen focus
  useFocusEffect(
    useCallback(() => {
      // Check if we're updating from dropdown selection
      // If so, don't reset state to prevent camera from reopening
      if (isUpdatingFromDropdownRef.current) {
        // Just update the selected challenge if needed
        const hasPreselected = preselectedChallengeId && typeof preselectedChallengeId === 'string' && preselectedChallengeId.trim() !== '';
        if (hasPreselected) {
          challengeService.getChallenge(preselectedChallengeId).then((challengeResponse) => {
            if (challengeResponse.success && challengeResponse.data) {
              setSelectedChallenge(challengeResponse.data);
            }
          });
        }
        return;
      }
      
      // Always reset state when navigating to camera tab (unless updating from dropdown)
      // This ensures camera view is shown, not preview mode
      setCapturedPhoto(null);
      setPhotoAspectRatio(1);
      setPhotoMirrored(false);
      setShowChallengeDropdown(false);
      setIsSubmitting(false);
      setIsCapturing(false);
      setNotification(null);
      setIsCameraActive(true);
      
      // Check if there's a preselected challenge
      const hasPreselected = preselectedChallengeId && typeof preselectedChallengeId === 'string' && preselectedChallengeId.trim() !== '';
      
      if (!hasPreselected) {
        setSelectedChallenge(null);
      } else {
        // Load the preselected challenge immediately
        challengeService.getChallenge(preselectedChallengeId).then((challengeResponse) => {
          if (challengeResponse.success && challengeResponse.data) {
            setSelectedChallenge(challengeResponse.data);
          }
        });
      }
      
      // Load challenges (this will set preselectedChallengeId if it exists)
      // Only load if user is authenticated (to avoid unnecessary calls)
      if (authUser) {
        loadChallenges();
      }

      // Cleanup: deactivate camera when leaving the screen
      return () => {
        setIsCameraActive(false);
        setIsCapturing(false);
      };
    }, [loadChallenges, preselectedChallengeId, authUser])
  );

  const handleCapture = async () => {
    // Prevent multiple captures
    if (isCapturing) return;
    
    // Check if camera is active - silently return if not ready
    if (!isCameraActive) {
      return;
    }

    // Check if permission is granted - silently return if not granted
    if (!permission?.granted) {
      return;
    }

    // Check if camera ref is available (with a small delay to allow camera to initialize)
    if (!cameraRef.current) {
      // Give camera a moment to initialize after retake
      await new Promise(resolve => setTimeout(resolve, 100));
      // Silently return if camera is still not ready
      if (!cameraRef.current) {
        return;
      }
    }

    setIsCapturing(true);
    
    try {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo && photo.uri) {
        setCapturedPhoto(photo.uri);
        // Don't clear selected challenge when taking a photo if there's a preselectedChallengeId
        // It should remain selected so user can submit the photo for that challenge
        const hasPreselected = preselectedChallengeId && typeof preselectedChallengeId === 'string' && preselectedChallengeId.trim() !== '';
        if (!hasPreselected) {
          setSelectedChallenge(null);
        } else {
          // Ensure preselected challenge is still selected after capture
          // It might have been cleared, so reload it
          if (!selectedChallenge) {
            challengeService.getChallenge(preselectedChallengeId).then((challengeResponse) => {
              if (challengeResponse.success && challengeResponse.data) {
                setSelectedChallenge(challengeResponse.data);
              }
            });
          }
        }
        // Calculate aspect ratio from photo dimensions
        if (photo.width && photo.height) {
          setPhotoAspectRatio(photo.width / photo.height);
        } else {
          // Fallback: load image to get dimensions (for web)
          Image.getSize(photo.uri, (width, height) => {
            setPhotoAspectRatio(width / height);
          }, () => {
            setPhotoAspectRatio(4/3); // Default webcam aspect ratio
          });
        }
        // On web, webcams are typically front-facing and browser mirrors the preview
        // On native, mirror only if using front camera
        setPhotoMirrored(isWeb || facing === 'front');
      }
      // Silently fail if photo is invalid
    } catch (error) {
      // Silently fail - don't show error notification
    } finally {
      setIsCapturing(false);
    }
  };

  const toggleCameraFacing = () => {
    if (isWeb) {
      // On web, we need to temporarily deactivate camera to force reinitialization
      // First, deactivate camera
      setIsCameraActive(false);
      
      // Wait a bit for camera to fully stop, then change facing and remount
      setTimeout(() => {
        // Force camera component to remount by changing key
        setCameraKey(prev => prev + 1);
        // Change facing
        setFacing(current => (current === 'back' ? 'front' : 'back'));
        // Reactivate camera after another delay to allow facing change to take effect
        setTimeout(() => {
          setIsCameraActive(true);
        }, 300);
      }, 200);
    } else {
      setFacing(current => (current === 'back' ? 'front' : 'back'));
    }
  };

  const toggleFlash = () => {
    setFlashMode(current => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setIsCapturing(false);
    setNotification(null);
    // Always ensure camera is active when retaking
    setIsCameraActive(true);
    // Don't clear selected challenge on retake if there's a preselectedChallengeId
    // It will be preserved so user can retake photo for the same challenge
    const hasPreselected = preselectedChallengeId && typeof preselectedChallengeId === 'string' && preselectedChallengeId.trim() !== '';
    if (!hasPreselected) {
      setSelectedChallenge(null);
    } else {
      // Ensure preselected challenge is still selected after retake
      // It might have been cleared, so reload it
      if (!selectedChallenge) {
        challengeService.getChallenge(preselectedChallengeId).then((challengeResponse) => {
          if (challengeResponse.success && challengeResponse.data) {
            setSelectedChallenge(challengeResponse.data);
          }
        });
      }
    }
  };

  const handleToggleDropdown = () => {
    isTogglingRef.current = true;
    setShowChallengeDropdown(prev => !prev);
    // Reset flag after state update
    setTimeout(() => {
      isTogglingRef.current = false;
    }, 100);
  };

  const handleChallengeSelect = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    // Mark that we're updating from dropdown to prevent useFocusEffect from resetting state
    isUpdatingFromDropdownRef.current = true;
    // Update URL parameter to preserve selected challenge after retake
    router.setParams({ preselectedChallengeId: challenge.id });
    // Reset flag after a short delay
    setTimeout(() => {
      isUpdatingFromDropdownRef.current = false;
    }, 100);
    // Close dropdown immediately
    setShowChallengeDropdown(false);
  };

  // Prepare dropdown data for FlatList
  const dropdownChallenges = useMemo(() => {
    const items: Challenge[] = [];
    
    // Add selected challenge first if it's not in uncompletedChallenges
    if (selectedChallenge && !uncompletedChallenges.find(c => c.id === selectedChallenge.id)) {
      items.push(selectedChallenge);
    }
    
    // Add all uncompleted challenges
    items.push(...uncompletedChallenges);
    
    return items;
  }, [selectedChallenge, uncompletedChallenges]);

  // Render item for FlatList
  const renderDropdownItem = useCallback(({ item }: { item: Challenge }) => {
    const isSelected = selectedChallenge?.id === item.id;
    return (
      <Pressable
        style={({ pressed }) => [
          styles.dropdownItem,
          isSelected && styles.dropdownItemSelected,
          pressed && styles.dropdownItemPressed
        ]}
        onPress={() => handleChallengeSelect(item)}
      >
        <View style={styles.dropdownItemContent}>
          <Text style={[
            styles.dropdownItemTitle,
            isSelected && styles.dropdownItemTitleSelected
          ]}>
            {item.title}
            {isSelected && ' ✓'}
          </Text>
        </View>
        <Text style={[
          styles.dropdownItemPoints,
          isSelected && styles.dropdownItemPointsSelected
        ]}>
          {item.points} pts
        </Text>
      </Pressable>
    );
  }, [selectedChallenge, handleChallengeSelect]);

  // Close dropdown when clicking outside (for web)
  useEffect(() => {
    if (!showChallengeDropdown || Platform.OS !== 'web') return;

    const handleClickOutside = (event: MouseEvent) => {
      if (typeof document === 'undefined') return;
      
      // Ignore if we're in the middle of toggling
      if (isTogglingRef.current) {
        return;
      }
      
      const target = event.target as HTMLElement;
      
      // Check if click is inside dropdown container by checking data attribute
      // The container includes both the button and the dropdown menu
      const clickedInside = target.closest('[data-dropdown="true"]');
      
      if (!clickedInside) {
        // Use setTimeout to allow onPress handlers to fire first
        setTimeout(() => {
          setShowChallengeDropdown(false);
        }, 0);
      }
    };

    // Use a delay to avoid immediate closure when opening dropdown
    // This allows the toggle button click to complete first
    const timeoutId = setTimeout(() => {
      // Use 'mouseup' instead of 'mousedown' to allow onPress to fire first
      document.addEventListener('mouseup', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mouseup', handleClickOutside);
    };
  }, [showChallengeDropdown]);

  const handleSubmit = async () => {
    if (!capturedPhoto || !selectedChallenge || isSubmitting) return;

    setIsSubmitting(true);
    setNotification({ type: 'loading', message: 'Verifying photo with AI...' });

    try {
      // Send photo to AI for verification
      // Pass challengeData with detectable_object from database
      const verifyResult = await photoService.verifyPhotoWithAI(
        capturedPhoto,
        selectedChallenge.title,
        {
          detectable_object: selectedChallenge.detectable_object ?? null,
        }
      );

      // Debug logging
      console.log('Verification result in camera:', {
        success: verifyResult.success,
        data: verifyResult.data,
        verified: verifyResult.data?.verified,
        message: verifyResult.data?.message,
      });

      if (verifyResult.success && verifyResult.data?.verified === true) {
        // Photo verified - submit photo and complete challenge
        const submitResult = await photoService.submitPhoto({
          photoUri: capturedPhoto,
          challengeId: selectedChallenge.id,
          challengeTitle: selectedChallenge.title,
          challengePoints: selectedChallenge.points,
          aspectRatio: photoAspectRatio,
        });

        if (submitResult.success) {
          setNotification({ 
            type: 'success', 
            message: `Photo verified! You earned ${selectedChallenge.points} points!` 
          });

          // Clear selected challenge and captured photo after successful submission
          setSelectedChallenge(null);
          setCapturedPhoto(null);

          // Redirect after 2 seconds
          setTimeout(() => {
            setIsCameraActive(false); // Disable camera before navigation
            setNotification(null);
            router.push('/(tabs)/feed');
          }, 2000);
        } else {
          setNotification({ type: 'error', message: submitResult.error || 'Failed to submit photo.' });
          setTimeout(() => setNotification(null), 3000);
        }
      } else {
        // Verification failed or error occurred
        const errorMessage = verifyResult.data?.message 
          || verifyResult.error 
          || 'Photo verification failed.';
        setNotification({ type: 'error', message: errorMessage });
        
        // Hide notification after 3 seconds
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to verify photo. Please try again.' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview mode
  if (capturedPhoto) {
    return (
      <View style={styles.container}>
        <View style={[styles.previewWrapper, centerContent && styles.previewWrapperDesktop]}>
          <Image 
            source={{ uri: capturedPhoto }} 
            style={[
              styles.preview,
              photoMirrored && styles.previewMirrored,
            ]}
            resizeMode="contain"
          />
          
          {/* Notification overlay */}
          {notification && (
            <View style={styles.notificationOverlay}>
              <View style={[
                styles.notificationBox,
                notification.type === 'success' && styles.notificationSuccess,
                notification.type === 'error' && styles.notificationError,
                notification.type === 'loading' && styles.notificationLoading,
              ]}>
                {notification.type === 'loading' && (
                  <ActivityIndicator size="small" color="#fff" style={{ marginRight: 10 }} />
                )}
                {notification.type === 'success' && (
                  <Ionicons name="checkmark-circle" size={24} color="#fff" style={{ marginRight: 10 }} />
                )}
                {notification.type === 'error' && (
                  <Ionicons name="close-circle" size={24} color="#fff" style={{ marginRight: 10 }} />
                )}
                <Text style={styles.notificationText}>{notification.message}</Text>
              </View>
            </View>
          )}
          <View style={[styles.previewControls, centerContent && styles.previewControlsDesktop]}>
            <View style={styles.actionButtons}>
              <Pressable
                style={({ hovered }: WebPressableState) => [styles.retakeButton, hovered && styles.buttonHovered]}
                onPress={handleRetake}
              >
                <Ionicons name="refresh" size={24} color="#fff" />
              </Pressable>

              <View ref={dropdownRef} style={styles.dropdownContainer} data-dropdown="true">
                <Pressable
                  style={({ hovered }: WebPressableState) => [styles.challengeButton, hovered && styles.challengeButtonHovered]}
                  onPress={handleToggleDropdown}
                >
                  <Ionicons name="trophy" size={16} color="#000" />
                  <Text style={styles.challengeButtonText} numberOfLines={1}>
                    {selectedChallenge ? selectedChallenge.title : 'Select Challenge'}
                  </Text>
                  {selectedChallenge && (
                    <Text style={styles.challengeButtonPoints}>{selectedChallenge.points} pts</Text>
                  )}
                  <Ionicons 
                    name={showChallengeDropdown ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color="#000" 
                  />
                </Pressable>

                {showChallengeDropdown && (
                  <View 
                    style={styles.dropdown} 
                    data-dropdown="true" 
                    collapsable={false}
                    onStartShouldSetResponder={() => false}
                    onMoveShouldSetResponder={() => false}
                  >
                    {dropdownChallenges.length === 0 ? (
                      <View style={styles.dropdownItem}>
                        <Text style={styles.dropdownItemTitle}>No challenges available</Text>
                      </View>
                    ) : (
                      <View style={Platform.OS === 'android' ? styles.dropdownListContainer : undefined}>
                        <FlatList
                          data={dropdownChallenges}
                          renderItem={renderDropdownItem}
                          keyExtractor={(item) => item.id}
                          style={styles.dropdownScroll}
                          nestedScrollEnabled={true}
                          scrollEnabled={true}
                          removeClippedSubviews={false}
                          keyboardShouldPersistTaps="handled"
                          showsVerticalScrollIndicator={true}
                          bounces={true}
                          onStartShouldSetResponder={() => true}
                          onMoveShouldSetResponder={() => true}
                        />
                      </View>
                    )}
                  </View>
                )}
              </View>

              <Pressable
                style={({ hovered }: WebPressableState) => [
                  styles.submitButton, 
                  (!selectedChallenge || isSubmitting) && styles.submitButtonDisabled,
                  selectedChallenge && !isSubmitting && hovered && styles.submitButtonHovered
                ]}
                onPress={handleSubmit}
                disabled={!selectedChallenge || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="arrow-forward" size={24} color={selectedChallenge ? "#fff" : "rgba(255,255,255,0.4)"} />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Check authentication
  if (authLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Loading...</Text>
      </View>
    );
  }

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setSignInError('');

    // Save returnTo and preselectedChallengeId for callback (web: localStorage, native: SecureStore)
    const returnTo = '/(tabs)/camera';
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('auth_returnTo', returnTo);
      if (preselectedChallengeId) {
        window.localStorage.setItem('auth_preselectedChallengeId', preselectedChallengeId);
      }
    } else {
      await SecureStore.setItemAsync('auth_returnTo', returnTo);
      if (preselectedChallengeId) {
        await SecureStore.setItemAsync('auth_preselectedChallengeId', preselectedChallengeId);
      }
    }

    const result = await signInWithGoogle();
    if (!result.success) {
      setSignInError(result.error || 'Failed to sign in with Google');
      // Clear stored values on error
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('auth_returnTo');
        window.localStorage.removeItem('auth_preselectedChallengeId');
      } else {
        await SecureStore.deleteItemAsync('auth_returnTo');
        await SecureStore.deleteItemAsync('auth_preselectedChallengeId');
      }
    }
    // For web, callback will handle redirect
    // For native, redirect is handled in login.tsx or callback
    setSigningIn(false);
  };

  const handleAppleSignIn = async () => {
    setSigningIn(true);
    setSignInError('');

    // Save returnTo and preselectedChallengeId for callback (web: localStorage, native: SecureStore)
    const returnTo = '/(tabs)/camera';
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('auth_returnTo', returnTo);
      if (preselectedChallengeId) {
        window.localStorage.setItem('auth_preselectedChallengeId', preselectedChallengeId);
      }
    } else {
      await SecureStore.setItemAsync('auth_returnTo', returnTo);
      if (preselectedChallengeId) {
        await SecureStore.setItemAsync('auth_preselectedChallengeId', preselectedChallengeId);
      }
    }

    const result = await signInWithApple();
    if (!result.success) {
      setSignInError(result.error || 'Failed to sign in with Apple');
      // Clear stored values on error
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('auth_returnTo');
        window.localStorage.removeItem('auth_preselectedChallengeId');
      } else {
        await SecureStore.deleteItemAsync('auth_returnTo');
        await SecureStore.deleteItemAsync('auth_preselectedChallengeId');
      }
    }
    // For web, callback will handle redirect
    // For native, redirect is handled in login.tsx or callback
    setSigningIn(false);
  };

  if (!authUser) {

    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="lock-closed-outline" size={60} color="#fff" />
          <Text style={styles.permissionText}>Sign in to use the camera</Text>
          
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
      </View>
    );
  }

  // Permission not granted yet
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={60} color="#fff" />
          <Text style={styles.permissionText}>Camera access required</Text>
          <Pressable style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Camera view
  return (
    <View style={styles.container}>
      <View style={[styles.cameraWrapper, centerContent && styles.cameraWrapperDesktop]}>
        {isCameraActive ? (
          <CameraView
            key={isWeb ? `camera-${facing}-${cameraKey}` : undefined}
            ref={cameraRef}
            style={styles.cameraView}
            facing={facing}
            mirror={false}
            videoStabilizationMode="off"
            flash={flashMode}
          />
        ) : (
          <View style={styles.cameraView}>
            <View style={styles.cameraUnavailableOverlay}>
              <Ionicons name="camera-outline" size={48} color="#fff" />
              <Text style={styles.cameraUnavailableText}>Camera initializing...</Text>
            </View>
          </View>
        )}
        {notification && (
          <View style={styles.notificationOverlay}>
            <View style={[
              styles.notificationBox,
              notification.type === 'success' && styles.notificationSuccess,
              notification.type === 'error' && styles.notificationError,
              notification.type === 'loading' && styles.notificationLoading,
            ]}>
              {notification.type === 'loading' && (
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 10 }} />
              )}
              {notification.type === 'success' && (
                <Ionicons name="checkmark-circle" size={24} color="#fff" style={{ marginRight: 10 }} />
              )}
              {notification.type === 'error' && (
                <Ionicons name="close-circle" size={24} color="#fff" style={{ marginRight: 10 }} />
              )}
              <Text style={styles.notificationText}>{notification.message}</Text>
            </View>
          </View>
        )}
        <View style={[styles.cameraControls, centerContent && styles.cameraControlsDesktop]}>
          {!(isDesktop && isWeb) && (
            <>
              {Platform.OS === 'android' && (
                <Pressable
                  style={styles.flashButton}
                  onPress={toggleFlash}
                >
                  <Ionicons 
                    name={
                      flashMode === 'off' ? 'flash-off' : 
                      flashMode === 'on' ? 'flash' : 
                      'flash-outline'
                    } 
                    size={28} 
                    color={flashMode === 'off' ? 'rgba(255, 255, 255, 0.5)' : '#fff'} 
                  />
                </Pressable>
              )}
              <Pressable
                style={styles.flipButton}
                onPress={toggleCameraFacing}
              >
                <Ionicons name="camera-reverse" size={28} color="#fff" />
              </Pressable>
            </>
          )}
          <Pressable
            style={({ hovered, pressed }: WebPressableState) => [
              styles.captureButton,
              (!isCameraActive || !permission?.granted || isCapturing) && styles.captureButtonDisabled,
              hovered && isCameraActive && permission?.granted && !isCapturing && styles.captureButtonHovered,
              pressed && isCameraActive && permission?.granted && !isCapturing && styles.captureButtonPressed,
            ]}
            onPress={handleCapture}
            disabled={!isCameraActive || !permission?.granted || isCapturing}
          >
            <View style={styles.captureButtonInner} />
            {isCapturing && (
              <ActivityIndicator 
                size="small" 
                color="#fff" 
                style={styles.captureButtonLoader} 
              />
            )}
          </Pressable>
          {!(isDesktop && isWeb) && (
            Platform.OS === 'android' ? (
              <View style={styles.flipButtonPlaceholder} />
            ) : (
              <View style={styles.flipButtonPlaceholder} />
            )
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionContainer: {
    alignItems: 'center',
    padding: 40,
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 32,
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
    borderColor: '#fff',
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
    backgroundColor: 'rgba(255, 238, 238, 0.95)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 204, 204, 0.8)',
    width: '100%',
    maxWidth: 300,
  },
  errorText: {
    color: '#c00',
    fontSize: 14,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
    marginBottom: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraWrapper: {
    flex: 1,
    width: '100%',
  },
  cameraWrapperDesktop: {
    maxWidth: CONTENT_MAX_WIDTH,
    margin: 24,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cameraView: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraUnavailableOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  cameraUnavailableText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  cameraControls: {
    backgroundColor: '#1a1a1a',
    height: 140,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  cameraControlsDesktop: {
    backgroundColor: '#262626',
  },
  flashButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButtonPlaceholder: {
    width: 50,
    height: 50,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#000',
  },
  captureButtonHovered: {
    transform: [{ scale: 1.05 }],
  },
  captureButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonLoader: {
    position: 'absolute',
  },
  previewWrapper: {
    flex: 1,
    width: '100%',
  },
  previewWrapperDesktop: {
    maxWidth: CONTENT_MAX_WIDTH,
    margin: 24,
    borderRadius: 24,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  preview: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewMirrored: {
    transform: [{ scaleX: -1 }],
  },
  previewControls: {
    backgroundColor: '#1a1a1a',
    height: 140,
    paddingHorizontal: 16,
    justifyContent: 'center',
    overflow: 'visible',
  },
  previewControlsDesktop: {
    backgroundColor: '#262626',
  },
  retakeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonHovered: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  dropdownContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 100,
    overflow: 'visible',
  },
  challengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  challengeButtonHovered: {
    backgroundColor: '#f5f5f5',
  },
  challengeButtonText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  challengeButtonPoints: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  dropdown: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 8,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.15)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    }),
    maxHeight: 200,
    overflow: 'hidden',
    zIndex: 1000,
    minHeight: 50,
  },
  dropdownListContainer: {
    flex: 1,
    ...(Platform.OS === 'android' && {
      // Ensure touch events work properly on Android
      pointerEvents: 'auto',
    }),
  },
  dropdownScroll: {
    maxHeight: 200,
    ...(Platform.OS === 'android' && {
      // Ensure scroll works on Android
      flexGrow: 0,
    }),
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  dropdownItemPressed: {
    backgroundColor: '#f9f9f9',
  },
  dropdownItemSelected: {
    backgroundColor: '#e8f5e9',
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  dropdownItemContent: {
    flex: 1,
  },
  dropdownItemTitle: {
    fontSize: 14,
    color: '#262626',
    fontWeight: '500',
  },
  dropdownItemTitleSelected: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  dropdownItemDescription: {
    fontSize: 12,
    color: '#8e8e8e',
    marginTop: 2,
  },
  dropdownItemPoints: {
    fontSize: 13,
    color: '#000',
    fontWeight: '600',
  },
  dropdownItemPointsSelected: {
    color: '#2e7d32',
    fontWeight: '700',
  },
  submitButton: {
    width: 48,
    height: 48,
    backgroundColor: '#000',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  submitButtonHovered: {
    backgroundColor: '#333',
  },
  notificationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  notificationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    maxWidth: '90%',
  },
  notificationLoading: {
    backgroundColor: '#333',
  },
  notificationSuccess: {
    backgroundColor: '#4CAF50',
  },
  notificationError: {
    backgroundColor: '#f44336',
  },
  notificationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    flexShrink: 1,
  },
});
