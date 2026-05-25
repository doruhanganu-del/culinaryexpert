import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { userApi, mealPlanApi } from '../../api/endpoints';
import { storage, StorageKeys } from '../../store/storage';
import { calcBMR, calcTDEE, calcBodyFatNavy, calcCalorieTarget, calcHealthScore, calcLeanMass } from '../../utils/healthCalc';
import { calculateMacroTargets } from '../../utils/macroCalculations';
import type { MealPlanMeal, HealthScore, UnitSystem, ActivityLevel, Goal } from '../../types';
import type { MainTabParamList } from '../../types';

const BRAND = '#1B4332';

function getLocalHealthData() {
  try {
    const bio       = JSON.parse(storage.getString('onboarding_bio')          ?? '{}');
    const meas      = JSON.parse(storage.getString('onboarding_measurements') ?? '{}');
    const lifestyle = JSON.parse(storage.getString('onboarding_lifestyle')    ?? '{}');
    const unitStr   = (storage.getString(StorageKeys.UNIT_SYSTEM) ?? 'metric') as UnitSystem;
    const imp       = unitStr === 'imperial';
    const toKg      = (v: string) => v ? (imp ? parseFloat(v) * 0.453592 : parseFloat(v)) : 0;
    const toCm      = (v: string) => v ? (imp ? parseFloat(v) * 2.54     : parseFloat(v)) : 0;

    const weightKg = toKg(bio.weight);
    const heightCm = toCm(bio.height);
    const age      = parseInt(bio.age) || 25;
    const sex      = bio.sex as 'male' | 'female' | undefined;
    if (!weightKg || !heightCm || !sex) return null;

    const waistCm = toCm(meas.waist);
    const neckCm  = toCm(meas.neck);
    const hipsCm  = toCm(meas.hips);

    const bmr     = calcBMR(weightKg, heightCm, age, sex);
    const tdee    = calcTDEE(bmr, lifestyle.activity ?? 'moderate');
    const bf      = calcBodyFatNavy(sex, waistCm || null, neckCm || null, heightCm, hipsCm || null);
    const calGoal = calcCalorieTarget(tdee, lifestyle.goal ?? 'maintenance', sex);
    const score   = calcHealthScore(bf, sex);
    const lbm     = calcLeanMass(weightKg, bf);
    const macros  = calculateMacroTargets(tdee, (lifestyle.goal ?? 'maintenance') as Goal, weightKg, bf);

    return { score, calGoal, bf, tdee, bmr, macros, sex, goal: lifestyle.goal as Goal };
  } catch { return null; }
}

export default function DashboardScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { t, i18n } = useTranslation();
  const [meals,       setMeals]       = useState<MealPlanMeal[]>([]);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [budgetMode,  setBudgetMode]  = useState(false);
  const [fastMode,    setFastMode]    = useState(false);
  const [sculptMode,  setSculptMode]  = useState(false);

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return t('dashboard.goodMorning');
    if (h < 18) return t('dashboard.goodAfternoon');
    return t('dashboard.goodEvening');
  }

  const localData = getLocalHealthData();
  const todayIndex = (new Date().getDay() + 6) % 7;

  useEffect(() => {
    mealPlanApi.getActive().then(setMeals).catch(() => {});
    userApi.getHealthScores().then(scores => {
      if (scores.length > 0) setHealthScore(scores[scores.length - 1]);
    }).catch(() => {});
  }, []);

  const todayMeals = meals.filter(m => m.day_of_week === todayIndex);
  const totalCals    = todayMeals.reduce((s, m) => s + (m.recipe?.calories_per_serving ?? 0) * m.servings, 0);
  const totalProtein = todayMeals.reduce((s, m) => s + (m.recipe?.protein_g_per_serving ?? 0) * m.servings, 0);
  const totalCarbs   = todayMeals.reduce((s, m) => s + (m.recipe?.carbs_g_per_serving ?? 0) * m.servings, 0);
  const totalFat     = todayMeals.reduce((s, m) => s + (m.recipe?.fat_g_per_serving ?? 0) * m.servings, 0);

  const displayScore = healthScore?.score ?? localData?.score ?? null;
  const displayTDEE  = healthScore?.tdee  ?? localData?.tdee  ?? null;
  const macroTarget  = localData?.macros;

  const scoreColor = displayScore == null ? BRAND : displayScore >= 75 ? '#059669' : displayScore >= 50 ? '#D97706' : '#EF4444';

  const QUICK_ACTIONS = [
    { label: t('nav.mealPlan'),  icon: 'calendar' as const, tab: 'MealPlan'  as keyof MainTabParamList, color: '#EEF2FF', iconColor: '#6366F1' },
    { label: t('nav.prepHub'),   icon: 'flame'    as const, tab: 'SmartPrep' as keyof MainTabParamList, color: '#FFF7ED', iconColor: '#F97316' },
    { label: t('nav.groceries'), icon: 'cart'     as const, tab: 'Groceries' as keyof MainTabParamList, color: '#F0FDF4', iconColor: '#16A34A' },
    { label: t('nav.profile'),   icon: 'person'   as const, tab: 'Profile'   as keyof MainTabParamList, color: '#FDF4FF', iconColor: '#A855F7' },
  ];

  const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner'] as const;
  const mealByType = Object.fromEntries(
    todayMeals.map(m => [m.meal_type, m])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()} 👋</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString(i18n.language, { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* Health Score Hero */}
        {displayScore != null && (
          <View style={[styles.scoreCard, { borderLeftColor: scoreColor }]}>
            <View style={styles.scoreLeft}>
              <Text style={styles.scoreLabel}>{t('dashboard.healthScore')}</Text>
              <Text style={[styles.scoreValue, { color: scoreColor }]}>
                {displayScore.toFixed(0)}<Text style={styles.scoreSub}>/100</Text>
              </Text>
              {displayTDEE != null && (
                <Text style={styles.tdeeText}>TDEE {Math.round(displayTDEE)} {t('dashboard.kcalPerDay')}</Text>
              )}
            </View>
            <View style={[styles.scoreRing, { borderColor: scoreColor }]}>
              <Text style={[styles.scoreRingNum, { color: scoreColor }]}>{displayScore.toFixed(0)}</Text>
            </View>
          </View>
        )}

        {/* Macro Targets for Today */}
        {macroTarget && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('dashboard.todaysTargets')}</Text>
            <View style={styles.macroGrid}>
              {[
                { label: t('dashboard.calories'), planned: Math.round(totalCals),    target: macroTarget.calories, unit: 'kcal', color: BRAND },
                { label: t('dashboard.protein'),  planned: Math.round(totalProtein), target: macroTarget.proteinG, unit: 'g',    color: '#2563EB' },
                { label: t('dashboard.carbs'),    planned: Math.round(totalCarbs),   target: macroTarget.carbsG,   unit: 'g',    color: '#D97706' },
                { label: t('dashboard.fat'),      planned: Math.round(totalFat),     target: macroTarget.fatG,     unit: 'g',    color: '#7C3AED' },
              ].map(m => {
                const pct = Math.min(1, m.target > 0 ? m.planned / m.target : 0);
                return (
                  <View key={m.label} style={styles.macroItem}>
                    <View style={styles.macroHeader}>
                      <Text style={styles.macroLabel}>{m.label}</Text>
                      <Text style={[styles.macroValue, { color: m.color }]}>
                        {m.planned}<Text style={styles.macroUnit}>/{m.target}{m.unit}</Text>
                      </Text>
                    </View>
                    <View style={styles.macroTrack}>
                      <View style={[styles.macroBar, { width: `${pct * 100}%` as any, backgroundColor: m.color }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Today's Meals */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('dashboard.todaysMeals')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MealPlan')}>
              <Text style={styles.seeAll}>{t('dashboard.seePlan')}</Text>
            </TouchableOpacity>
          </View>
          {MEAL_SLOTS.map(slot => {
            const meal = mealByType[slot];
            return (
              <TouchableOpacity
                key={slot}
                style={styles.mealRow}
                onPress={() => navigation.navigate('MealPlan')}
              >
                <View style={[styles.mealDot, meal?.recipe ? styles.mealDotFilled : styles.mealDotEmpty]} />
                <View style={styles.mealInfo}>
                  <Text style={styles.mealType}>{t(`mealPlan.${slot}`)}</Text>
                  {meal?.recipe ? (
                    <Text style={styles.mealName} numberOfLines={1}>{meal.recipe.title}</Text>
                  ) : (
                    <Text style={styles.mealEmpty}>{t('dashboard.notPlanned')}</Text>
                  )}
                </View>
                {meal?.recipe && (
                  <Text style={styles.mealCal}>
                    {Math.round((meal.recipe.calories_per_serving ?? 0) * meal.servings)} kcal
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
          {meals.length === 0 && (
            <TouchableOpacity
              style={styles.generateCta}
              onPress={() => navigation.navigate('MealPlan')}
            >
              <Ionicons name="sparkles" size={20} color={BRAND} />
              <Text style={styles.generateCtaText}>{t('dashboard.generateFirst')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('dashboard.quickActions')}</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map(a => (
              <TouchableOpacity
                key={a.tab}
                style={[styles.actionCard, { backgroundColor: a.color }]}
                onPress={() => navigation.navigate(a.tab)}
              >
                <Ionicons name={a.icon} size={26} color={a.iconColor} />
                <Text style={[styles.actionLabel, { color: a.iconColor }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Lifestyle Toggles */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('dashboard.lifestyleModes')}</Text>
          {[
            { label: t('dashboard.budgetModeLabel'), value: budgetMode,  set: setBudgetMode,  desc: t('dashboard.budgetModeDesc') },
            { label: t('dashboard.fastLifeLabel'),   value: fastMode,    set: setFastMode,    desc: t('dashboard.fastLifeDesc') },
            { label: t('dashboard.bodySculptLabel'), value: sculptMode,  set: setSculptMode,  desc: t('dashboard.bodySculptDesc') },
          ].map(({ label, value, set, desc }) => (
            <View key={label} style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>{label}</Text>
                <Text style={styles.toggleDesc}>{desc}</Text>
              </View>
              <Switch value={value} onValueChange={set} trackColor={{ false: '#E5E7EB', true: BRAND }} />
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#F3F4F6' },
  header:          { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 },
  greeting:        { fontSize: 26, fontWeight: '800', color: '#111827' },
  date:            { fontSize: 13, color: '#9CA3AF', marginTop: 3 },

  scoreCard:       { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 18, padding: 20, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 5, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  scoreLeft:       { flex: 1 },
  scoreLabel:      { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 },
  scoreValue:      { fontSize: 44, fontWeight: '900', marginTop: 2 },
  scoreSub:        { fontSize: 16, fontWeight: '400', color: '#9CA3AF' },
  tdeeText:        { fontSize: 12, color: '#6B7280', marginTop: 6 },
  scoreRing:       { width: 72, height: 72, borderRadius: 36, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  scoreRingNum:    { fontSize: 22, fontWeight: '900' },

  card:            { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 18, padding: 18, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  cardTitle:       { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 14 },
  cardHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  seeAll:          { fontSize: 13, color: BRAND, fontWeight: '600' },

  macroGrid:       { gap: 12 },
  macroItem:       { gap: 5 },
  macroHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  macroLabel:      { fontSize: 13, fontWeight: '600', color: '#374151' },
  macroValue:      { fontSize: 13, fontWeight: '800' },
  macroUnit:       { fontSize: 11, fontWeight: '400', color: '#9CA3AF' },
  macroTrack:      { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  macroBar:        { height: '100%', borderRadius: 3 },

  mealRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  mealDot:         { width: 10, height: 10, borderRadius: 5 },
  mealDotFilled:   { backgroundColor: BRAND },
  mealDotEmpty:    { backgroundColor: '#E5E7EB' },
  mealInfo:        { flex: 1 },
  mealType:        { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  mealName:        { fontSize: 14, fontWeight: '600', color: '#111827', marginTop: 1 },
  mealEmpty:       { fontSize: 13, color: '#D1D5DB', marginTop: 1 },
  mealCal:         { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  generateCta:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, backgroundColor: '#F0FDF4', borderRadius: 12, marginTop: 8 },
  generateCtaText: { fontSize: 15, fontWeight: '700', color: BRAND },

  actionsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard:      { flex: 1, minWidth: '45%', borderRadius: 14, paddingVertical: 16, alignItems: 'center', gap: 6 },
  actionLabel:     { fontSize: 13, fontWeight: '700' },

  toggleRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  toggleInfo:      { flex: 1 },
  toggleLabel:     { fontSize: 14, fontWeight: '600', color: '#374151' },
  toggleDesc:      { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
});
