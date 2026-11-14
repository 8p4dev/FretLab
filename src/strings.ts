// 앱 셸 문구 (오케스트레이터 소유)
import type { Str } from './core/i18n'
export const S = {
  study: { en: 'Practice', ko: '연습', ja: '練習' },
  grip: { en: 'Grip', ko: '그립', ja: 'グリップ' },
  ok: { en: 'OK', ko: '확인', ja: 'OK' },
  theme: { en: 'Theme', ko: '테마', ja: 'テーマ' },
  light: { en: 'Light', ko: '라이트', ja: 'ライト' },
  dark: { en: 'Dark', ko: '다크', ja: 'ダーク' },
  gripTitle: { en: 'Grip — FretLab', ko: '그립 — FretLab', ja: 'グリップ — FretLab' },
} satisfies Record<string, Str>
