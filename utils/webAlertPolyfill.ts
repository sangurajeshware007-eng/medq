/**
 * Alert polyfill — native side.
 *
 * No-op: React Native's Alert works natively. The web twin
 * (webAlertPolyfill.web.ts) patches Alert.alert, which react-native-web
 * ships as a silent no-op — without it every error/confirm dialog in the
 * app would just vanish in browsers.
 *
 * Imported once, for its side effect, in app/_layout.tsx.
 */
export {};
