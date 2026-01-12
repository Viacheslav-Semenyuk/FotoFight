import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { userService, User, CURRENT_USER_ID } from '../../services';
import { useResponsive, CONTENT_MAX_WIDTH } from '../../hooks/useResponsive';

export default function LeaderboardScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isDesktop, isTablet } = useResponsive();
  const centerContent = isDesktop || isTablet;

  // Load leaderboard when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadLeaderboard = async () => {
        setIsLoading(true);
        const response = await userService.getLeaderboard();
        if (response.success && response.data) {
          setUsers(response.data);
        }
        setIsLoading(false);
      };
      loadLeaderboard();
    }, [])
  );

  const handleUserPress = (userId: string) => {
    if (userId === CURRENT_USER_ID) {
      router.push('/(tabs)/profile');
    } else {
      router.push(`/(tabs)/user/${userId}`);
    }
  };

  const renderItem = ({ item, index }: { item: User; index: number }) => {
    const isCurrentUser = item.id === CURRENT_USER_ID;
    
    return (
      <View style={[styles.item, isCurrentUser && styles.currentUserItem]}>
        <Text style={[styles.rank, index < 3 && styles.topRank]}>{index + 1}</Text>
        <Pressable 
          style={styles.userPressable}
          onPress={() => handleUserPress(item.id)}
        >
          <View style={[styles.avatar, isCurrentUser && styles.currentUserAvatar]}>
            <Text style={styles.avatarText}>
              {item.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.username, isCurrentUser && styles.currentUserName]}>
              {item.username}
              {isCurrentUser && ' (you)'}
            </Text>
            <Text style={styles.challengesText}>
              {item.challengesCompleted} challenges
            </Text>
          </View>
        </Pressable>
        <View style={styles.pointsContainer}>
          <Text style={styles.points}>{item.points}</Text>
          <Text style={styles.pointsLabel}>pts</Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        style={[styles.flatList, centerContent && styles.flatListDesktop]}
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  flatList: {
    width: '100%',
  },
  flatListDesktop: {
    alignSelf: 'center',
    maxWidth: CONTENT_MAX_WIDTH,
  },
  list: {
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  currentUserItem: {
    backgroundColor: '#f5f5f5',
  },
  rank: {
    width: 24,
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  topRank: {
    color: '#000',
    fontWeight: 'bold',
  },
  userPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    cursor: 'pointer',
  } as any,
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  currentUserAvatar: {
    backgroundColor: '#333',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '500',
    color: '#262626',
  },
  currentUserName: {
    fontWeight: 'bold',
    color: '#000',
  },
  challengesText: {
    fontSize: 11,
    color: '#999',
    marginTop: 1,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  points: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  pointsLabel: {
    fontSize: 11,
    color: '#999',
    marginLeft: 2,
  },
});
