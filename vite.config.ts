/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // The phone install: a manifest, and a service worker that keeps the app and its audio
    // for offline use. New versions wait for the learner to tap Update (src/routes/Update.tsx).
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Kinyarwanda',
        short_name: 'Kinyarwanda',
        description: 'Learn Kinyarwanda one card at a time.',
        lang: 'en',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#f3f5ff',
        background_color: '#f3f5ff',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // The app carries the course for offline use; with 1,000 words its script is over
        // workbox's 2 MiB default, and a script left out would break the app offline.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: '/index.html',
        // Reminders arrive as web push; public/push.js shows them and opens the app.
        importScripts: ['/push.js'],
        runtimeCaching: [
          {
            // Course and story audio, kept once played or downloaded on Profile.
            urlPattern: ({ url }) => url.pathname.includes('/storage/v1/object/public/audio/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio',
              rangeRequests: true,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 20000, maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
    // React loads its production build (which has no act) if the shell has NODE_ENV=production.
    env: { NODE_ENV: 'test' },
  },
});
