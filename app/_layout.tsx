import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FF6B6B',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Foto Fight',
            headerShown: true,
          }} 
        />
        <Stack.Screen 
          name="camera" 
          options={{ 
            title: 'Take Photo',
            headerShown: true,
          }} 
        />
        <Stack.Screen 
          name="leaderboard" 
          options={{ 
            title: 'Leaderboard',
            headerShown: true,
          }} 
        />
      </Stack>
    </>
  );
}
