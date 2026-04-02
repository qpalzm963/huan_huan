import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/huan_huan/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      base: '/huan_huan/',
      scope: '/huan_huan/',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'screenshot-home.png'],
      manifest: {
        name: '嬛嬛日記',
        short_name: '嬛嬛日記',
        description: '嬛嬛的生活記錄',
        lang: 'zh-TW',
        theme_color: '#4AAFDC',
        background_color: '#F5F0EB',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/huan_huan/',
        start_url: '/huan_huan/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        screenshots: [
          {
            src: 'screenshot-home.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: '嬛嬛日記首頁',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'firestore-cache' },
          },
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'photos-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
})
