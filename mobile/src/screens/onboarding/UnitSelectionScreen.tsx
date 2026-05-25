import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList, UnitSystem } from '../../types';
import { storage, StorageKeys } from '../../store/storage';

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'UnitSelection'> };

export default function UnitSelectionScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<UnitSystem>('metric');

  const handleContinue = () => {
    storage.set(StorageKeys.UNIT_SYSTEM, selected);
    navigation.navigate('MedicalDisclaimer');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.step}>{t('onboarding.stepOf', { step: 1, total: 6 })}</Text>
        <Text style={styles.title}>{t('onboarding.unitSelection.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.unitSelection.subtitle')}</Text>
      </View>

      <View style={styles.options}>
        {(['metric', 'imperial'] as UnitSystem[]).map(unit => (
          <TouchableOpacity
            key={unit}
            style={[styles.option, selected === unit && styles.optionSelected]}
            onPress={() => setSelected(unit)}
          >
            <Text style={styles.optionIcon}>{unit === 'metric' ? '🌍' : '🇺🇸'}</Text>
            <View>
              <Text style={[styles.optionTitle, selected === unit && styles.optionTitleSelected]}>
                {t(`onboarding.unitSelection.${unit}`)}
              </Text>
              <Text style={styles.optionDesc}>
                {t(`onboarding.unitSelection.${unit}Desc`)}
              </Text>
            </View>
            {selected === unit && <Text style={styles.check}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>{t('common.continue')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#fff', paddingHorizontal: 24 },
  header:             { paddingTop: 24, marginBottom: 40 },
  step:               { color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 8 },
  title:              { fontSize: 28, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  subtitle:           { color: '#6B7280', fontSize: 14, marginTop: 6 },
  options:            { gap: 16, marginBottom: 40 },
  option:             { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  optionSelected:     { borderColor: '#1B4332', backgroundColor: '#F0FDF4' },
  optionIcon:         { fontSize: 28 },
  optionTitle:        { fontSize: 18, fontWeight: '700', color: '#374151' },
  optionTitleSelected:{ color: '#1B4332' },
  optionDesc:         { color: '#9CA3AF', fontSize: 13, marginTop: 2 },
  check:              { marginLeft: 'auto', fontSize: 18, color: '#1B4332', fontWeight: '700' },
  button:             { backgroundColor: '#1B4332', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  buttonText:         { color: '#fff', fontSize: 17, fontWeight: '700' },
});
