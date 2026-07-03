#!/usr/bin/env node
// Rebuilds the MedQ+ globe icon matching the existing brand design,
// swapping ONLY the stylized "continents" inside the globe for a real-world map
// with India highlighted in saffron.
//
// World map base: Wikimedia BlankMap-World.svg (Public Domain).
// Geometry below was measured pixel-for-pixel against the existing app-icon.png:
//   - background gradient: top-left #20CFEA → bottom-right #0D6072
//   - globe centered at (493, 487), radius ~207
//   - medical cross centered at (615, 402), hollow stroke
//   - Q-tail extends from below the globe to (~751, 697)
//
// Usage:
//   node scripts/build-app-icon.mjs --preview   # write preview/*.png only (safe)
//   node scripts/build-app-icon.mjs             # overwrite production icons

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(PROJECT_ROOT, 'assets/logo/new');
const SOURCE_DIR = path.join(ASSETS_DIR, '_source');
const PREVIEW_DIR = path.join(SOURCE_DIR, 'preview');
const BLANKMAP_PATH = path.join(SOURCE_DIR, 'blankmap-world-pd.svg');
const MASTER_SVG_PATH = path.join(SOURCE_DIR, 'app-icon-master.svg');

const preview = process.argv.includes('--preview');
fs.mkdirSync(PREVIEW_DIR, { recursive: true });

const worldRaw = fs.readFileSync(BLANKMAP_PATH, 'utf-8');
const worldInner = worldRaw
  .replace(/<\?xml[\s\S]*?\?>\s*/, '')
  .replace(/<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '');

// Geometry derived from existing app-icon.png (1024x1024).
const GLOBE_CX = 493;
const GLOBE_CY = 487;
const GLOBE_R = 207;

// BlankMap-World source viewBox: 2754x1398. India centered at ~(1900, 540).
// We center the map on India inside the globe by scaling source width 1700 → globe diameter 414.
const MAP_SCALE = 0.243;
const INDIA_SRC_X = 1900;
const INDIA_SRC_Y = 540;
const MAP_TX = GLOBE_CX - INDIA_SRC_X * MAP_SCALE;
const MAP_TY = GLOBE_CY - INDIA_SRC_Y * MAP_SCALE;

// Cross: two overlapping rounded rects filled white.
// Original measured extent ~229 wide × 230 tall, sitting upper-right of globe.
const CROSS_CX = 660, CROSS_CY = 360;
const CROSS_ARM_LEN = 230;
const CROSS_ARM_THICK = 70;
const CROSS_R = 18;

// Q-tail: thick white stroke curve sweeping under the globe to lower-right.
// Original endpoint measured at ~(751, 697).
const Q_TAIL_D = 'M 360 660 Q 540 730 745 690';
const Q_TAIL_STROKE = 40;

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <title>MedQ+</title>
  <desc>MedQ+ app icon. World map: Wikimedia BlankMap-World.svg (Public Domain).</desc>

  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1024" y2="1024" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#20CFEA"/>
      <stop offset="35%" stop-color="#14B0CE"/>
      <stop offset="75%" stop-color="#0A7892"/>
      <stop offset="100%" stop-color="#0D6072"/>
    </linearGradient>
    <clipPath id="globeClip">
      <circle cx="${GLOBE_CX}" cy="${GLOBE_CY}" r="${GLOBE_R}"/>
    </clipPath>
    <style>
      .landxx { fill: #ffffff !important; stroke: none !important; fill-rule: evenodd; }
      .coastxx { stroke: none !important; }
      .antxx { fill: #ffffff !important; opacity: 0.9; }
      .oceanxx { fill: none !important; stroke: none !important; }
      .circlexx, .subxx, .noxx { opacity: 0 !important; }
      #in, #in path, #in .landxx, g#in path { fill: #FF9933 !important; stroke: none !important; }
    </style>
  </defs>

  <!-- Background gradient -->
  <rect width="1024" height="1024" fill="url(#bg)"/>

  <!-- Real world map clipped to globe circle, centered on India -->
  <g clip-path="url(#globeClip)">
    <g transform="translate(${MAP_TX.toFixed(3)} ${MAP_TY.toFixed(3)}) scale(${MAP_SCALE})">
${worldInner}
    </g>
  </g>

  <!-- Meridian/latitude curves overlaying the globe (preserves the original Q-globe feel) -->
  <g fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" opacity="0.95">
    <path d="M ${GLOBE_CX - GLOBE_R + 4} ${GLOBE_CY} Q ${GLOBE_CX} ${GLOBE_CY + 60} ${GLOBE_CX + GLOBE_R - 4} ${GLOBE_CY}"/>
    <path d="M ${GLOBE_CX - GLOBE_R + 35} ${GLOBE_CY - 95} Q ${GLOBE_CX} ${GLOBE_CY - 125} ${GLOBE_CX + GLOBE_R - 35} ${GLOBE_CY - 95}"/>
    <path d="M ${GLOBE_CX - GLOBE_R + 35} ${GLOBE_CY + 95} Q ${GLOBE_CX} ${GLOBE_CY + 125} ${GLOBE_CX + GLOBE_R - 35} ${GLOBE_CY + 95}"/>
    <path d="M ${GLOBE_CX} ${GLOBE_CY - GLOBE_R + 4} Q ${GLOBE_CX + 45} ${GLOBE_CY} ${GLOBE_CX} ${GLOBE_CY + GLOBE_R - 4}"/>
    <path d="M ${GLOBE_CX} ${GLOBE_CY - GLOBE_R + 4} Q ${GLOBE_CX - 45} ${GLOBE_CY} ${GLOBE_CX} ${GLOBE_CY + GLOBE_R - 4}"/>
  </g>

  <!-- Subtle globe rim -->
  <circle cx="${GLOBE_CX}" cy="${GLOBE_CY}" r="${GLOBE_R}" fill="none" stroke="rgba(255,255,255,0.30)" stroke-width="3"/>

  <!-- Medical cross (two filled white bars) -->
  <g fill="#FFFFFF">
    <rect x="${CROSS_CX - CROSS_ARM_THICK/2}" y="${CROSS_CY - CROSS_ARM_LEN/2}" width="${CROSS_ARM_THICK}" height="${CROSS_ARM_LEN}" rx="${CROSS_R}"/>
    <rect x="${CROSS_CX - CROSS_ARM_LEN/2}" y="${CROSS_CY - CROSS_ARM_THICK/2}" width="${CROSS_ARM_LEN}" height="${CROSS_ARM_THICK}" rx="${CROSS_R}"/>
  </g>

  <!-- Q-tail (thick white stroke curve) -->
  <path d="${Q_TAIL_D}" fill="none" stroke="#FFFFFF" stroke-width="${Q_TAIL_STROKE}" stroke-linecap="round"/>
</svg>
`;

fs.writeFileSync(MASTER_SVG_PATH, iconSvg);
console.log(`✓ master SVG: ${path.relative(PROJECT_ROOT, MASTER_SVG_PATH)} (${(iconSvg.length / 1024).toFixed(0)} KB)`);

if (!spawnSync('rsvg-convert', ['--version'], { stdio: 'ignore' }).status === 0) {
  console.error('rsvg-convert not found. Run: brew install librsvg');
  process.exit(1);
}

const targets = preview
  ? [{ name: 'preview-app-icon.png', size: 1024, dir: PREVIEW_DIR }]
  : [
      { name: 'app-icon.png', size: 1024, dir: ASSETS_DIR },
      { name: 'adoptive-icon.png', size: 1024, dir: ASSETS_DIR },
      { name: 'logo-icon.png', size: 1024, dir: ASSETS_DIR },
      { name: 'splash-screen.png', size: 2048, dir: ASSETS_DIR },
    ];

for (const t of targets) {
  const out = path.join(t.dir, t.name);
  const res = spawnSync('rsvg-convert', ['-w', String(t.size), '-h', String(t.size), '-f', 'png', MASTER_SVG_PATH, '-o', out], { stdio: 'inherit' });
  if (res.status !== 0) process.exit(res.status ?? 1);
  console.log(`✓ ${path.relative(PROJECT_ROOT, out)} (${t.size}×${t.size})`);
}
