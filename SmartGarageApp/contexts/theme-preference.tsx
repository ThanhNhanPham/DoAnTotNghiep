import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

type ThemePreference = 'light' | 'dark';

type ThemePreferenceContextValue = {
  colorScheme: ThemePreference;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => Promise<void>;
  isReady: boolean;
};

const STORAGE_KEY = 'themePreference';

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | undefined>(undefined);

export function ThemePreferenceProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = Appearance.getColorScheme();
  const fallbackScheme: ThemePreference = systemScheme === 'dark' ? 'dark' : 'light';

  const [preference, setPreferenceState] = useState<ThemePreference>(fallbackScheme);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const storedPreference = await AsyncStorage.getItem(STORAGE_KEY);

        if (storedPreference === 'light' || storedPreference === 'dark') {
          setPreferenceState(storedPreference);
        }
      } catch (error) {
        console.error('Load theme preference failed:', error);
      } finally {
        setIsReady(true);
      }
    };

    loadPreference();
  }, []);

  const setPreference = async (nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference);
    await AsyncStorage.setItem(STORAGE_KEY, nextPreference);
  };

  const value = useMemo(
    () => ({
      colorScheme: preference,
      preference,
      setPreference,
      isReady,
    }),
    [isReady, preference]
  );

  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);

  if (!context) {
    throw new Error('useThemePreference must be used within ThemePreferenceProvider');
  }

  return context;
}

export function toStatusBarStyle(colorScheme: ColorSchemeName) {
  return colorScheme === 'dark' ? 'light' : 'dark';
}
