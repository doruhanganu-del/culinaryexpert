import React, { createContext, useContext, useState, useCallback } from 'react';
import { clearTokens, storage, StorageKeys } from './storage';

interface AuthContextType {
  isOnboarded: boolean;
  trialDaysLeft: number | null;
  isTrialDay12: boolean;
  isTrialExpired: boolean;
  completeOnboarding: () => void;
  signOut: () => void;
}

function getTrialDaysLeft(): number | null {
  const startStr = storage.getString(StorageKeys.TRIAL_START_DATE);
  if (!startStr) return null;
  const start = new Date(startStr).getTime();
  const now   = Date.now();
  const daysElapsed = (now - start) / (1000 * 60 * 60 * 24);
  return Math.max(0, 14 - daysElapsed);
}

const AuthContext = createContext<AuthContextType>({
  isOnboarded: false,
  trialDaysLeft: null,
  isTrialDay12: false,
  isTrialExpired: false,
  completeOnboarding: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isOnboarded, setIsOnboarded] = useState(
    () => storage.getBoolean(StorageKeys.ONBOARDING_DONE) ?? false
  );

  const trialDaysLeft  = getTrialDaysLeft();
  const isTrialDay12   = trialDaysLeft !== null && trialDaysLeft <= 2 && trialDaysLeft > 0;
  const isTrialExpired = trialDaysLeft !== null && trialDaysLeft <= 0;

  const completeOnboarding = useCallback(() => {
    storage.set(StorageKeys.ONBOARDING_DONE, true);
    setIsOnboarded(true);
  }, []);

  const signOut = useCallback(() => {
    clearTokens();
    storage.delete(StorageKeys.ONBOARDING_DONE);
    storage.delete(StorageKeys.TRIAL_START_DATE);
    storage.delete(StorageKeys.TRIAL_NOTIFIED);
    setIsOnboarded(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isOnboarded, trialDaysLeft, isTrialDay12, isTrialExpired, completeOnboarding, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
