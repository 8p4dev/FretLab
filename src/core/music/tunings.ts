// 튜닝 — 공유 계약 §3.3 (에이전트 A 소유). strings: 낮은 줄 → 높은 줄 MIDI. 괄호는 ASCII 만(ScaleBar 가 괄호부를 떼어 요약한다)
import type { Tuning } from '../types'

export const TUNINGS: Tuning[] = [
  { id: 'standard', name: 'Standard (E A D G B E)', nameKo: '스탠다드 (E A D G B E)', nameJa: 'レギュラー (E A D G B E)', strings: [40, 45, 50, 55, 59, 64] },
  { id: 'drop-d', name: 'Drop D (D A D G B E)', nameKo: '드롭 D (D A D G B E)', nameJa: 'ドロップD (D A D G B E)', strings: [38, 45, 50, 55, 59, 64] },
  { id: 'eb', name: 'Half-step down (Eb Ab Db Gb Bb Eb)', nameKo: '반음 다운 (Eb Ab Db Gb Bb Eb)', nameJa: '半音下げ (Eb Ab Db Gb Bb Eb)', strings: [39, 44, 49, 54, 58, 63] },
  { id: 'drop-c', name: 'Drop C (C G C F A D)', nameKo: '드롭 C (C G C F A D)', nameJa: 'ドロップC (C G C F A D)', strings: [36, 43, 48, 53, 57, 62] },
  { id: 'open-g', name: 'Open G (D G D G B D)', nameKo: '오픈 G (D G D G B D)', nameJa: 'オープンG (D G D G B D)', strings: [38, 43, 50, 55, 59, 62] },
  { id: 'open-d', name: 'Open D (D A D F# A D)', nameKo: '오픈 D (D A D F# A D)', nameJa: 'オープンD (D A D F# A D)', strings: [38, 45, 50, 54, 57, 62] },
  { id: 'dadgad', name: 'DADGAD (D A D G A D)', nameKo: 'DADGAD (D A D G A D)', nameJa: 'DADGAD (D A D G A D)', strings: [38, 45, 50, 55, 57, 62] },
  { id: 'standard-7', name: '7-string standard (B E A D G B E)', nameKo: '7현 스탠다드 (B E A D G B E)', nameJa: '7弦レギュラー (B E A D G B E)', strings: [35, 40, 45, 50, 55, 59, 64] },
]

export const tuningById = (id: string): Tuning => TUNINGS.find((t) => t.id === id) ?? TUNINGS[0]
