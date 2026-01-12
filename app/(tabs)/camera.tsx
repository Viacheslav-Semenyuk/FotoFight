import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
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

export default function CameraScreen() {
  const router = useRouter();
  const { preselectedChallengeId } = useLocalSearchParams<{ preselectedChallengeId?: string }>();
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [photoAspectRatio, setPhotoAspectRatio] = useState<number>(1);
  const [photoMirrored, setPhotoMirrored] = useState(false);
  const [showChallengeDropdown, setShowChallengeDropdown] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'loading'; message: string } | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [uncompletedChallenges, setUncompletedChallenges] = useState<Challenge[]>([]);
  const cameraRef = useRef<CameraView>(null);
  const { isDesktop, isTablet } = useResponsive();
  const centerContent = isDesktop || isTablet;
  const isWeb = Platform.OS === 'web';

  // Load challenges and handle preselected challenge
  const loadChallenges = useCallback(async () => {
    const response = await challengeService.getUncompletedChallenges();
    if (response.success && response.data) {
      setUncompletedChallenges(response.data);
    }
    
    // If there's a preselected challenge, load it
    if (preselectedChallengeId) {
      const challengeResponse = await challengeService.getChallenge(preselectedChallengeId);
      if (challengeResponse.success && challengeResponse.data) {
        setSelectedChallenge(challengeResponse.data);
      }
    }
  }, [preselectedChallengeId]);

  // Control camera activation based on screen focus
  useFocusEffect(
    useCallback(() => {
      // Reset all state and activate camera when navigating to camera
      setCapturedPhoto(null);
      setPhotoAspectRatio(1);
      setPhotoMirrored(false);
      setShowChallengeDropdown(false);
      setSelectedChallenge(null);
      setIsSubmitting(false);
      setNotification(null);
      setIsCameraActive(true);
      
      // Load challenges
      loadChallenges();

      // Cleanup: deactivate camera when leaving the screen
      return () => {
        setIsCameraActive(false);
      };
    }, [loadChallenges])
  );

  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo) {
          setCapturedPhoto(photo.uri);
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
      } catch (error) {
        // Fallback to mock photo if camera fails
        const randomId = Math.floor(Math.random() * 1000);
        const mockPhotoUri = `https://picsum.photos/800/600?random=${randomId}`;
        setCapturedPhoto(mockPhotoUri);
        setPhotoAspectRatio(4/3);
        setPhotoMirrored(false);
      }
    } else {
      // Mock photo for web or when camera not available
      const randomId = Math.floor(Math.random() * 1000);
      const mockPhotoUri = `https://picsum.photos/800/600?random=${randomId}`;
      setCapturedPhoto(mockPhotoUri);
      setPhotoAspectRatio(4/3);
      setPhotoMirrored(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    if (!preselectedChallengeId) {
      setSelectedChallenge(null);
    }
  };

  const handleToggleDropdown = () => {
    setShowChallengeDropdown(prev => !prev);
  };

  const handleChallengeSelect = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setShowChallengeDropdown(false);
  };

  const handleSubmit = async () => {
    if (!capturedPhoto || !selectedChallenge || isSubmitting) return;

    setIsSubmitting(true);
    setNotification({ type: 'loading', message: 'Verifying photo with AI...' });

    try {
      // Send photo to AI for verification
      const verifyResult = await photoService.verifyPhotoWithAI(capturedPhoto, selectedChallenge.title);

      if (verifyResult.success && verifyResult.data?.verified) {
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
        // Verification failed
        setNotification({ type: 'error', message: verifyResult.data?.message || 'Photo verification failed.' });
        
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

              <View style={styles.dropdownContainer}>
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
                  <View style={styles.dropdown}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                      {uncompletedChallenges.map((item) => (
                        <Pressable
                          key={item.id}
                          style={({ hovered }: WebPressableState) => [styles.dropdownItem, hovered && styles.dropdownItemHovered]}
                          onPress={() => handleChallengeSelect(item)}
                        >
                          <View style={styles.dropdownItemContent}>
                            <Text style={styles.dropdownItemTitle}>{item.title}</Text>
                            {item.description ? (
                              <Text style={styles.dropdownItemDescription} numberOfLines={2}>{item.description}</Text>
                            ) : null}
                          </View>
                          <Text style={styles.dropdownItemPoints}>{item.points} pts</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
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
          <Ionicons name="camera-outline" size={60} color="#000" />
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
          />
        ) : (
          <View style={styles.cameraView} />
        )}
        <View style={[styles.cameraControls, centerContent && styles.cameraControlsDesktop]}>
          {!(isDesktop && isWeb) && (
            <Pressable
              style={styles.flipButton}
              onPress={toggleCameraFacing}
            >
              <Ionicons name="camera-reverse" size={28} color="#fff" />
            </Pressable>
          )}
          <Pressable
            style={({ hovered, pressed }: WebPressableState) => [
              styles.captureButton,
              hovered && styles.captureButtonHovered,
              pressed && styles.captureButtonPressed,
            ]}
            onPress={handleCapture}
          >
            <View style={styles.captureButtonInner} />
          </Pressable>
          {!(isDesktop && isWeb) && <View style={styles.flipButtonPlaceholder} />}
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
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
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
    resizeMode: 'contain',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 200,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 200,
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
  dropdownItemHovered: {
    backgroundColor: '#f9f9f9',
  },
  dropdownItemContent: {
    flex: 1,
  },
  dropdownItemTitle: {
    fontSize: 14,
    color: '#262626',
    fontWeight: '500',
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
