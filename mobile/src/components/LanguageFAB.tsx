import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList, StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';

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

export default function LanguageFAB() {
  const { i18n, t } = useTranslation();
  const [visible, setVisible] = useState(false);

  const current = LANGUAGES.find(l => l.locale === i18n.language) ?? LANGUAGES[0];

  return (
    <>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
        accessibilityLabel="Change language"
      >
        <Text style={styles.fabFlag}>{current.flag}</Text>
        <Text style={styles.fabCode}>{i18n.language.split('-')[0].toUpperCase()}</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{t('profile.languageTitle')}</Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={item => item.locale}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, i18n.language === item.locale && styles.optionSelected]}
                  onPress={() => { i18n.changeLanguage(item.locale); setVisible(false); }}
                >
                  <Text style={styles.optionFlag}>{item.flag}</Text>
                  <Text style={[styles.optionName, i18n.language === item.locale && styles.optionNameSelected]}>
                    {item.name}
                  </Text>
                  {i18n.language === item.locale && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position:        'absolute',
    top:             12,
    right:           16,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             4,
    backgroundColor: 'rgba(27,67,50,0.9)',
    paddingHorizontal: 10,
    paddingVertical:   6,
    borderRadius:    20,
    zIndex:          999,
    elevation:       8,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.18,
    shadowRadius:    4,
  },
  fabFlag: { fontSize: 16 },
  fabCode: { color: '#fff', fontSize: 12, fontWeight: '700' },

  overlay:           { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet:             { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingBottom: 40, maxHeight: '72%' },
  handle:            { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:        { fontSize: 15, fontWeight: '700', color: '#374151', paddingHorizontal: 24, marginBottom: 8 },
  option:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, gap: 14 },
  optionSelected:    { backgroundColor: '#F0FDF4' },
  optionFlag:        { fontSize: 24 },
  optionName:        { flex: 1, fontSize: 16, color: '#374151', fontWeight: '500' },
  optionNameSelected:{ color: '#1B4332', fontWeight: '700' },
  check:             { fontSize: 16, color: '#1B4332', fontWeight: '800' },
});
