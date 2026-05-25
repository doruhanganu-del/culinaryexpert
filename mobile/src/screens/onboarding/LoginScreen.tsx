import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../types';
import { supabase } from '../../lib/supabase';
import { setTokens, setItem, StorageKeys } from '../../store/storage';
import { useAuth } from '../../store/authContext';

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Login'> };

export default function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { completeOnboarding } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) throw new Error(signInError.message);

      setTokens(data.session.access_token, data.session.refresh_token);
      setItem(StorageKeys.USER_ID, data.user.id);
      completeOnboarding();
    } catch (_) {
      setError(t('onboarding.login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← {t('common.back')}</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{t('onboarding.login.title')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.login.subtitle')}</Text>

          <View style={styles.form}>
            <Text style={styles.label}>{t('onboarding.login.email')}</Text>
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

            <Text style={styles.label}>{t('onboarding.login.password')}</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#B0B7C3"
              value={password}
              onChangeText={v => { setPassword(v); setError(''); }}
            />

            {!!error && <Text style={styles.error}>{error}</Text>}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, (!email || !password || loading) && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={!email || !password || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>{t('onboarding.login.signIn')}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('AccountCreation')}>
            <Text style={styles.noAccount}>{t('onboarding.login.noAccount')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const BRAND = '#1B4332';

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#fff', paddingHorizontal: 24 },
  backBtn:        { marginTop: 16, marginBottom: 8 },
  backText:       { color: '#6B7280', fontSize: 14 },
  title:          { fontSize: 28, fontWeight: '800', color: '#111827', marginTop: 8, letterSpacing: -0.5 },
  subtitle:       { color: '#6B7280', fontSize: 14, marginTop: 6, marginBottom: 28 },
  form:           { marginBottom: 16 },
  label:          { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input:          { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 16, color: '#111827', marginBottom: 16 },
  error:          { color: '#EF4444', fontSize: 13, fontWeight: '500', marginTop: -8, marginBottom: 12 },
  footer:         { paddingBottom: 24 },
  button:         { backgroundColor: BRAND, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  buttonDisabled: { backgroundColor: '#D1D5DB' },
  buttonText:     { color: '#fff', fontSize: 17, fontWeight: '700' },
  noAccount:      { color: '#6B7280', fontSize: 14, textAlign: 'center', textDecorationLine: 'underline' },
});
