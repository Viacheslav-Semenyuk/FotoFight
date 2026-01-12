import React, { useState, useEffect, useCallback } from 'react';
import { View, Image, StyleSheet, ActivityIndicator, LayoutChangeEvent } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';

interface FeedImageProps {
  uri: string;
  aspectRatio?: number; // width / height
}

// Instagram's aspect ratio limits
const MIN_ASPECT_RATIO = 0.8; // Portrait limit (4:5)
const MAX_ASPECT_RATIO = 1.91; // Landscape limit (1.91:1)
const MAX_HEIGHT_RATIO = 0.75; // Max 75% of viewport height

export default function FeedImage({ uri, aspectRatio: providedAspectRatio }: FeedImageProps) {
  const { height: screenHeight } = useResponsive();
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

  // Clamp aspect ratio to Instagram's limits for container sizing
  const clampedAspectRatio = Math.max(MIN_ASPECT_RATIO, Math.min(MAX_ASPECT_RATIO, imageAspectRatio));
  
  // Calculate container height based on clamped aspect ratio
  let containerHeight = containerWidth > 0 ? containerWidth / clampedAspectRatio : 0;
  
  // Ensure container doesn't exceed viewport height
  const maxContainerHeight = screenHeight * MAX_HEIGHT_RATIO;
  if (containerHeight > maxContainerHeight) {
    containerHeight = maxContainerHeight;
  }

  // Calculate the actual displayed image dimensions (for contain behavior)
  // This handles images that don't match the container aspect ratio
  const containerAspectRatio = containerWidth / (containerHeight || 1);
  
  let displayWidth = containerWidth;
  let displayHeight = containerHeight;
  
  if (containerWidth > 0 && containerHeight > 0) {
    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider than container - fit to width, show letterbox (black bars top/bottom)
      displayWidth = containerWidth;
      displayHeight = containerWidth / imageAspectRatio;
    } else if (imageAspectRatio < containerAspectRatio) {
      // Image is taller than container - fit to height, show pillarbox (black bars left/right)
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
          width: displayWidth,
          height: displayHeight,
        }}
        resizeMode="contain"
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
