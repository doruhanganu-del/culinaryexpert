import React, { createContext, useContext, useState, useCallback } from 'react';
import { clearTokens, storage, StorageKeys } from './storage';

interface AuthContextType {
  isOnboarded: boolean;
  completeOnboarding: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isOnboarded: false,
  completeOnboarding: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isOnboarded, setIsOnboarded] = useState(
    () => storage.getBoolean(StorageKeys.ONBOARDING_DONE) ?? false
  );

  const completeOnboarding = useCallback(() => {
    storage.set(StorageKeys.ONBOARDING_DONE, true);
    setIsOnboarded(true);
  }, []);

  const signOut = useCallback(() => {
    clearTokens();
    storage.delete(StorageKeys.ONBOARDING_DONE);
    setIsOnboarded(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isOnboarded, completeOnboarding, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
