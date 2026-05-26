import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import type { MainTabParamList, MealPlanMeal } from '../../types';
import { mealPlanApi } from '../../api/endpoints';
import { storage, StorageKeys } from '../../store/storage';

const MEAL_ORDER: Record<string, number> = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };
const TODAY_INDEX = (new Date().getDay() + 6) % 7;

type GroceryNav = BottomTabNavigationProp<MainTabParamList, 'MealPlan'>;

export default function MealPlanScreen() {
  const navigation  = useNavigation<GroceryNav>();
  const { t, i18n } = useTranslation();
  const [meals,       setMeals]       = useState<MealPlanMeal[]>([]);
  const [activeDay,   setActiveDay]   = useState(TODAY_INDEX);
  const [loading,     setLoading]     = useState(true);
  const [generating,  setGenerating]  = useState(false);
  const dayScrollRef = useRef<ScrollView>(null);

  // Jan 1 2024 is a Monday; offset i gives Mon=0 … Sun=6
  const DAY_LABELS = Array.from({ length: 7 }, (_, i) => {
    return new Intl.DateTimeFormat(i18n.language, { weekday: 'short' }).format(new Date(2024, 0, 1 + i));
  });

  useEffect(() => {
    mealPlanApi.getActive()
      .then(data => { setMeals(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const dayMeals = (meals ?? [])
    .filter(m => m.day_of_week === activeDay)
    .sort((a, b) => (MEAL_ORDER[a.meal_type] ?? 9) - (MEAL_ORDER[b.meal_type] ?? 9));

  const handleFeedback = async (meal: MealPlanMeal, feedback: 'loved' | 'disliked') => {
    try {
      await mealPlanApi.submitFeedback(meal.id, feedback);
      setMeals(prev => prev.map(m => m.id === meal.id ? { ...m, feedback } : m));
    } catch {}
  };

  const doGenerate = async () => {
    const monday = getMondayDate();
    setGenerating(true);
    try {
      const { plan_id } = await mealPlanApi.generate(monday);
      storage.set(StorageKeys.ACTIVE_PLAN_ID, plan_id);
      const fresh = await mealPlanApi.getActive();
      setMeals(Array.isArray(fresh) ? fresh : []);
    } catch (e: any) {
      Alert.alert(t('mealPlan.generationFailed'), e.message ?? t('mealPlan.generationError'));
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = () => {
    Alert.alert(
      t('mealPlan.regenerateTitle'),
      t('mealPlan.regenerateMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('mealPlan.regenerateConfirm'), style: 'destructive', onPress: doGenerate },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>{t('mealPlan.loading')}</Text>
      </SafeAreaView>
    );
  }

  // ── Empty state: no plan exists yet ──
  if ((meals ?? []).length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyWrapper}>
          <Text style={styles.emptyHero}>🍽</Text>
          <Text style={styles.emptyTitle}>{t('mealPlan.noMealPlan')}</Text>
          <Text style={styles.emptySubtitle}>{t('mealPlan.noMealPlanDesc')}</Text>

          <TouchableOpacity
            style={[styles.generateBtn, generating && styles.generateBtnDisabled]}
            onPress={doGenerate}
            disabled={generating}
          >
            {generating ? (
              <View style={styles.generatingRow}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.generateBtnText}>{t('mealPlan.generating')}</Text>
              </View>
            ) : (
              <Text style={styles.generateBtnText}>{t('mealPlan.generate')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.featureList}>
            {[
              { icon: '🥗', text: t('mealPlan.feature1') },
              { icon: '⏱', text: t('mealPlan.feature2') },
              { icon: '🚫', text: t('mealPlan.feature3') },
              { icon: '🛒', text: t('mealPlan.feature4') },
            ].map(f => (
              <View key={f.text} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('mealPlan.title')}</Text>
        <TouchableOpacity onPress={handleRegenerate} disabled={generating}>
          {generating
            ? <ActivityIndicator color="#1B4332" size="small" />
            : <Text style={styles.regenerate}>{t('mealPlan.regenerate')}</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Horizontal day selector */}
      <ScrollView
        ref={dayScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayScroll}
        contentContainerStyle={styles.dayScrollContent}
      >
        {DAY_LABELS.map((day, idx) => (
          <TouchableOpacity
            key={day}
            style={[styles.dayChip, activeDay === idx && styles.dayChipActive, idx === TODAY_INDEX && styles.dayChipToday]}
            onPress={() => setActiveDay(idx)}
          >
            <Text style={[styles.dayLabel, activeDay === idx && styles.dayLabelActive]}>{day}</Text>
            {idx === TODAY_INDEX && <View style={styles.todayDot} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Meals for selected day */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mealList}>
        {(dayMeals ?? []).length === 0 ? (
          <Text style={styles.dayEmptyText}>{t('mealPlan.noPlanToday')}</Text>
        ) : (
          (dayMeals ?? []).map(meal => (
            <View key={meal.id} style={styles.mealCard}>
              <Text style={styles.mealType}>{t(`mealPlan.${meal.meal_type}`)}</Text>
              {meal.recipe ? (
                <>
                  <Text style={styles.mealName}>{meal.recipe.title}</Text>
                  <View style={styles.mealMacros}>
                    <Text style={styles.macroPill}>🔥 {Math.round((meal.recipe.calories_per_serving ?? 0) * meal.servings)} kcal</Text>
                    <Text style={styles.macroPill}>🥩 {Math.round((meal.recipe.protein_g_per_serving ?? 0) * meal.servings)}g</Text>
                    <Text style={styles.macroPill}>⏱ {meal.recipe.total_time_minutes ?? 0}min</Text>
                  </View>
                  <View style={styles.feedbackRow}>
                    <Text style={styles.feedbackPrompt}>{t('mealPlan.howWasIt')}</Text>
                    <TouchableOpacity
                      style={[styles.feedbackBtn, meal.feedback === 'loved' && styles.feedbackBtnLoved]}
                      onPress={() => handleFeedback(meal, 'loved')}
                    >
                      <Text style={styles.feedbackBtnText}>{t('mealPlan.lovedIt')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.feedbackBtn, meal.feedback === 'disliked' && styles.feedbackBtnDisliked]}
                      onPress={() => handleFeedback(meal, 'disliked')}
                    >
                      <Text style={styles.feedbackBtnText}>{t('mealPlan.notAFan')}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <Text style={styles.noRecipe}>{t('mealPlan.noRecipe')}</Text>
              )}
            </View>
          ))
        )}

        <TouchableOpacity
          style={styles.groceriesButton}
          onPress={() => navigation.navigate('Groceries')}
        >
          <Text style={styles.groceriesButtonText}>{t('mealPlan.shopIngredients')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function getMondayDate(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: '#F9FAFB' },
  loading:             { textAlign: 'center', marginTop: 80, color: '#6B7280', fontSize: 15 },

  // Empty state
  emptyWrapper:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyHero:           { fontSize: 64, marginBottom: 16 },
  emptyTitle:          { fontSize: 24, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 10 },
  emptySubtitle:       { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  generateBtn:         { backgroundColor: '#1B4332', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32, alignItems: 'center', width: '100%', marginBottom: 32 },
  generateBtnDisabled: { backgroundColor: '#6B7280' },
  generateBtnText:     { color: '#fff', fontSize: 17, fontWeight: '700' },
  generatingRow:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureList:         { width: '100%', gap: 12 },
  featureRow:          { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14 },
  featureIcon:         { fontSize: 22 },
  featureText:         { fontSize: 14, color: '#374151', fontWeight: '500' },

  // Normal state header
  headerRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, marginBottom: 8 },
  title:               { fontSize: 24, fontWeight: '800', color: '#111827' },
  regenerate:          { fontSize: 14, color: '#1B4332', fontWeight: '600' },

  // Day selector
  dayScroll:           { flexGrow: 0 },
  dayScrollContent:    { paddingHorizontal: 20, gap: 8, paddingVertical: 8 },
  dayChip:             { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center' },
  dayChipActive:       { backgroundColor: '#1B4332', borderColor: '#1B4332' },
  dayChipToday:        { borderColor: '#1B4332' },
  dayLabel:            { fontSize: 14, fontWeight: '600', color: '#374151' },
  dayLabelActive:      { color: '#fff' },
  todayDot:            { width: 4, height: 4, borderRadius: 2, backgroundColor: '#1B4332', marginTop: 3 },

  // Meal cards
  mealList:            { paddingHorizontal: 24, paddingBottom: 32, gap: 12, paddingTop: 8 },
  dayEmptyText:        { color: '#9CA3AF', textAlign: 'center', marginTop: 40, fontSize: 15 },
  mealCard:            { backgroundColor: '#fff', borderRadius: 16, padding: 18 },
  mealType:            { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 },
  mealName:            { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 4 },
  mealMacros:          { flexDirection: 'row', gap: 8, marginTop: 10 },
  macroPill:           { backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 12, color: '#1B4332', fontWeight: '600' },
  feedbackRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  feedbackPrompt:      { fontSize: 13, color: '#6B7280', marginRight: 4 },
  feedbackBtn:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1.5, borderColor: '#E5E7EB' },
  feedbackBtnLoved:    { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  feedbackBtnDisliked: { backgroundColor: '#F3F4F6', borderColor: '#D1D5DB' },
  feedbackBtnText:     { fontSize: 13, fontWeight: '500' },
  noRecipe:            { color: '#9CA3AF', marginTop: 6, fontSize: 14 },
  groceriesButton:     { backgroundColor: '#1B4332', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  groceriesButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
