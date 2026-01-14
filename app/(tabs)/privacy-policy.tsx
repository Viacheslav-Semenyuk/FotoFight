import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useResponsive, CONTENT_MAX_WIDTH } from '../../hooks/useResponsive';

export default function PrivacyPolicyScreen() {
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
            styles.content,
            centerContent && { maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', width: '100%' },
          ]}
        >
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.text}>
            Effective Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
          <Text style={styles.paragraph}>
            This Privacy Policy describes how we collect, use, store, and protect personal data when you use Foto Fight, available on Web, Android, and iOS.
          </Text>
          <Text style={styles.paragraph}>
            By using Foto Fight, you agree to this Privacy Policy.
          </Text>
          <Text style={styles.subtitle}>1. Information We Collect</Text>
          <Text style={styles.subtitle2}>1.1 Information You Provide</Text>
          <Text style={styles.paragraph}>
            We may collect the following information:
          </Text>
          <Text style={styles.paragraph}>
            • Username{'\n'}
            • Email address (via Google Sign-In){'\n'}
            • Profile photo (if provided by Google){'\n'}
            • Photos uploaded to Foto Fight{'\n'}
            • Captions, comments, and other user-generated content
          </Text>
          <Text style={styles.subtitle2}>1.2 Information Collected Automatically</Text>
          <Text style={styles.paragraph}>
            When you use Foto Fight, we may automatically collect:
          </Text>
          <Text style={styles.paragraph}>
            • IP address{'\n'}
            • Device type and operating system{'\n'}
            • Browser type (for web version){'\n'}
            • Date and time of access{'\n'}
            • Technical logs and error data
          </Text>
          <Text style={styles.subtitle}>2. How We Use Information</Text>
          <Text style={styles.paragraph}>
            We use collected information to:
          </Text>
          <Text style={styles.paragraph}>
            • Register and authenticate users{'\n'}
            • Enable photo upload, display, and sharing features{'\n'}
            • Display user profiles and social content{'\n'}
            • Operate feeds, rankings, likes, and other social features{'\n'}
            • Improve Application performance and user experience{'\n'}
            • Ensure security and prevent abuse or misuse
          </Text>
          <Text style={styles.subtitle}>3. Google Authentication</Text>
          <Text style={styles.paragraph}>
            The Application uses Google OAuth for authentication.
          </Text>
          <Text style={styles.paragraph}>
            We receive only basic profile information permitted by Google, such as:
          </Text>
          <Text style={styles.paragraph}>
            • Email address{'\n'}
            • Name{'\n'}
            • Profile photo
          </Text>
          <Text style={styles.paragraph}>
            We do not receive or store Google account passwords.
          </Text>
          <Text style={styles.subtitle}>4. User Content and Content Moderation</Text>
          <Text style={styles.paragraph}>
            Photos and other user-generated content uploaded to Foto Fight are stored on secure servers.
          </Text>
          <Text style={styles.paragraph}>
            User content may be visible to other users according to Foto Fight's functionality.
          </Text>
          <Text style={styles.paragraph}>
            Users are fully responsible for the content they upload or share.
          </Text>
          <Text style={styles.paragraph}>
            We reserve the right, at our sole discretion and without prior notice, to remove, block, or delete any user-generated content (including photos, captions, comments, or other materials) that violates applicable laws, infringes the rights of third parties, breaches this Privacy Policy or other Application rules, or is deemed inappropriate, offensive, illegal, or unacceptable.
          </Text>
          <Text style={styles.paragraph}>
            Foto Fight may use automated systems, including AI-based tools, to verify challenge completion and moderate content.
          </Text>
          <Text style={styles.subtitle}>5. Data Sharing with Third Parties</Text>
          <Text style={styles.paragraph}>
            We do not sell users' personal data.
          </Text>
          <Text style={styles.paragraph}>
            Data may be shared only with:
          </Text>
          <Text style={styles.paragraph}>
            • Authentication providers (Google){'\n'}
            • Cloud and hosting providers used to operate Foto Fight{'\n'}
            • Authorities if required by law or legal process
          </Text>
          <Text style={styles.subtitle}>6. Data Storage and Security</Text>
          <Text style={styles.paragraph}>
            We apply reasonable technical and organizational measures to protect personal data, including:
          </Text>
          <Text style={styles.paragraph}>
            • Secure HTTPS connections (SSL encryption){'\n'}
            • Restricted access to data{'\n'}
            • Password-protected account access{'\n'}
            • Protection against unauthorized access and misuse{'\n'}
            • Data stored in password-controlled servers with limited access
          </Text>
          <Text style={styles.paragraph}>
            However, no method of transmission or storage is 100% secure. You also have a significant role in protecting your information. Do not share your username and password with others.
          </Text>
          <Text style={styles.subtitle}>7. Legal Basis for Processing Personal Data (GDPR Compliance)</Text>
          <Text style={styles.paragraph}>
            If applicable under GDPR, we process data based on:
          </Text>
          <Text style={styles.paragraph}>
            • Consent - when you have given us clear permission{'\n'}
            • Contract necessity - to fulfill our services to you{'\n'}
            • Legal obligations - when required by law{'\n'}
            • Legitimate interests - for purposes such as fraud prevention or improving services
          </Text>
          <Text style={styles.subtitle}>8. User Rights (GDPR)</Text>
          <Text style={styles.paragraph}>
            If you are located in the European Union, you have the right to:
          </Text>
          <Text style={styles.paragraph}>
            • Access your personal data{'\n'}
            • Correct or update your data{'\n'}
            • Request deletion of your account and associated data{'\n'}
            • Withdraw consent to data processing{'\n'}
            • Data portability (for EU residents){'\n'}
            • Restrict or object to processing
          </Text>
          <Text style={styles.paragraph}>
            To exercise these rights, please contact us using the details below.
          </Text>
          <Text style={styles.subtitle}>9. Data Retention Policy</Text>
          <Text style={styles.paragraph}>
            We retain personal data only as long as necessary for service delivery, compliance, and legitimate business purposes. Unused accounts and inactive data will be securely deleted after a defined retention period, unless retention is required by law.
          </Text>
          <Text style={styles.subtitle}>10. International Data Transfers</Text>
          <Text style={styles.paragraph}>
            If data is transferred outside of your jurisdiction, we ensure adequate safeguards, such as:
          </Text>
          <Text style={styles.paragraph}>
            • Standard contractual clauses (SCCs){'\n'}
            • Encryption and secure processing{'\n'}
            • Compliance with applicable data protection frameworks
          </Text>
          <Text style={styles.subtitle}>11. Privacy for California Residents (CCPA/CPRA Compliance)</Text>
          <Text style={styles.paragraph}>
            If you are a California resident, you have rights under the CCPA/CPRA:
          </Text>
          <Text style={styles.paragraph}>
            • Right to know what personal data we collect{'\n'}
            • Right to delete personal data{'\n'}
            • Right to opt out of data sales (we do not sell personal data){'\n'}
            • Right to non-discrimination for exercising your rights
          </Text>
          <Text style={styles.paragraph}>
            To exercise these rights, please contact us using the details below.
          </Text>
          <Text style={styles.subtitle}>12. Use of Cookies and Tracking Technologies</Text>
          <Text style={styles.paragraph}>
            When you browse Foto Fight (web version), we may use standard technologies called "cookies" to collect information about how you use Foto Fight. Cookies are small text files placed on your device that help personalize your experience.
          </Text>
          <Text style={styles.paragraph}>
            Cookies cannot be used to run programs or deliver viruses. You have the ability to accept or decline cookies through your browser settings. If you choose to decline cookies, you may not be able to fully experience certain features of Foto Fight.
          </Text>
          <Text style={styles.paragraph}>
            We may also generate non-identifying usage data, such as number of visits. This information is used for internal purposes only and contains no personal information.
          </Text>
          <Text style={styles.subtitle}>13. Third-Party Services and Affiliated Businesses</Text>
          <Text style={styles.paragraph}>
            We may use third-party companies and individuals to perform functions on our behalf, including:
          </Text>
          <Text style={styles.paragraph}>
            • Authentication services (Google OAuth){'\n'}
            • Cloud and hosting providers{'\n'}
            • Data storage and processing
          </Text>
          <Text style={styles.paragraph}>
            We provide such entities with access to certain information needed to perform their functions, but take measures to ensure they may not use it for other purposes. These third parties are either subject to this Privacy Policy or to their own privacy policy that is at least as protective as this Privacy Policy.
          </Text>
          <Text style={styles.subtitle}>14. Access to Your Personal Information</Text>
          <Text style={styles.paragraph}>
            We will provide you with the means to ensure that your personal information is correct and current. You may review and update this information at any time through your account settings.
          </Text>
          <Text style={styles.paragraph}>
            To protect your privacy and security, we will take reasonable steps to verify your identity before granting access to your data.
          </Text>
          <Text style={styles.subtitle}>15. Account and Data Deletion</Text>
          <Text style={styles.paragraph}>
            Users may:
          </Text>
          <Text style={styles.paragraph}>
            • Delete content within Foto Fight{'\n'}
            • Request full deletion of their account and personal data
          </Text>
          <Text style={styles.paragraph}>
            Upon request, data will be deleted or anonymized within a reasonable timeframe, unless retention is required by law.
          </Text>
          <Text style={styles.subtitle}>16. Children's Privacy</Text>
          <Text style={styles.paragraph}>
            Protecting the privacy of the very young is especially important. The Application is not intended for users under the age of 13. We never collect or maintain information from those we actually know are under 13, and no part of our service is structured to attract anyone under 13.
          </Text>
          <Text style={styles.subtitle}>17. Changes to This Policy</Text>
          <Text style={styles.paragraph}>
            We reserve the right to update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date. Significant changes will be communicated via Foto Fight or email notification. Continued use of Foto Fight after changes means acceptance of the updated Privacy Policy.
          </Text>
          <Text style={styles.subtitle}>18. Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have any questions about this Privacy Policy or data protection, please contact us at:
          </Text>
          <Text style={styles.paragraph}>
            Email: ebazy.official@gmail.com
          </Text>
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
  subtitle2: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
    marginTop: 12,
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 14,
    color: '#262626',
    lineHeight: 22,
    marginBottom: 12,
  },
});
