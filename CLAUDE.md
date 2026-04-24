# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm start              # Start Metro dev server (JS-only, fast reload)
npm run ios            # Start Metro + open iOS simulator
npm run ios:build      # Full native rebuild (expo run:ios, ~2 min)
npm run android        # Start Metro + open Android emulator
npm run android:qa     # Start with QA environment
npm run android:prod   # Start with production environment

# Code quality
npm run lint           # ESLint (strict, max-warnings: 0)
npm run lint:fix       # Auto-fix lint issues
npm run format         # Prettier format
npm run format:check   # Check formatting without modifying
npm run type-check     # TypeScript compiler check (no emit)

# Testing
npx jest               # Run all tests
npx jest <path>        # Run a single test file
```

## Architecture

MedQ+ is a React Native + Expo medical appointment booking app (Expo SDK 54, RN 0.81.5) using file-based routing via **Expo Router**.

### Navigation Structure

`/app` is the Expo Router root:
- `(tabs)/` — Bottom tab navigator (Home, Search, Bookings, Profile)
- `(auth)/` — Login/signup screens
- `onboarding/` — Doctor and hospital registration flows (multi-step)
- `doctor/[id].tsx`, `hospital/[id].tsx` — Detail screens
- `booking/[id].tsx`, `token/[id].tsx` — Booking confirmation and live queue
- `nearme.tsx`, `location-picker.tsx` — Location-based screens

### State Management (Three-layer hybrid)

1. **AuthContext + Zustand (`store/authStore.ts`)** — Authentication state (`isLoggedIn`, `user`, `loading`). Access token kept in memory; refresh token in MMKV. Auto-refresh on 401 via Axios interceptor.
2. **TanStack Query v5 (`hooks/useApiHooks.ts`)** — All server state (doctors, hospitals, bookings, reviews, tokens). Never use `useEffect` for data fetching; use React Query hooks instead.
3. **LocationContext / LanguageContext** — Device location and i18n (English, Hindi, Kannada via `constants/Languages.ts`).

Additional Zustand stores: `doctorOnboardingStore`, `hospitalOnboardingStore` for multi-step registration flows.

### Service / API Layer

`services/api.ts` — Axios instance with:
- Base URL from `config/environment.ts` (local/QA/prod via `EXPO_PUBLIC_ENV`)
- Request interceptor: injects `Authorization: Bearer {token}`
- Response interceptor: unwraps `{ success, data, message }` envelope; handles 401 with silent token refresh + retry

Service files (`services/`): `authService`, `doctorService`, `hospitalService`, `bookingService`, `reviewService`, `tokenService`, `searchService`, `onboardingService`. All API calls must go through these — never call the Axios instance directly from components or hooks.

### Coding Conventions

- **Components**: functional only, one per file, PascalCase filename. Props must have a TypeScript `interface` or `type`. No `any` types.
- **Business logic**: always in a custom `useXxx` hook, never inline in a component.
- **Forms**: React Hook Form + Zod validation schemas.
- **Styling**: theme tokens from `/theme/` (colors, spacing, typography, shadows, radius). No hardcoded colors or magic numbers. Use `StyleSheet.create`.
- **Prop drilling**: max 2 levels — beyond that, use Context or Zustand.
- **No `console.log`** outside of dev-gated blocks.
- Component files should stay under ~200 lines.

### TypeScript Path Aliases (tsconfig.json)

`@/*`, `@app/*`, `@components/*`, `@services/*`, `@hooks/*`, `@utils/*`, `@constants/*`, `@theme/*`, `@context/*`, `@store/*`, `@config/*`

### Key Libraries

| Purpose | Library |
|---------|---------|
| Navigation | Expo Router (file-based) |
| Server state | TanStack Query v5 |
| Client state | Zustand v5 |
| Forms | React Hook Form + Zod |
| Storage | MMKV (falls back to AsyncStorage in Expo Go) |
| Icons | Lucide React Native |
| Virtualized lists | Shopify FlashList |
| Maps | React Native Maps |
| Location | Expo Location |

### Environment Configuration

Three environments configured in `config/environment.ts`, selected by `EXPO_PUBLIC_ENV`:
- `local` — `http://localhost:8080`
- `qa` — QA HTTPS URL
- `production` — prod HTTPS URL

Corresponding `.env.local`, `.env.qa`, `.env.production` files hold `EXPO_PUBLIC_ENV` and `EXPO_PUBLIC_API_URL`.
