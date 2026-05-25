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
import { getLastSyncedAt, setLastSyncedAt, storage, StorageKeys } from './src/store/storage';
import { AuthProvider, useAuth } from './src/store/authContext';
import TrialModal from './src/components/TrialModal';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 2 },
  },
});

function TrialGate() {
  const { isTrialDay12, isTrialExpired, trialDaysLeft } = useAuth();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!isTrialDay12 && !isTrialExpired) return;
    const alreadyShown = storage.getBoolean(StorageKeys.TRIAL_NOTIFIED);
    if (!alreadyShown) {
      setShowModal(true);
      storage.set(StorageKeys.TRIAL_NOTIFIED, true);
    }
  }, [isTrialDay12, isTrialExpired]);

  return (
    <TrialModal
      visible={showModal}
      daysLeft={trialDaysLeft ?? 0}
      onDismiss={() => setShowModal(false)}
    />
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await initStorage();
        // Best-effort background sync — fire and forget so splash hides immediately
        syncApi.pull(getLastSyncedAt())
          .then(() => setLastSyncedAt(new Date().toISOString()))
          .catch(() => {});
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
            <StatusBar style="light" translucent={false} />
            <AppNavigator />
            <TrialGate />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
