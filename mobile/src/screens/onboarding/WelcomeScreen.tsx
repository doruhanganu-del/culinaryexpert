import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../types';

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Welcome'> };

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

export default function WelcomeScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);

  const currentLocale = i18n.language;
  const current = LANGUAGES.find(l => l.locale === currentLocale) ?? LANGUAGES[0];

  const selectLanguage = (locale: string) => {
    i18n.changeLanguage(locale);
    setShowPicker(false);
  };

  return (
    <LinearGradient colors={['#1B4332', '#2D6A4F', '#52B788']} style={styles.gradient}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>

        {/* Language picker button — top right */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.langButton} onPress={() => setShowPicker(true)}>
            <Text style={styles.langFlag}>{current.flag}</Text>
            <Text style={styles.langCode}>{currentLocale.split('-')[0].toUpperCase()}</Text>
            <Text style={styles.langChevron}>▾</Text>
          </TouchableOpacity>
        </View>

        {/* Hero content */}
        <View style={styles.content}>
          <Text style={styles.logo}>🥗</Text>
          <Text style={styles.title}>{t('onboarding.welcome.title')}</Text>
          <Text style={styles.tagline}>{t('onboarding.welcome.tagline')}</Text>
          <Text style={styles.description}>{t('onboarding.welcome.description')}</Text>
        </View>

        {/* CTA */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('UnitSelection')}
          >
            <Text style={styles.primaryButtonText}>{t('onboarding.welcome.getStarted')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginHint}>{t('onboarding.welcome.loginHint')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Language picker bottom sheet */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Language / Idioma / Langue</Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={item => item.locale}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, currentLocale === item.locale && styles.optionSelected]}
                  onPress={() => selectLanguage(item.locale)}
                >
                  <Text style={styles.optionFlag}>{item.flag}</Text>
                  <Text style={[styles.optionName, currentLocale === item.locale && styles.optionNameSelected]}>
                    {item.name}
                  </Text>
                  {currentLocale === item.locale && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient:          { flex: 1 },
  safeArea:          { flex: 1 },
  topBar:            { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 4 },
  langButton:        { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  langFlag:          { fontSize: 18 },
  langCode:          { color: '#fff', fontSize: 13, fontWeight: '700' },
  langChevron:       { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  content:           { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logo:              { fontSize: 72, marginBottom: 16 },
  title:             { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  tagline:           { fontSize: 16, color: '#B7E4C7', fontWeight: '600', marginTop: 4, marginBottom: 24 },
  description:       { fontSize: 15, color: '#D8F3DC', textAlign: 'center', lineHeight: 22 },
  actions:           { paddingHorizontal: 32, paddingBottom: 48 },
  primaryButton:     { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  primaryButtonText: { color: '#1B4332', fontSize: 17, fontWeight: '700' },
  loginButton:       { marginTop: 16, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.45)', alignSelf: 'center' },
  loginHint:         { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600' },
  // Modal
  overlay:           { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet:             { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingBottom: 40, maxHeight: '72%' },
  sheetHandle:       { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:        { fontSize: 15, fontWeight: '700', color: '#374151', paddingHorizontal: 24, marginBottom: 8 },
  option:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, gap: 14 },
  optionSelected:    { backgroundColor: '#F0FDF4' },
  optionFlag:        { fontSize: 24 },
  optionName:        { flex: 1, fontSize: 16, color: '#374151', fontWeight: '500' },
  optionNameSelected:{ color: '#1B4332', fontWeight: '700' },
  checkmark:         { fontSize: 16, color: '#1B4332', fontWeight: '800' },
});
