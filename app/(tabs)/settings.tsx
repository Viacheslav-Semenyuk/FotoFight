import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useResponsive, CONTENT_MAX_WIDTH } from '../../hooks/useResponsive';
import { useWindowDimensions } from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut, user: authUser } = useAuth();
  const { isDesktop, isTablet } = useResponsive();
  const centerContent = isDesktop || isTablet;
  const { width } = useWindowDimensions();

  const handleLogout = async () => {
    await signOut();
    router.push('/(tabs)/profile');
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={[
          styles.container,
          centerContent && styles.containerDesktop,
          Platform.OS === 'web' && { pointerEvents: 'auto' },
        ]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.settingsContainer,
            centerContent && { maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', width: '100%' },
          ]}
        >
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#262626" />
            </Pressable>
            <Text style={styles.title}>Settings</Text>
          </View>

          {/* Localization Button */}
          <Pressable style={styles.settingItem} onPress={() => {}}>
            <View style={styles.settingContent}>
              <Ionicons name="language-outline" size={24} color="#262626" />
              <Text style={styles.settingText}>Localization</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </Pressable>

          {/* Information Button */}
          <Pressable style={styles.settingItem} onPress={() => router.push('/(tabs)/information')}>
            <View style={styles.settingContent}>
              <Ionicons name="information-circle-outline" size={24} color="#262626" />
              <Text style={styles.settingText}>Information</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </Pressable>

          {/* Delete Account Button */}
          <Pressable style={styles.settingItem} onPress={() => router.push('/(tabs)/account-deletion')}>
            <View style={styles.settingContent}>
              <Ionicons name="trash-outline" size={24} color="#c00" />
              <Text style={[styles.settingText, styles.deleteAccountText]}>Delete Account</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </Pressable>

          {/* Logout Button */}
          <Pressable style={styles.settingItem} onPress={handleLogout}>
            <View style={styles.settingContent}>
              <Ionicons name="log-out-outline" size={24} color="#c00" />
              <Text style={[styles.settingText, styles.logoutText]}>Log Out</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  container: {
    flex: 1,
    width: '100%',
  },
  containerDesktop: {
    alignSelf: 'center',
    maxWidth: CONTENT_MAX_WIDTH,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  settingsContainer: {
    backgroundColor: '#fff',
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 8,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#262626',
    flex: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: '#262626',
  },
  logoutText: {
    color: '#c00',
  },
  deleteAccountText: {
    color: '#c00',
  },
});
