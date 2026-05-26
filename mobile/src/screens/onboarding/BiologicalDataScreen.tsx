import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList, Sex, UnitSystem } from '../../types';
import { storage, StorageKeys } from '../../store/storage';
import { weightUnitLabel, lengthUnitLabel } from '../../utils/unitConversions';

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'BiologicalData'> };

function calcAge(day: string, month: string, year: string): number {
  const d = parseInt(day), m = parseInt(month), y = parseInt(year);
  if (!d || !m || !y || y < 1900 || y > new Date().getFullYear()) return 0;
  const today = new Date();
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--;
  return Math.max(0, age);
}

export default function BiologicalDataScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const unitSystem = (storage.getString(StorageKeys.UNIT_SYSTEM) ?? 'metric') as UnitSystem;

  const [name,   setName]   = useState('');
  const [sex,    setSex]    = useState<Sex | null>(null);
  const [dob_d,  setDobD]   = useState('');
  const [dob_m,  setDobM]   = useState('');
  const [dob_y,  setDobY]   = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  const wUnit = weightUnitLabel(unitSystem);
  const lUnit = lengthUnitLabel(unitSystem);

  const age = calcAge(dob_d, dob_m, dob_y);
  const dobValid = age > 0 && age < 120;
  const canContinue = name.trim() && sex && dobValid && weight && height;

  const handleContinue = () => {
    const birthDate = `${dob_y.padStart(4,'0')}-${dob_m.padStart(2,'0')}-${dob_d.padStart(2,'0')}`;
    const data = {
      name: name.trim(),
      sex,
      birth_date: birthDate,
      age,
      weight: parseFloat(weight),
      height: parseFloat(height),
      unitSystem,
    };
    storage.set('onboarding_bio', JSON.stringify(data));
    navigation.navigate('Measurements');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.step}>{t('onboarding.stepOf', { step: 2, total: 6 })}</Text>
        <Text style={styles.title}>{t('onboarding.biologicalData.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.biologicalData.subtitle')}</Text>

        {/* Name */}
        <Text style={styles.label}>{t('onboarding.biologicalData.name')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('onboarding.biologicalData.namePlaceholder')}
          placeholderTextColor="#B0B7C3"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        {/* Sex */}
        <Text style={styles.label}>{t('onboarding.biologicalData.sex')}</Text>
        <View style={styles.row}>
          {(['male', 'female'] as Sex[]).map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.sexOption, sex === s && styles.sexOptionSelected]}
              onPress={() => setSex(s)}
            >
              <Text style={styles.sexIcon}>{s === 'male' ? '♂' : '♀'}</Text>
              <Text style={[styles.sexLabel, sex === s && styles.sexLabelSelected]}>
                {t(`onboarding.biologicalData.${s}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Birth date */}
        <Text style={styles.label}>{t('onboarding.biologicalData.birthDate')}</Text>
        <View style={styles.dobRow}>
          <View style={styles.dobField}>
            <TextInput
              style={styles.dobInput}
              keyboardType="number-pad"
              placeholder={t('onboarding.biologicalData.day')}
              placeholderTextColor="#B0B7C3"
              value={dob_d}
              onChangeText={v => setDobD(v.replace(/[^0-9]/g, '').slice(0, 2))}
              maxLength={2}
            />
            <Text style={styles.dobLabel}>{t('onboarding.biologicalData.day')}</Text>
          </View>
          <View style={styles.dobField}>
            <TextInput
              style={styles.dobInput}
              keyboardType="number-pad"
              placeholder={t('onboarding.biologicalData.month')}
              placeholderTextColor="#B0B7C3"
              value={dob_m}
              onChangeText={v => setDobM(v.replace(/[^0-9]/g, '').slice(0, 2))}
              maxLength={2}
            />
            <Text style={styles.dobLabel}>{t('onboarding.biologicalData.month')}</Text>
          </View>
          <View style={[styles.dobField, styles.dobFieldYear]}>
            <TextInput
              style={styles.dobInput}
              keyboardType="number-pad"
              placeholder={t('onboarding.biologicalData.year')}
              placeholderTextColor="#B0B7C3"
              value={dob_y}
              onChangeText={v => setDobY(v.replace(/[^0-9]/g, '').slice(0, 4))}
              maxLength={4}
            />
            <Text style={styles.dobLabel}>{t('onboarding.biologicalData.year')}</Text>
          </View>
        </View>
        {dobValid && (
          <Text style={styles.ageHint}>{t('onboarding.biologicalData.ageCalc', { age })}</Text>
        )}

        {/* Weight */}
        <Text style={styles.label}>{t('onboarding.biologicalData.weight', { unit: wUnit })}</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder={unitSystem === 'metric' ? 'ex. 75.0' : 'ex. 165'}
          placeholderTextColor="#B0B7C3"
          value={weight}
          onChangeText={setWeight}
        />

        {/* Height */}
        <Text style={styles.label}>{t('onboarding.biologicalData.height', { unit: lUnit })}</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder={unitSystem === 'metric' ? 'ex. 175' : 'ex. 69'}
          placeholderTextColor="#B0B7C3"
          value={height}
          onChangeText={setHeight}
        />
      </ScrollView>

      <TouchableOpacity
        style={[styles.button, !canContinue && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!canContinue}
      >
        <Text style={styles.buttonText}>{t('common.continue')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#fff', paddingHorizontal: 24 },
  step:               { color: '#6B7280', fontSize: 13, fontWeight: '500', marginTop: 24 },
  title:              { fontSize: 28, fontWeight: '800', color: '#111827', marginTop: 4, letterSpacing: -0.5 },
  subtitle:           { color: '#6B7280', fontSize: 14, marginTop: 6, marginBottom: 24 },
  label:              { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input:              { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 16, color: '#111827', marginBottom: 20 },
  row:                { flexDirection: 'row', gap: 12, marginBottom: 20 },
  sexOption:          { flex: 1, padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB', alignItems: 'center', gap: 4 },
  sexOptionSelected:  { borderColor: '#1B4332', backgroundColor: '#F0FDF4' },
  sexIcon:            { fontSize: 24 },
  sexLabel:           { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  sexLabelSelected:   { color: '#1B4332' },
  dobRow:             { flexDirection: 'row', gap: 10, marginBottom: 8 },
  dobField:           { flex: 1, alignItems: 'center' },
  dobFieldYear:       { flex: 1.6 },
  dobInput:           { width: '100%', backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 18, color: '#111827', textAlign: 'center', fontWeight: '700' },
  dobLabel:           { fontSize: 11, color: '#9CA3AF', marginTop: 4, fontWeight: '500' },
  ageHint:            { color: '#1B4332', fontSize: 13, fontWeight: '600', marginBottom: 20, textAlign: 'center' },
  button:             { backgroundColor: '#1B4332', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginVertical: 24 },
  buttonDisabled:     { backgroundColor: '#D1D5DB' },
  buttonText:         { color: '#fff', fontSize: 17, fontWeight: '700' },
});
