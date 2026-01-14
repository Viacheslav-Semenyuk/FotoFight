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
import { useResponsive, CONTENT_MAX_WIDTH } from '../../hooks/useResponsive';

export default function InformationScreen() {
  const router = useRouter();
  const { isDesktop, isTablet } = useResponsive();
  const centerContent = isDesktop || isTablet;

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
            <Pressable style={styles.backButton} onPress={() => router.push('/(tabs)/settings')}>
              <Ionicons name="chevron-back" size={24} color="#262626" />
            </Pressable>
            <Text style={styles.title}>Information</Text>
          </View>

          {/* Privacy Policy Button */}
          <Pressable style={styles.settingItem} onPress={() => router.push('/(tabs)/privacy-policy')}>
            <View style={styles.settingContent}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#262626" />
              <Text style={styles.settingText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </Pressable>

          {/* Terms of Use Button */}
          <Pressable style={styles.settingItem} onPress={() => router.push('/(tabs)/terms-of-use')}>
            <View style={styles.settingContent}>
              <Ionicons name="document-text-outline" size={24} color="#262626" />
              <Text style={styles.settingText}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </Pressable>

          {/* Accessibility Button */}
          <Pressable style={styles.settingItem} onPress={() => router.push('/(tabs)/accessibility')}>
            <View style={styles.settingContent}>
              <Ionicons name="accessibility-outline" size={24} color="#262626" />
              <Text style={styles.settingText}>Accessibility Statement</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </Pressable>

          {/* Account Deletion Button */}
          <Pressable style={styles.settingItem} onPress={() => router.push('/(tabs)/account-deletion')}>
            <View style={styles.settingContent}>
              <Ionicons name="trash-outline" size={24} color="#262626" />
              <Text style={styles.settingText}>Account & Data Deletion</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
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
});
