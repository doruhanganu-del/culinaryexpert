import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../types';
import { userApi } from '../../api/endpoints';

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'MedicalDisclaimer'> };

export default function MedicalDisclaimerScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [accepted, setAccepted] = useState(false);

  const handleAccept = async () => {
    try { await userApi.acceptLegal('medical'); } catch {}
    navigation.navigate('BiologicalData');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t('onboarding.disclaimer.title')}</Text>
      <Text style={styles.subtitle}>{t('onboarding.disclaimer.subtitle')}</Text>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.warning}>⚠️ {t('onboarding.disclaimer.warningTitle')}</Text>
          <Text style={styles.body}>{t('onboarding.disclaimer.p1')}</Text>
          <Text style={styles.body}>{t('onboarding.disclaimer.p2')}</Text>
          <Text style={styles.body}>{t('onboarding.disclaimer.p3')}</Text>
          <Text style={styles.body}>{t('onboarding.disclaimer.p4')}</Text>
          <Text style={styles.body}>{t('onboarding.disclaimer.p5')}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.checkbox} onPress={() => setAccepted(!accepted)}>
          <View style={[styles.box, accepted && styles.boxChecked]}>
            {accepted && <Text style={styles.boxCheck}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>{t('onboarding.disclaimer.checkboxLabel')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !accepted && styles.buttonDisabled]}
          onPress={handleAccept}
          disabled={!accepted}
        >
          <Text style={styles.buttonText}>{t('onboarding.disclaimer.acceptButton')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#fff', paddingHorizontal: 24 },
  title:          { fontSize: 26, fontWeight: '800', color: '#111827', marginTop: 24 },
  subtitle:       { color: '#6B7280', fontSize: 14, marginTop: 4, marginBottom: 16 },
  scroll:         { flex: 1 },
  card:           { backgroundColor: '#FFF7ED', borderRadius: 16, padding: 20, gap: 12 },
  warning:        { fontSize: 16, fontWeight: '700', color: '#C2410C' },
  body:           { fontSize: 14, color: '#374151', lineHeight: 22 },
  footer:         { paddingVertical: 24, gap: 16 },
  checkbox:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  box:            { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  boxChecked:     { backgroundColor: '#1B4332', borderColor: '#1B4332' },
  boxCheck:       { color: '#fff', fontSize: 14, fontWeight: '700' },
  checkboxLabel:  { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },
  button:         { backgroundColor: '#1B4332', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#D1D5DB' },
  buttonText:     { color: '#fff', fontSize: 17, fontWeight: '700' },
});
