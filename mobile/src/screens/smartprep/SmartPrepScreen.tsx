import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mealPlanApi } from '../../api/endpoints';
import { storage, StorageKeys } from '../../store/storage';
import type { BatchCookingSession, BatchCookingStep, StorageInstruction } from '../../types';

export default function SmartPrepScreen() {
  const [sessions, setSessions] = useState<BatchCookingSession[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState<number | null>(1);

  useEffect(() => {
    const planId = storage.getString(StorageKeys.ACTIVE_PLAN_ID);
    if (planId) {
      mealPlanApi.getBatchCooking(planId)
        .then(data => setSessions(Array.isArray(data) ? data : []))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>Loading your prep schedule…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Smart Prep Hub</Text>
        <Text style={styles.subtitle}>Cook twice a week — eat well every day.</Text>

        <View style={styles.philosophy}>
          <Text style={styles.philosophyText}>
            🔁 Batch cooking 2× per week reduces your daily kitchen time by up to{' '}
            <Text style={styles.bold}>70%</Text> while maximizing ingredient utilization.
          </Text>
        </View>

        {sessions.length === 0 ? (
          <Text style={styles.empty}>Generate a meal plan first to see your prep schedule.</Text>
        ) : (
          sessions.map(session => (
            <View key={session.id} style={styles.sessionCard}>
              <TouchableOpacity
                style={styles.sessionHeader}
                onPress={() => setExpanded(expanded === session.session_number ? null : session.session_number)}
              >
                <View>
                  <Text style={styles.sessionLabel}>Session {session.session_number}</Text>
                  <Text style={styles.sessionDate}>
                    {new Date(session.session_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <View style={styles.sessionMeta}>
                  <Text style={styles.sessionDuration}>⏱ ~{session.estimated_duration_min} min</Text>
                  <Text style={styles.expandIcon}>{expanded === session.session_number ? '▲' : '▼'}</Text>
                </View>
              </TouchableOpacity>

              {expanded === session.session_number && (
                <View style={styles.sessionBody}>
                  <Text style={styles.sectionTitle}>Prep Steps</Text>
                  {(session.steps ?? []).map((step: BatchCookingStep) => (
                    <View key={step.order} style={styles.step}>
                      <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{step.order}</Text></View>
                      <View style={styles.stepContent}>
                        <Text style={styles.stepAction}>{step.action}</Text>
                        {step.detail && <Text style={styles.stepDetail}>{step.detail}</Text>}
                        {step.duration_min > 0 && <Text style={styles.stepDuration}>{step.duration_min} min</Text>}
                      </View>
                    </View>
                  ))}

                  {(session.storage_instructions ?? []).length > 0 && (
                    <>
                      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Storage Guide</Text>
                      {(session.storage_instructions ?? []).map((s: StorageInstruction, i: number) => (
                        <View key={i} style={styles.storageRow}>
                          <Text style={styles.storageIcon}>{s.icon}</Text>
                          <View style={styles.storageInfo}>
                            <Text style={styles.storageItem}>{s.item}</Text>
                            <Text style={styles.storageQty}>{s.quantity}</Text>
                          </View>
                          <View style={[styles.storageBadge, s.storage === 'freezer' && styles.freezerBadge]}>
                            <Text style={styles.storageBadgeText}>
                              {s.storage === 'fridge' ? 'Fridge' : 'Freezer'} · {s.duration_days}d
                            </Text>
                          </View>
                        </View>
                      ))}
                    </>
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#F9FAFB' },
  loading:           { textAlign: 'center', marginTop: 80, color: '#6B7280' },
  content:           { paddingHorizontal: 24, paddingBottom: 40 },
  title:             { fontSize: 26, fontWeight: '800', color: '#111827', marginTop: 16 },
  subtitle:          { color: '#6B7280', fontSize: 14, marginTop: 4, marginBottom: 16 },
  philosophy:        { backgroundColor: '#F0FDF4', borderRadius: 14, padding: 16, marginBottom: 20 },
  philosophyText:    { fontSize: 14, color: '#374151', lineHeight: 22 },
  bold:              { fontWeight: '700', color: '#1B4332' },
  empty:             { color: '#9CA3AF', textAlign: 'center', marginTop: 60, fontSize: 15 },
  sessionCard:       { backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
  sessionHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
  sessionLabel:      { fontSize: 16, fontWeight: '700', color: '#111827' },
  sessionDate:       { fontSize: 13, color: '#6B7280', marginTop: 2 },
  sessionMeta:       { alignItems: 'flex-end', gap: 4 },
  sessionDuration:   { fontSize: 13, color: '#1B4332', fontWeight: '600' },
  expandIcon:        { color: '#9CA3AF', fontSize: 12 },
  sessionBody:       { paddingHorizontal: 18, paddingBottom: 18, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  sectionTitle:      { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 10 },
  step:              { flexDirection: 'row', gap: 12, marginBottom: 14 },
  stepNumber:        { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1B4332', alignItems: 'center', justifyContent: 'center' },
  stepNumberText:    { color: '#fff', fontSize: 13, fontWeight: '700' },
  stepContent:       { flex: 1 },
  stepAction:        { fontSize: 14, fontWeight: '600', color: '#111827' },
  stepDetail:        { fontSize: 13, color: '#6B7280', marginTop: 2 },
  stepDuration:      { fontSize: 12, color: '#9CA3AF', marginTop: 3 },
  storageRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  storageIcon:       { fontSize: 24 },
  storageInfo:       { flex: 1 },
  storageItem:       { fontSize: 14, fontWeight: '600', color: '#111827' },
  storageQty:        { fontSize: 12, color: '#6B7280' },
  storageBadge:      { backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  freezerBadge:      { backgroundColor: '#E0F2FE' },
  storageBadgeText:  { fontSize: 12, fontWeight: '600', color: '#1E40AF' },
});
