import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useResponsive, CONTENT_MAX_WIDTH } from '../../hooks/useResponsive';
import { useAuth } from '../../contexts/AuthContext';

export default function AccountDeletionScreen() {
  const router = useRouter();
  const { deleteAccount, user } = useAuth();
  const { isDesktop, isTablet } = useResponsive();
  const centerContent = isDesktop || isTablet;
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) {
      return;
    }

    setIsDeleting(true);
    try {
      console.log('Starting account deletion...');
      const result = await deleteAccount();
      console.log('Delete account result:', result);
      if (result.success) {
        // Navigate to login/home screen after successful deletion
        router.replace('/(tabs)/profile');
      } else {
        console.error('Delete account failed:', result.error);
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Delete account error:', error);
      setIsDeleting(false);
    }
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
            styles.content,
            centerContent && { maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', width: '100%' },
          ]}
        >
          <Text style={styles.title}>Account & Data Deletion</Text>
          <Text style={styles.paragraph}>
            Users of Foto Fight can request deletion of their account and associated personal data at any time.
          </Text>
          <Text style={styles.subtitle}>How to delete your account</Text>
          <Text style={styles.paragraph}>
            You can delete your account directly in the application by navigating to:
          </Text>
          <Text style={styles.paragraph}>
            Profile → Settings → Delete Account
          </Text>
          <Text style={styles.paragraph}>
            Alternatively, you may request account deletion by contacting us at:
          </Text>
          <Text style={styles.paragraph}>
            Email: ebazy.official@gmail.com
          </Text>
          <Text style={styles.subtitle}>What happens when you delete your account</Text>
          <Text style={styles.paragraph}>
            When your account deletion request is confirmed:
          </Text>
          <Text style={styles.paragraph}>
            • Your user profile will be permanently deleted{'\n'}
            • Uploaded photos, captions, comments, and other user-generated content will be removed{'\n'}
            • Authentication data (including email and Google account identifiers) will be deleted{'\n'}
            • Any stored personal data associated with your account will be deleted or anonymized
          </Text>
          <Text style={styles.subtitle}>Data retention</Text>
          <Text style={styles.paragraph}>
            Some data may be retained for a limited period where required by law, security, or legitimate business purposes. Any retained data will be securely stored and automatically deleted once the retention period expires.
          </Text>
          <Text style={styles.subtitle}>Processing time</Text>
          <Text style={styles.paragraph}>
            Account deletion requests are processed within a reasonable timeframe, typically within 30 days.
          </Text>

          {/* Delete Account Button */}
          {user && (
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                    <Text style={styles.deleteButtonText}>Delete My Account</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
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
  content: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#262626',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: '#262626',
    lineHeight: 22,
    marginBottom: 12,
  },
  buttonContainer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  deleteButton: {
    backgroundColor: '#c00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
