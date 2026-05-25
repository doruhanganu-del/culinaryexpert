import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList, UnitSystem } from '../../types';
import { supabase } from '../../lib/supabase';
import { supabaseUserApi } from '../../api/supabaseApi';
import { storage, StorageKeys, setTokens, setItem } from '../../store/storage';
import { useAuth } from '../../store/authContext';

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'AccountCreation'> };

const num = (v: string | undefined) => (v ? parseFloat(v) : undefined);

export default function AccountCreationScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { completeOnboarding } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleCreate = async () => {
    setError('');
    if (password.length < 6) { setError(t('onboarding.accountCreation.passwordTooShort')); return; }
    if (password !== confirm)  { setError(t('onboarding.accountCreation.passwordMismatch')); return; }

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      // Register directly via Supabase — no backend/Railway dependency.
      // "User already registered" is not an error; we fall through to signIn.
      const { error: signUpError } = await supabase.auth.signUp({ email: cleanEmail, password });
      if (signUpError && !signUpError.message.toLowerCase().includes('already registered')) {
        throw signUpError;
      }

      // Sign in directly via Supabase
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (signInError) {
        if (signInError.message.toLowerCase().includes('not confirmed')) {
          setError(t('onboarding.accountCreation.emailNotConfirmed'));
          return;
        }
        throw new Error(signInError.message);
      }
      const accessToken  = signInData.session.access_token;
      const refreshToken = signInData.session.refresh_token;
      const userId       = signInData.user.id;

      setTokens(accessToken, refreshToken);
      setItem(StorageKeys.USER_ID, userId);
      setItem(StorageKeys.TRIAL_START_DATE, new Date().toISOString());

      // Ensure Supabase client has session for direct DB queries
      await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });

      // Upload onboarding profile
      const unitSystem = (storage.getString(StorageKeys.UNIT_SYSTEM) ?? 'metric') as UnitSystem;
      const bio        = JSON.parse(storage.getString('onboarding_bio') ?? '{}');
      const meas       = JSON.parse(storage.getString('onboarding_measurements') ?? '{}');
      const lifestyle  = JSON.parse(storage.getString('onboarding_lifestyle') ?? '{}');
      const birthYear  = new Date().getFullYear() - (parseInt(bio.age) || 25);

      await supabaseUserApi.upsertProfile({
        unit_system:              unitSystem,
        sex:                      bio.sex,
        birth_date:               `${birthYear}-01-01`,
        weight:                   parseFloat(bio.weight),
        height:                   parseFloat(bio.height),
        waist:                    num(meas.waist),
        neck:                     num(meas.neck),
        hips:                     num(meas.hips),
        hips_lower:               num(meas.hipsLower),
        chest:                    num(meas.chest),
        arm_left:                 num(meas.arm),   arm_right:    num(meas.arm),
        forearm_left:             num(meas.forearm), forearm_right: num(meas.forearm),
        thigh_left:               num(meas.thigh),  thigh_right:  num(meas.thigh),
        calf_left:                num(meas.calf),   calf_right:   num(meas.calf),
        activity_level:           lifestyle.activity,
        goal:                     lifestyle.goal,
        grocery_budget_weekly:    lifestyle.budget ? parseFloat(lifestyle.budget) : null,
        max_cooking_time_minutes: parseInt(lifestyle.cookTime) || 45,
        allergies:                (lifestyle.allergens ?? []).map((a: string) => a.toLowerCase()),
        favorite_foods:           (lifestyle.favFoods ?? '').split(',').map((f: string) => f.trim().toLowerCase()).filter(Boolean),
      }).catch(() => {});

      // Re-assert tokens: upsertProfile's 401 handling may have called clearTokens()
      setTokens(accessToken, refreshToken);
      setItem(StorageKeys.USER_ID, userId);

      completeOnboarding();
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.toLowerCase().includes('exist') || msg.toLowerCase().includes('duplicate')) {
        setError(t('onboarding.accountCreation.emailExists'));
      } else {
        setError(t('onboarding.accountCreation.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.step}>{t('onboarding.stepOf', { step: 6, total: 6 })}</Text>
          <Text style={styles.title}>{t('onboarding.accountCreation.title')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.accountCreation.subtitle')}</Text>

          <View style={styles.form}>
            <Text style={styles.label}>{t('onboarding.accountCreation.email')}</Text>
            <TextInput
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="you@example.com"
              placeholderTextColor="#B0B7C3"
              value={email}
              onChangeText={v => { setEmail(v); setError(''); }}
            />

            <Text style={styles.label}>{t('onboarding.accountCreation.password')}</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#B0B7C3"
              value={password}
              onChangeText={v => { setPassword(v); setError(''); }}
            />

            <Text style={styles.label}>{t('onboarding.accountCreation.confirmPassword')}</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#B0B7C3"
              value={confirm}
              onChangeText={v => { setConfirm(v); setError(''); }}
            />

            {!!error && <Text style={styles.error}>{error}</Text>}
          </View>

          <View style={styles.benefits}>
            {(['benefit1', 'benefit2', 'benefit3'] as const).map(k => (
              <View key={k} style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>{t(`onboarding.accountCreation.${k}`)}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.button, (!email || !password || !confirm || loading) && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={!email || !password || !confirm || loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>{t('onboarding.accountCreation.create')}</Text>
          }
        </TouchableOpacity>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fff', paddingHorizontal: 24 },
  step:         { color: '#6B7280', fontSize: 13, fontWeight: '500', marginTop: 24 },
  title:        { fontSize: 28, fontWeight: '800', color: '#111827', marginTop: 4, letterSpacing: -0.5 },
  subtitle:     { color: '#6B7280', fontSize: 14, marginTop: 6, marginBottom: 24 },
  form:         { gap: 0, marginBottom: 24 },
  label:        { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input:        { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 16, color: '#111827', marginBottom: 16 },
  error:        { color: '#EF4444', fontSize: 13, fontWeight: '500', marginTop: -8, marginBottom: 12 },
  benefits:     { gap: 12, marginBottom: 24, backgroundColor: '#F0FDF4', borderRadius: 16, padding: 16 },
  benefitRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitIcon:  { color: '#1B4332', fontSize: 16, fontWeight: '800', width: 20 },
  benefitText:  { flex: 1, fontSize: 14, color: '#374151' },
  button:       { backgroundColor: '#1B4332', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginVertical: 24 },
  buttonDisabled: { backgroundColor: '#D1D5DB' },
  buttonText:   { color: '#fff', fontSize: 17, fontWeight: '700' },
});
