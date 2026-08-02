/**
 * Minimal static server for the Expo web export (Railway medq-web service).
 * Mirrors vercel.json: clean URLs, dynamic-route rewrites to [id].html
 * artifacts, immutable caching for hashed bundles, +not-found fallback.
 * Zero dependencies on purpose — nothing to break, logs on boot.
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const ROOT = process.env.WEB_ROOT || '/srv';
const PORT = Number(process.env.PORT || 8080);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

// Dynamic routes → exported [id].html files (checked only when no static
// page exists for the path, so /doctor/queue.html wins over /doctor/[id]).
const REWRITES = [
  [/^\/doctor\/patient\/[^/]+\/?$/, '/doctor/patient/[id].html'],
  [/^\/doctor\/[^/]+\/reviews\/?$/, '/doctor/[id]/reviews.html'],
  [/^\/doctor\/[^/]+\/?$/, '/doctor/[id].html'],
  [/^\/hospital\/[^/]+\/?$/, '/hospital/[id].html'],
  [/^\/booking\/reschedule\/[^/]+\/?$/, '/booking/reschedule/[id].html'],
  [/^\/booking\/view\/[^/]+\/?$/, '/booking/view/[id].html'],
  [/^\/booking\/[^/]+\/?$/, '/booking/[id].html'],
  [/^\/token\/[^/]+\/?$/, '/token/[id].html'],
];

function fileFor(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
  const candidates = [clean, `${clean}.html`, join(clean, 'index.html')];
  for (const rel of candidates) {
    const abs = join(ROOT, rel);
    if (abs.startsWith(ROOT) && existsSync(abs) && statSync(abs).isFile())
      return { file: abs, status: 200 };
  }
  for (const [pattern, target] of REWRITES) {
    if (pattern.test(clean)) {
      const abs = join(ROOT, target);
      if (existsSync(abs)) return { file: abs, status: 200 };
    }
  }
  const notFound = join(ROOT, '+not-found.html');
  return existsSync(notFound) ? { file: notFound, status: 404 } : null;
}

const server = createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];
  const hit = fileFor(urlPath === '/' ? '/index.html' : urlPath);
  if (!hit) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }
  const headers = { 'Content-Type': MIME[extname(hit.file)] || 'application/octet-stream' };
  if (urlPath.startsWith('/_expo/static/')) {
    headers['Cache-Control'] = 'public, max-age=31536000, immutable';
  }
  res.writeHead(hit.status, headers);
  createReadStream(hit.file).pipe(res);
});

// '::' = dual-stack — Railway's healthcheck/private network is IPv6-only,
// so binding 0.0.0.0 makes the app unreachable ("service unavailable").
server.listen(PORT, '::', () => {
  console.log(`[serve-web] listening on [::]:${PORT}, root=${ROOT}`);
});
