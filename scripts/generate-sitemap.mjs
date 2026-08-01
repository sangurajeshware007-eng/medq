/**
 * Sitemap generator — runs after `expo export --platform web` (see build:web).
 *
 * Fetches doctor and hospital IDs from the backend and writes dist/sitemap.xml
 * with the static public pages plus every /doctor/:id and /hospital/:id.
 * Also rewrites the relative `Sitemap:` line in dist/robots.txt to an
 * absolute URL (required by the robots spec).
 *
 * Env:
 *   EXPO_PUBLIC_WEB_URL  — public site origin (required for a useful sitemap)
 *   EXPO_PUBLIC_API_URL  — backend base URL (falls back to the QA backend)
 *
 * Fails soft: a missing backend or env var logs a warning and writes the
 * static-pages-only sitemap, so the web build never breaks on SEO extras.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const DIST = resolve(process.cwd(), 'dist');
const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || '').replace(/\/$/, '');
const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://medq-be-qa.up.railway.app').replace(/\/$/, '');

// Browsing is anonymous since 2026-08 — home and search are indexable.
const STATIC_PATHS = ['/', '/search', '/hospitals', '/nearme'];

async function fetchIds(path) {
  try {
    const res = await fetch(`${API_URL}${path}`, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    // ApiResponse envelope: { success, data, message } — data is the list.
    const list = Array.isArray(body) ? body : (body.data ?? []);
    return list.map((item) => item.id).filter((id) => id != null);
  } catch (err) {
    console.warn(`[sitemap] could not fetch ${path}: ${err.message}`);
    return [];
  }
}

function urlTag(loc) {
  return `  <url><loc>${loc}</loc></url>`;
}

async function main() {
  if (!existsSync(DIST)) {
    console.warn('[sitemap] dist/ not found — run expo export first. Skipping.');
    return;
  }
  if (!WEB_URL) {
    console.warn('[sitemap] EXPO_PUBLIC_WEB_URL not set — writing sitemap with relative origin placeholder skipped; static paths only.');
  }

  const [doctorIds, hospitalIds] = await Promise.all([
    fetchIds('/api/v1/doctors?size=500'),
    fetchIds('/api/v1/hospitals'),
  ]);

  const base = WEB_URL || '';
  const urls = [
    ...STATIC_PATHS.map((p) => urlTag(`${base}${p}`)),
    ...doctorIds.map((id) => urlTag(`${base}/doctor/${id}`)),
    ...hospitalIds.map((id) => urlTag(`${base}/hospital/${id}`)),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  writeFileSync(resolve(DIST, 'sitemap.xml'), xml);
  console.log(`[sitemap] wrote dist/sitemap.xml — ${STATIC_PATHS.length} static, ${doctorIds.length} doctors, ${hospitalIds.length} hospitals`);

  // Make the robots.txt Sitemap line absolute when we know the origin.
  const robotsPath = resolve(DIST, 'robots.txt');
  if (WEB_URL && existsSync(robotsPath)) {
    const robots = readFileSync(robotsPath, 'utf8').replace(
      /^Sitemap: .*$/m,
      `Sitemap: ${WEB_URL}/sitemap.xml`,
    );
    writeFileSync(robotsPath, robots);
    console.log('[sitemap] robots.txt Sitemap line made absolute');
  }
}

main();
