import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useState, useEffect } from 'react';

// Mock leaderboard data (will come from backend later)
const mockLeaderboard = [
  { id: '1', name: 'Player1', score: 150, rank: 1 },
  { id: '2', name: 'Player2', score: 140, rank: 2 },
  { id: '3', name: 'Player3', score: 130, rank: 3 },
  { id: '4', name: 'Player4', score: 120, rank: 4 },
  { id: '5', name: 'Player5', score: 110, rank: 5 },
  { id: '6', name: 'Player6', score: 100, rank: 6 },
  { id: '7', name: 'Player7', score: 90, rank: 7 },
  { id: '8', name: 'Player8', score: 80, rank: 8 },
  { id: '9', name: 'Player9', score: 70, rank: 9 },
  { id: '10', name: 'Player10', score: 60, rank: 10 },
];

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  rank: number;
}

export default function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    // TODO: Fetch from backend
    setLeaderboard(mockLeaderboard);
  }, []);

  const renderItem = ({ item }: { item: LeaderboardEntry }) => {
    const isTopThree = item.rank <= 3;
    
    return (
      <View style={[styles.entry, isTopThree && styles.topEntry]}>
        <View style={styles.rankContainer}>
          <Text style={[styles.rank, isTopThree && styles.topRank]}>
            #{item.rank}
          </Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={[styles.name, isTopThree && styles.topName]}>
            {item.name}
          </Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={[styles.score, isTopThree && styles.topScore]}>
            {item.score} pts
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Top Players</Text>
      </View>
      <FlatList
        data={leaderboard}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#FF6B6B',
    padding: 20,
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  list: {
    padding: 10,
  },
  entry: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  topEntry: {
    backgroundColor: '#FFF3E0',
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  rankContainer: {
    width: 60,
    alignItems: 'center',
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  topRank: {
    color: '#FF6B6B',
    fontSize: 20,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  topName: {
    fontSize: 18,
    color: '#FF6B6B',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  score: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  topScore: {
    fontSize: 18,
    color: '#FF6B6B',
  },
});
