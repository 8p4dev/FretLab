// 자가 검사 — `npx tsx src/features/picker/search.check.ts`. 한글·영문·별칭·대소문자·공백.
import type { Scale } from '../../core/types.ts'
import { matchScale } from './search.ts'

const pent: Scale = { id: 'minor-pentatonic', name: 'Minor Pentatonic', nameKo: '마이너 펜타토닉', intervals: [0, 3, 5, 7, 10], group: 'pentatonic', aliases: ['Blues Scale (no b5)', '펜타'] }
const major: Scale = { id: 'major', name: 'Major (Ionian)', nameKo: '메이저 (이오니안)', intervals: [0, 2, 4, 5, 7, 9, 11], group: 'major' }

const cases: [Scale, string, boolean][] = [
  [pent, '', true],
  [pent, '펜타토닉', true],
  [pent, '마이너펜타', true], // 공백 무시
  [pent, 'PENTATONIC', true], // 대소문자 무시
  [pent, 'minor pent', true],
  [pent, 'blues', true], // 별칭(영문)
  [pent, '펜타', true], // 별칭(한글)
  [pent, 'minor-pent', true], // id
  [pent, '이오니안', false],
  [major, '이오니안', true],
  [major, 'ionian', true],
  [major, 'Major (', true],
  [major, 'minor', false],
]
for (const [s, q, want] of cases) {
  const got = matchScale(s, q)
  if (got !== want) throw new Error(`matchScale(${s.id}, ${JSON.stringify(q)}) = ${got}, want ${want}`)
}
console.log('search.check ok')
