// 프렛보드 문구 (오케스트레이터가 생성, B 소유 폴더)
import type { Str } from '../../core/i18n'
export const S = {
  /** aria-label: {tuning} {lo}–{hi} */
  board: { en: 'Fretboard {tuning}, frets {lo}–{hi}', ko: '프렛보드 {tuning} {lo}–{hi}프렛', ja: 'フレットボード {tuning} {lo}–{hi}フレット' },
} satisfies Record<string, Str>
