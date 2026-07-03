import React from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { useLocalizedName } from '../hooks/useLocalizedName';

interface Props {
  /** English name from the API. Required — the source of truth. */
  name: string | null | undefined;
  /** Optional pre-localized variants (future-proofing for when the backend
   * starts populating the existing `name_hi`/`name_kn` columns). */
  nameHi?: string | null;
  nameKn?: string | null;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

/**
 * Drop-in replacement for `<Text>{name}</Text>` on doctor/hospital names.
 * Renders the localized form when the UI is Hindi/Kannada and the
 * transliteration succeeds; otherwise falls back to the original English with
 * `fontFamily: undefined` so the global Devanagari/Kannada default doesn't
 * apply to that one node.
 */
export default function LocalizedName({ name, nameHi, nameKn, style, numberOfLines }: Props) {
  const { display, latin } = useLocalizedName(name, nameHi, nameKn);
  return (
    <Text style={latin ? [style, styles.latinOverride] : style} numberOfLines={numberOfLines}>
      {display}
    </Text>
  );
}

const styles = StyleSheet.create({
  // Force the system Latin font; overrides the per-language default font set
  // on Text.defaultProps inside LanguageContext.
  latinOverride: { fontFamily: undefined },
});
