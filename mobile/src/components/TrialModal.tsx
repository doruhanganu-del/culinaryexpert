import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

interface Props {
  visible: boolean;
  daysLeft: number;
  onDismiss: () => void;
}

const PRICES: Record<string, { monthly: string; annualMonthly: string; annualTotal: string }> = {
  'ro':    { monthly: '20 Lei/lună',   annualMonthly: '10 Lei/lună',  annualTotal: '120 Lei/an'   },
  'en-US': { monthly: '$4.50/month',   annualMonthly: '$2.25/month',  annualTotal: '$27/year'     },
  'en-GB': { monthly: '£3.50/month',   annualMonthly: '£1.75/month',  annualTotal: '£21/year'     },
  'es-ES': { monthly: '4€/mes',        annualMonthly: '2€/mes',       annualTotal: '24€/año'      },
  'ca':    { monthly: '4€/mes',        annualMonthly: '2€/mes',       annualTotal: '24€/any'      },
  'pt':    { monthly: '4€/mês',        annualMonthly: '2€/mês',       annualTotal: '24€/ano'      },
  'fr':    { monthly: '4€/mois',       annualMonthly: '2€/mois',      annualTotal: '24€/an'       },
  'it':    { monthly: '4€/mese',       annualMonthly: '2€/mese',      annualTotal: '24€/anno'     },
  'de-DE': { monthly: '4€/Monat',      annualMonthly: '2€/Monat',     annualTotal: '24€/Jahr'     },
  'de-AT': { monthly: '4€/Monat',      annualMonthly: '2€/Monat',     annualTotal: '24€/Jahr'     },
  'nl':    { monthly: '€4/maand',      annualMonthly: '€2/maand',     annualTotal: '€24/jaar'     },
  'pl':    { monthly: '18 zł/mies.',   annualMonthly: '9 zł/mies.',   annualTotal: '108 zł/rok'   },
};

export default function TrialModal({ visible, daysLeft, onDismiss }: Props) {
  const { t, i18n } = useTranslation();
  const prices = PRICES[i18n.language] ?? PRICES['en-US'];
  const isExpired = daysLeft <= 0;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>{isExpired ? '⏰' : '🎉'}</Text>
          <Text style={styles.title}>
            {isExpired ? t('subscription.expiredTitle') : t('subscription.day12Title')}
          </Text>
          <Text style={styles.body}>
            {isExpired
              ? t('subscription.expiredBody')
              : t('subscription.day12Body', { days: Math.ceil(daysLeft) })}
          </Text>

          {/* Annual plan — highlighted */}
          <TouchableOpacity style={styles.planCardBest} onPress={onDismiss}>
            <View style={styles.badgeRow}>
              <View style={styles.badge}><Text style={styles.badgeText}>{t('subscription.bestValue')}</Text></View>
            </View>
            <Text style={styles.planTitle}>{t('subscription.annualPlan')}</Text>
            <Text style={styles.planPrice}>{prices.annualMonthly}</Text>
            <Text style={styles.planSub}>{t('subscription.billedAs', { total: prices.annualTotal })}</Text>
          </TouchableOpacity>

          {/* Monthly plan */}
          <TouchableOpacity style={styles.planCard} onPress={onDismiss}>
            <Text style={styles.planTitle}>{t('subscription.monthlyPlan')}</Text>
            <Text style={styles.planPrice}>{prices.monthly}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
            <Text style={styles.dismissText}>
              {isExpired ? t('subscription.continueExpired') : t('subscription.remindLater')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const BRAND = '#1B4332';

const styles = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card:          { backgroundColor: '#fff', borderRadius: 24, padding: 28, width: '100%', alignItems: 'center' },
  emoji:         { fontSize: 44, marginBottom: 8 },
  title:         { fontSize: 20, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 10 },
  body:          { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 21, marginBottom: 20 },
  planCardBest:  { width: '100%', backgroundColor: BRAND, borderRadius: 16, padding: 18, marginBottom: 10, alignItems: 'center' },
  planCard:      { width: '100%', backgroundColor: '#F3F4F6', borderRadius: 16, padding: 16, marginBottom: 16, alignItems: 'center' },
  badgeRow:      { marginBottom: 4 },
  badge:         { backgroundColor: '#52B788', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText:     { color: '#fff', fontSize: 11, fontWeight: '700' },
  planTitle:     { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 4 },
  planPrice:     { fontSize: 24, fontWeight: '900', color: '#fff' },
  planSub:       { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  dismissBtn:    { paddingVertical: 10 },
  dismissText:   { color: '#9CA3AF', fontSize: 13, textDecorationLine: 'underline' },
});
