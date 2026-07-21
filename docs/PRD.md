# MedQ+ — Product Requirements Document

> Generated with the `prd-generator` template, reverse-engineered from the live codebase (mobile app, web app, backend, admin panel). Last updated: 2026-07-22.

---

## 1. Executive Summary

MedQ+ is a doctor-appointment booking platform for tier-2/tier-3 India, launching in the Bidar region of Karnataka. Patients find nearby doctors and hospitals, book appointment slots, and — the product's signature feature — track their **live queue token** so they arrive at the clinic when their turn is near instead of waiting hours in a crowded lobby.

The platform serves five audiences from one system: patients (book & track), doctors (manage schedule and queue), hospital managers (run their facility), reception staff (advance the queue), and platform admins (approve onboarding, manage content). It ships as native iOS/Android apps and, as of July 2026, a browser web app — all three from a single React Native + Expo codebase.

**MVP goal:** prove the book-then-track loop in one region — a patient can discover a doctor in their language (English, Hindi, or Kannada), book a slot, pay at the clinic, and watch their token advance in near-real-time.

## 2. Mission

**Give every patient their time back.** Healthcare queues in small-city India are opaque; MedQ+ makes them visible and predictable.

Core principles:
1. **Local-first** — seeded and tuned for one region (Bidar) before expanding; disease search works in local languages and handles typos/transliteration.
2. **Low-friction** — Google one-tap sign-in, no payment gateway at MVP (pay at clinic), no app install required (web).
3. **One codebase, every screen** — iOS, Android, and web from the same React Native code; features never diverge by platform.
4. **Trust through transparency** — live token position, verified doctor profiles (admin-approved onboarding), reviews anchored to completed bookings only.

## 3. Target Users

| Persona | Who they are | Comfort | Key needs |
|---|---|---|---|
| **Patient** | Residents of Bidar & surrounding towns; often first-language Hindi/Kannada | Low–medium; WhatsApp-level | Find the right doctor for a symptom, know the fee, avoid waiting-room hours |
| **Doctor** | Independent practitioners & hospital-affiliated specialists | Medium | Fill slots, manage time-off, see today's queue, build reputation via reviews |
| **Hospital manager** | Owner/administrator of a clinic or hospital | Medium | Facility profile with photos/departments, roster of doctors, booking volume |
| **Reception staff** | Front-desk operators | Low | Dead-simple "next token" queue console |
| **Platform admin** | MedQ+ operations team | High | Approve doctor/hospital onboarding, manage users, city imagery, appointments |

Pain points addressed: unpredictable waits (token tracking), language barriers (en/hi/kn i18n + transliterated fuzzy search), discovery ("which doctor treats this?" — 50+ disease→specialization mappings), trust (admin-vetted profiles).

## 4. MVP Scope

### In scope ✅
**Core functionality**
- ✅ Google Sign-In (primary), phone OTP login (built, behind a flag)
- ✅ Doctor discovery: nearby (GPS/Haversine), by specialization, by disease, fuzzy/typo-tolerant search, voice search (native)
- ✅ Hospital discovery: nearby list, departments, 24×7 flag, photo gallery, call/WhatsApp/directions
- ✅ Booking: slot selection, confirmation, cancel, reschedule; booking reference & shareable summary
- ✅ Live token queue: current token, your position, auto-advance scheduler (3-min cadence), REST polling
- ✅ Reviews: rating + text, allowed only after a completed booking, 7-day edit window
- ✅ Doctor onboarding (4 steps) & hospital onboarding (3 steps + map location picker) → admin approval → approval-pending state
- ✅ Dashboards: doctor (today's schedule/queue), hospital manager, reception queue console, staff
- ✅ i18n: English, Hindi, Kannada (Noto fonts, localized specialization/disease names)

**Technical**
- ✅ Single codebase → iOS + Android (Expo) + Web (react-native-web, static export on Vercel)
- ✅ JWT auth (15-min access / 30-day refresh, silent refresh), role-based access (5 roles)
- ✅ Media on Cloudflare R2 via presigned uploads
- ✅ SEO for public pages: meta/OG tags, schema.org Physician/MedicalClinic JSON-LD, sitemap generated from live data, robots.txt

### Out of scope ❌ (deferred)
- ❌ Online payments / payment gateway (pay at clinic for MVP)
- ❌ Push notifications ("your token is 3 away")
- ❌ WebSocket live queue (REST polling today; `/ws` STOMP planned)
- ❌ Teleconsultation / video visits
- ❌ Hospital ratings display (hidden until review volume justifies it)
- ❌ Anonymous browsing of home/search (login-gated today — open product decision)
- ❌ Multi-region expansion, insurance, pharmacy, lab bookings

## 5. User Stories

1. **As a patient**, I want to search "bukhar" (fever) in Hindi and see relevant doctors, so that the language I think in doesn't block care. *(Fuzzy + transliterated disease search → General Physician list)*
2. **As a patient**, I want to book tomorrow's 10:30 slot with Dr. Sharma and get a token number, so that my visit is confirmed before I travel. *(Slot picker → booking ref + token)*
3. **As a patient**, I want to watch the live token counter from home, so that I leave only when my turn is ~3 tokens away. *(Token screen, 15s polling)*
4. **As a doctor**, I want to mark next week Thursday as time-off, so that no one books a slot I can't honor. *(Doctor time-off management)*
5. **As a receptionist**, I want one button that advances the queue, so that the lobby display and every patient's phone stay in sync. *(Reception queue console; auto-advance failsafe every 3 min)*
6. **As a hospital manager**, I want to submit my facility with photos, departments, and a map pin, so that patients can find and trust us. *(3-step onboarding + map picker → admin approval)*
7. **As an admin**, I want to review and approve doctor registrations, so that only verified practitioners appear in search. *(Admin panel approval flow)*
8. **As a patient on a shared/borrowed phone**, I want to use MedQ+ in the browser without installing anything, so that a 60 MB download isn't the barrier to care. *(Web app, same features)*

## 6. Core Architecture & Patterns

```
   iOS / Android (Expo)        Web (react-native-web, Vercel)     Admin (Next.js, Vercel)
          └──────────────┬──────────────┘                              │
                         │  HTTPS + JWT (Authorization: Bearer)        │
                         ▼                                             ▼
              Spring Boot 3.4.3 API (Kotlin)  ── :8080, /api/v1/**, ApiResponse envelope
                         │
      ┌──────────────────┼──────────────────────┬────────────────────┐
      ▼                  ▼                      ▼                    ▼
 PostgreSQL 16      Redis 7 (sessions,    Cloudflare R2        2Factor.in
 (persistent data)  token-queue state)    (media, presigned)   (OTP delivery)
```

- **Frontend:** Expo Router file-based navigation (43 routes); three-layer state — AuthContext+Zustand (session), TanStack Query (all server data), Contexts (location, language). All API calls go through `services/*` → one Axios instance with token injection + silent 401 refresh.
- **Backend:** feature modules (`auth/ doctor/ hospital/ booking/ token/ review/ search/ translation/`), each `controller → service → repository → entity/dto`. Manual SQL schema (Flyway present but disabled).
- **Platform split (web):** `.web.tsx` file variants resolved by Metro (storage→localStorage, Google Identity Services sign-in, Google Maps JS, Nominatim geocoding); route files stay platform-neutral thin re-exports.
- **Queue model:** Redis-backed token state per doctor per day; `TokenAdvanceScheduler` fires every 3 minutes as a failsafe; clients poll REST (WebSocket topic `/topic/tokens/{doctorId}` reserved for later).

## 7. Features

| Feature | What it does | Status |
|---|---|---|
| Disease-aware search | Fuse.js fuzzy match + 50+ disease→specialization mappings + Indic transliteration | ✅ Shipped |
| Voice search | Speech-to-text search (native; Web Speech API candidate on web) | ✅ Native / ⏳ web |
| Nearby discovery | Haversine radius query for doctors & hospitals, city hero imagery by coverage area | ✅ Shipped |
| Slot booking | Available-slots per doctor/hospital, book/cancel/reschedule, booking ref | ✅ Shipped |
| Live token | Token number, current serving, position, ETA behavior; reception advance console | ✅ Shipped (polling) |
| Reviews | Post-visit rating/text, edit ≤ 7 days, aggregate on doctor profile | ✅ Shipped |
| Onboarding & approval | Doctor (4-step) / hospital (3-step + map), documents to R2, admin approve/reject | ✅ Shipped |
| Multi-language | en/hi/kn UI + localized medical terms | ✅ Shipped |
| Web app + SEO | Full app in browser; public pages indexable (JSON-LD, sitemap) | ✅ Shipped 2026-07 |

## 8. Technology Stack

| Layer | Technology |
|---|---|
| Mobile + Web | React Native 0.81.5, Expo SDK 54, React 19.1, Expo Router 6, react-native-web 0.21 |
| State/data | TanStack Query v5, Zustand v5, React Hook Form + Zod, Axios |
| Storage (client) | MMKV (native) / localStorage (web) behind one adapter |
| Maps/geo | react-native-maps (native), @vis.gl/react-google-maps + Nominatim (web), expo-location |
| Auth (client) | @react-native-google-signin (native), Google Identity Services (web) |
| Backend | Spring Boot 3.4.3, Kotlin, JUnit 5 + MockK |
| Data | PostgreSQL 16, Redis 7, Cloudflare R2 (S3-compatible, presigned) |
| Admin | Next.js 16, React 19, Tailwind CSS v4, TanStack Query |
| Hosting | Railway (QA API), api.medreachplus.com (prod API), Vercel (web + admin), EAS (app builds) |

## 9. Security & Configuration

- **Auth:** stateless JWT — access token in memory (15 min), refresh token in MMKV/localStorage (30 days), silent refresh with request queueing on 401. Google ID-token audience validated server-side; passwords BCrypt(12); role-gated route prefixes (`/api/v1/admin/**` → ADMIN, etc.).
- **Transport:** HTTPS on QA (Railway) and prod; CORS currently `allowedOrigins: *` with header-based auth (no cookies).
- **Config:** three env sets (`local`/`qa`/`production`) via `EXPO_PUBLIC_*` vars; web additionally `EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY`, `EXPO_PUBLIC_WEB_URL`. Backend env documented in `medq-be/README.md`.
- **Known hardening backlog:** refresh token in localStorage is XSS-readable (same tradeoff as admin panel) → CSP headers, refresh rotation, consider httpOnly cookies once CORS is origin-scoped; tighten CORS from `*`; HTTPS-only everywhere.

## 10. API Specification (shape)

All endpoints under `/api/v1`, responses wrapped in `{ success, data, message }`.

| Area | Representative endpoints |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/social` (Google ID token), `POST /auth/refresh-token`, OTP endpoints |
| Doctors | `GET /doctors?lat&lng&radius_km`, `GET /doctors/{id}`, `GET /doctors/{id}/available-slots`, `GET /doctors/{id}/reviews` |
| Hospitals | `GET /hospitals`, `GET /hospitals/{id}` (nearby via Haversine params) |
| Bookings | create / cancel / reschedule; `GET /bookings/{id}` |
| Tokens | `GET /tokens/...` live queue state; reception advance |
| Uploads | presigned R2 URL issuance, `GET /upload/signed-url` |
| Public | doctors/hospitals/search/translations GETs are `permitAll` (browsable & crawlable) |

## 11. Success Criteria

MVP succeeds when a Bidar patient completes the full loop unaided:
- ✅ Discover a doctor by disease in their language (≤ 3 taps/keystrokes to results)
- ✅ Book a slot and receive a token
- ✅ Track the live token remotely; arrive ≤ 30 min before their turn
- ✅ Leave a review after the visit

Quality indicators: booking-to-visit completion rate, token screen poll engagement on visit day, review submission rate, onboarding approval turnaround < 48 h, web LCP < 2.5 s on public pages, zero cross-platform feature drift.

## 12. Implementation Phases

| Phase | Goal | Status |
|---|---|---|
| **1. Core booking (native)** | Auth, discovery, booking, token queue, reviews on iOS/Android | ✅ Done |
| **2. Operations** | Onboarding flows, admin panel, reception/staff consoles, R2 media | ✅ Done |
| **3. Web from same codebase** | react-native-web bootstrap, platform adapters, responsive shell, Vercel | ✅ Done (2026-07) |
| **4. SEO & go-live** | Meta/JSON-LD/sitemap, Vercel env + Google Cloud keys, Search Console | 🔄 Code done; deploy pending |
| **5. Engagement (next)** | Push notifications, WebSocket live queue, anonymous browsing decision, analytics | ⏳ Planned |

## 13. Future Considerations

Payments (UPI-first), teleconsultation, "token is near" push alerts, WhatsApp notifications, multi-city expansion with per-city seeding, pharmacy/lab cross-sell, doctor calendar sync, hospital analytics dashboards, EAS Update OTA channel strategy.

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Queue accuracy drifts from reality (reception forgets to advance) | Patients lose trust in the core promise | 3-min auto-advance failsafe already shipped; add reception reminders + patient-visible "last updated" timestamp |
| Login-gated home/search suppresses acquisition & SEO | Organic growth stalls | Product decision queued: anonymous browse, login at booking; public detail pages already indexable |
| Two-sided cold start (no doctors → no patients) | Empty marketplace | Region-first seeding (13 doctors, 9 hospitals live in Bidar); ops-led onboarding with admin approval |
| localStorage refresh token XSS exposure (web) | Account takeover if XSS lands | CSP headers, token rotation, cookie migration on the hardening backlog (§9) |
| Polling load as usage grows | API cost/latency | WebSocket `/topic/tokens/{doctorId}` topic already reserved; polling interval tunable server-side |

## 15. Appendix

- Repos: `medq` (app), `medq-be` (API), `medq-admin` (admin) — github.com/sangameshwarrr
- Dev bypass: phone `+919999999999`, OTP `123456` · Swagger: `:8080/swagger-ui.html`
- Web architecture decisions & gotchas: `medq/CLAUDE.md` §Web Support, `medq/README.md` §Web
- Seed data: 9 hospitals, 13 doctors, 50+ disease mappings (Bidar/Karnataka)
