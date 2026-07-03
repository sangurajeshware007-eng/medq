/**
 * Best-effort English → Devanagari / Kannada transliteration for doctor and
 * hospital names. We pipe the lowercased name through
 * @indic-transliteration/sanscript with the `itrans` input scheme, then strip
 * trailing virama / halant marks at word boundaries — sanscript treats a
 * naked consonant as halant-suppressed, but Indian readers expect a full
 * akshara when the consonant is the last syllable of a name.
 *
 * Quality is imperfect. When sanscript leaves Latin letters in the output
 * (a clear signal it couldn't map something) or returns empty text, we fall
 * back to the original English string and the caller renders it in the Latin
 * font instead of the active script font.
 */
import Sanscript from '@indic-transliteration/sanscript';

import type { LanguageCode } from '../constants/Languages';

export interface LocalizedNameResult {
  /** What to render. */
  display: string;
  /** True when `display` is still the English source — caller should pin the
   * Text's fontFamily to undefined so the global script font doesn't apply. */
  latin: boolean;
}

const HONORIFIC_RE = /^(Dr|Mr|Mrs|Ms|Smt|Sri|Shri|Prof)\.?\s+/i;

const HONORIFIC: Record<LanguageCode, string> = {
  en: 'Dr. ',
  hi: 'डॉ. ',
  kn: 'ಡಾ. ',
};

const SCHEME_FOR: Record<LanguageCode, string | null> = {
  en: null,
  hi: 'devanagari',
  kn: 'kannada',
};

// Devanagari virama U+094D, Kannada virama U+0CCD — drop at word boundaries.
const TRAILING_VIRAMA_RE = /[्್](\s|$)/g;

// Stable cache — keyed by `${language}:${input}`. Display strings are re-read
// on every list render, so even a small cache pays back quickly.
const cache = new Map<string, LocalizedNameResult>();

function stripHonorific(name: string): { rest: string; hadHonorific: boolean } {
  const m = name.match(HONORIFIC_RE);
  if (!m) return { rest: name, hadHonorific: false };
  return { rest: name.slice(m[0].length), hadHonorific: true };
}

export function localizedName(
  raw: string | null | undefined,
  language: LanguageCode,
): LocalizedNameResult {
  const name = (raw ?? '').trim();
  if (!name) return { display: '', latin: true };

  // English UI — never transliterate.
  const scheme = SCHEME_FOR[language];
  if (!scheme) return { display: name, latin: true };

  const cacheKey = `${language}:${name}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const { rest, hadHonorific } = stripHonorific(name);
  let result: LocalizedNameResult;
  try {
    const rough = Sanscript.t(rest.toLowerCase(), 'itrans', scheme) as string;
    const out = rough.replace(TRAILING_VIRAMA_RE, '$1').trim();
    const stillLatin = /[A-Za-z]/.test(out);
    if (stillLatin || !out) {
      result = { display: name, latin: true };
    } else {
      const prefix = hadHonorific ? HONORIFIC[language] : '';
      result = { display: `${prefix}${out}`.trim(), latin: false };
    }
  } catch {
    // Sanscript shouldn't throw on plain input, but if it does, fall back.
    result = { display: name, latin: true };
  }

  cache.set(cacheKey, result);
  return result;
}
