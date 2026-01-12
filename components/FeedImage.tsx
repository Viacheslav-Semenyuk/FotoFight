import React, { useState, useEffect, useCallback } from 'react';
import { View, Image, StyleSheet, ActivityIndicator, LayoutChangeEvent } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';

interface FeedImageProps {
  uri: string;
  aspectRatio?: number; // width / height
}

// Aspect ratio limits
const MIN_ASPECT_RATIO_MOBILE = 0.75; // Portrait limit for mobile (3:4)
const MIN_ASPECT_RATIO_DESKTOP = 0.8; // Portrait limit for desktop (4:5)
const MAX_ASPECT_RATIO = 1.91; // Landscape limit (1.91:1)
const MAX_HEIGHT_RATIO = 0.75; // Max 75% of viewport height

export default function FeedImage({ uri, aspectRatio: providedAspectRatio }: FeedImageProps) {
  const { height: screenHeight, isMobile } = useResponsive();
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(providedAspectRatio || 1);
  const [loading, setLoading] = useState(!providedAspectRatio);
  const [error, setError] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  // Handle container layout to get actual width
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  }, []);

  useEffect(() => {
    // If aspect ratio is provided, use it directly
    if (providedAspectRatio) {
      setImageAspectRatio(providedAspectRatio);
      setLoading(false);
      return;
    }

    // Otherwise, load image to get dimensions
    Image.getSize(
      uri,
      (width, height) => {
        setImageAspectRatio(width / height);
        setLoading(false);
      },
      () => {
        setError(true);
        setLoading(false);
      }
    );
  }, [uri, providedAspectRatio]);

  // Use different min aspect ratio for mobile vs desktop
  const minAspectRatio = isMobile ? MIN_ASPECT_RATIO_MOBILE : MIN_ASPECT_RATIO_DESKTOP;
  
  // Clamp aspect ratio to limits for container sizing
  const clampedAspectRatio = Math.max(minAspectRatio, Math.min(MAX_ASPECT_RATIO, imageAspectRatio));
  
  // Calculate container height based on clamped aspect ratio
  let containerHeight = containerWidth > 0 ? containerWidth / clampedAspectRatio : 0;
  
  // Ensure container doesn't exceed viewport height
  const maxContainerHeight = screenHeight * MAX_HEIGHT_RATIO;
  if (containerHeight > maxContainerHeight) {
    containerHeight = maxContainerHeight;
  }

  // On mobile, use cover mode to fill width without black bars
  // On desktop, use contain mode with calculated dimensions
  const useCoverMode = isMobile;
  
  // Calculate display dimensions for contain mode (desktop)
  let displayWidth = containerWidth;
  let displayHeight = containerHeight;
  
  if (!useCoverMode && containerWidth > 0 && containerHeight > 0) {
    const containerAspectRatio = containerWidth / containerHeight;
    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider than container - fit to width
      displayWidth = containerWidth;
      displayHeight = containerWidth / imageAspectRatio;
    } else if (imageAspectRatio < containerAspectRatio) {
      // Image is taller than container - fit to height
      displayHeight = containerHeight;
      displayWidth = containerHeight * imageAspectRatio;
    }
  }

  if (loading || containerWidth === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]} onLayout={onLayout}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (error) {
    return (
      <View 
        style={[styles.container, styles.errorContainer, { height: containerWidth }]} 
        onLayout={onLayout}
      >
        <View style={styles.errorPlaceholder} />
      </View>
    );
  }

  return (
    <View 
      style={[styles.container, { height: containerHeight }]} 
      onLayout={onLayout}
    >
      <Image
        source={{ uri }}
        style={{
          width: useCoverMode ? '100%' : displayWidth,
          height: useCoverMode ? '100%' : displayHeight,
          pointerEvents: 'auto',
        }}
        resizeMode={useCoverMode ? 'cover' : 'contain'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  loadingContainer: {
    aspectRatio: 1, // Square placeholder while loading
  },
  errorContainer: {
    backgroundColor: '#262626',
  },
  errorPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#404040',
  },
});
