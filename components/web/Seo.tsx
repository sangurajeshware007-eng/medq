/**
 * Seo — per-route head tags for the web build
 *
 * Wraps expo-router/head: title, description, canonical + Open Graph tags,
 * and optional schema.org JSON-LD. Static values are baked into the
 * prerendered HTML at export time; data-driven values (doctor name etc.)
 * update client-side, which Googlebot's renderer picks up.
 *
 * Safe to render on native (Expo Head no-ops beyond activity metadata).
 * Canonical/OG URLs are emitted only when EXPO_PUBLIC_WEB_URL is set.
 */
import Head from 'expo-router/head';
import React from 'react';
import { Platform } from 'react-native';

import { ENV } from '../../config/environment';

interface SeoProps {
  title: string;
  description?: string;
  /** Route path for the canonical URL, e.g. `/doctor/12` */
  path?: string;
  /** schema.org structured data, serialized into a JSON-LD script tag */
  jsonLd?: Record<string, unknown>;
}

export default function Seo({ title, description, path, jsonLd }: SeoProps) {
  const fullTitle = `${title} | MedQ+`;
  const canonical = ENV.webUrl && path ? `${ENV.webUrl}${path}` : undefined;

  return (
    <Head>
      <title>{fullTitle}</title>
      {description ? <meta name="description" content={description} /> : null}
      <meta property="og:title" content={fullTitle} />
      {description ? <meta property="og:description" content={description} /> : null}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="MedQ+" />
      {canonical ? <link rel="canonical" href={canonical} /> : null}
      {canonical ? <meta property="og:url" content={canonical} /> : null}
      {jsonLd && Platform.OS === 'web' ? (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      ) : null}
    </Head>
  );
}
