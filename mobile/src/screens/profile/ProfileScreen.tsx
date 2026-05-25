import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert,
  Dimensions, Modal, FlatList, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { VictoryChart, VictoryLine, VictoryAxis, VictoryTheme } from 'victory-native';
import { useMeasurements, useSaveMeasurement } from '../../hooks/useMeasurements';
import { useHealthScores } from '../../hooks/useHealthScores';
import { calcBodyFatNavy } from '../../utils/healthCalc';
import { storage, StorageKeys } from '../../store/storage';
import { useAuth } from '../../store/authContext';
import { displayWeight, displayMeasurement } from '../../utils/unitConversions';
import type { Measurement, HealthScore, UnitSystem, ActivityLevel, Goal } from '../../types';

const SCREEN_W = Dimensions.get('window').width;

type ChartTab = 'weight' | 'score' | 'waist' | 'chest' | 'arm' | 'thigh';

const LANGUAGES = [
  { locale: 'en-US', flag: '🇺🇸', name: 'English (US)' },
  { locale: 'en-GB', flag: '🇬🇧', name: 'English (UK)' },
  { locale: 'es-ES', flag: '🇪🇸', name: 'Español' },
  { locale: 'ca',    flag: '🏴',   name: 'Català' },
  { locale: 'pt',    flag: '🇵🇹', name: 'Português' },
  { locale: 'fr',    flag: '🇫🇷', name: 'Français' },
  { locale: 'it',    flag: '🇮🇹', name: 'Italiano' },
  { locale: 'de-DE', flag: '🇩🇪', name: 'Deutsch (DE)' },
  { locale: 'de-AT', flag: '🇦🇹', name: 'Deutsch (AT)' },
  { locale: 'nl',    flag: '🇳🇱', name: 'Nederlands' },
  { locale: 'pl',    flag: '🇵🇱', name: 'Polski' },
  { locale: 'ro',    flag: '🇷🇴', name: 'Română' },
];

function snakeToCamel(s: string) {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

const GOAL_ICONS: Record<Goal, string> = {
  weight_loss: '📉', maintenance: '⚖️', hypertrophy: '💪', endurance: '🏃',
};

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { signOut } = useAuth();
  const { data: measurements = [], isLoading } = useMeasurements();
  const { data: healthScores  = [] }           = useHealthScores();
  const { mutateAsync: saveMeasurement }        = useSaveMeasurement();

  const [unitSystem,    setUnitSystem]    = useState<UnitSystem>(
    (storage.getString(StorageKeys.UNIT_SYSTEM) ?? 'metric') as UnitSystem
  );
  const [activeChart,   setActiveChart]   = useState<ChartTab>('weight');
  const [addingMeasure, setAddingMeasure] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [legalType, setLegalType] = useState<'privacy' | 'terms' | 'medical' | null>(null);

  const [fWeight,    setFWeight]    = useState('');
  const [fNeck,      setFNeck]      = useState('');
  const [fWaist,     setFWaist]     = useState('');
  const [fHips,      setFHips]      = useState('');
  const [fHipsLower, setFHipsLower] = useState('');
  const [fChest,     setFChest]     = useState('');
  const [fArm,       setFArm]       = useState('');
  const [fForearm,   setFForearm]   = useState('');
  const [fThigh,     setFThigh]     = useState('');
  const [fCalf,      setFCalf]      = useState('');

  const bioStr       = storage.getString('onboarding_bio');
  const lifestyleStr = storage.getString('onboarding_lifestyle');
  const bio          = bioStr       ? JSON.parse(bioStr)       : {} as any;
  const lifestyle    = lifestyleStr ? JSON.parse(lifestyleStr) : {} as any;

  const latestM = measurements[measurements.length - 1];
  const lUnit   = unitSystem === 'imperial' ? 'in' : 'cm';
  const wUnit   = unitSystem === 'imperial' ? 'lbs' : 'kg';

  const chartData = (): { x: number; y: number }[] => {
    const imp = unitSystem === 'imperial';
    switch (activeChart) {
      case 'weight':
        return measurements.filter(m => m.weight_kg != null)
          .map((m, i) => ({ x: i + 1, y: imp ? m.weight_kg! / 0.453592 : m.weight_kg! }));
      case 'score':
        return healthScores.map((h, i) => ({ x: i + 1, y: h.score }));
      case 'waist':
        return measurements.filter(m => m.waist_cm != null)
          .map((m, i) => ({ x: i + 1, y: imp ? m.waist_cm! / 2.54 : m.waist_cm! }));
      case 'chest':
        return measurements.filter(m => m.chest_cm != null)
          .map((m, i) => ({ x: i + 1, y: imp ? m.chest_cm! / 2.54 : m.chest_cm! }));
      case 'arm':
        return measurements.filter(m => m.arm_left_cm != null)
          .map((m, i) => ({ x: i + 1, y: imp ? m.arm_left_cm! / 2.54 : m.arm_left_cm! }));
      case 'thigh':
        return measurements.filter(m => m.thigh_left_cm != null)
          .map((m, i) => ({ x: i + 1, y: imp ? m.thigh_left_cm! / 2.54 : m.thigh_left_cm! }));
    }
  };

  const handleSaveMeasurement = async () => {
    if (!fWeight && !fWaist) return;
    try {
      const imp  = unitSystem === 'imperial';
      const toKg = (v: string) => v ? (imp ? parseFloat(v) * 0.453592 : parseFloat(v)) : null;
      const toCm = (v: string) => v ? (imp ? parseFloat(v) * 2.54     : parseFloat(v)) : null;
      const r1   = (v: number | null) => v != null ? parseFloat(v.toFixed(1)) : null;

      const neckCm   = toCm(fNeck)  ?? latestM?.neck_cm  ?? null;
      const waistCm  = toCm(fWaist) ?? latestM?.waist_cm ?? null;
      const hipsCm   = toCm(fHips)  ?? latestM?.hips_cm  ?? null;
      const heightCm = latestM?.height_cm ?? null;
      const sex      = bio.sex as 'male' | 'female' | undefined;
      const bodyFatPct = (sex && heightCm)
        ? calcBodyFatNavy(sex, waistCm, neckCm, heightCm, hipsCm)
        : null;

      await saveMeasurement({
        weight_kg:        toKg(fWeight),
        height_cm:        heightCm,
        neck_cm:          r1(toCm(fNeck)),
        waist_cm:         r1(waistCm),
        hips_cm:          r1(hipsCm),
        chest_cm:         r1(toCm(fChest)),
        arm_left_cm:      r1(toCm(fArm)),
        arm_right_cm:     r1(toCm(fArm)),
        forearm_left_cm:  r1(toCm(fForearm)),
        forearm_right_cm: r1(toCm(fForearm)),
        thigh_left_cm:    r1(toCm(fThigh)),
        thigh_right_cm:   r1(toCm(fThigh)),
        calf_left_cm:     r1(toCm(fCalf)),
        calf_right_cm:    r1(toCm(fCalf)),
        body_fat_pct:     bodyFatPct,
        is_synced:        true,
      });
      setFWeight(''); setFNeck(''); setFWaist(''); setFHips(''); setFHipsLower('');
      setFChest(''); setFArm(''); setFForearm(''); setFThigh(''); setFCalf('');
      setAddingMeasure(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleLogout = () => {
    Alert.alert(t('profile.signOutConfirm'), t('profile.signOutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.signOut'), style: 'destructive', onPress: signOut },
    ]);
  };

  const data = chartData();

  const CHART_TABS: { key: ChartTab; label: string }[] = [
    { key: 'weight', label: t('profile.weight') },
    { key: 'score',  label: t('profile.score') },
    { key: 'waist',  label: t('profile.waist') },
    { key: 'chest',  label: t('profile.chest') },
    { key: 'arm',    label: t('profile.arm') },
    { key: 'thigh',  label: t('profile.thigh') },
  ];

  const currentLocale = i18n.language;
  const currentLang   = LANGUAGES.find(l => l.locale === currentLocale) ?? LANGUAGES[0];

  if (isLoading && measurements.length === 0) {
    return <SafeAreaView style={styles.container}><Text style={styles.loading}>{t('common.loading')}</Text></SafeAreaView>;
  }

  const hasPersonalInfo = bio.sex || bio.age || bio.weight || bio.height || lifestyle.goal;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('profile.title')}</Text>

        {/* ── Personal Information ── */}
        {hasPersonalInfo && (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>{t('profile.personalInfo')}</Text>

            <View style={styles.infoGrid}>
              {bio.sex && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoEmoji}>{bio.sex === 'male' ? '♂️' : '♀️'}</Text>
                  <Text style={styles.infoVal}>{bio.sex === 'male' ? t('onboarding.biologicalData.male') : t('onboarding.biologicalData.female')}</Text>
                  <Text style={styles.infoLabel}>{t('profile.sex')}</Text>
                </View>
              )}
              {bio.age && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoEmoji}>🎂</Text>
                  <Text style={styles.infoVal}>{bio.age} yrs</Text>
                  <Text style={styles.infoLabel}>{t('profile.age')}</Text>
                </View>
              )}
              {bio.height && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoEmoji}>📏</Text>
                  <Text style={styles.infoVal}>{bio.height} {lUnit}</Text>
                  <Text style={styles.infoLabel}>{t('profile.height')}</Text>
                </View>
              )}
              {bio.weight && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoEmoji}>⚖️</Text>
                  <Text style={styles.infoVal}>{bio.weight} {wUnit}</Text>
                  <Text style={styles.infoLabel}>{t('profile.weight')}</Text>
                </View>
              )}
            </View>

            {lifestyle.goal && (
              <View style={styles.detailRow}>
                <Text style={styles.detailEmoji}>{GOAL_ICONS[lifestyle.goal as Goal] ?? '🎯'}</Text>
                <View>
                  <Text style={styles.detailLabel}>{t('profile.goalLabel')}</Text>
                  <Text style={styles.detailVal}>{t(`goal.${snakeToCamel(lifestyle.goal as string)}`) || lifestyle.goal}</Text>
                </View>
              </View>
            )}
            {lifestyle.activity && (
              <View style={styles.detailRow}>
                <Text style={styles.detailEmoji}>🏃</Text>
                <View>
                  <Text style={styles.detailLabel}>{t('profile.activityLevelLabel')}</Text>
                  <Text style={styles.detailVal}>{t(`activity.${snakeToCamel(lifestyle.activity as string)}`) || lifestyle.activity}</Text>
                </View>
              </View>
            )}
            {lifestyle.cookTime && (
              <View style={styles.detailRow}>
                <Text style={styles.detailEmoji}>⏱</Text>
                <View>
                  <Text style={styles.detailLabel}>{t('profile.maxCookTimeLabel')}</Text>
                  <Text style={styles.detailVal}>{lifestyle.cookTime} {t('profile.minutes')}</Text>
                </View>
              </View>
            )}
            {lifestyle.allergens?.length > 0 && (
              <View style={styles.allergenBlock}>
                <Text style={styles.detailLabel}>{t('profile.allergiesLabel')}</Text>
                <View style={styles.chipRow}>
                  {lifestyle.allergens.map((a: string) => (
                    <View key={a} style={styles.chip}>
                      <Text style={styles.chipText}>{a}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {lifestyle.favFoods && (
              <View style={styles.detailRow}>
                <Text style={styles.detailEmoji}>🍽</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>{t('profile.favouriteFoodsLabel')}</Text>
                  <Text style={styles.detailVal} numberOfLines={2}>{lifestyle.favFoods}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── Current Measurements ── */}
        {latestM && (
          <View style={styles.statsCard}>
            <Text style={styles.cardTitle}>{t('profile.currentMeasurements')}</Text>
            <View style={styles.statsGrid}>
              {latestM.weight_kg != null && (
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{displayWeight(latestM.weight_kg, unitSystem)}</Text>
                  <Text style={styles.statLabel}>{t('profile.weight')}</Text>
                </View>
              )}
              {latestM.body_fat_pct != null && (
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{latestM.body_fat_pct.toFixed(1)}%</Text>
                  <Text style={styles.statLabel}>{t('profile.bodyFat')}</Text>
                </View>
              )}
              {latestM.waist_cm != null && (
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{displayMeasurement(latestM.waist_cm, unitSystem)}</Text>
                  <Text style={styles.statLabel}>{t('profile.waist')}</Text>
                </View>
              )}
              {latestM.chest_cm != null && (
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{displayMeasurement(latestM.chest_cm, unitSystem)}</Text>
                  <Text style={styles.statLabel}>{t('profile.chest')}</Text>
                </View>
              )}
              {latestM.arm_left_cm != null && (
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{displayMeasurement(latestM.arm_left_cm, unitSystem)}</Text>
                  <Text style={styles.statLabel}>{t('profile.bicep')}</Text>
                </View>
              )}
              {latestM.thigh_left_cm != null && (
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{displayMeasurement(latestM.thigh_left_cm, unitSystem)}</Text>
                  <Text style={styles.statLabel}>{t('profile.thigh')}</Text>
                </View>
              )}
              {latestM.calf_left_cm != null && (
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{displayMeasurement(latestM.calf_left_cm, unitSystem)}</Text>
                  <Text style={styles.statLabel}>{t('profile.calf')}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Log Measurement ── */}
        <TouchableOpacity style={styles.addButton} onPress={() => setAddingMeasure(!addingMeasure)}>
          <Text style={styles.addButtonText}>{addingMeasure ? t('common.cancel') : t('profile.logMeasurement')}</Text>
        </TouchableOpacity>

        {addingMeasure && (
          <View style={styles.addForm}>
            {[
              { label: `${t('profile.weight')} (${wUnit})`,                                      value: fWeight,    set: setFWeight    },
              { label: `${t('onboarding.measurements.neck')} (${lUnit})`,                        value: fNeck,      set: setFNeck      },
              { label: `${t('onboarding.measurements.waist')} (${lUnit})`,                       value: fWaist,     set: setFWaist     },
              { label: `${t('onboarding.measurements.hips')} (${lUnit})`,                        value: fHips,      set: setFHips      },
              { label: `${t('onboarding.measurements.hipsLower')} (${lUnit})`,                   value: fHipsLower, set: setFHipsLower },
              { label: `${t('onboarding.measurements.chest')} (${lUnit})`,                       value: fChest,     set: setFChest     },
              { label: `${t('profile.bicepCirc')} (${lUnit})`,                                   value: fArm,       set: setFArm       },
              { label: `${t('onboarding.measurements.forearm')} (${lUnit})`,                     value: fForearm,   set: setFForearm   },
              { label: `${t('profile.thighCirc')} (${lUnit})`,                                   value: fThigh,     set: setFThigh     },
              { label: `${t('profile.calfCirc')} (${lUnit})`,                                    value: fCalf,      set: setFCalf      },
            ].map(({ label, value, set }) => (
              <TextInput
                key={label}
                style={styles.input}
                keyboardType="decimal-pad"
                placeholder={label}
                value={value}
                onChangeText={set}
              />
            ))}
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveMeasurement}>
              <Text style={styles.saveButtonText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Progress Charts ── */}
        {data.length >= 2 && (
          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>{t('profile.progressCharts')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartTabs}>
              {CHART_TABS.map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.chartTab, activeChart === tab.key && styles.chartTabActive]}
                  onPress={() => setActiveChart(tab.key)}
                >
                  <Text style={[styles.chartTabText, activeChart === tab.key && styles.chartTabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.chart}>
              <VictoryChart
                width={SCREEN_W - 80}
                height={200}
                theme={VictoryTheme.material}
                domainPadding={{ x: 15, y: 20 }}
              >
                <VictoryAxis style={{ tickLabels: { fontSize: 10 } }} />
                <VictoryAxis dependentAxis style={{ tickLabels: { fontSize: 10 } }} />
                <VictoryLine data={data} style={{ data: { stroke: '#1B4332', strokeWidth: 2 } }} />
              </VictoryChart>
            </View>
          </View>
        )}

        {/* ── Language ── */}
        <View style={styles.langCard}>
          <Text style={styles.cardTitle}>{t('profile.languageTitle')}</Text>
          <TouchableOpacity style={styles.langRow} onPress={() => setShowLangPicker(true)}>
            <Text style={styles.langFlag}>{currentLang.flag}</Text>
            <Text style={styles.langName}>{currentLang.name}</Text>
            <Text style={styles.langArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Legal ── */}
        <View style={styles.legalCard}>
          <Text style={styles.cardTitle}>{t('profile.legal')}</Text>
          {([
            { label: t('profile.privacyPolicy'),     type: 'privacy'  as const },
            { label: t('profile.termsOfService'),    type: 'terms'    as const },
            { label: t('profile.medicalDisclaimer'), type: 'medical'  as const },
          ]).map(item => (
            <TouchableOpacity key={item.type} style={styles.legalRow} onPress={() => setLegalType(item.type)}>
              <Text style={styles.legalLabel}>{item.label}</Text>
              <Text style={styles.legalArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>{t('profile.signOut')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Legal content modal ── */}
      <Modal
        visible={legalType != null}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setLegalType(null)}
      >
        <View style={styles.overlay}>
          <View style={[styles.sheet, { maxHeight: '88%' }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {legalType === 'privacy'  && t('profile.privacyPolicy')}
              {legalType === 'terms'    && t('profile.termsOfService')}
              {legalType === 'medical'  && t('profile.medicalDisclaimer')}
            </Text>
            <ScrollView style={{ paddingHorizontal: 24 }} showsVerticalScrollIndicator={false}>
              {legalType === 'medical' && (
                <View style={styles.legalContent}>
                  <Text style={styles.legalWarning}>⚠️ {t('onboarding.disclaimer.warningTitle')}</Text>
                  {(['p1','p2','p3','p4','p5'] as const).map(k => (
                    <Text key={k} style={styles.legalPara}>{t(`onboarding.disclaimer.${k}`)}</Text>
                  ))}
                </View>
              )}
              {legalType === 'privacy' && (
                <View style={styles.legalContent}>
                  {(['privacyP1','privacyP2','privacyP3','privacyP4'] as const).map(k => (
                    <Text key={k} style={styles.legalPara}>{t(`profile.${k}`)}</Text>
                  ))}
                </View>
              )}
              {legalType === 'terms' && (
                <View style={styles.legalContent}>
                  {(['termsP1','termsP2','termsP3','termsP4'] as const).map(k => (
                    <Text key={k} style={styles.legalPara}>{t(`profile.${k}`)}</Text>
                  ))}
                </View>
              )}
              <View style={{ height: 32 }} />
            </ScrollView>
            <TouchableOpacity style={styles.legalCloseBtn} onPress={() => setLegalType(null)}>
              <Text style={styles.legalCloseBtnText}>{t('common.done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Language picker modal ── */}
      <Modal
        visible={showLangPicker}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowLangPicker(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowLangPicker(false)}
        >
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{t('profile.languageTitle')}</Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={item => item.locale}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.langOption, currentLocale === item.locale && styles.langOptionSelected]}
                  onPress={() => { i18n.changeLanguage(item.locale); setShowLangPicker(false); }}
                >
                  <Text style={styles.langOptionFlag}>{item.flag}</Text>
                  <Text style={[styles.langOptionName, currentLocale === item.locale && styles.langOptionNameSelected]}>
                    {item.name}
                  </Text>
                  {currentLocale === item.locale && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:              { flex: 1, backgroundColor: '#F9FAFB' },
  loading:                { textAlign: 'center', marginTop: 80, color: '#6B7280' },
  content:                { paddingHorizontal: 24, paddingBottom: 48, gap: 16 },
  title:                  { fontSize: 26, fontWeight: '800', color: '#111827', marginTop: 16 },

  // Personal info
  infoCard:               { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  infoGrid:               { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  infoItem:               { minWidth: '44%', flex: 1, alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, paddingVertical: 12 },
  infoEmoji:              { fontSize: 22, marginBottom: 4 },
  infoVal:                { fontSize: 16, fontWeight: '700', color: '#111827' },
  infoLabel:              { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  detailRow:              { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  detailEmoji:            { fontSize: 20, width: 28, textAlign: 'center' },
  detailLabel:            { fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailVal:              { fontSize: 14, color: '#374151', fontWeight: '600', marginTop: 1 },
  allergenBlock:          { paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  chipRow:                { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip:                   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  chipText:               { fontSize: 12, color: '#EF4444', fontWeight: '500' },

  // Measurements
  cardTitle:              { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 14 },
  statsCard:              { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  statsGrid:              { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  statItem:               { minWidth: '45%' },
  statVal:                { fontSize: 20, fontWeight: '800', color: '#111827' },
  statLabel:              { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  // Add measurement
  addButton:              { backgroundColor: '#F0FDF4', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#BBF7D0' },
  addButtonText:          { color: '#1B4332', fontSize: 15, fontWeight: '600' },
  addForm:                { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 10 },
  input:                  { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 15 },
  saveButton:             { backgroundColor: '#1B4332', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveButtonText:         { color: '#fff', fontWeight: '700' },

  // Chart
  chartCard:              { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  chartTabs:              { flexGrow: 0, marginBottom: 12 },
  chartTab:               { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, marginRight: 8, backgroundColor: '#F3F4F6' },
  chartTabActive:         { backgroundColor: '#1B4332' },
  chartTabText:           { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  chartTabTextActive:     { color: '#fff' },
  chart:                  { alignItems: 'center' },

  // Language
  langCard:               { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  langRow:                { flexDirection: 'row', alignItems: 'center', gap: 10 },
  langFlag:               { fontSize: 22 },
  langName:               { flex: 1, fontSize: 15, color: '#374151', fontWeight: '500' },
  langArrow:              { fontSize: 20, color: '#D1D5DB' },

  // Legal
  legalCard:              { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  legalRow:               { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  legalLabel:             { fontSize: 15, color: '#374151' },
  legalArrow:             { fontSize: 20, color: '#D1D5DB' },

  // Logout
  logoutButton:           { backgroundColor: '#FEF2F2', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#FECACA' },
  logoutText:             { color: '#EF4444', fontSize: 15, fontWeight: '700' },

  // Legal modal content
  legalContent:           { paddingTop: 8, paddingBottom: 16 },
  legalWarning:           { fontSize: 15, fontWeight: '700', color: '#D97706', marginBottom: 12 },
  legalPara:              { fontSize: 14, color: '#374151', lineHeight: 22, marginBottom: 12 },
  legalCloseBtn:          { backgroundColor: '#1B4332', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginHorizontal: 24, marginBottom: 12 },
  legalCloseBtnText:      { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Modal
  overlay:                { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet:                  { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingBottom: 40, maxHeight: '72%' },
  sheetHandle:            { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:             { fontSize: 15, fontWeight: '700', color: '#374151', paddingHorizontal: 24, marginBottom: 8 },
  langOption:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, gap: 14 },
  langOptionSelected:     { backgroundColor: '#F0FDF4' },
  langOptionFlag:         { fontSize: 24 },
  langOptionName:         { flex: 1, fontSize: 16, color: '#374151', fontWeight: '500' },
  langOptionNameSelected: { color: '#1B4332', fontWeight: '700' },
  checkmark:              { fontSize: 16, color: '#1B4332', fontWeight: '800' },
});
