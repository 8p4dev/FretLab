import { defineConfig } from '@playwright/test'

// E2E 는 빌드 결과(dist)를 vite preview 로 띄워 붙는다. 서버 없음 (orchestration_fretlab.md §5)
const PORT = 4183
export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: `http://127.0.0.1:${PORT}`, channel: 'msedge', reducedMotion: 'reduce' },
  webServer: { command: `npm run build && npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`, url: `http://127.0.0.1:${PORT}/`, reuseExistingServer: false, timeout: 180_000 },
})
