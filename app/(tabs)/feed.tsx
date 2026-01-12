import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { photoService, Post } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { useResponsive, CONTENT_MAX_WIDTH } from '../../hooks/useResponsive';
import FeedImage from '../../components/FeedImage';

const HEADER_HEIGHT = 56;

export default function FeedScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isDesktop, isTablet } = useResponsive();
  const centerContent = isDesktop || isTablet;
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const headerTranslateY = useRef(new Animated.Value(0)).current;

  // Reload posts every time feed comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadPosts = async () => {
        setIsLoading(true);
        const response = await photoService.getFeed();
        if (response.success && response.data) {
          setPosts(response.data);
        }
        setIsLoading(false);
      };
      loadPosts();
    }, [])
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const diff = currentScrollY - lastScrollY.current;
    
    if (currentScrollY > 10) {
      if (diff > 0) {
        // Scrolling down - hide header
        Animated.timing(headerTranslateY, {
          toValue: -(HEADER_HEIGHT + insets.top),
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else if (diff < -5) {
        // Scrolling up - show header
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    } else {
      // At top - always show header
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    
    lastScrollY.current = currentScrollY;
  };

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

  const renderPost = ({ item }: { item: Post }) => (
    <View style={[
      styles.postContainer,
      centerContent && styles.postContainerDesktop,
    ]}>
      {/* Header */}
      <View style={styles.postHeader}>
        <Pressable 
          style={styles.userInfo}
          onPress={() => {
            // Navigate to profile - if it's current user, go to profile tab
            if (authUser && item.userId === authUser.id) {
              router.push('/(tabs)/profile');
            } else {
              // Navigate to user's profile page (within tabs)
              router.push(`/(tabs)/user/${item.userId}`);
            }
          }}
        >
          <View style={[styles.avatar, !item.avatarUrl && styles.avatarWithText]}>
            {item.avatarUrl ? (
              <Image
                source={{ uri: item.avatarUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarText}>
                {item.username.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <Text style={styles.username}>{item.username}</Text>
        </Pressable>
        <Text style={styles.timeAgo}>{formatTime(item.timestamp)}</Text>
      </View>

      {/* Photo */}
      <FeedImage uri={item.photoUri} aspectRatio={item.aspectRatio} />

      {/* Footer */}
      <View style={styles.postFooter}>
        <Text style={styles.challengeText}>{item.challengeDescription}</Text>
        <Text style={styles.pointsText}>+{item.challengePoints} pts</Text>
      </View>
    </View>
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // Don't show custom header on desktop/tablet
  if (centerContent) {
    return (
      <View style={styles.container}>
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            styles.listDesktop,
          ]}
          showsVerticalScrollIndicator={false}
          style={[styles.flatList, styles.flatListDesktop]}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Custom Animated Header */}
      <Animated.View
        style={[
          styles.customHeader,
          {
            paddingTop: insets.top,
            height: HEADER_HEIGHT + insets.top,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <Text style={styles.headerTitle}>Foto Fight</Text>
      </Animated.View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingTop: HEADER_HEIGHT + insets.top },
        ]}
        showsVerticalScrollIndicator={false}
        style={styles.flatList}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  flatList: {
    width: '100%',
  },
  flatListDesktop: {
    alignSelf: 'center',
    maxWidth: CONTENT_MAX_WIDTH,
  },
  list: {
    paddingBottom: 0,
  },
  listDesktop: {
    paddingBottom: 0,
  },
  postContainer: {
    backgroundColor: '#fff',
  },
  postContainerDesktop: {
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 2,
    marginLeft: -2,
    borderRadius: 6,
    cursor: 'pointer',
  } as any,
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
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
    fontWeight: 'bold',
    fontSize: 10,
  },
  username: {
    fontSize: 12,
    fontWeight: '600',
    color: '#262626',
  },
  timeAgo: {
    fontSize: 10,
    color: '#8e8e8e',
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  challengeText: {
    fontSize: 12,
    color: '#262626',
  },
  pointsText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
  },
});
