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
