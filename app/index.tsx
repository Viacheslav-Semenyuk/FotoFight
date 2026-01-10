import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';

// Mock daily challenge (will come from backend later)
const getDailyChallenge = () => {
  const challenges = [
    'Take a photo of something blue',
    'Take a photo of something round',
    'Take a photo of food',
    'Take a photo of a smile',
    'Take a photo of nature',
  ];
  // Use day of year to get consistent challenge per day
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  return challenges[dayOfYear % challenges.length];
};

export default function HomeScreen() {
  const router = useRouter();
  const [challenge, setChallenge] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setChallenge(getDailyChallenge());
    // Check if already submitted today (will check backend later)
    // For now, we'll just set it to false
    setSubmitted(false);
  }, []);

  const handleTakePhoto = () => {
    router.push('/camera');
  };

  const handleViewLeaderboard = () => {
    router.push('/leaderboard');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Daily Challenge</Text>
        
        <View style={styles.challengeBox}>
          <Text style={styles.challengeText}>{challenge}</Text>
        </View>

        {submitted ? (
          <View style={styles.submittedBox}>
            <Text style={styles.submittedText}>✓ Already submitted today!</Text>
            <Text style={styles.submittedSubtext}>Come back tomorrow for a new challenge</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleTakePhoto}
          >
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={handleViewLeaderboard}
        >
          <Text style={styles.secondaryButtonText}>View Leaderboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 40,
  },
  challengeBox: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 15,
    marginBottom: 40,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  challengeText: {
    fontSize: 24,
    textAlign: 'center',
    color: '#333',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 25,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  submittedBox: {
    backgroundColor: '#E8F5E9',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  submittedText: {
    fontSize: 18,
    color: '#2E7D32',
    fontWeight: '600',
    marginBottom: 5,
  },
  submittedSubtext: {
    fontSize: 14,
    color: '#66BB6A',
  },
});
