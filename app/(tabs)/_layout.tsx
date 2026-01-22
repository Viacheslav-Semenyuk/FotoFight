import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, View, StyleSheet, Platform } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import Sidebar from '../../components/Sidebar';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { isDesktop, isTablet, width } = useResponsive();
  const showSidebar = isDesktop || isTablet;
  const isSmallScreen = width < 380;

  return (
    <View style={styles.container}>
      {showSidebar && <Sidebar />}
      <View style={styles.content}>
        <Tabs
          initialRouteName="feed"
          screenOptions={{
            tabBarActiveTintColor: '#000',
            tabBarInactiveTintColor: '#999',
            headerStyle: {
              backgroundColor: '#000',
              borderBottomWidth: 0,
              elevation: 0,
              shadowOpacity: 0,
              height: 56 + insets.top,
            },
            headerStatusBarHeight: insets.top,
            headerShadowVisible: false,
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
            // Hide tab bar on desktop/tablet
            tabBarStyle: showSidebar ? { display: 'none' } : {
              backgroundColor: '#fff',
              borderTopWidth: 1,
              borderTopColor: '#e0e0e0',
              paddingBottom: Math.max(insets.bottom, 8),
              height: 60 + Math.max(insets.bottom - 8, 0),
            },
            tabBarShowLabel: !isSmallScreen,
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: '500',
            },
            // Hide header completely (mobile and desktop/tablet)
            headerShown: false,
          }}
        >
          <Tabs.Screen
            name="feed"
            options={{
              title: 'Feed',
              headerTitle: 'Foto Fight',
              headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="home" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="challenges"
            options={{
              title: 'Challenges',
              headerTitle: 'Challenges',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="flash" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="camera"
            options={{
              title: '',
              headerTitle: 'Camera',
              tabBarIcon: () => (
                <Ionicons name="camera" size={28} color="#fff" />
              ),

              tabBarButton: (props) => (
                <Pressable
                  {...props}
                  style={{
                    marginTop: -20,
                    height: 64,
                    width: 64,
                    borderRadius: 32,
                    backgroundColor: '#000',
                    borderWidth: 4,
                    borderColor: '#fff',
                    alignSelf: 'center',
                    ...(Platform.OS === 'web' ? {
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
                    } : {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 4,
                      elevation: 5,
                    }),
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="leaderboard"
            options={{
              title: 'Ranking',
              headerTitle: 'Leaderboard',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="trophy" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              headerTitle: 'Profile',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="person" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="user/[userId]"
            options={{
              title: 'User Profile',
              headerTitle: 'Profile',
              href: null, // Hide from tab bar
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              headerTitle: 'Settings',
              href: null, // Hide from tab bar
            }}
          />
          <Tabs.Screen
            name="information"
            options={{
              title: 'Information',
              headerTitle: 'Information',
              href: null, // Hide from tab bar
            }}
          />
          <Tabs.Screen
            name="privacy-policy"
            options={{
              title: 'Privacy Policy',
              headerTitle: 'Privacy Policy',
              href: null, // Hide from tab bar
            }}
          />
          <Tabs.Screen
            name="terms-of-use"
            options={{
              title: 'Terms of Use',
              headerTitle: 'Terms of Use',
              href: null, // Hide from tab bar
            }}
          />
          <Tabs.Screen
            name="accessibility"
            options={{
              title: 'Accessibility',
              headerTitle: 'Accessibility Statement',
              href: null, // Hide from tab bar
            }}
          />
          <Tabs.Screen
            name="account-deletion"
            options={{
              title: 'Account Deletion',
              headerTitle: 'Account & Data Deletion',
              href: null, // Hide from tab bar
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
});
