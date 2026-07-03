import { useMemo } from 'react';

import { useLanguage } from '../context/LanguageContext';
import { localizedName, type LocalizedNameResult } from '../utils/transliterateName';

/**
 * Picks the right display string for a doctor or hospital name based on the
 * current UI language. Today, transliterates English → Hindi/Kannada on the
 * fly. The optional `nameHi`/`nameKn` overrides exist so that when the
 * backend later starts populating the existing `name_hi`/`name_kn` columns
 * and exposing them in DTOs, call sites can pass them straight through and
 * skip transliteration — no other code changes needed.
 */
export function useLocalizedName(
  name: string | null | undefined,
  nameHi?: string | null,
  nameKn?: string | null,
): LocalizedNameResult {
  const { language } = useLanguage();
  return useMemo(() => {
    if (language === 'hi' && nameHi && nameHi.trim()) {
      return { display: nameHi, latin: false };
    }
    if (language === 'kn' && nameKn && nameKn.trim()) {
      return { display: nameKn, latin: false };
    }
    return localizedName(name, language);
  }, [language, name, nameHi, nameKn]);
}
