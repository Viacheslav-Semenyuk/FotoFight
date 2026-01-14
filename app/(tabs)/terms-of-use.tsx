import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useResponsive, CONTENT_MAX_WIDTH } from '../../hooks/useResponsive';

export default function TermsOfUseScreen() {
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
            styles.content,
            centerContent && { maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', width: '100%' },
          ]}
        >
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.push('/(tabs)/information')}>
              <Ionicons name="chevron-back" size={24} color="#262626" />
            </Pressable>
            <Text style={styles.title}>Terms of Service</Text>
          </View>
          <Text style={styles.text}>
            Effective Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
          <Text style={styles.paragraph}>
            These Terms of Service ("Terms" or "Terms & Conditions") govern your access to and use of our application ("Foto Fight"), available on Web, Android, and iOS. Please carefully read these Terms & Conditions before using or obtaining any information, material, products or services through Foto Fight.
          </Text>
          <Text style={styles.paragraph}>
            By accessing or using Foto Fight, you agree to be bound by these Terms. If you do not agree to all of these Terms & Conditions, you may not use Foto Fight in any way. We encourage you to regularly review these Terms as we may amend them from time to time.
          </Text>
          <Text style={styles.subtitle}>1. General</Text>
          <Text style={styles.paragraph}>
            The content, products and services available through Foto Fight are subject to change without notice. Continued use of Foto Fight constitutes acceptance of any changes to these Terms and other guidelines or policies governing Foto Fight.
          </Text>
          <Text style={styles.subtitle}>2. Eligibility</Text>
          <Text style={styles.paragraph}>
            You must be at least 13 years old to use Foto Fight. By using Foto Fight, you represent that you meet this requirement. Use of Foto Fight shall not be for any illegal, harmful or otherwise inappropriate purpose, as determined by us in our sole discretion.
          </Text>
          <Text style={styles.subtitle}>3. User Accounts</Text>
          <Text style={styles.paragraph}>
            To access certain features, you must sign in using Google authentication. It is your exclusive obligation to maintain secure access to your account. You are exclusively responsible for all activities that occur in connection with your account.
          </Text>
          <Text style={styles.paragraph}>
            You agree to immediately notify us of any unauthorized uses of your account or any other breaches of security. We will not be liable for any loss or damages of any kind caused by your failure to comply with the foregoing security obligations or caused by any person to whom you grant access to your account.
          </Text>
          <Text style={styles.subtitle}>4. User Content</Text>
          <Text style={styles.paragraph}>
            The Application allows users to upload, publish, and share content, including photos, captions, and comments ("User Content").
          </Text>
          <Text style={styles.paragraph}>
            By uploading User Content, you confirm that:
          </Text>
          <Text style={styles.paragraph}>
            • you own the content or have the necessary rights to publish it{'\n'}
            • the content does not violate laws or third-party rights
          </Text>
          <Text style={styles.paragraph}>
            You retain ownership of your User Content, but you grant us a non-exclusive, worldwide, royalty-free license to host, store, display, and distribute such content solely for operating and improving Foto Fight.
          </Text>
          <Text style={styles.subtitle}>5. Content Moderation</Text>
          <Text style={styles.paragraph}>
            We reserve the right, at our sole discretion and without prior notice, to review, remove, block, or delete any User Content that we determine to be unlawful, infringing, offensive, harmful, misleading, or otherwise inappropriate, or that violates these Terms or applicable laws.
          </Text>
          <Text style={styles.paragraph}>
            We are not obligated to monitor User Content, but we may do so at any time. Failure to comply with these Terms & Conditions, Privacy Policy or any other policy constitutes a breach that may result in the termination of your use of Foto Fight.
          </Text>
          <Text style={styles.paragraph}>
            Foto Fight may use automated systems, including AI-based tools, to verify challenge completion and moderate content.
          </Text>
          <Text style={styles.subtitle}>6. Prohibited Conduct</Text>
          <Text style={styles.paragraph}>
            You agree not to:
          </Text>
          <Text style={styles.paragraph}>
            • upload illegal, harmful, abusive, or offensive content{'\n'}
            • impersonate another person or entity{'\n'}
            • violate intellectual property rights{'\n'}
            • attempt to gain unauthorized access to Foto Fight{'\n'}
            • interfere with the operation or security of Foto Fight{'\n'}
            • use Foto Fight for spam, fraud, or abuse
          </Text>
          <Text style={styles.subtitle}>7. Termination, Restriction & Suspension</Text>
          <Text style={styles.paragraph}>
            We retain the right to terminate, restrict or suspend your use of Foto Fight at any time in our sole discretion without prior notice. We may suspend or terminate your account if:
          </Text>
          <Text style={styles.paragraph}>
            • you violate these Terms{'\n'}
            • you engage in unlawful or harmful behavior{'\n'}
            • required by law or regulation
          </Text>
          <Text style={styles.paragraph}>
            Failure to address any breach does not waive our right to act on similar breaches. You may stop using Foto Fight and request account deletion at any time.
          </Text>
          <Text style={styles.subtitle}>8. Intellectual Property</Text>
          <Text style={styles.paragraph}>
            WE RESPECT AND SUPPORT THE INTELLECTUAL PROPERTY RIGHTS OF USERS. ANY PHOTOS, IMAGES, OR OTHER CONTENT SUBMITTED, SHOWCASED, OR UPLOADED THROUGH FOTO FIGHT REMAINS THE SOLE PROPERTY OF THE USER WHO CREATED OR UPLOADED SUCH CONTENT. WE DO NOT CLAIM OWNERSHIP OVER THE RIGHTS TO ANY USER-SUBMITTED OR USER-GENERATED CONTENT.
          </Text>
          <Text style={styles.paragraph}>
            All other content and materials on Foto Fight, excluding user-submitted content, are protected by copyright. Your access to this content is limited to a non-exclusive, non-transferable license for personal, non-commercial use, as permitted under these Terms.
          </Text>
          <Text style={styles.paragraph}>
            You may not modify, copy, distribute, transmit, display, publish, sell, license, create derivative works from, or otherwise exploit any content on or through Foto Fight for commercial or public purposes without proper authorization from the respective rights holder.
          </Text>
          <Text style={styles.paragraph}>
            If you believe that any content on Foto Fight infringes your copyright or intellectual property rights, please contact us with detailed information regarding the alleged infringement.
          </Text>
          <Text style={styles.subtitle}>9. Linked Sites and Third-Party Content</Text>
          <Text style={styles.paragraph}>
            The Application may provide links to other sites or third-party content. We have no discretion to alter, update, or control the content on linked sites. The fact that we have provided a link is not an endorsement, authorization, sponsorship, or affiliation with respect to such site.
          </Text>
          <Text style={styles.paragraph}>
            All content, products and services on Foto Fight, or obtained from linked sites, are provided to you "AS IS" without warranty of any kind. We do not endorse and are not responsible for the accuracy, reliability, or content of third-party sites or services.
          </Text>
          <Text style={styles.subtitle}>10. Privacy Policy</Text>
          <Text style={styles.paragraph}>
            Your use of Foto Fight is also governed by our Privacy Policy, which describes how we collect and process personal data. To understand how we collect, use, and protect your personal information, please review our Privacy Policy.
          </Text>
          <Text style={styles.subtitle}>11. Disclaimer of Warranties</Text>
          <Text style={styles.paragraph}>
            The Application is provided "as is" and "as available".
          </Text>
          <Text style={styles.paragraph}>
            We make no warranties regarding:
          </Text>
          <Text style={styles.paragraph}>
            • uninterrupted or error-free operation{'\n'}
            • accuracy or reliability of content{'\n'}
            • availability of features
          </Text>
          <Text style={styles.paragraph}>
            Use of Foto Fight is at your own risk.
          </Text>
          <Text style={styles.subtitle}>12. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            Your use of any information or materials from Foto Fight is entirely at your own risk, for which we shall not be liable. It shall be your own responsibility to ensure that any products, services or information available through Foto Fight meet your specific requirements.
          </Text>
          <Text style={styles.paragraph}>
            To the maximum extent permitted by law, we shall not be liable, whether in contract, tort, strict liability or otherwise, for any indirect, punitive, special, consequential, or incidental damages (including without limitation lost profits, cost of procuring substitute service or lost opportunity) arising out of or in connection with the delay or inability to use Foto Fight, even if we are made aware of the possibility of such damages.
          </Text>
          <Text style={styles.paragraph}>
            This limitation on liability includes, but is not limited to, the transmission of any viruses, failure of mechanical or electronic equipment or communication lines, unauthorized access, theft, operator errors, or any force majeure. We cannot and do not guarantee continuous, uninterrupted or secure access to Foto Fight.
          </Text>
          <Text style={styles.subtitle}>13. Enforceability</Text>
          <Text style={styles.paragraph}>
            If any of the Terms or provisions contained herein are deemed to be invalid or unenforceable, the other Terms or remaining provisions shall remain valid and enforceable.
          </Text>
          <Text style={styles.subtitle}>14. Governing Law</Text>
          <Text style={styles.paragraph}>
            This Agreement shall be governed by and construed in accordance with the laws of Germany, unless otherwise required by applicable law. You further agree that any dispute arising out of these Terms of Service shall be resolved individually, apart from any form of class action lawsuit.
          </Text>
          <Text style={styles.subtitle}>15. Feedback</Text>
          <Text style={styles.paragraph}>
            While we encourage you to provide feedback, comments and questions, it is possible that we may not be able to respond to each one. You are responsible for messages, materials and the content of all submissions and it is your responsibility to ensure any said message is accurate, reliable, original and does not infringe upon the intellectual property rights of others.
          </Text>
          <Text style={styles.subtitle}>16. Changes to the Terms</Text>
          <Text style={styles.paragraph}>
            We reserve the right to update these Terms from time to time. Any changes will be posted on this page with an updated revision date. Continued use of Foto Fight after changes means acceptance of the updated Terms.
          </Text>
          <Text style={styles.subtitle}>17. Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have questions about these Terms, please contact us at:
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
