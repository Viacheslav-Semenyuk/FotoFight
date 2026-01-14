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

export default function AccessibilityScreen() {
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
            <Text style={styles.title}>Accessibility Statement</Text>
          </View>
          <Text style={styles.text}>
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
          <Text style={styles.subtitle}>General</Text>
          <Text style={styles.paragraph}>
            This is an accessibility statement for Foto Fight. We are a business that strives to provide access to our products or services to all customers or potential customers regardless of their disability, race, religion, ethnicity, skin tone, sexual orientation, or gender. We have made great efforts to accommodate as many of our customers and potential customers as possible, given our size, resources, and knowledge of our customers and potential customer needs.
          </Text>
          <Text style={styles.subtitle}>Accessibility on Foto Fight</Text>
          <Text style={styles.paragraph}>
            Foto Fight provides several methods, features, and policies that can help access our application and/or products or services provided or referred to on our application. There are also various aids available by third parties, which are provided by most web browsers on different operating systems.
          </Text>
          <Text style={styles.paragraph}>
            If you are having difficulty accessing Foto Fight even after utilizing any access features within this application and/or any third-party or browser features, we invite you to contact us for further assistance. Contact information is set forth below.
          </Text>
          <Text style={styles.subtitle}>Disclaimer</Text>
          <Text style={styles.paragraph}>
            We anticipate that from time to time, within our resources, we will be making modifications to parts of Foto Fight and possibly alterations to the accessibility of Foto Fight. Reasonable efforts toward improving the seamless, accessible, and unhindered use of our application by customers and potential customers is a worthwhile goal. Despite the efforts we may have made regarding accessibility, consistent with standard business practices for a company of our size and resources, some content, features, processes, or policies may be improved, so we welcome your suggestions.
          </Text>
          <Text style={styles.subtitle}>Third-Party Applications</Text>
          <Text style={styles.paragraph}>
            Foto Fight may use third-party add-ons or "plug-ins" for specific functions, such as Google Analytics, social media feeds, etc. These may not work or may not work the same for every user and/or every type of disability. We do not have control over the structure of these plug-ins. Therefore, we cannot modify them at all or to the extent that would accommodate every application user. We are not responsible for those elements we do not control.
          </Text>
          <Text style={styles.subtitle}>We Welcome Feedback</Text>
          <Text style={styles.paragraph}>
            We welcome your feedback on the accessibility of Foto Fight. Please let us know if you encounter accessibility barriers on Foto Fight. Please provide brief details such as screenshots, or detailed written or audio recordings of your description of the supposed area of the application, which included a barrier.
          </Text>
          <Text style={styles.paragraph}>
            PLEASE DO NOT USE THIS METHOD OF CONTACTING US FOR ANY OTHER REASON OTHER THAN FEEDBACK ON THE ACCESSIBILITY OF OUR APPLICATION; MESSAGES RELATED TO ANY OTHER MATTER WILL BE DISREGARDED.
          </Text>
          <Text style={styles.paragraph}>
            Accessibility Feedback via email: ebazy.official@gmail.com
          </Text>
          <Text style={styles.paragraph}>
            We appreciate your patience in awaiting our response, as we are a small team. Therefore, responses to feedback may take up to sixty days in some instances.
          </Text>
          <Text style={styles.subtitle}>Privacy</Text>
          <Text style={styles.paragraph}>
            We respect your privacy. In addition to the privacy policy found on Foto Fight, we offer additional privacy guidelines for persons wishing to contact us regarding application accessibility. If you would prefer a response to your feedback from a staff member, we ask you to utilize the email contact method. Using the email contact method does not require you to provide us with a name.
          </Text>
          <Text style={styles.subtitle}>Compatibility with browsers and assistive technology</Text>
          <Text style={styles.paragraph}>
            Foto Fight is designed to be compatible with the following assistive technologies:
          </Text>
          <Text style={styles.paragraph}>
            • Browsers: Google Chrome, Apple Safari, Microsoft Edge, Mozilla Firefox{'\n'}
            • Operating Systems: iOS, Android, macOS, Windows
          </Text>
          <Text style={styles.paragraph}>
            Foto Fight may not be compatible with:
          </Text>
          <Text style={styles.paragraph}>
            • Any browsers older than three major versions{'\n'}
            • Mobile operating systems older than five years
          </Text>
          <Text style={styles.subtitle}>Technical specifications</Text>
          <Text style={styles.paragraph}>
            Accessibility of Foto Fight relies on the following technologies to work with the particular combination of web browser and any assistive technologies or plug-ins installed on your device:
          </Text>
          <Text style={styles.paragraph}>
            • React Native (mobile application framework){'\n'}
            • React Native Web (web platform implementation){'\n'}
            • HTML{'\n'}
            • WAI-ARIA{'\n'}
            • CSS{'\n'}
            • JavaScript
          </Text>
          <Text style={styles.paragraph}>
            These technologies are relied upon for conformance with the accessibility standards used.
          </Text>
          <Text style={styles.subtitle}>Limitations and alternatives</Text>
          <Text style={styles.paragraph}>
            Despite our best efforts to offer accessibility to all customers and potential customers of Foto Fight, there may be some limitations. Below is a description of known limitations and possible solutions. Please contact us if you observe an issue not listed below.
          </Text>
          <Text style={styles.paragraph}>
            Known limitations for Foto Fight:
          </Text>
          <Text style={styles.paragraph}>
            • User-uploaded content (photos and images may not have text alternatives) because we cannot ensure the quality of user contributions. We monitor user content and typically address issues within 60 business days. Please use the report feature if you encounter an issue.
          </Text>
          <Text style={styles.subtitle}>Assessment approach</Text>
          <Text style={styles.paragraph}>
            We assess the accessibility of Foto Fight through self-evaluation and external evaluation when available.
          </Text>
          <Text style={styles.subtitle}>Formal complaints</Text>
          <Text style={styles.paragraph}>
            We care about your experience utilizing Foto Fight. Therefore, you must write to us to file a formal complaint. Please include your full name, address, and contact information where we can reach you, along with a detailed description of your complaint, including the date and time the complaint was observed and an area of the application your complaint is concerned.
          </Text>
          <Text style={styles.paragraph}>
            We aim to respond to accessibility complaints within thirty days and propose a solution within sixty business days of receiving the complaint. We remind you that we are a small team and appreciate your patience as we strive to respond to your complaint within a reasonable time frame appropriate for the size and resources available to our business.
          </Text>
          <Text style={styles.paragraph}>
            Although we aim to respond to all complaints, a failure to provide complete information in your complaints, such as the full name, email, address, phone number, or detailed descriptions of the complaint, may remove our ability to review, analyze, and or contact you regarding such complaint, or offer proposed solutions of your complaint in a manner that is appropriate or timely. In such a situation, complaints with missing information may be disregarded.
          </Text>
          <Text style={styles.paragraph}>
            Formal complaints may be sent to: ebazy.official@gmail.com
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
