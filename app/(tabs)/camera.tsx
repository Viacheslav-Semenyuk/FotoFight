import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
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
import { Picker } from '@react-native-picker/picker';
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
  const cameraRef = useRef<CameraView>(null);
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
    setFacing(current => (current === 'back' ? 'front' : 'back'));
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

  const handleChallengeSelect = (challengeId: string) => {
    // Find challenge by ID
    const challenge = dropdownChallenges.find(c => c.id === challengeId) || null;
    setSelectedChallenge(challenge);
    // Mark that we're updating from dropdown to prevent useFocusEffect from resetting state
    isUpdatingFromDropdownRef.current = true;
    // Update URL parameter to preserve selected challenge after retake
    if (challenge) {
      router.setParams({ preselectedChallengeId: challenge.id });
    }
    // Reset flag after a short delay
    setTimeout(() => {
      isUpdatingFromDropdownRef.current = false;
    }, 100);
  };

  // Prepare dropdown data for Picker
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

  const handleSubmit = async () => {
    console.log('[Camera] handleSubmit called');
    console.log('[Camera] State check:', {
      hasPhoto: !!capturedPhoto,
      hasChallenge: !!selectedChallenge,
      isSubmitting,
    });
    
    if (!capturedPhoto || !selectedChallenge || isSubmitting) {
      console.log('[Camera] handleSubmit early return - missing data or already submitting');
      return;
    }

    console.log('[Camera] Starting photo submission process');
    console.log('[Camera] Photo URI:', capturedPhoto);
    console.log('[Camera] Challenge:', {
      id: selectedChallenge.id,
      title: selectedChallenge.title,
      points: selectedChallenge.points,
      detectable_object: selectedChallenge.detectable_object,
    });
    
    // Log current log count
    try {
      const { loggerService } = require('../../services/loggerService');
      console.log('[Camera] Current logs in memory:', loggerService.getLogCount());
    } catch (e) {
      console.warn('[Camera] Could not get log count:', e);
    }

    setIsSubmitting(true);
    setNotification({ type: 'loading', message: 'Verifying photo with AI...' });

    try {
      // Send photo to AI for verification
      // Pass challengeData with detectable_object from database
      console.log('[Camera] Starting AI verification...');
      const verifyResult = await photoService.verifyPhotoWithAI(
        capturedPhoto,
        selectedChallenge.title,
        {
          detectable_object: selectedChallenge.detectable_object ?? null,
        }
      );

      // Debug logging
      console.log('[Camera] Verification result:', {
        success: verifyResult.success,
        data: verifyResult.data,
        verified: verifyResult.data?.verified,
        message: verifyResult.data?.message,
        error: verifyResult.error,
      });

      if (verifyResult.success && verifyResult.data?.verified === true) {
        // Photo verified - submit photo and complete challenge
        console.log('[Camera] Photo verified, starting upload...');
        const submitResult = await photoService.submitPhoto({
          photoUri: capturedPhoto,
          challengeId: selectedChallenge.id,
          challengeTitle: selectedChallenge.title,
          challengePoints: selectedChallenge.points,
          aspectRatio: photoAspectRatio,
        });

        console.log('[Camera] Submit result:', {
          success: submitResult.success,
          error: submitResult.error,
          data: submitResult.data ? {
            id: submitResult.data.id,
            userId: submitResult.data.userId,
            challengeId: submitResult.data.challengeId,
          } : null,
        });

        if (submitResult.success) {
          console.log('[Camera] Photo submitted successfully!');
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
          console.error('[Camera] Submit failed:', submitResult.error);
          setNotification({ type: 'error', message: submitResult.error || 'Failed to submit photo.' });
          setTimeout(() => setNotification(null), 3000);
        }
      } else {
        // Verification failed or error occurred
        const errorMessage = verifyResult.data?.message 
          || verifyResult.error 
          || 'Photo verification failed.';
        console.warn('[Camera] Verification failed:', errorMessage);
        setNotification({ type: 'error', message: errorMessage });
        
        // Hide notification after 3 seconds
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('[Camera] Error in handleSubmit:', error);
      console.error('[Camera] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('[Camera] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        photoUri: capturedPhoto,
        challengeId: selectedChallenge?.id,
      });
      
      // Try to save logs immediately on error
      try {
        const { loggerService } = require('../../services/loggerService');
        console.log('[Camera] Attempting to save logs due to error...');
        loggerService.saveLogsToFile().then(result => {
          if (result.success) {
            console.log('[Camera] Logs saved successfully after error:', result.filePath);
          } else {
            console.error('[Camera] Failed to save logs after error:', result.error);
          }
        }).catch(saveError => {
          console.error('[Camera] Exception while saving logs:', saveError);
        });
      } catch (requireError) {
        console.error('[Camera] Could not require loggerService:', requireError);
      }
      
      setNotification({ type: 'error', message: 'Failed to verify photo. Please try again.' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsSubmitting(false);
      console.log('[Camera] Submission process completed');
      
      // Log final log count
      try {
        const { loggerService } = require('../../services/loggerService');
        console.log('[Camera] Final logs in memory:', loggerService.getLogCount());
      } catch (e) {
        // Ignore
      }
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

              <View style={styles.pickerContainer}>
                <View style={styles.pickerWrapper}>
                  <Ionicons name="trophy" size={16} color="#000" style={styles.pickerIcon} />
                  {Platform.OS === 'web' ? (
                    // Web fallback - use select element
                    <select
                      style={styles.pickerSelect}
                      value={selectedChallenge?.id || ''}
                      onChange={(e) => handleChallengeSelect(e.target.value)}
                    >
                      <option value="">Select Challenge</option>
                      {dropdownChallenges.map((challenge) => (
                        <option key={challenge.id} value={challenge.id}>
                          {challenge.title} ({challenge.points} pts)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Picker
                      selectedValue={selectedChallenge?.id || ''}
                      onValueChange={handleChallengeSelect}
                      style={styles.picker}
                      dropdownIconColor="#000"
                      mode="dropdown"
                    >
                      <Picker.Item label="Select Challenge" value="" />
                      {dropdownChallenges.map((challenge) => (
                        <Picker.Item
                          key={challenge.id}
                          label={`${challenge.title} (${challenge.points} pts)`}
                          value={challenge.id}
                        />
                      ))}
                    </Picker>
                  )}
                </View>
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
  pickerContainer: {
    flex: 1,
  },
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  pickerIcon: {
    marginRight: 6,
  },
  picker: {
    flex: 1,
    color: '#000',
    height: 48,
  },
  pickerSelect: {
    flex: 1,
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 12,
    paddingHorizontal: 6,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
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
