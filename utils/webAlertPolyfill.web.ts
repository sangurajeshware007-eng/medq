/**
 * Alert polyfill — web side.
 *
 * react-native-web ships Alert.alert as a silent no-op, so the app's 70+
 * Alert.alert calls (errors, confirmations) would vanish in browsers.
 * Patching the shared module once is deliberately preferred over rewiring
 * imports in ~24 files: every importer gets the patched method.
 *
 * Mapping:
 *   0–1 buttons → window.alert, then the button's onPress
 *   2+ buttons  → window.confirm: OK runs the primary (non-cancel) button,
 *                 Cancel runs the style:'cancel' button. Three-button alerts
 *                 degrade to primary-vs-cancel.
 *
 * Imported once, for its side effect, in app/_layout.tsx.
 */
import { Alert, type AlertButton } from 'react-native';

function webAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  const text = message ? `${title}\n\n${message}` : title;

  if (!buttons || buttons.length <= 1) {
    window.alert(text);
    buttons?.[0]?.onPress?.();
    return;
  }

  const cancelButton = buttons.find((b) => b.style === 'cancel') ?? buttons[buttons.length - 1];
  const primaryButton = buttons.find((b) => b !== cancelButton) ?? buttons[0];

  if (window.confirm(text)) {
    primaryButton?.onPress?.();
  } else {
    cancelButton?.onPress?.();
  }
}

Alert.alert = webAlert;

export {};
