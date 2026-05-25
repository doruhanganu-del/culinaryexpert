import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList, UnitSystem } from '../../types';
import { storage, StorageKeys } from '../../store/storage';
import { calcBMR, calcTDEE, calcBodyFatNavy, calcCalorieTarget, calcHealthScore } from '../../utils/healthCalc';

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'HealthScore'> };

export default function HealthScoreScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [score, setScore] = useState(0);
  const [cals,  setCals]  = useState<number | null>(null);
  const [bfPct, setBfPct] = useState<number | null>(null);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unitSystem  = (storage.getString(StorageKeys.UNIT_SYSTEM) ?? 'metric') as UnitSystem;
    const bio         = JSON.parse(storage.getString('onboarding_bio')       ?? '{}');
    const meas        = JSON.parse(storage.getString('onboarding_measurements') ?? '{}');
    const lifestyle   = JSON.parse(storage.getString('onboarding_lifestyle') ?? '{}');

    const num = (v: string | undefined): number | null => (v ? parseFloat(v) : null);
    const toM = (v: number | null, kind: 'weight' | 'length'): number | null => {
      if (v == null) return null;
      if (unitSystem === 'imperial') return kind === 'weight' ? v * 0.453592 : v * 2.54;
      return v;
    };

    const weightKg = toM(num(bio.weight), 'weight');
    const heightCm = toM(num(bio.height), 'length');
    const age      = parseInt(bio.age) || 25;
    const sex      = bio.sex as 'male' | 'female' | undefined;

    if (!weightKg || !heightCm || !sex) return;

    const waistCm = toM(num(meas.waist), 'length');
    const neckCm  = toM(num(meas.neck),  'length');
    const hipsCm  = toM(num(meas.hips),  'length');

    const bmr      = calcBMR(weightKg, heightCm, age, sex);
    const tdee     = calcTDEE(bmr, lifestyle.activity ?? 'moderate');
    const bf       = calcBodyFatNavy(sex, waistCm, neckCm, heightCm, hipsCm);
    const calGoal  = calcCalorieTarget(tdee, lifestyle.goal ?? 'maintenance');
    const scoreVal = calcHealthScore(bf, sex);

    setBfPct(bf);
    setCals(calGoal);
    setScore(scoreVal);

    Animated.timing(progress, {
      toValue:  scoreVal / 100,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, []);

  const scoreColor = score >= 75 ? '#1B4332' : score >= 50 ? '#D97706' : '#EF4444';

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t('onboarding.healthScore.title')}</Text>
      <Text style={styles.subtitle}>{t('onboarding.healthScore.subtitle')}</Text>

      <View style={styles.scoreCircle}>
        <Text style={[styles.scoreNumber, { color: scoreColor }]}>{score.toFixed(0)}</Text>
        <Text style={styles.scoreLabel}>/ 100</Text>
      </View>

      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressBar, {
          width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          backgroundColor: scoreColor,
        }]} />
      </View>

      <View style={styles.stats}>
        {cals != null && (
          <View style={styles.stat}>
            <Text style={styles.statValue}>{cals}</Text>
            <Text style={styles.statLabel}>{t('onboarding.healthScore.dailyCalories')}</Text>
          </View>
        )}
        {bfPct != null && (
          <View style={styles.stat}>
            <Text style={styles.statValue}>{bfPct.toFixed(1)}%</Text>
            <Text style={styles.statLabel}>{t('onboarding.healthScore.bodyFat')}</Text>
          </View>
        )}
      </View>

      <Text style={styles.description}>{t('onboarding.healthScore.description')}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.getParent()?.navigate('Main')}
      >
        <Text style={styles.buttonText}>{t('onboarding.healthScore.viewPlan')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#fff', paddingHorizontal: 32, alignItems: 'center' },
  title:         { fontSize: 28, fontWeight: '800', color: '#111827', marginTop: 32, textAlign: 'center' },
  subtitle:      { color: '#6B7280', fontSize: 14, marginTop: 6, textAlign: 'center' },
  scoreCircle:   { width: 160, height: 160, borderRadius: 80, backgroundColor: '#F0FDF4', borderWidth: 6, borderColor: '#1B4332', alignItems: 'center', justifyContent: 'center', marginVertical: 40 },
  scoreNumber:   { fontSize: 52, fontWeight: '900' },
  scoreLabel:    { fontSize: 14, color: '#6B7280' },
  progressTrack: { width: '100%', height: 10, backgroundColor: '#E5E7EB', borderRadius: 5, overflow: 'hidden', marginBottom: 40 },
  progressBar:   { height: '100%', borderRadius: 5 },
  stats:         { flexDirection: 'row', gap: 32, marginBottom: 32 },
  stat:          { alignItems: 'center' },
  statValue:     { fontSize: 24, fontWeight: '800', color: '#111827' },
  statLabel:     { fontSize: 12, color: '#9CA3AF', marginTop: 2, textAlign: 'center' },
  description:   { fontSize: 14, color: '#374151', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  button:        { backgroundColor: '#1B4332', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 40 },
  buttonText:    { color: '#fff', fontSize: 17, fontWeight: '700' },
});
