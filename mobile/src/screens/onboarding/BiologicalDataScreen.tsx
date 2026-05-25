import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList, Sex, UnitSystem } from '../../types';
import { storage, StorageKeys } from '../../store/storage';
import { weightUnitLabel, lengthUnitLabel } from '../../utils/unitConversions';

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'BiologicalData'> };

export default function BiologicalDataScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const unitSystem = (storage.getString(StorageKeys.UNIT_SYSTEM) ?? 'metric') as UnitSystem;

  const [sex,    setSex]    = useState<Sex | null>(null);
  const [age,    setAge]    = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  const wUnit = weightUnitLabel(unitSystem);
  const lUnit = lengthUnitLabel(unitSystem);

  const canContinue = sex && age && weight && height;

  const handleContinue = () => {
    const data = { sex, age: parseInt(age), weight: parseFloat(weight), height: parseFloat(height), unitSystem };
    storage.set('onboarding_bio', JSON.stringify(data));
    navigation.navigate('Measurements');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.step}>{t('onboarding.stepOf', { step: 2, total: 6 })}</Text>
        <Text style={styles.title}>{t('onboarding.biologicalData.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.biologicalData.subtitle')}</Text>

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

        <Text style={styles.label}>{t('onboarding.biologicalData.age')}</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          placeholder={unitSystem === 'metric' ? 'e.g. 28' : 'e.g. 28'}
          value={age}
          onChangeText={setAge}
          maxLength={3}
        />

        <Text style={styles.label}>{t('onboarding.biologicalData.weight', { unit: wUnit })}</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder={unitSystem === 'metric' ? 'e.g. 75.0' : 'e.g. 165'}
          value={weight}
          onChangeText={setWeight}
        />

        <Text style={styles.label}>{t('onboarding.biologicalData.height', { unit: lUnit })}</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder={unitSystem === 'metric' ? 'e.g. 175' : 'e.g. 69'}
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
  button:             { backgroundColor: '#1B4332', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginVertical: 24 },
  buttonDisabled:     { backgroundColor: '#D1D5DB' },
  buttonText:         { color: '#fff', fontSize: 17, fontWeight: '700' },
});
