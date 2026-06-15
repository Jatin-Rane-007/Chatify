'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { tokens, type DesignTokens, type ThemeMode } from '@/styles/tokens';

type Preference = ThemeMode | 'system';

interface ThemeContextType {
  /** Resolved mode actually applied to the document. */
  theme: ThemeMode;
  /** User preference — may be 'system'. */
  preference: Preference;
  tokens: DesignTokens;
  setPreference: (pref: Preference) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'chatify_theme';

function resolveMode(pref: Preference): ThemeMode {
  if (pref === 'light' || pref === 'dark') return pref;
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyMode(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(mode);
  root.style.colorScheme = mode;
}

export function ThemeProvider({ children }: { readonly children: React.ReactNode }) {
  // Initial render must match the no-flash script in layout.tsx, so default to 'dark'
  // and reconcile in the mount effect below.
  const [preference, setPreferenceState] = useState<Preference>('dark');
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  // Mount: read stored preference + react to system changes.
  useEffect(() => {
    const stored = (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null) as Preference | null;
    const initialPref: Preference = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    setPreferenceState(initialPref);

    const resolved = resolveMode(initialPref);
    setThemeState(resolved);
    applyMode(resolved);

    if (initialPref === 'system' && typeof window !== 'undefined') {
      const mql = window.matchMedia('(prefers-color-scheme: light)');
      const onChange = () => {
        const next: ThemeMode = mql.matches ? 'light' : 'dark';
        setThemeState(next);
        applyMode(next);
      };
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
  }, []);

  const setPreference = useCallback((pref: Preference) => {
    setPreferenceState(pref);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, pref);
    const resolved = resolveMode(pref);
    setThemeState(resolved);
    applyMode(resolved);
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => setPreference(mode), [setPreference]);

  const toggleTheme = useCallback(() => {
    setPreference(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setPreference]);

  const value: ThemeContextType = {
    theme,
    preference,
    tokens,
    setPreference,
    setTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
