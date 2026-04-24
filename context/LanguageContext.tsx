import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { LanguageCode, translations } from '../constants/Languages';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

// ─────────────────────────────────────────────────────────────────────────
// MULTI-LANGUAGE SUPPORT IS DISABLED FOR NOW (English-only launch).
//
// All `useLanguage().t(key)` calls across the app keep working — they
// just always resolve against `translations.en`. The switcher UI is
// hidden via LanguageToggle returning null. To re-enable Hindi/Kannada:
//   1. Uncomment the original useState + setLanguage branch below.
//   2. Re-render <LanguageToggle /> by restoring its JSX in
//      components/LanguageToggle.tsx.
// ─────────────────────────────────────────────────────────────────────────

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  // ── English-only (temporary) ────────────────────────────────────────────
  const language: LanguageCode = 'en';
  const setLanguage = () => {
    // no-op while multi-language is disabled
  };
  const t = (key: string): string => translations.en?.[key] ?? key;

  // ── Original multi-language implementation (restore to re-enable) ───────
  // const [language, setLanguage] = useState<LanguageCode>('en');
  // const t = useCallback(
  //   (key: string): string =>
  //     translations[language]?.[key] || translations.en?.[key] || key,
  //   [language],
  // );

  const value = useMemo(() => ({ language, setLanguage, t }), []);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
