import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const getTodayChallenge = () => {
  const challenges = [
    'Take a photo of something blue',
    'Take a photo of something round',
    'Take a photo of food',
    'Take a photo of a smile',
    'Take a photo of nature',
  ];
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  return challenges[dayOfYear % challenges.length];
};

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [challenge, setChallenge] = useState('');

  useEffect(() => {
    setChallenge(getTodayChallenge());
  }, []);

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 40 }}>Foto Fight</Text>
      <Text style={{ fontSize: 18, marginBottom: 40, textAlign: 'center' }}>{challenge}</Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('Camera')}
        style={{
          backgroundColor: '#000',
          paddingVertical: 15,
          paddingHorizontal: 40,
          borderRadius: 5,
          width: '100%',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Take photo</Text>
      </TouchableOpacity>
    </View>
  );
}
