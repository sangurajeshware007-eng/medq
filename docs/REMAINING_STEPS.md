# MedQ+ Web — Remaining Steps to Go Live

> Status as of 2026-07-22. All web **code** is done and pushed (commit `0328043`): the app builds for web, adapters/SEO/Vercel config are in place, and `npm run build:web` passes. What remains is account setup, deployment, verification, and a few product/engineering follow-ups.

Companion doc: [`docs/PRD.md`](./PRD.md) — full product requirements.

---

## A. Google Cloud Console (~10 min) — owner: Sangameshwar

Project: the one that owns OAuth client `1069164250595-…` (existing sign-in clients live there).

- [ ] **Enable APIs**: *APIs & Services → Library* → enable **Maps JavaScript API** and **Geocoding API** (the web map's search box needs both).
- [ ] **Create browser Maps key**: *Credentials → Create credentials → API key*, then restrict it:
  - Application restrictions → **Websites** → `https://*.vercel.app/*` (add the custom domain later)
  - API restrictions → only *Maps JavaScript API* + *Geocoding API*
  - This becomes `EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY`. (The key in `app.json` is Android-restricted — browsers can't use it.)
- [ ] **Authorize web origin for sign-in**: *Credentials → OAuth 2.0 Client IDs → Web client (`1069164250595-vhjj…`)* → *Authorized JavaScript origins* → add the Vercel production URL (from step B). No redirect URIs needed (GIS button flow).
  - Note: no wildcards allowed here → Google sign-in won't work on preview deployments (expected).

## B (option 1). Railway (~10 min) — owner: Sangameshwar

Same platform as the QA backend. The repo is Railway-ready: `railway.toml` (build + start) and `serve.json` (rewrites, cleanUrls, asset caching) are committed.

- [ ] railway.app → open the existing project (with `medq-be-qa`) → **+ New → GitHub Repo** → select **`medq`**.
- [ ] Service → **Variables** → add (build-time — redeploy after changing):
  `EXPO_PUBLIC_ENV=qa`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=1069164250595-vhjj6j2r3jmane3e1p7e7e8cs53pmuon.apps.googleusercontent.com`, `EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY=<from step A>`, `EXPO_PUBLIC_STORAGE_PUBLIC_URL=https://pub-3c7beaf4b934497e84e54682370a24bf.r2.dev`
- [ ] **Settings → Networking → Generate Domain** → note the `*.up.railway.app` URL.
- [ ] Add `EXPO_PUBLIC_WEB_URL=<that URL>` variable → **Redeploy**; add the URL to Google OAuth origins (step A) and the Maps key referrers (`https://*.up.railway.app/*`).
- [ ] Trade-off vs Vercel: no CDN edge / per-PR previews; a small always-on service bills against Railway usage. Fine at current scale; revisit if traffic grows.

## B (option 2). Vercel (~10 min) — owner: Sangameshwar

- [ ] Log in at vercel.com with GitHub (`sangameshwarrr`) → **Add New → Project** → import **`medq`**.
- [ ] Framework preset **Other** — `vercel.json` already defines build command, `dist/` output, and the dynamic-route rewrites.
- [ ] Set **Environment Variables** before deploying:

  | Variable | Value |
  |---|---|
  | `EXPO_PUBLIC_ENV` | `qa` first; `production` at launch |
  | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | `1069164250595-vhjj6j2r3jmane3e1p7e7e8cs53pmuon.apps.googleusercontent.com` |
  | `EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY` | key from step A |
  | `EXPO_PUBLIC_STORAGE_PUBLIC_URL` | `https://pub-3c7beaf4b934497e84e54682370a24bf.r2.dev` |

- [ ] **Deploy** → note the URL (e.g. `https://medq-xyz.vercel.app`).
- [ ] Close the loop: add `EXPO_PUBLIC_WEB_URL=<that URL>` (makes canonical tags + sitemap absolute), add the URL to OAuth origins (A) → **Redeploy**.

## C. Post-deploy verification (~15 min)

- [ ] Open the URL → login with Google works end-to-end (token persists across a page reload).
- [ ] Deep links cold-load: paste `/hospitals` and a real `/doctor/<id>` into the address bar (tests rewrites + auth bootstrap).
- [ ] `/<url>/sitemap.xml` lists absolute URLs; `/robots.txt` has an absolute `Sitemap:` line.
- [ ] Onboarding map screen loads Google Maps (needs the step-A key); without a key it falls back to manual coordinates — that's the fallback working, not a bug.
- [ ] Browser matrix smoke (login → search → doctor → book → bookings): Chrome, Safari, Firefox, Edge + iOS Safari, Android Chrome. Safari extras: private-mode (in-memory session fallback), geolocation prompt.
- [ ] Lighthouse (mobile preset) on `/hospitals` and a doctor page — target LCP < 2.5 s, no mixed-content warnings.
- [ ] Native regression: run iOS/Android once — web changes must be inert there (`npx jest`, `npm run type-check` already green).

## D. Google Search Console (~10 min, after deploy)

- [ ] Add property (*URL prefix* = the Vercel URL) at search.google.com/search-console.
- [ ] Verify via **HTML tag** → give the `google-site-verification` content value to Claude → it goes into `app/+html.tsx` → redeploy. (Custom domain later → DNS verification instead.)
- [ ] **Sitemaps** → submit `sitemap.xml`.
- [ ] *URL Inspection → Test Live URL* on one doctor page — confirms Google's renderer sees the client-fetched content and JSON-LD.

## E. Product decisions (need a call from Sangameshwar)

- [ ] **Anonymous browsing** — `(tabs)/_layout.tsx` currently redirects logged-out users to `/login`, so **home and search are neither browsable nor indexable**. Public today: `/hospitals`, `/nearme`, `/doctor/:id`, `/hospital/:id`. Decision: open browsing and require login only at booking? (Affects native too — same code. ~half-day change + QA.)
- [ ] **Analytics** — Vercel Analytics (one click, free tier) vs GA4 (web-gated)? Nothing is wired yet.
- [ ] **Custom domain** — e.g. `medreachplus.com` → Vercel *Settings → Domains* + registrar DNS; then update `EXPO_PUBLIC_WEB_URL`, OAuth origins, Maps key referrers, and add a Search Console domain property.

## F. Engineering backlog (post-launch, rough order)

| Item | Why | Size |
|---|---|---|
| Security hardening: CSP headers in `vercel.json`, refresh-token rotation, origin-scoped CORS (backend) | localStorage refresh token is XSS-readable; CORS is `*` | S–M |
| Doctor detail two-column layout at `lg` | Detail pages still use the 480px column on desktop | M |
| Voice search on web (Web Speech API — Chrome/Edge) | `useVoiceSearch` no-ops on web today; library advertises web support | S |
| Push notifications ("token is near") | Biggest engagement lever for the core promise | L |
| WebSocket live queue (`/topic/tokens/{doctorId}`) | Replace polling before visit-day traffic grows | M |
| Sitemap freshness: Vercel deploy-hook cron (daily) | New doctors appear in the sitemap without a manual redeploy | S |
| `generateStaticParams` prerender of top doctors, or bot-UA middleware for social share previews | Only if crawl coverage/social previews disappoint | M |
| Clean up `types.d.ts` ambient overrides (expo-router/expo-location/react-native-maps stubs) | They hide real typings and cause most of the 27 baseline `tsc` errors | S |
| Lint debt: repo has ~2,285 warnings with `--max-warnings 0` (lint always fails) | CI signal is meaningless until reduced or re-baselined | M |

---

**TL;DR:** A → B → C → D is one focused afternoon and the web app is live. E-1 (anonymous browsing) is the one decision that changes acquisition materially. F is sequenced backlog.
