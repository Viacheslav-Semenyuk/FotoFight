import React from 'react';
import { View, Text } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

type ResultScreenRouteProp = RouteProp<RootStackParamList, 'Result'>;

export default function ResultScreen() {
  const route = useRoute<ResultScreenRouteProp>();
  const photoUri = route.params?.photoUri;

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 40 }}>Foto Fight</Text>
      <Text style={{ fontSize: 18, textAlign: 'center' }}>Checking your photo...</Text>
    </View>
  );
}
