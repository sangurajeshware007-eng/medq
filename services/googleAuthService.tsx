/**
 * Native Google Sign-In wrapper
 *
 * Isolates @react-native-google-signin/google-signin from the rest of the
 * app so components/context only deal with a simple result union. The
 * returned idToken is exchanged for our own JWTs via
 * authService.googleLogin().
 *
 * The package is loaded LAZILY inside a try/catch: it registers a native
 * TurboModule at import time and hard-crashes any binary that doesn't
 * contain it (Expo Go, or a dev build made before the module was added).
 * Lazy loading keeps the rest of the app alive in those binaries — the
 * Google button then reports a clear error instead of killing the bundle.
 *
 * For Google sign-in to actually work you need a rebuilt dev/production
 * binary: `npm run ios:build` / `npm run android`.
 */
// Type-only import — fully erased at compile time, never loads the native module.
import type * as GoogleSigninPackage from '@react-native-google-signin/google-signin';

import { ENV } from '../config/environment';

type GoogleSigninModule = typeof GoogleSigninPackage;

let mod: GoogleSigninModule | null | undefined;
let configured = false;

function loadModule(): GoogleSigninModule | null {
  if (mod !== undefined) return mod;
  try {
    mod = require('@react-native-google-signin/google-signin') as GoogleSigninModule;
  } catch {
    // Native module not in this binary — see header comment.
    mod = null;
  }
  return mod;
}

function ensureConfigured(g: GoogleSigninModule): void {
  if (configured) return;
  g.GoogleSignin.configure({
    // The WEB client ID — it becomes the ID token's audience, which the
    // backend validates.
    webClientId: ENV.googleWebClientId,
    // The iOS client ID — required on iOS since we don't ship a Firebase
    // GoogleService-Info.plist. Ignored on Android.
    ...(ENV.googleIosClientId ? { iosClientId: ENV.googleIosClientId } : {}),
  });
  configured = true;
}

/** True when the native module is present in this binary. */
export function isGoogleSignInAvailable(): boolean {
  return loadModule() !== null;
}

/** The library's native branded button, or null in binaries without the module. */
export function getGoogleSigninButton(): GoogleSigninModule['GoogleSigninButton'] | null {
  return loadModule()?.GoogleSigninButton ?? null;
}

export type GoogleSignInResult =
  | { status: 'success'; idToken: string }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

export async function nativeGoogleSignIn(): Promise<GoogleSignInResult> {
  const g = loadModule();
  if (!g) {
    return {
      status: 'error',
      message:
        'Google Sign-In is not available in this build. Rebuild the app (npm run ios:build / npm run android).',
    };
  }
  try {
    ensureConfigured(g);
    await g.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await g.GoogleSignin.signIn();

    if (!g.isSuccessResponse(response) || !response.data.idToken) {
      // NoSavedCredentialFound or a success payload without an ID token —
      // treat both as a non-completed sign-in.
      return { status: 'cancelled' };
    }
    return { status: 'success', idToken: response.data.idToken };
  } catch (err) {
    if (g.isErrorWithCode(err)) {
      switch (err.code) {
        case g.statusCodes.SIGN_IN_CANCELLED:
          return { status: 'cancelled' };
        case g.statusCodes.IN_PROGRESS:
          return { status: 'cancelled' };
        case g.statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          return {
            status: 'error',
            message: 'Google Play Services is not available on this device.',
          };
      }
    }
    return { status: 'error', message: 'Google sign-in failed. Please try again.' };
  }
}

/** Best-effort sign-out so the account picker shows again on next login. */
export async function nativeGoogleSignOut(): Promise<void> {
  const g = loadModule();
  if (!g) return;
  try {
    ensureConfigured(g);
    await g.GoogleSignin.signOut();
  } catch {
    // Ignore — local token cleanup is what matters; Google session is cosmetic.
  }
}
