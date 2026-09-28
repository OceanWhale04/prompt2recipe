"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_PROVIDER_SETTINGS,
  parseStoredProviderSettings,
  PROVIDER_STORAGE_KEY,
  type ProviderSettings,
} from "@/lib/compute-provider";

interface ProviderSettingsContextValue {
  settings: ProviderSettings;
  hydrated: boolean;
  saveSettings: (settings: ProviderSettings) => void;
  resetSettings: () => void;
}

const ProviderSettingsContext = createContext<ProviderSettingsContextValue | null>(null);

export function ProviderSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ProviderSettings>(DEFAULT_PROVIDER_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setSettings(parseStoredProviderSettings(window.localStorage.getItem(PROVIDER_STORAGE_KEY)));
    } finally {
      setHydrated(true);
    }
  }, []);

  const saveSettings = useCallback((next: ProviderSettings) => {
    setSettings(next);
    try {
      window.localStorage.setItem(PROVIDER_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // In-memory state still works when localStorage is unavailable.
    }
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_PROVIDER_SETTINGS);
    try {
      window.localStorage.removeItem(PROVIDER_STORAGE_KEY);
    } catch {
      // Ignore storage failures and keep the default in memory.
    }
  }, []);

  const value = useMemo(
    () => ({ settings, hydrated, saveSettings, resetSettings }),
    [hydrated, resetSettings, saveSettings, settings],
  );

  return (
    <ProviderSettingsContext.Provider value={value}>
      {children}
    </ProviderSettingsContext.Provider>
  );
}

export function useProviderSettings() {
  const context = useContext(ProviderSettingsContext);
  if (!context) {
    throw new Error("useProviderSettings must be used within ProviderSettingsProvider.");
  }
  return context;
}
