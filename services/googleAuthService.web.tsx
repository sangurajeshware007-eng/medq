/**
 * Web Google Sign-In wrapper — Google Identity Services (GIS)
 *
 * Metro resolves this file instead of googleAuthService.ts on web, so the
 * native @react-native-google-signin module never enters the web bundle.
 *
 * Same surface as the native wrapper. Integration contract with the login
 * screen (which we keep unchanged):
 *   1. getGoogleSigninButton() returns a component that renders the official
 *      GIS button. Google handles the click and hands us the ID token in a
 *      callback — there is no imperative "open popup" API for ID tokens.
 *   2. The component stashes that token and THEN calls props.onPress(),
 *      which runs AuthContext.signInWithGoogle() → nativeGoogleSignIn().
 *   3. nativeGoogleSignIn() consumes the stashed token and resolves
 *      immediately, so the existing promise-based flow works untouched.
 *
 * Requires EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and the site origin listed under
 * "Authorized JavaScript origins" on that OAuth client in Google Cloud Console.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ENV } from '../config/environment';

declare global {
  interface Window {
    google: typeof google;
  }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client';

let gisPromise: Promise<boolean> | null = null;
let initialized = false;
/** ID token captured by the GIS button callback, consumed by nativeGoogleSignIn(). */
let pendingIdToken: string | null = null;

function loadGisScript(): Promise<boolean> {
  if (gisPromise) return gisPromise;
  gisPromise = new Promise<boolean>((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if (window.google?.accounts?.id) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve(!!window.google?.accounts?.id);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
  return gisPromise;
}

type CredentialListener = (idToken: string) => void;
const credentialListeners = new Set<CredentialListener>();

async function ensureInitialized(): Promise<boolean> {
  if (!ENV.googleWebClientId) return false;
  const loaded = await loadGisScript();
  if (!loaded) return false;
  if (!initialized) {
    window.google.accounts.id.initialize({
      client_id: ENV.googleWebClientId,
      callback: (response) => {
        if (!response.credential) return;
        pendingIdToken = response.credential;
        credentialListeners.forEach((listener) => listener(response.credential));
      },
    });
    initialized = true;
  }
  return true;
}

/** True when web sign-in is configured (script availability is checked lazily). */
export function isGoogleSignInAvailable(): boolean {
  return !!ENV.googleWebClientId;
}

export type GoogleSignInResult =
  | { status: 'success'; idToken: string }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

export async function nativeGoogleSignIn(): Promise<GoogleSignInResult> {
  // Normal path: the GIS button already captured a credential.
  if (pendingIdToken) {
    const idToken = pendingIdToken;
    pendingIdToken = null;
    return { status: 'success', idToken };
  }

  // Fallback path (GIS button not rendered): try the One Tap prompt.
  const ready = await ensureInitialized();
  if (!ready) {
    return {
      status: 'error',
      message: 'Google sign-in is not available right now. Please try again later.',
    };
  }
  return new Promise<GoogleSignInResult>((resolve) => {
    let settled = false;
    const finish = (result: GoogleSignInResult) => {
      if (settled) return;
      settled = true;
      credentialListeners.delete(onCredential);
      resolve(result);
    };
    const onCredential: CredentialListener = (idToken) => {
      pendingIdToken = null;
      finish({ status: 'success', idToken });
    };
    credentialListeners.add(onCredential);
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        finish({ status: 'cancelled' });
      }
    });
    // Safety net: never leave the login screen spinner hanging.
    setTimeout(() => finish({ status: 'cancelled' }), 90_000);
  });
}

/** Best-effort sign-out so auto-select doesn't silently log the user back in. */
export async function nativeGoogleSignOut(): Promise<void> {
  try {
    if (initialized && window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  } catch {
    // Cosmetic — local token cleanup is what matters.
  }
}

// ── Branded button component ──────────────────────────────────────────────

interface WebGoogleButtonProps {
  size?: number;
  color?: number;
  onPress?: () => void;
  disabled?: boolean;
}

const SIZE = { Icon: 0, Standard: 1, Wide: 2 } as const;
const COLOR = { Auto: 0, Light: 1, Dark: 2 } as const;

function WebGoogleButtonBase({ color, onPress, disabled }: WebGoogleButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const listener: CredentialListener = () => onPressRef.current?.();
    credentialListeners.add(listener);
    (async () => {
      const ready = await ensureInitialized();
      if (cancelled) return;
      if (!ready || !containerRef.current) {
        setFailed(true);
        return;
      }
      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: color === COLOR.Dark ? 'filled_blue' : 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: 312,
      });
    })();
    return () => {
      cancelled = true;
      credentialListeners.delete(listener);
    };
  }, [color]);

  if (failed) {
    // GIS script blocked/offline — plain button routed through the prompt flow.
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: '#dadce0',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#3c4043' }}>
          Continue with Google
        </Text>
      </Pressable>
    );
  }

  return (
    <View pointerEvents={disabled ? 'none' : 'auto'} style={{ opacity: disabled ? 0.5 : 1 }}>
      <div ref={containerRef} />
    </View>
  );
}

const WebGoogleButton = Object.assign(WebGoogleButtonBase, { Size: SIZE, Color: COLOR });

/** GIS-rendered branded button, mirroring the native GoogleSigninButton API. */
export function getGoogleSigninButton(): typeof WebGoogleButton | null {
  if (!isGoogleSignInAvailable()) return null;
  return WebGoogleButton;
}
