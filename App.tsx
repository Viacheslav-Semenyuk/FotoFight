import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import CameraScreen from './screens/CameraScreen';
import ResultScreen from './screens/ResultScreen';
import { RootStackParamList } from './types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Foto Fight' }}
        />
        <Stack.Screen 
          name="Camera" 
          component={CameraScreen}
          options={{ title: 'Take Photo' }}
        />
        <Stack.Screen 
          name="Result" 
          component={ResultScreen}
          options={{ title: 'Foto Fight' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
