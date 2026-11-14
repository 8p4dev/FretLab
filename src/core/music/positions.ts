// 포지션 계산 — 공유 계약 §3.3 (에이전트 A 소유). 박스 데이터 없이 알고리즘으로 낸다(설명: docs/plans/agent_A_music.md).
import type { FretPos, Mark, Pc, Position, PositionSystem, Scale, Tuning } from '../types'
import { posKey } from '../types'
import { marksFor, midiToPc } from './fretboard'

const PERIOD = 12
const CAGED_N = 5
const WINDOW = 5 // 창 폭(프렛 수)

const inScale = (root: Pc, scale: Scale, midi: number): boolean => scale.intervals.includes((midiToPc(midi) - root + 12) % 12)

/** string 0 에서 루트가 처음 나오는 프렛 0..11 */
const rootFret0 = (root: Pc, tuning: Tuning): number => (root - midiToPc(tuning.strings[0]) + 12) % 12

/** string 0 의 [from, from+12) 안 스케일 프렛(오름차순) */
function startFrets(root: Pc, scale: Scale, tuning: Tuning, from: number): number[] {
  const out: number[] = []
  for (let f = from; f < from + PERIOD; f++) if (inScale(root, scale, tuning.strings[0] + f)) out.push(f)
  return out
}

/**
 * 피치 연속 박스: string 0 의 startFret 에서 시작해 줄마다 n 음씩, 줄이 바뀌어도 바로 윗 음으로 이어진다(펜타 박스·3NPS 패턴).
 * 줄 간격이 크면 프렛이 음수가 될 수 있다 — 패턴은 12프렛 주기이므로 place() 가 옥타브를 맞춘다.
 */
function contiguousBox(root: Pc, scale: Scale, tuning: Tuning, startFret: number, n: number): FretPos[] {
  const out: FretPos[] = []
  let prev = tuning.strings[0] + startFret - 1
  tuning.strings.forEach((open, string) => {
    let midi = prev + 1
    for (let k = 0; k < n; midi++) {
      if (!inScale(root, scale, midi)) continue
      out.push({ string, fret: midi - open })
      prev = midi
      k++
    }
  })
  return out
}

/** 창 박스: [lo, lo+WINDOW-1] 안 모든 스케일 음 */
function windowBox(root: Pc, scale: Scale, tuning: Tuning, lo: number): FretPos[] {
  const out: FretPos[] = []
  tuning.strings.forEach((open, string) => {
    for (let fret = lo; fret < lo + WINDOW; fret++) if (inScale(root, scale, open + fret)) out.push({ string, fret })
  })
  return out
}

const residue = (m: FretPos): string => `${m.string}:${((m.fret % PERIOD) + PERIOD) % PERIOD}`

/** 박스를 off 만큼 옮겨 넥 위에 놓는다. 범위 밖 음은 버린다 */
function place(box: FretPos[], off: number, byKey: Map<string, Mark>, fretCount: number, system: PositionSystem): Position {
  const lo = Math.min(...box.map((p) => p.fret)) + off
  const hi = Math.max(...box.map((p) => p.fret)) + off
  const marks = box.map((p) => byKey.get(posKey({ string: p.string, fret: p.fret + off }))).filter((m): m is Mark => !!m)
  return { system, index: 0, frets: [Math.max(lo, 0), Math.min(hi, fretCount)], marks }
}

/** 옥타브 후보: 0 이상이 되는 가장 낮은 옥타브에서 fretCount 를 넘으면 12 씩 내린다. 그래도 안 들어가면 한 옥타브 더 내린 것도 후보 */
function octaves(box: FretPos[], fretCount: number): number[] {
  const lo = Math.min(...box.map((p) => p.fret))
  const hi = Math.max(...box.map((p) => p.fret))
  let off = lo < 0 ? PERIOD * Math.ceil(-lo / PERIOD) : 0
  while (hi + off > fretCount && lo + off - PERIOD >= 0) off -= PERIOD
  return hi + off > fretCount ? [off, off - PERIOD] : [off]
}

/** 포지션 목록. full = 1개(전체). caged = 5개, 3nps = 7개(7음 스케일만, 그 외는 caged 와 같은 박스를 system='3nps' 로 돌려준다) */
export function positions(root: Pc, scale: Scale, tuning: Tuning, system: PositionSystem, fretCount: number): Position[] {
  const all = marksFor(root, scale, tuning, fretCount)
  if (system === 'full') return [{ system, index: 0, frets: [0, fretCount], marks: all }]
  const n = scale.intervals.length
  const r = rootFret0(root, tuning)
  let boxes: FretPos[][]
  if (system === '3nps' && n === 7) boxes = startFrets(root, scale, tuning, r).map((f) => contiguousBox(root, scale, tuning, f, 3))
  else if (n === 5) boxes = startFrets(root, scale, tuning, r).map((f) => contiguousBox(root, scale, tuning, f, 2))
  else boxes = Array.from({ length: CAGED_N }, (_, k) => windowBox(root, scale, tuning, r + Math.round((PERIOD * k) / CAGED_N)))
  const byKey = new Map(all.map((m) => [posKey(m), m]))
  const cands = boxes.map((b) => octaves(b, fretCount).map((off) => place(b, off, byKey, fretCount, system)))
  // 안 들어가는 박스(후보 2개)는 조합을 전부 보고 커버리지(줄 × 12프렛 주기) → 인접 겹침 → 음 수 순으로 좋은 옥타브를 고른다
  const byLo = (ps: Position[]) => [...ps].sort((x, y) => x.frets[0] - y.frets[0] || x.frets[1] - y.frets[1])
  const score = (ps: Position[]): number => {
    const got = new Set(ps.flatMap((p) => p.marks.map(residue)))
    const uncovered = all.filter((m) => !got.has(residue(m))).length
    const sorted = byLo(ps)
    const gaps = sorted.filter((p, i) => i > 0 && sorted[i - 1].frets[1] < p.frets[0]).length
    return uncovered * 1e6 + gaps * 1e3 - ps.reduce((n, p) => n + p.marks.length, 0)
  }
  const open = cands.map((_, i) => i).filter((i) => cands[i].length > 1)
  let best: Position[] = cands.map((c) => c[0])
  for (let mask = 1; mask < 1 << open.length; mask++) {
    const ps = cands.map((c, i) => c[open.indexOf(i) >= 0 && (mask >> open.indexOf(i)) & 1 ? 1 : 0])
    if (score(ps) < score(best)) best = ps
  }
  return byLo(best).map((p, index) => ({ ...p, index }))
}
