import { useCallback, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { LanguageCode } from '../constants/Languages';

// Native module is loaded via require() inside a try/catch so the Search
// route still renders in dev clients / Expo Go that don't yet include the
// expo-speech-recognition native binary. Without this guard, importing the
// module would break the route and Expo Router would drop the tab.
type SpeechModule = {
  start: (opts: Record<string, unknown>) => void;
  stop: () => void;
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
};

type EventName = 'start' | 'end' | 'result' | 'error';
type EventHook = (event: EventName, cb: (e: any) => void) => void;

let speechModule: SpeechModule | null = null;
let useSpeechEvent: EventHook = () => {};

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('expo-speech-recognition');
  if (mod?.ExpoSpeechRecognitionModule && mod?.useSpeechRecognitionEvent) {
    speechModule = mod.ExpoSpeechRecognitionModule;
    useSpeechEvent = mod.useSpeechRecognitionEvent;
  }
} catch {
  speechModule = null;
}

const LOCALE_MAP: Record<LanguageCode, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  kn: 'kn-IN',
};

interface UseVoiceSearchOptions {
  onResult: (transcript: string) => void;
}

interface UseVoiceSearchReturn {
  isAvailable: boolean;
  isListening: boolean;
  partialTranscript: string;
  error: string | null;
  toggle: () => Promise<void>;
  stop: () => void;
}

export function useVoiceSearch({ onResult }: UseVoiceSearchOptions): UseVoiceSearchReturn {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  useSpeechEvent('start', () => {
    setIsListening(true);
    setError(null);
  });

  useSpeechEvent('end', () => {
    setIsListening(false);
    setPartialTranscript('');
  });

  useSpeechEvent('result', (event) => {
    const transcript = event.results?.[0]?.transcript ?? '';
    if (!transcript) return;
    if (event.isFinal) {
      onResult(transcript);
      setPartialTranscript('');
    } else {
      setPartialTranscript(transcript);
    }
  });

  useSpeechEvent('error', (event) => {
    setIsListening(false);
    setPartialTranscript('');
    setError(event.message || event.error || 'Voice recognition failed');
  });

  const stop = useCallback(() => {
    speechModule?.stop();
  }, []);

  const toggle = useCallback(async () => {
    if (!speechModule) {
      setError('Voice search unavailable — rebuild the app to enable.');
      return;
    }
    if (isListening) {
      stop();
      return;
    }
    const permission = await speechModule.requestPermissionsAsync();
    if (!permission.granted) {
      setError('Microphone permission denied');
      return;
    }
    setError(null);
    speechModule.start({
      lang: LOCALE_MAP[language],
      interimResults: true,
      continuous: false,
      requiresOnDeviceRecognition: false,
      addsPunctuation: false,
    });
  }, [isListening, language, stop]);

  return {
    isAvailable: speechModule !== null,
    isListening,
    partialTranscript,
    error,
    toggle,
    stop,
  };
}
