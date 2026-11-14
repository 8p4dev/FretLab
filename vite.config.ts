import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// 가벼움 예산(orchestration_fretlab.md §1 R8): 첫 로드 JS+CSS gzip ≤ 60 KB, 외부 요청 0, 오디오 에셋 0.
export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline',
      includeManifestIcons: false,
      manifest: {
        name: 'FretLab', short_name: 'FretLab', lang: 'ko', display: 'standalone', orientation: 'any',
        theme_color: '#f4f4f4', background_color: '#f4f4f4',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
