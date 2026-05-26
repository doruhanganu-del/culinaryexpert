import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { groceryApi } from '../../api/endpoints';
import { storage, StorageKeys } from '../../store/storage';
import type { GroceryListItem, GroceryScope } from '../../types';

export default function GroceriesScreen() {
  const { t } = useTranslation();
  const [items,    setItems]    = useState<GroceryListItem[]>([]);
  const [listId,   setListId]   = useState<string | null>(null);
  const [scope,    setScope]    = useState<GroceryScope>('week');
  const [loading,  setLoading]  = useState(false);
  const [progress, setProgress] = useState(0);

  const loadGroceries = async (newScope: GroceryScope) => {
    const planId = storage.getString(StorageKeys.ACTIVE_PLAN_ID);
    if (!planId) return;

    setLoading(true);
    try {
      const { list_id, items: newItems } = await groceryApi.generate(planId, newScope);
      setListId(list_id);
      setItems(newItems as GroceryListItem[]);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGroceries(scope); }, [scope]);

  useEffect(() => {
    if (items.length === 0) { setProgress(0); return; }
    setProgress(items.filter(i => i.is_checked).length / items.length);
  }, [items]);

  const toggleItem = async (item: GroceryListItem) => {
    const newVal = !item.is_checked;
    // Match by BOTH id and ingredient_id to guard against duplicate or null ids from backend
    setItems(prev => prev.map(i =>
      (i.id && i.id === item.id && i.ingredient_id === item.ingredient_id)
        ? { ...i, is_checked: newVal }
        : i
    ));
    if (listId && item.id) {
      try { await groceryApi.toggleItem(item.id, newVal); } catch {}
    }
  };

  const grouped = items.reduce<Record<string, GroceryListItem[]>>((acc, item) => {
    const aisle = item.supermarket_aisle ?? 'Other';
    if (!acc[aisle]) acc[aisle] = [];
    acc[aisle].push(item);
    return acc;
  }, {});

  const aisleOrder = ['Produce', 'Proteins', 'Dairy', 'Dry Goods', 'Canned', 'Frozen', 'Condiments', 'Bakery', 'Other'];
  const sortedAisles = Object.keys(grouped).sort(
    (a, b) => (aisleOrder.indexOf(a) + 1 || 99) - (aisleOrder.indexOf(b) + 1 || 99)
  );

  const AISLE_EMOJI: Record<string, string> = {
    Produce: '🥦', Proteins: '🥩', Dairy: '🥛', 'Dry Goods': '🌾',
    Canned: '🥫', Frozen: '❄️', Condiments: '🫙', Bakery: '🍞', Other: '📦',
  };
  const AISLE_I18N_KEY: Record<string, string> = {
    Produce: 'produce', Proteins: 'proteins', Dairy: 'dairy', 'Dry Goods': 'dryGoods',
    Canned: 'canned', Frozen: 'frozen', Condiments: 'condiments', Bakery: 'bakery', Other: 'other',
  };

  const checkedCount = items.filter(i => i.is_checked).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('nav.groceries')}</Text>

        {/* Critical UI element: scope toggle */}
        <View style={styles.scopeToggle}>
          <TouchableOpacity
            style={[styles.scopeBtn, scope === 'week' && styles.scopeBtnActive]}
            onPress={() => setScope('week')}
          >
            <Text style={[styles.scopeText, scope === 'week' && styles.scopeTextActive]}>{t('groceries.wholeWeek')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.scopeBtn, scope === 'next_day' && styles.scopeBtnActive]}
            onPress={() => setScope('next_day')}
          >
            <Text style={[styles.scopeText, scope === 'next_day' && styles.scopeTextActive]}>{t('groceries.nextDay')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress bar */}
      {items.length > 0 && (
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>{t('groceries.itemsChecked', { checked: checkedCount, total: items.length })}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
          </View>
        </View>
      )}

      {loading ? (
        <Text style={styles.loading}>{t('groceries.loading')}</Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {sortedAisles.map(aisle => (
            <View key={aisle} style={styles.aisleSection}>
              <Text style={styles.aisleTitle}>
                {AISLE_EMOJI[aisle] ?? '🛒'} {t(`groceries.${AISLE_I18N_KEY[aisle] ?? 'other'}`)}
              </Text>
              {grouped[aisle].map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemRow, item.is_checked && styles.itemRowChecked]}
                  onPress={() => toggleItem(item)}
                >
                  <View style={[styles.checkbox, item.is_checked && styles.checkboxChecked]}>
                    {item.is_checked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, item.is_checked && styles.itemNameChecked]}>
                      {item.ingredient?.name ?? 'Unknown'}
                    </Text>
                    <Text style={styles.itemQty}>{item.display_quantity}</Text>
                  </View>
                  {(item.used_in_recipe_ids?.length ?? 0) > 1 && (
                    <Text style={styles.usedIn}>×{item.used_in_recipe_ids.length}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#F9FAFB' },
  header:           { paddingHorizontal: 24, paddingTop: 16, gap: 12, marginBottom: 4 },
  title:            { fontSize: 26, fontWeight: '800', color: '#111827' },
  scopeToggle:      { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 12, padding: 3 },
  scopeBtn:         { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  scopeBtnActive:   { backgroundColor: '#1B4332' },
  scopeText:        { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  scopeTextActive:  { color: '#fff' },
  progressSection:  { paddingHorizontal: 24, marginVertical: 12, gap: 6 },
  progressText:     { fontSize: 13, color: '#6B7280' },
  progressTrack:    { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressBar:      { height: '100%', backgroundColor: '#1B4332', borderRadius: 3 },
  loading:          { textAlign: 'center', marginTop: 80, color: '#6B7280' },
  list:             { paddingHorizontal: 24, paddingBottom: 40 },
  aisleSection:     { marginBottom: 24 },
  aisleTitle:       { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  itemRow:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, gap: 12 },
  itemRowChecked:   { opacity: 0.55 },
  checkbox:         { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked:  { backgroundColor: '#1B4332', borderColor: '#1B4332' },
  checkmark:        { color: '#fff', fontSize: 14, fontWeight: '700' },
  itemInfo:         { flex: 1 },
  itemName:         { fontSize: 15, fontWeight: '600', color: '#111827' },
  itemNameChecked:  { textDecorationLine: 'line-through', color: '#9CA3AF' },
  itemQty:          { fontSize: 12, color: '#6B7280', marginTop: 2 },
  usedIn:           { backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
});
