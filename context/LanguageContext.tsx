// Phase 1: English only — restore with detectInitialLanguage.
// import * as Localization from 'expo-localization';
import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Text, TextInput } from 'react-native';

import type { LanguageCode } from '../constants/Languages';
import { translations } from '../constants/Languages';
import storage from '../utils/storage';

import { useAuth } from './AuthContext';

const STORAGE_KEY = 'lang';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

/** Detect first-launch default: stored choice → device locale → English. */
function detectInitialLanguage(): LanguageCode {
  // ── Phase 1: English only ────────────────────────────────────────────
  // The language switcher is hidden until hi/kn translations are complete.
  // To re-enable: restore the commented detection below, un-comment the
  // <LanguageToggle /> usages, and restore the profile-preference effect.
  return 'en';
  // const stored = storage.getSync(STORAGE_KEY);
  // if (stored === 'en' || stored === 'hi' || stored === 'kn') return stored;
  // try {
  //   const code = Localization.getLocales()[0]?.languageCode;
  //   if (code === 'hi' || code === 'kn') return code;
  // } catch {
  //   // expo-localization unavailable (e.g. some test envs) — fall through to en.
  // }
  // return 'en';
}

/** Per-language script font. `undefined` means "use system default". */
function fontFamilyFor(language: LanguageCode): string | undefined {
  if (language === 'hi') return 'NotoSansDevanagari_400Regular';
  if (language === 'kn') return 'NotoSansKannada_400Regular';
  return undefined;
}

/** Swap the default font on every Text / TextInput in the app whenever the
 * language changes. Per-component `style={{ fontFamily }}` still wins, but
 * the vast majority of Text elements in this codebase don't set one. */
function applyDefaultFont(language: LanguageCode) {
  const fontFamily = fontFamilyFor(language);
  const apply = (Component: typeof Text | typeof TextInput) => {
    const existing = (Component as unknown as { defaultProps?: { style?: object } }).defaultProps;
    (Component as unknown as { defaultProps: { style: object } }).defaultProps = {
      ...existing,
      style: [
        ...(Array.isArray(existing?.style)
          ? existing.style
          : existing?.style
            ? [existing.style]
            : []),
        { fontFamily },
      ],
    };
  };
  apply(Text);
  apply(TextInput);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(detectInitialLanguage);
  const { user } = useAuth();

  const setLanguage = useCallback((next: LanguageCode) => {
    setLanguageState(next);
    storage.setSync(STORAGE_KEY, next);
  }, []);

  // Apply the script font as soon as language changes (including initial mount).
  useEffect(() => {
    applyDefaultFont(language);
  }, [language]);

  // First time we see a logged-in user with a server-stored preference and
  // no local override, adopt theirs. Local choice (anything in storage) always
  // wins — this only kicks in for a fresh install of an existing account.
  // ── Phase 1: English only — profile preference adoption disabled with the
  // language switcher. Restore this effect together with detectInitialLanguage.
  // useEffect(() => {
  //   if (!user?.preferredLanguage) return;
  //   if (storage.getSync(STORAGE_KEY)) return;
  //   const code = user.preferredLanguage as LanguageCode;
  //   if (code === 'en' || code === 'hi' || code === 'kn') {
  //     setLanguage(code);
  //   }
  // }, [user?.preferredLanguage, setLanguage]);
  void user;

  const t = useCallback(
    (key: string): string => translations[language]?.[key] || translations.en?.[key] || key,
    [language],
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
