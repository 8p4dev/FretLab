// 자가 검사 — `npm run check`. 실패하면 throw.
import { posKey } from '../types.ts'
import type { Position, PositionSystem } from '../types.ts'
import { SCALE_GROUPS, SCALES, TUNINGS, labelOf, marksFor, positions, scaleById, tuningById } from './index.ts'

const assert = (ok: unknown, msg: string): void => {
  if (!ok) throw new Error(msg)
}

// 1. 스케일 카탈로그
assert(SCALES.length >= 55, `scales ${SCALES.length} < 55`)
assert(new Set(SCALES.map((s) => s.id)).size === SCALES.length, 'duplicate scale id')
for (const s of SCALES) {
  const iv = s.intervals
  assert(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id), `${s.id}: id not kebab`)
  assert(s.name && s.nameKo, `${s.id}: name`)
  assert(iv.length >= 5 && iv.length <= 12, `${s.id}: ${iv.length} notes`)
  assert(iv[0] === 0, `${s.id}: must start at 0`)
  for (let i = 1; i < iv.length; i++) assert(iv[i] > iv[i - 1] && iv[i] < 12, `${s.id}: intervals not ascending/<12 at ${i}`)
}
assert(scaleById('nope') === SCALES[0] && SCALES[0].id === 'major', 'scaleById fallback')

// 2. 튜닝
assert(TUNINGS.length >= 8, `tunings ${TUNINGS.length} < 8`)
assert(new Set(TUNINGS.map((t) => t.id)).size === TUNINGS.length, 'duplicate tuning id')
for (const t of TUNINGS) assert(t.strings.length >= 6 && t.strings.every((m, i) => i === 0 || m > t.strings[i - 1]), `${t.id}: strings`)
assert(tuningById('standard-7').strings.length === 7, '7-string tuning')
assert(tuningById('nope').id === 'standard', 'tuningById fallback')

// 2b. 이름 i18n (6차): name/nameKo/nameJa 전부 비어 있지 않고, 같은 목록 안에서 언어별 중복 없음. name 은 영문(한글·가나·한자 없음)
type Named = { id: string; name: string; nameKo?: string; nameJa?: string }
const NAME_KEYS = ['name', 'nameKo', 'nameJa'] as const
function checkNames(kind: string, xs: Named[]): number {
  for (const k of NAME_KEYS) {
    for (const x of xs) assert(x[k]?.trim() && x[k] === x[k]?.trim(), `${kind} ${x.id}: ${k} empty or untrimmed`)
    const dup = xs.find((x, i) => xs.findIndex((y) => y[k] === x[k]) !== i)
    assert(!dup, `${kind}: duplicate ${k} "${dup?.[k]}"`)
  }
  for (const x of xs) assert(!/[぀-ヿ㐀-鿿가-힣]/.test(x.name), `${kind} ${x.id}: name must be English`)
  return xs.filter((x) => x.nameJa).length
}
const jaScales = checkNames('scale', SCALES)
const jaGroups = checkNames('group', SCALE_GROUPS)
const jaTunings = checkNames('tuning', TUNINGS)
assert(SCALE_GROUPS.length === 11 && SCALES.every((s) => SCALE_GROUPS.some((g) => g.id === s.group)), 'scale groups')
// 튜닝 이름의 괄호부는 ASCII 괄호(ScaleBar 요약이 /\s*\(.*\)\s*$/ 로 뗀다)
for (const t of TUNINGS) for (const k of NAME_KEYS) assert(/^\S.* \([A-G][A-G#b ]+\)$/.test(t[k] ?? ''), `tuning ${t.id}: ${k} format`)

// 3. marksFor 샘플: A 마이너 펜타토닉, 스탠다드, 12프렛 → 루트 7개 (E5 A0 A12 D7 G2 B10 e5)
const std = tuningById('standard')
const amp = marksFor(9, scaleById('minor-pentatonic'), std, 12)
assert(amp.filter((m) => m.root).length === 7, 'A minor penta root count')
assert(amp.every((m, i) => i === 0 || m.string > amp[i - 1].string || m.fret > amp[i - 1].fret), 'marks sort')
const c = marksFor(0, scaleById('major'), std, 12).find((m) => m.string === 1 && m.fret === 5)! // A 줄 5프렛 = D
assert(labelOf(c, 'note', 'sharp') === 'D' && labelOf(c, 'degree', 'sharp') === '2' && labelOf(c, 'interval', 'flat') === '2' && labelOf(c, 'none', 'flat') === '', 'labelOf')
const bb = marksFor(10, scaleById('minor-pentatonic'), std, 12).find((m) => m.string === 0 && m.fret === 9)! // E 줄 9프렛 = C# = Bb 의 b3
assert(labelOf(bb, 'note', 'flat') === 'Db' && labelOf(bb, 'note', 'sharp') === 'C#' && labelOf(bb, 'interval', 'flat') === 'b3', 'labelOf accidental')

// 4. 포지션
const maxInWindow = (iv: number[], w: number): number => Math.max(...iv.map((a) => iv.filter((b) => (b - a + 12) % 12 < w).length))
function checkPositions(root: number, scaleId: string, tuningId: string, system: PositionSystem, fretCount: number): Position[] {
  const scale = scaleById(scaleId)
  const tuning = tuningById(tuningId)
  const all = marksFor(root, scale, tuning, fretCount)
  const keys = new Set(all.map(posKey))
  const ps = positions(root, scale, tuning, system, fretCount)
  const tag = `${scaleId}/${tuningId}/r${root}/${system}/${fretCount}`
  const n = scale.intervals.length
  const maxGap = Math.max(...scale.intervals.map((v, i, a) => (i + 1 < a.length ? a[i + 1] : 12) - v))
  const expect = system === 'full' ? 1 : system === '3nps' && n === 7 ? 7 : 5
  assert(ps.length === expect, `${tag}: ${ps.length} positions, expected ${expect}`)
  ps.forEach((p, i) => {
    assert(p.index === i && p.system === system, `${tag}: index/system`)
    const [lo, hi] = p.frets
    assert(lo >= 0 && lo <= hi && hi <= fretCount, `${tag}#${i}: range ${lo}-${hi}`)
    assert(p.marks.length > 0, `${tag}#${i}: empty`)
    assert(p.marks.every((m) => keys.has(posKey(m)) && m.fret >= lo && m.fret <= hi), `${tag}#${i}: mark outside`)
    assert(new Set(p.marks.map(posKey)).size === p.marks.length, `${tag}#${i}: duplicate mark`)
    if (i > 0) assert(ps[i - 1].frets[1] >= lo, `${tag}#${i}: no overlap with previous (${ps[i - 1].frets} / ${p.frets})`)
    const perString = tuning.strings.map((_, s) => p.marks.filter((m) => m.string === s).length)
    const cap = system === '3nps' && n === 7 ? 3 : n === 5 ? 2 : Math.max(3, maxInWindow(scale.intervals, 5))
    if (system !== 'full') assert(Math.max(...perString) <= cap, `${tag}#${i}: ${Math.max(...perString)} notes on a string > ${cap}`)
    // 폭 4~5프렛: 스탠다드계 튜닝, 잘리지 않은 박스, 통상 음정(최대 간격 ≤ 3반음)의 CAGED 만
    const width = hi - lo + 1
    const stdLike = tuningId === 'standard' || tuningId === 'standard-7' || tuningId === 'eb'
    if (stdLike && lo > 0 && hi < fretCount && !(system === '3nps' && n === 7)) assert(width >= 4 && (maxGap > 3 || width <= 5), `${tag}#${i}: width ${width}`)
  })
  if (system === 'full') assert(ps[0].marks.length === all.length && ps[0].frets[0] === 0 && ps[0].frets[1] === fretCount, `${tag}: full`)
  // 커버리지: 0..fretCount 의 모든 스케일 음이 (같은 줄, 12프렛 주기) 어느 한 포지션에 속한다
  const covered = new Set(ps.flatMap((p) => p.marks.map((m) => `${m.string}:${m.fret % 12}`)))
  const miss = all.filter((m) => !covered.has(`${m.string}:${m.fret % 12}`))
  assert(miss.length === 0, `${tag}: uncovered ${miss.map(posKey).join(' ')}`)
  return ps
}
const systems: PositionSystem[] = ['full', 'caged', '3nps']
for (const s of SCALES) for (const t of TUNINGS) for (const sys of systems) for (const fc of [12, 15, 22, 24]) for (let root = 0; root < 12; root++) checkPositions(root, s.id, t.id, sys, fc)

// 교과서 펜타토닉 박스: A 마이너 펜타토닉 스탠다드 24프렛 → 5-8, 7-10, 9-13, 12-15, 14-17
const boxes = positions(9, scaleById('minor-pentatonic'), std, 'caged', 24).map((p) => p.frets.join('-'))
assert(boxes.join(' ') === '5-8 7-10 9-13 12-15 14-17', `penta boxes ${boxes.join(' ')}`)
// 3NPS: 7음 스케일만 7개, 줄마다 정확히 3음; 비7음은 caged 와 같은 박스
const nps = positions(0, scaleById('major'), std, '3nps', 24)
assert(nps.every((p) => std.strings.every((_, s) => p.marks.filter((m) => m.string === s).length === 3)), '3nps: 3 notes per string')
const fb = positions(9, scaleById('minor-pentatonic'), std, '3nps', 24)
const cg = positions(9, scaleById('minor-pentatonic'), std, 'caged', 24)
assert(fb.length === 5 && fb.every((p, i) => p.system === '3nps' && p.frets.join() === cg[i].frets.join() && p.marks.map(posKey).join() === cg[i].marks.map(posKey).join()), '3nps fallback = caged')
// 7현: 줄 7개 전부에 마크, 포지션 수 유지
const seven = positions(9, scaleById('minor-pentatonic'), tuningById('standard-7'), 'caged', 24)
assert(seven.length === 5 && seven.every((p) => new Set(p.marks.map((m) => m.string)).size === 7), '7-string caged')
assert(positions(9, scaleById('major'), tuningById('standard-7'), '3nps', 24).length === 7, '7-string 3nps')

console.log(`music.check ok — scales ${SCALES.length}, tunings ${TUNINGS.length}, nameJa ${jaScales}/${SCALES.length} · groups ${jaGroups}/${SCALE_GROUPS.length} · tunings ${jaTunings}/${TUNINGS.length}, positions ${SCALES.length * TUNINGS.length * systems.length * 4 * 12} combos`)
