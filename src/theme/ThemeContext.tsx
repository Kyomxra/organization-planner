import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors } from './colors';
import type { ThemeColors } from './colors';
import { showMessage } from '../features/auth/utils/feedback';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => Promise<void>;
}

const STORAGE_KEY = '@organization-planner/theme-mode';
const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Could not save your appearance setting.';
}

export function ThemeProvider({ children }: React.PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((savedMode) => {
        if (active && isThemeMode(savedMode)) setModeState(savedMode);
      })
      .catch((error: unknown) => {
        if (active) {
          showMessage(
            'Could not load appearance setting',
            error instanceof Error ? error.message : 'The system appearance will be used.',
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const setMode = useCallback(async (nextMode: ThemeMode) => {
    const previousMode = mode;
    setModeState(nextMode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, nextMode);
    } catch (error: unknown) {
      setModeState(previousMode);
      showMessage('Could not save appearance setting', getErrorMessage(error));
    }
  }, [mode]);

  const resolvedMode = mode === 'system'
    ? systemColorScheme === 'dark' ? 'dark' : 'light'
    : mode;
  const colors = resolvedMode === 'dark' ? darkColors : lightColors;
  const value = useMemo(
    () => ({ mode, resolvedMode, colors, setMode }),
    [mode, resolvedMode, colors, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useAppTheme must be used within ThemeProvider.');
  return theme;
}

export type { ThemeColors };
