# MedQ+ — React Native (Expo) Medical App

> **New machine?** The full-stack local setup guide (backend + database +
> Google Sign-In config + this app) lives in the backend repo:
> [`medq-be/SETUP.md`](https://github.com/sangameshwarrr/medq-be/blob/main/SETUP.md)

## Quick Start

### First-time setup (native build — slow, ~2 min)
```sh
npm install --legacy-peer-deps
npx expo run:ios          # builds native code + installs on simulator
```

### Daily development (JS only — instant, ~2 sec)
```sh
npm start                 # starts Metro bundler
# Then press "i" to open in iOS simulator
```

> **Key insight:** `expo run:ios` recompiles all native (Objective-C/Swift) code every time — that's why it's slow (~2 min). You only need it when:
> - First time setup
> - Adding/removing a native dependency (e.g. `npm install react-native-maps`)
> - Changing `ios/Podfile` or any native config
>
> For **all other changes** (screens, components, styles, API calls, etc.), just run `npm start`. Metro serves JS bundles instantly with hot reload.

## Available Scripts

| Command | What it does |
|---|---|
| `npm start` | Start Metro dev server (fast — JS only) |
| `npm run ios` | Start Metro + auto-open iOS simulator |
| `npm run ios:build` | Full native rebuild (`expo run:ios`) — slow |
| `npm run android` | Start Metro + auto-open Android emulator |
| `npm run web` | Start Metro + open the app in a browser |
| `npm run build:web` | Static web export to `dist/` (what Vercel runs) |

## Web (same codebase)

The app also ships as a web app (react-native-web, `web.output: "static"`), deployed to
Vercel — `vercel.json` holds the build command and the rewrites for dynamic routes
(`/doctor/:id` → `doctor/[id].html` etc.).

Platform-specific code uses `.web.tsx`/`.web.ts` file variants (Metro picks them
automatically on web). **Gotcha:** route files under `app/` cannot be platform-split —
Expo Router bundles every route file on every platform. Keep the route a thin re-export
and split the underlying component in `components/` instead (see
`app/onboarding/hospital/pick-location.tsx`).

Current web forks: `utils/storage.web.ts` (localStorage instead of MMKV),
`services/googleAuthService.web.tsx` (Google Identity Services),
`utils/geocode.web.ts` (Nominatim — expo-location geocoding is native-only),
`components/onboarding/HospitalPickLocationScreen.web.tsx` (Google Maps JS instead of
react-native-maps, with a manual-coordinates fallback when no maps key is set).

Web-specific environment variables (set in the Vercel project settings):

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_ENV` | `qa` or `production` |
| `EXPO_PUBLIC_API_URL` | Backend base URL (optional — overrides the env default) |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | OAuth web client — also add the Vercel domain to its *Authorized JavaScript origins* |
| `EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY` | Maps JS API key, HTTP-referrer-restricted (the `app.json` key is Android-only) |

## About the Xcode Warnings

You may see warnings like:
```
Run script build phase 'Bundle React Native code and images' will be run during every build
because it does not specify any outputs.
```

These are **harmless cosmetic warnings** from Xcode 15+. They come from React Native's and Expo's build scripts that intentionally run every build. They don't affect functionality or performance and cannot be permanently silenced because Expo regenerates the Xcode project.

## Environment Configuration

| File | Purpose |
|---|---|
| `.env.local` | Local development (default) |
| `.env.qa` | QA/staging environment |
| `.env.production` | Production environment |

## Architecture

- **Expo SDK 54** + React Native 0.81
- **Expo Router** — file-based navigation
- **Zustand** — global state
- **TanStack Query** — server state / API caching
- **Lucide React Native** — SVG icons (replaces emoji)
- **MMKV** — fast key-value storage
- **Axios** — HTTP client with interceptors
