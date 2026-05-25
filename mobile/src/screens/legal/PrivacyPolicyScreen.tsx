import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.updated}>Last updated: January 1, 2025</Text>

        <Section title="1. Data We Collect">
          We collect the health and fitness data you voluntarily provide, including biological measurements (weight, height, body measurements), dietary preferences, allergies, and meal feedback. We also collect your email address for account management.
        </Section>

        <Section title="2. Local vs. Cloud Storage">
          <Text style={styles.body}>
            <Text style={styles.bold}>Local storage:</Text> Your meal plan data, grocery lists, and daily preferences are stored locally on your device using an encrypted SQLite database. This data is accessible immediately and does not require an internet connection.
          </Text>
          {'\n\n'}
          <Text style={styles.bold}>Cloud storage (Supabase):</Text> Your health data, measurement history, and account information are synchronized to secure PostgreSQL databases hosted on Supabase, located in the United States. Synchronization occurs automatically when you have an internet connection.
        </Section>

        <Section title="3. GDPR (European Users)">
          If you are located in the European Economic Area, you have the right to: access your personal data, rectify inaccurate data, erase your data ("right to be forgotten"), restrict processing, and data portability. To exercise these rights, contact us at privacy@culinaryexpert.app.
        </Section>

        <Section title="4. CCPA (California Users)">
          California residents have the right to know what personal information we collect, the right to delete personal information, and the right to opt-out of the sale of personal information. We do NOT sell your personal information to third parties.
        </Section>

        <Section title="5. Health Data">
          Your health metrics (BMR, body fat percentage, measurements) are sensitive personal data. We store this data with encryption at rest and in transit (TLS 1.3). We do not share your health data with advertisers, insurers, or any third parties.
        </Section>

        <Section title="6. Data Retention">
          Your data is retained as long as your account is active. Upon account deletion, all cloud data is permanently erased within 30 days. Local device data must be cleared manually through your device settings.
        </Section>

        <Section title="7. Contact">
          For privacy inquiries: privacy@culinaryexpert.app
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
  bold:         { fontWeight: '700' },
});
