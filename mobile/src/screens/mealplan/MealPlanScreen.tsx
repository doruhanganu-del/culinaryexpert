import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
  LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import type { MainTabParamList, MealPlanMeal, Recipe } from '../../types';
import { mealPlanApi } from '../../api/endpoints';
import { storage, StorageKeys } from '../../store/storage';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MEAL_ORDER: Record<string, number> = {
  pre_breakfast: 0, breakfast: 1, morning_snack: 2,
  lunch: 3, afternoon_snack: 4, dinner: 5, snack: 6,
};
const TODAY_INDEX = (new Date().getDay() + 6) % 7;

type GroceryNav = BottomTabNavigationProp<MainTabParamList, 'MealPlan'>;

function RecipeAccordion({ recipe, servings, lang }: { recipe: Recipe; servings: number; lang: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(v => !v);
  };

  const totalPrep = ((recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0)) || recipe.total_time_minutes;
  const diffIcon = recipe.difficulty === 'easy' ? '🟢' : recipe.difficulty === 'medium' ? '🟡' : '🔴';

  return (
    <View style={acc.wrapper}>
      {/* Header — tappable */}
      <TouchableOpacity style={acc.header} onPress={toggle} activeOpacity={0.75}>
        <View style={acc.headerLeft}>
          <Text style={acc.recipeName}>{recipe.title}</Text>
          <View style={acc.pillRow}>
            {totalPrep ? (
              <Text style={acc.pill}>⏱ {totalPrep} {t('recipe.min')}</Text>
            ) : null}
            <Text style={acc.pill}>🔥 {Math.round((recipe.calories_per_serving ?? 0) * servings)} kcal</Text>
            <Text style={acc.pill}>🥩 {Math.round((recipe.protein_g_per_serving ?? 0) * servings)}g</Text>
            <Text style={acc.pill}>{diffIcon} {t(`recipe.difficulty.${recipe.difficulty}`)}</Text>
          </View>
        </View>
        <Text style={acc.chevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* Expanded content */}
      {open && (
        <View style={acc.body}>
          {/* Time info */}
          {(recipe.prep_time_minutes != null || recipe.cook_time_minutes != null) && (
            <View style={acc.timeRow}>
              {recipe.prep_time_minutes != null && (
                <View style={acc.timeItem}>
                  <Text style={acc.timeVal}>{recipe.prep_time_minutes} {t('recipe.min')}</Text>
                  <Text style={acc.timeLabel}>{t('recipe.prepTime')}</Text>
                </View>
              )}
              {recipe.cook_time_minutes != null && (
                <View style={acc.timeItem}>
                  <Text style={acc.timeVal}>{recipe.cook_time_minutes} {t('recipe.min')}</Text>
                  <Text style={acc.timeLabel}>{t('recipe.cookTime')}</Text>
                </View>
              )}
              {recipe.total_time_minutes != null && (
                <View style={acc.timeItem}>
                  <Text style={acc.timeVal}>{recipe.total_time_minutes} {t('recipe.min')}</Text>
                  <Text style={acc.timeLabel}>{t('recipe.totalTime')}</Text>
                </View>
              )}
              <View style={acc.timeItem}>
                <Text style={acc.timeVal}>1 {t('recipe.person')}</Text>
                <Text style={acc.timeLabel}>{t('recipe.servings')}</Text>
              </View>
            </View>
          )}

          {/* Ingredients */}
          {recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0 && (
            <View style={acc.section}>
              <Text style={acc.sectionTitle}>🛒 {t('recipe.ingredients')}</Text>
              {recipe.recipe_ingredients.map((ri, idx) => (
                <View key={ri.id ?? idx} style={acc.ingredientRow}>
                  <Text style={acc.bullet}>•</Text>
                  <Text style={acc.ingredientText}>
                    <Text style={acc.ingredientQty}>{ri.display_qty ?? `${ri.quantity_g}g`}</Text>
                    {' '}{ri.ingredient?.name ?? ''}
                    {ri.prep_note ? <Text style={acc.prepNote}> ({ri.prep_note})</Text> : null}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Macros per serving */}
          {(recipe.carbs_g_per_serving != null || recipe.fat_g_per_serving != null) && (
            <View style={acc.macroRow}>
              {recipe.protein_g_per_serving != null && (
                <View style={acc.macroItem}>
                  <Text style={acc.macroVal}>{Math.round(recipe.protein_g_per_serving * servings)}g</Text>
                  <Text style={acc.macroLabel}>{t('dashboard.protein')}</Text>
                </View>
              )}
              {recipe.carbs_g_per_serving != null && (
                <View style={acc.macroItem}>
                  <Text style={acc.macroVal}>{Math.round(recipe.carbs_g_per_serving * servings)}g</Text>
                  <Text style={acc.macroLabel}>{t('dashboard.carbs')}</Text>
                </View>
              )}
              {recipe.fat_g_per_serving != null && (
                <View style={acc.macroItem}>
                  <Text style={acc.macroVal}>{Math.round(recipe.fat_g_per_serving * servings)}g</Text>
                  <Text style={acc.macroLabel}>{t('dashboard.fat')}</Text>
                </View>
              )}
            </View>
          )}

          {/* Instructions */}
          {recipe.instructions && recipe.instructions.length > 0 && (
            <View style={acc.section}>
              <Text style={acc.sectionTitle}>👨‍🍳 {t('recipe.instructions')}</Text>
              {recipe.instructions.map((step, idx) => (
                <View key={idx} style={acc.stepRow}>
                  <View style={acc.stepNum}>
                    <Text style={acc.stepNumText}>{step.step ?? idx + 1}</Text>
                  </View>
                  <View style={acc.stepContent}>
                    <Text style={acc.stepText}>{step.text}</Text>
                    {step.duration_min ? (
                      <Text style={acc.stepDuration}>⏱ {step.duration_min} {t('recipe.min')}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Serving suggestion */}
          {recipe.description && (
            <View style={acc.section}>
              <Text style={acc.sectionTitle}>🍽️ {t('recipe.serving')}</Text>
              <Text style={acc.servingText}>{recipe.description}</Text>
            </View>
          )}

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <View style={acc.tagRow}>
              {recipe.tags.slice(0, 5).map(tag => (
                <View key={tag} style={acc.tag}>
                  <Text style={acc.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function MealPlanScreen() {
  const navigation  = useNavigation<GroceryNav>();
  const { t, i18n } = useTranslation();
  const [meals,       setMeals]       = useState<MealPlanMeal[]>([]);
  const [activeDay,   setActiveDay]   = useState(TODAY_INDEX);
  const [loading,     setLoading]     = useState(true);
  const [generating,  setGenerating]  = useState(false);
  const dayScrollRef = useRef<ScrollView>(null);

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
      const { plan_id } = await mealPlanApi.generate(monday, i18n.language);
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
                  <RecipeAccordion recipe={meal.recipe} servings={meal.servings} lang={i18n.language} />

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

// ─── Accordion styles ────────────────────────────────────────────────────────
const acc = StyleSheet.create({
  wrapper:       { backgroundColor: '#F9FAFB', borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#F0FDF4' },
  headerLeft:    { flex: 1, gap: 6 },
  recipeName:    { fontSize: 16, fontWeight: '700', color: '#111827' },
  pillRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill:          { backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, fontSize: 11, color: '#065F46', fontWeight: '600' },
  chevron:       { fontSize: 12, color: '#6B7280', marginLeft: 8 },
  body:          { padding: 16, gap: 16 },

  timeRow:       { flexDirection: 'row', gap: 0, backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden' },
  timeItem:      { flex: 1, alignItems: 'center', paddingVertical: 10, borderRightWidth: 1, borderRightColor: '#F3F4F6' },
  timeVal:       { fontSize: 14, fontWeight: '700', color: '#111827' },
  timeLabel:     { fontSize: 10, color: '#9CA3AF', marginTop: 2, textAlign: 'center' },

  section:       { gap: 8 },
  sectionTitle:  { fontSize: 13, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 },

  ingredientRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  bullet:        { color: '#1B4332', fontSize: 16, lineHeight: 20, width: 12 },
  ingredientText:{ flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },
  ingredientQty: { fontWeight: '700', color: '#111827' },
  prepNote:      { color: '#6B7280', fontStyle: 'italic' },

  macroRow:      { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden' },
  macroItem:     { flex: 1, alignItems: 'center', paddingVertical: 10, borderRightWidth: 1, borderRightColor: '#F3F4F6' },
  macroVal:      { fontSize: 15, fontWeight: '800', color: '#1B4332' },
  macroLabel:    { fontSize: 10, color: '#9CA3AF', marginTop: 2 },

  stepRow:       { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNum:       { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1B4332', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  stepNumText:   { color: '#fff', fontSize: 13, fontWeight: '800' },
  stepContent:   { flex: 1, gap: 3 },
  stepText:      { fontSize: 14, color: '#374151', lineHeight: 21 },
  stepDuration:  { fontSize: 11, color: '#6B7280' },

  servingText:   { fontSize: 14, color: '#374151', lineHeight: 21, fontStyle: 'italic' },

  tagRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:           { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  tagText:       { fontSize: 12, color: '#6B7280' },
});

// ─── Screen styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: '#F9FAFB' },
  loading:             { textAlign: 'center', marginTop: 80, color: '#6B7280', fontSize: 15 },

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

  headerRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, marginBottom: 8 },
  title:               { fontSize: 24, fontWeight: '800', color: '#111827' },
  regenerate:          { fontSize: 14, color: '#1B4332', fontWeight: '600' },

  dayScroll:           { flexGrow: 0 },
  dayScrollContent:    { paddingHorizontal: 20, gap: 8, paddingVertical: 8 },
  dayChip:             { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center' },
  dayChipActive:       { backgroundColor: '#1B4332', borderColor: '#1B4332' },
  dayChipToday:        { borderColor: '#1B4332' },
  dayLabel:            { fontSize: 14, fontWeight: '600', color: '#374151' },
  dayLabelActive:      { color: '#fff' },
  todayDot:            { width: 4, height: 4, borderRadius: 2, backgroundColor: '#1B4332', marginTop: 3 },

  mealList:            { paddingHorizontal: 20, paddingBottom: 32, gap: 12, paddingTop: 8 },
  dayEmptyText:        { color: '#9CA3AF', textAlign: 'center', marginTop: 40, fontSize: 15 },
  mealCard:            { backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  mealType:            { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  noRecipe:            { color: '#9CA3AF', marginTop: 6, fontSize: 14 },

  feedbackRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  feedbackPrompt:      { fontSize: 13, color: '#6B7280', marginRight: 4 },
  feedbackBtn:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1.5, borderColor: '#E5E7EB' },
  feedbackBtnLoved:    { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  feedbackBtnDisliked: { backgroundColor: '#F3F4F6', borderColor: '#D1D5DB' },
  feedbackBtnText:     { fontSize: 13, fontWeight: '500' },

  groceriesButton:     { backgroundColor: '#1B4332', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  groceriesButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
