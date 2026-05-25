import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsOfServiceScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.updated}>Last updated: January 1, 2025</Text>

        <Section title="1. Acceptance of Terms">
          By downloading, installing, or using CulinaryExpert, you agree to be bound by these Terms of Service. If you do not agree, do not use the application.
        </Section>

        <Section title="2. License Grant">
          CulinaryExpert grants you a personal, non-exclusive, non-transferable, revocable license to use the application on your personal devices solely for your personal, non-commercial purposes.
        </Section>

        <Section title="3. User Responsibilities">
          You are responsible for maintaining the confidentiality of your account credentials, all activities under your account, and ensuring that your use of the app complies with applicable laws.
        </Section>

        <Section title="4. Health Disclaimer">
          CulinaryExpert is a fitness and nutrition tool for informational purposes only. It is NOT a substitute for professional medical advice. Always consult a qualified healthcare professional before making changes to your diet or exercise routine.
        </Section>

        <Section title="5. No Warranty">
          The application is provided "AS IS" without warranty of any kind. We do not warrant that the service will be uninterrupted, error-free, or that nutritional data is 100% accurate. Nutritional information is sourced from publicly available databases and may contain inaccuracies.
        </Section>

        <Section title="6. Limitation of Liability">
          To the maximum extent permitted by law, CulinaryExpert shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the application, including any health-related decisions made based on information provided by the app.
        </Section>

        <Section title="7. Termination">
          We reserve the right to terminate or suspend your account at any time for violation of these terms. You may delete your account at any time through the Profile section.
        </Section>

        <Section title="8. Governing Law">
          These terms shall be governed by the laws of the State of Delaware, United States, without regard to conflict of law principles.
        </Section>

        <Section title="9. Contact">
          For questions about these Terms: legal@culinaryexpert.app
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fff' },
  content:      { paddingHorizontal: 24, paddingBottom: 48 },
  title:        { fontSize: 26, fontWeight: '800', color: '#111827', marginTop: 24 },
  updated:      { fontSize: 13, color: '#9CA3AF', marginTop: 4, marginBottom: 24 },
  section:      { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  body:         { fontSize: 14, color: '#374151', lineHeight: 22 },
});
