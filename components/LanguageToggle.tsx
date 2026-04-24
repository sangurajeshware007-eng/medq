import React from 'react';

// ─────────────────────────────────────────────────────────────────────────
// MULTI-LANGUAGE SUPPORT IS DISABLED FOR NOW (English-only launch).
//
// This component intentionally renders `null` so every existing
// `<LanguageToggle />` call site (LogoHeader, login, register, profile)
// keeps compiling while the UI stays hidden. To re-enable:
//   1. Uncomment the JSX block below.
//   2. Uncomment the original multi-language branch in
//      context/LanguageContext.tsx.
// ─────────────────────────────────────────────────────────────────────────

export default function LanguageToggle() {
  return null;
}

// ── Original implementation (restore to re-enable the en / hi / kn switcher) ──
// import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// import { Colors } from '../constants/Colors';
// import { LANGUAGES } from '../constants/Languages';
// import { useLanguage } from '../context/LanguageContext';
// import { crossPlatformShadow } from '../utils/shadow';
//
// export default function LanguageToggle() {
//   const { language, setLanguage } = useLanguage();
//   return (
//     <View style={styles.container}>
//       {LANGUAGES.map((lang) => (
//         <TouchableOpacity
//           key={lang.code}
//           style={[styles.option, language === lang.code && styles.optionActive]}
//           onPress={() => setLanguage(lang.code)}
//           activeOpacity={0.7}
//         >
//           <Text style={[styles.optionText, language === lang.code && styles.optionTextActive]}>
//             {lang.nativeLabel}
//           </Text>
//         </TouchableOpacity>
//       ))}
//     </View>
//   );
// }
//
// const styles = StyleSheet.create({
//   container: {
//     flexDirection: 'row',
//     backgroundColor: Colors.borderLight,
//     borderRadius: 12,
//     padding: 3,
//   },
//   option: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
//   optionActive: {
//     backgroundColor: Colors.primary,
//     ...crossPlatformShadow({ color: Colors.primary, offsetY: 2, opacity: 0.3, radius: 4, elevation: 2 }),
//   },
//   optionText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
//   optionTextActive: { color: Colors.white },
// });
