import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList, ActivityLevel, Goal } from '../../types';
import { storage, StorageKeys } from '../../store/storage';

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Lifestyle'> };

const ACTIVITY_LEVELS: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
const GOAL_OPTIONS: { value: Goal; icon: string }[] = [
  { value: 'weight_loss',  icon: '📉' },
  { value: 'maintenance',  icon: '⚖️' },
  { value: 'hypertrophy',  icon: '💪' },
  { value: 'endurance',    icon: '🏃' },
];
const COMMON_ALLERGENS = ['Gluten', 'Milk', 'Eggs', 'Fish', 'Shellfish', 'Tree Nuts', 'Peanuts', 'Soy', 'Sesame'];

const LOCALE_CURRENCY: Record<string, string> = {
  'en-US': '$', 'en-GB': '£', 'es-ES': '€', 'ca': '€', 'pt': '€',
  'fr': '€', 'it': '€', 'de-DE': '€', 'de-AT': '€', 'nl': '€', 'pl': 'zł', 'ro': 'lei',
};

const activityKey = (v: ActivityLevel) =>
  ({ sedentary: 'sedentary', light: 'light', moderate: 'moderate', active: 'active', very_active: 'veryActive' } as const)[v];
const goalKey = (v: Goal) =>
  ({ weight_loss: 'weightLoss', maintenance: 'maintenance', hypertrophy: 'hypertrophy', endurance: 'endurance' } as const)[v];

export default function LifestyleScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const [activity, setActivity]   = useState<ActivityLevel>('moderate');
  const [goal,     setGoal]       = useState<Goal>('maintenance');
  const [budget,   setBudget]     = useState('');
  const [cookTime, setCookTime]   = useState('45');
  const [allergens, setAllergens] = useState<string[]>([]);
  const [favFoods,  setFavFoods]  = useState('');

  const currency = LOCALE_CURRENCY[i18n.language] ?? '€';

  const toggleAllergen = (a: string) =>
    setAllergens(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const handleFinish = () => {
    storage.set('onboarding_lifestyle', JSON.stringify({ activity, goal, cookTime, budget, allergens, favFoods }));
    navigation.navigate('HealthScore');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.step}>{t('onboarding.stepOf', { step: 4, total: 6 })}</Text>
        <Text style={styles.title}>{t('onboarding.lifestyle.title')}</Text>

        <Text style={styles.label}>{t('onboarding.lifestyle.activityLevel')}</Text>
        <View style={styles.activityList}>
          {ACTIVITY_LEVELS.map(val => (
            <TouchableOpacity
              key={val}
              style={[styles.activityItem, activity === val && styles.activityItemSelected]}
              onPress={() => setActivity(val)}
            >
              <Text style={[styles.activityLabel, activity === val && styles.selectedText]}>
                {t(`activity.${activityKey(val)}`)}
              </Text>
              <Text style={styles.activityDesc}>{t(`activity.${activityKey(val)}Desc`)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('onboarding.lifestyle.primaryGoal')}</Text>
        <View style={styles.goalGrid}>
          {GOAL_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.goalItem, goal === opt.value && styles.goalItemSelected]}
              onPress={() => setGoal(opt.value)}
            >
              <Text style={styles.goalIcon}>{opt.icon}</Text>
              <Text style={[styles.goalLabel, goal === opt.value && styles.selectedText]}>
                {t(`goal.${goalKey(opt.value)}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('onboarding.lifestyle.budget', { currency })}</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder={t('onboarding.lifestyle.budgetPlaceholder')}
          value={budget}
          onChangeText={setBudget}
        />

        <Text style={styles.label}>{t('onboarding.lifestyle.cookTime')}</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          placeholder="45"
          value={cookTime}
          onChangeText={setCookTime}
        />

        <Text style={styles.label}>{t('onboarding.lifestyle.allergies')}</Text>
        <View style={styles.chipGrid}>
          {COMMON_ALLERGENS.map(a => (
            <TouchableOpacity
              key={a}
              style={[styles.chip, allergens.includes(a) && styles.chipSelected]}
              onPress={() => toggleAllergen(a)}
            >
              <Text style={[styles.chipText, allergens.includes(a) && styles.chipTextSelected]}>
                {t(`allergens.${a}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('onboarding.lifestyle.favoriteFoods')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('onboarding.lifestyle.favoriteFoodsPlaceholder')}
          value={favFoods}
          onChangeText={setFavFoods}
        />
      </ScrollView>

      <TouchableOpacity style={styles.button} onPress={handleFinish}>
        <Text style={styles.buttonText}>{t('onboarding.lifestyle.buildPlan')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: '#fff', paddingHorizontal: 24 },
  step:                { color: '#6B7280', fontSize: 13, fontWeight: '500', marginTop: 24 },
  title:               { fontSize: 28, fontWeight: '800', color: '#111827', marginTop: 4, letterSpacing: -0.5, marginBottom: 24 },
  label:               { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10, marginTop: 8 },
  input:               { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', marginBottom: 8 },
  activityList:        { gap: 8, marginBottom: 16 },
  activityItem:        { padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activityItemSelected:{ borderColor: '#1B4332', backgroundColor: '#F0FDF4' },
  activityLabel:       { fontSize: 15, fontWeight: '600', color: '#374151' },
  activityDesc:        { fontSize: 12, color: '#9CA3AF' },
  goalGrid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  goalItem:            { flex: 1, minWidth: '45%', padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB', alignItems: 'center', gap: 4 },
  goalItemSelected:    { borderColor: '#1B4332', backgroundColor: '#F0FDF4' },
  goalIcon:            { fontSize: 24 },
  goalLabel:           { fontSize: 13, fontWeight: '600', color: '#374151' },
  selectedText:        { color: '#1B4332' },
  chipGrid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip:                { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  chipSelected:        { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  chipText:            { fontSize: 13, fontWeight: '500', color: '#374151' },
  chipTextSelected:    { color: '#EF4444' },
  button:              { backgroundColor: '#1B4332', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginVertical: 24 },
  buttonText:          { color: '#fff', fontSize: 17, fontWeight: '700' },
});
