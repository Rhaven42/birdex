import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 800 },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Enregistrement manuel (src/main.tsx) : pas de service worker dans l'application Android
      injectRegister: false,
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'logo-birdex.webp', 'emblem.webp'],
      manifest: {
        name: 'Birdex – L’encyclopédie des oiseaux',
        short_name: 'Birdex',
        description: 'Découvrez, observez et collectionnez les oiseaux de France, région par région.',
        lang: 'fr',
        theme_color: '#0b2b55',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webp,woff2,json}'],
        runtimeCaching: [
          {
            // Photos Wikimedia : mises en cache pour une consultation hors connexion
            urlPattern: /^https:\/\/(upload|thumb)\.wikimedia\.org\//,
            handler: 'CacheFirst',
            options: { cacheName: 'photos-wikimedia', expiration: { maxEntries: 800 }, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
    }),
  ],
});
