import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import './src/i18n';
import AppNavigator from './src/navigation/AppNavigator';
import { initStorage } from './src/store/storage';
import { syncApi } from './src/api/endpoints';
import { getLastSyncedAt, setLastSyncedAt } from './src/store/storage';
import { AuthProvider } from './src/store/authContext';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 2 },
  },
});

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Load AsyncStorage into in-memory cache before anything renders
        await initStorage();
        // Best-effort background sync
        try {
          const lastSynced = getLastSyncedAt();
          await syncApi.pull(lastSynced);
          setLastSyncedAt(new Date().toISOString());
        } catch {}
      } finally {
        setReady(true);
        await SplashScreen.hideAsync();
      }
    };
    init();
  }, []);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar style="dark" />
            <AppNavigator />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
