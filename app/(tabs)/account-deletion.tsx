import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  ActivityIndicator,
  TextInput,
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
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const handleDelete = async () => {
    if (!user) {
      return;
    }
    if (deleteConfirmation.toLowerCase() !== 'delete') {
      return;
    }
    setIsDeleting(true);
    try {
      console.log('[AccountDeletion] Starting account deletion...');
      const result = await deleteAccount();
      console.log('[AccountDeletion] Delete account result:', result);
      if (result.success) {
        // Navigate to login/home screen after successful deletion
        router.replace('/(tabs)/profile');
      } else {
        console.error('[AccountDeletion] Delete account failed:', result.error);
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('[AccountDeletion] Delete account error:', error);
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
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.push('/(tabs)/information')}>
              <Ionicons name="chevron-back" size={24} color="#262626" />
            </Pressable>
            <Text style={styles.title}>Account & Data Deletion</Text>
          </View>
          <Text style={styles.paragraph}>
            Users of Foto Fight can request deletion of their account and associated personal data at any time.
          </Text>
          <Text style={styles.subtitle}>How to delete your account</Text>
          <Text style={styles.paragraph}>
            You can delete your account directly in the application by navigating to:
          </Text>
          <Text style={styles.paragraph}>
            Profile → Settings → Delete Account → Delete My Account
          </Text>
          <Text style={styles.paragraph}>
            Alternatively, you may request account deletion by contacting us at:
          </Text>
          <Text style={styles.paragraph}>
            Email: ebazy.official@gmail.com
          </Text>
          <Text style={styles.subtitle}>What happens when you delete your account</Text>
          <Text style={styles.paragraph}>
            When you delete your account, the following will happen:
          </Text>
          <Text style={styles.paragraph}>
            • Your user profile will be permanently deleted{'\n'}
            • Uploaded photos, captions, comments, and other user-generated content will be removed{'\n'}
            • Authentication data (including email and Google account identifiers) will be deleted{'\n'}
            • Points, achievements, and challenge participation records will be deleted{'\n'}
            • Any stored personal data associated with your account will be deleted or anonymized
          </Text>
          <Text style={styles.paragraph}>
            Account deletion is permanent and cannot be undone. Once your account is deleted, you will not be able to recover any data or content associated with your account.
          </Text>
          <Text style={styles.subtitle}>Processing time</Text>
          <Text style={styles.paragraph}>
            When you delete your account through the application, the deletion process begins immediately. For account deletion requests submitted via email, we will process your request within 30 days of verification.
          </Text>
          <Text style={styles.subtitle}>Data retention exceptions</Text>
          <Text style={styles.paragraph}>
            Please note that some data may be retained in the following circumstances:
          </Text>
          <Text style={styles.paragraph}>
            • Data required to be retained by law or legal obligations{'\n'}
            • Data stored in backup systems, which will be deleted in accordance with our data retention schedule{'\n'}
            • Anonymized or aggregated data that cannot be linked to your identity
          </Text>

          {/* Delete Account Section */}
          {user && (
            <View style={styles.buttonContainer}>
              <Text style={styles.warningText}>
                To confirm account deletion, please type "delete" in the field below. This action cannot be undone and all your data will be permanently deleted.
              </Text>
              <TextInput
                style={styles.deleteInput}
                value={deleteConfirmation}
                onChangeText={setDeleteConfirmation}
                placeholder="Type 'delete' to confirm"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isDeleting}
              />
              <Pressable
                style={[
                  styles.deleteButton,
                  (isDeleting || deleteConfirmation.toLowerCase() !== 'delete') && styles.deleteButtonDisabled,
                ]}
                onPress={handleDelete}
                disabled={isDeleting || deleteConfirmation.toLowerCase() !== 'delete'}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#262626',
    flex: 1,
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
  warningText: {
    fontSize: 14,
    color: '#c00',
    lineHeight: 20,
    marginBottom: 16,
    fontWeight: '500',
  },
  deleteInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#262626',
    backgroundColor: '#fff',
    marginBottom: 16,
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
