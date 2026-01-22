import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { challengeService, ChallengeWithStatus } from '../../services';
import { useResponsive, CONTENT_MAX_WIDTH } from '../../hooks/useResponsive';

export default function ChallengesScreen() {
  const router = useRouter();
  const [challenges, setChallenges] = useState<ChallengeWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isDesktop, isTablet } = useResponsive();
  const centerContent = isDesktop || isTablet;

  // Load challenges when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadChallenges = async () => {
        setIsLoading(true);
        const response = await challengeService.getChallengesWithStatus();
        if (response.success && response.data) {
          setChallenges(response.data);
        }
        setIsLoading(false);
      };
      loadChallenges();
    }, [])
  );

  const handleCameraPress = (challengeId: string) => {
    // Always navigate to camera - it will show "Sign in to use the camera" if user is not authenticated
    router.push({
      pathname: '/(tabs)/camera',
      params: { preselectedChallengeId: challengeId },
    });
  };

  const renderChallenge = ({ item }: { item: ChallengeWithStatus }) => {
    const isCompleted = item.isCompletedByCurrentUser;
    
    return (
      <View style={styles.challengeCard}>
        <View style={styles.challengeInfo}>
          <Text style={[styles.challengeTitle, isCompleted && styles.completedTitle]}>
            {item.title}
          </Text>
          {item.completedCount > 0 && (
            <Text style={styles.completedByText}>
              {item.completedCount} {item.completedCount === 1 ? 'user' : 'users'} completed the challenge
            </Text>
          )}
        </View>
        <View style={styles.pointsContainer}>
          <Text style={[styles.pointsText, isCompleted && styles.completedPoints]}>{item.points}</Text>
          <Text style={styles.pointsLabel}>pts</Text>
        </View>
        {isCompleted ? (
          <View style={styles.cameraButton}>
            <Ionicons name="checkmark-circle" size={24} color="#000" />
          </View>
        ) : (
          <Pressable
            style={({ hovered }) => [styles.cameraButton, hovered && styles.cameraButtonHovered]}
            onPress={() => handleCameraPress(item.id)}
          >
            <Ionicons name="camera" size={24} color="#000" />
          </Pressable>
        )}
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
        data={challenges}
        renderItem={renderChallenge}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          centerContent && styles.listDesktop,
        ]}
        showsVerticalScrollIndicator={false}
        style={[styles.flatList, centerContent && styles.flatListDesktop]}
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
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
  listDesktop: {
  },
  challengeCard: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#262626',
  },
  completedTitle: {
    color: '#8e8e8e',
  },
  completedByText: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  pointsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  completedPoints: {
    color: '#8e8e8e',
  },
  pointsLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: -2,
  },
  cameraButton: {
    padding: 8,
    borderRadius: 8,
  },
  cameraButtonHovered: {
    backgroundColor: '#f0f0f0',
  },
});
