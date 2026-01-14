import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ImageStyle, ViewStyle, TextStyle } from 'react-native';

interface AvatarProps {
  avatarUrl?: string | null;
  username: string;
  size?: number;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  textStyle?: TextStyle;
  // Add cache buster for Google URLs that sometimes fail to load
  enableCacheBuster?: boolean;
}

export default function Avatar({
  avatarUrl,
  username,
  size = 72,
  style,
  imageStyle,
  textStyle,
  enableCacheBuster = true,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageKey, setImageKey] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  // Reset error state when avatarUrl changes
  useEffect(() => {
    setImageError(false);
    setImageKey(0);
    setRetryCount(0);
  }, [avatarUrl]);

  // Get cache-busted URL for Google URLs to avoid stale cache issues
  const getImageUri = useCallback((retry: number = 0) => {
    if (!avatarUrl) return null;
    
    // For Google URLs, add a cache buster parameter
    if (enableCacheBuster && avatarUrl.includes('googleusercontent.com')) {
      const separator = avatarUrl.includes('?') ? '&' : '?';
      // Use different cache busters for retries
      const timestamp = Date.now() + retry;
      return `${avatarUrl}${separator}_t=${timestamp}`;
    }
    
    return avatarUrl;
  }, [avatarUrl, enableCacheBuster]);

  const handleImageError = useCallback(() => {
    // Retry up to 2 times for Google URLs
    if (retryCount < 2 && avatarUrl?.includes('googleusercontent.com')) {
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      setImageKey(newRetryCount);
      setImageError(false);
    } else {
      setImageError(true);
    }
  }, [retryCount, avatarUrl]);

  const handleImageLoad = useCallback(() => {
    setImageError(false);
    setRetryCount(0);
  }, []);

  const showImage = avatarUrl && !imageError;
  const initials = username.charAt(0).toUpperCase();

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        !showImage && styles.avatarWithText,
        style,
      ]}
    >
      {showImage ? (
        <Image
          key={imageKey}
          source={{ uri: getImageUri(retryCount) || undefined }}
          style={[
            styles.avatarImage,
            {
              width: size,
              height: size,
              backgroundColor: 'transparent',
            },
            imageStyle,
          ]}
          resizeMode="cover"
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      ) : (
        <Text
          style={[
            styles.avatarText,
            {
              fontSize: size * 0.4,
            },
            textStyle,
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
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
    fontWeight: 'bold',
  },
});
