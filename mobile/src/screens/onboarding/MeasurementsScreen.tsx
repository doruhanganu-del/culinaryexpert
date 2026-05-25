import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList, UnitSystem } from '../../types';
import { storage, StorageKeys } from '../../store/storage';
import { lengthUnitLabel } from '../../utils/unitConversions';

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Measurements'> };

type MeasurementFields = {
  waist: string; neck: string; hips: string; hipsLower: string;
  chest: string; arm: string; forearm: string;
  thigh: string; calf: string;
};

const EMPTY: MeasurementFields = {
  waist: '', neck: '', hips: '', hipsLower: '',
  chest: '', arm: '', forearm: '',
  thigh: '', calf: '',
};

export default function MeasurementsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const unitSystem = (storage.getString(StorageKeys.UNIT_SYSTEM) ?? 'metric') as UnitSystem;
  const lUnit = lengthUnitLabel(unitSystem);
  const bioStr = storage.getString('onboarding_bio');
  const bio = bioStr ? JSON.parse(bioStr) : {};

  const [m, setM] = useState<MeasurementFields>(EMPTY);

  const isFemale = bio.sex === 'female';

  const required =
    m.waist && m.neck && m.hipsLower &&
    (!isFemale || m.hips) &&
    m.chest && m.arm && m.forearm && m.thigh && m.calf;

  const field = (key: keyof MeasurementFields, label: string, placeholder: string) => (
    <View key={key} style={styles.fieldWrap}>
      <Text style={styles.label}>
        {label} <Text style={styles.unit}>({lUnit})</Text>
        <Text style={styles.req}> *</Text>
      </Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor="#B0B7C3"
        value={m[key]}
        onChangeText={v => setM(prev => ({ ...prev, [key]: v }))}
      />
    </View>
  );

  const handleContinue = () => {
    storage.set('onboarding_measurements', JSON.stringify(m));
    navigation.navigate('Lifestyle');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.step}>{t('onboarding.stepOf', { step: 3, total: 6 })}</Text>
        <Text style={styles.title}>{t('onboarding.measurements.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.measurements.subtitle')}</Text>

        {/* Body fat formula fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('onboarding.measurements.required')}</Text>
          {field('waist',     t('onboarding.measurements.waist'),     '82.0')}
          {field('neck',      t('onboarding.measurements.neck'),      '38.0')}
          {isFemale && field('hips', t('onboarding.measurements.hips'), '96.0')}
          {field('hipsLower', t('onboarding.measurements.hipsLower'), '98.0')}
          {field('chest',     t('onboarding.measurements.chest'),     '95.0')}
        </View>

        {/* Sculpt / lean mass fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('onboarding.measurements.bodySculpt')}</Text>
          <Text style={styles.sectionNote}>{t('onboarding.measurements.sideNote')}</Text>
          {field('arm',     t('onboarding.measurements.arm'),     '33.0')}
          {field('forearm', t('onboarding.measurements.forearm'), '28.0')}
          {field('thigh',   t('onboarding.measurements.thigh'),   '55.0')}
          {field('calf',    t('onboarding.measurements.calf'),    '37.0')}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.button, !required && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!required}
      >
        <Text style={styles.buttonText}>{t('common.continue')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fff', paddingHorizontal: 24 },
  step:         { color: '#6B7280', fontSize: 13, fontWeight: '500', marginTop: 24 },
  title:        { fontSize: 28, fontWeight: '800', color: '#111827', marginTop: 4, letterSpacing: -0.5 },
  subtitle:     { color: '#6B7280', fontSize: 14, marginTop: 6, marginBottom: 24 },
  section:      { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  sectionNote:  { fontSize: 12, color: '#B0B7C3', marginBottom: 12, fontStyle: 'italic' },
  fieldWrap:    { marginBottom: 4 },
  label:        { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  unit:         { fontWeight: '400', color: '#9CA3AF' },
  req:          { color: '#EF4444' },
  input:        { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 16, color: '#111827', marginBottom: 16 },
  button:       { backgroundColor: '#1B4332', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginVertical: 24 },
  buttonDisabled: { backgroundColor: '#D1D5DB' },
  buttonText:   { color: '#fff', fontSize: 17, fontWeight: '700' },
});
