import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { photoService, Post } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { useResponsive, CONTENT_MAX_WIDTH } from '../../hooks/useResponsive';
import FeedImage from '../../components/FeedImage';
import Avatar from '../../components/Avatar';

export default function FeedScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isDesktop, isTablet } = useResponsive();
  const centerContent = isDesktop || isTablet;
  const { user: authUser } = useAuth();

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
          <Avatar
            avatarUrl={item.avatarUrl}
            username={item.username}
            size={24}
            style={{ marginRight: 6 }}
          />
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

  // Empty state
  if (posts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[
          styles.emptyContainer,
          centerContent && styles.emptyContainerDesktop,
        ]}>
          <Ionicons name="images-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Feed is empty</Text>
          <Text style={styles.emptyText}>Be the first to post a photo!</Text>
        </View>
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
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        style={styles.flatList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fafafa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#fafafa',
  },
  emptyContainerDesktop: {
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#262626',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8e8e8e',
    textAlign: 'center',
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
