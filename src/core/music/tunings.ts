// 튜닝 — 공유 계약 §3.3 (에이전트 A 소유). strings: 낮은 줄 → 높은 줄 MIDI
import type { Tuning } from '../types'

export const TUNINGS: Tuning[] = [
  { id: 'standard', name: '스탠다드 (E A D G B E)', strings: [40, 45, 50, 55, 59, 64] },
  { id: 'drop-d', name: 'Drop D (D A D G B E)', strings: [38, 45, 50, 55, 59, 64] },
  { id: 'eb', name: '반음 다운 (Eb Ab Db Gb Bb Eb)', strings: [39, 44, 49, 54, 58, 63] },
  { id: 'drop-c', name: 'Drop C (C G C F A D)', strings: [36, 43, 48, 53, 57, 62] },
  { id: 'open-g', name: 'Open G (D G D G B D)', strings: [38, 43, 50, 55, 59, 62] },
  { id: 'open-d', name: 'Open D (D A D F# A D)', strings: [38, 45, 50, 54, 57, 62] },
  { id: 'dadgad', name: 'DADGAD (D A D G A D)', strings: [38, 45, 50, 55, 57, 62] },
  { id: 'standard-7', name: '7현 스탠다드 (B E A D G B E)', strings: [35, 40, 45, 50, 55, 59, 64] },
]

export const tuningById = (id: string): Tuning => TUNINGS.find((t) => t.id === id) ?? TUNINGS[0]
