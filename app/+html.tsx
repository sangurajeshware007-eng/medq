import { ScrollViewStyleReset } from 'expo-router/html';
import React from 'react';
import type { PropsWithChildren } from 'react';

/**
 * Static-output HTML shell for every web page (Expo Router `+html.tsx`).
 * Rendered only at build time — no hooks or client-side logic here.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#0891B2" />
        <meta
          name="description"
          content="MedQ+ — book doctor appointments, track your live queue token, and find hospitals near you."
        />
        <title>MedQ+</title>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Disable body scrolling — matches native ScrollView behavior */}
        <ScrollViewStyleReset />

        {/* Match the app background so there is no white flash before hydration */}
        <style dangerouslySetInnerHTML={{ __html: 'html, body { background: #F4F8FB; }' }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
