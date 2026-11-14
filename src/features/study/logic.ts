// 학습 모드 상태 — 공유 계약 orchestration_fretlab.md §3.7 (에이전트 D 소유). 그립(E)도 useFill/useFollow 를 import 한다 — 이름·반환 형태 유지.
// 순수 리듀서(gradeFill·followOrder·followTap …)는 훅 밖에 두어 logic.check.ts 가 tsx 로 검사한다.
import { useEffect, useState } from 'preact/hooks'
import { posKey } from '../../core/types'
import type { FretPos, FretState, Mark } from '../../core/types'

export type FillResult = { hit: number; miss: number; missing: number }
export type Outcome = 'hit' | 'miss' | 'done'

/** marks 서명 — 바뀌면 훅 상태를 처음으로 되돌린다 */
const sigOf = (marks: Mark[]): string => marks.map(posKey).join(' ')

// ── 프렛 창(순수) ─────────────────────────────────────────────────────────────
/** 범위 [lo,hi] 를 max 칸 이하의 창으로 고르게 나눈다(모바일 390 폭에서 라벨이 읽히게). 9칸 이하면 그대로 1개 */
export function fretWindows(frets: [number, number], max = 9): [number, number][] {
  const [lo, hi] = frets, span = hi - lo + 1
  const n = Math.max(1, Math.ceil(span / max)), size = Math.ceil(span / n)
  const out: [number, number][] = []
  for (let k = 0; k < n; k++) out.push([lo + k * size, Math.min(hi, lo + (k + 1) * size - 1)])
  return out
}

// ── 채우기(순수) ──────────────────────────────────────────────────────────────
/** 채점: 찍은 자리 ∩ 정답 = hit, 찍었지만 정답 아님 = miss, 정답인데 안 찍음 = missing(dim) */
export function gradeFill(marks: Mark[], picked: Set<string>): { result: FillResult; states: Record<string, FretState> } {
  const answer = new Set(marks.map(posKey))
  const states: Record<string, FretState> = {}
  let hit = 0, miss = 0
  for (const k of picked) {
    if (answer.has(k)) { hit++; states[k] = 'hit' } else { miss++; states[k] = 'miss' }
  }
  for (const k of answer) if (!picked.has(k)) states[k] = 'dim'
  return { result: { hit, miss, missing: answer.size - hit }, states }
}
/** 채점 전 표시: 찍은 자리 = picked */
export function fillStates(picked: Set<string>): Record<string, FretState> {
  const out: Record<string, FretState> = {}
  for (const k of picked) out[k] = 'picked'
  return out
}

type FillSt = { sig: string; picked: Set<string>; result: FillResult | null; states: Record<string, FretState> }
const fillInit = (sig: string): FillSt => ({ sig, picked: new Set(), result: null, states: {} })

/** 채우기: 보이는 범위의 스케일 음 자리를 전부 찍은 뒤 채점. marks 가 바뀌면 자동 초기화 */
export function useFill(marks: Mark[]): {
  picked: Set<string>; toggle: (pos: FretPos) => void; graded: boolean; grade: () => FillResult; reset: () => void
  states: Record<string, FretState>; result: FillResult | null
} {
  const sig = sigOf(marks)
  const [st, setSt] = useState(() => fillInit(sig))
  const cur = st.sig === sig ? st : fillInit(sig)
  const toggle = (pos: FretPos) => setSt((p) => {
    const c = p.sig === sig ? p : fillInit(sig)
    if (c.result) return c // 채점 뒤에는 잠금
    const picked = new Set(c.picked), k = posKey(pos)
    if (!picked.delete(k)) picked.add(k)
    return { ...c, picked, states: fillStates(picked) }
  })
  const grade = (): FillResult => {
    const g = gradeFill(marks, cur.picked)
    setSt({ ...cur, result: g.result, states: g.states })
    return g.result
  }
  const reset = () => setSt(fillInit(sig))
  return { picked: cur.picked, toggle, graded: cur.result !== null, grade, reset, states: cur.states, result: cur.result }
}

// ── 따라치기(순수) ────────────────────────────────────────────────────────────
/** 순서: string ↑, fret ↑ (포지션 안 오름차순) */
export const followOrder = (marks: Mark[]): Mark[] => [...marks].sort((a, b) => a.string - b.string || a.fret - b.fret)
/** 한 번 탭: 맞으면 hit(마지막이면 done), 틀리면 miss. 이미 끝났으면 done */
export function followTap(order: Mark[], idx: number, pos: FretPos): Outcome {
  if (idx >= order.length) return 'done'
  const t = order[idx]
  if (t.string !== pos.string || t.fret !== pos.fret) return 'miss'
  return idx + 1 >= order.length ? 'done' : 'hit'
}
/** 표시: 지난 음 hit, 현재 음 target, 틀린 셀 miss */
export function followStates(order: Mark[], idx: number, missKey?: string | null): Record<string, FretState> {
  const out: Record<string, FretState> = {}
  order.forEach((m, i) => { if (i < idx) out[posKey(m)] = 'hit'; else if (i === idx) out[posKey(m)] = 'target' })
  if (missKey) out[missKey] = 'miss'
  return out
}

type FollowSt = { sig: string; idx: number; wrong: number; missKey: string | null }
const followInit = (sig: string): FollowSt => ({ sig, idx: 0, wrong: 0, missKey: null })
const MISS_MS = 300

/** 따라치기: 다음 음이 target, 그 자리를 눌러 나간다. 틀린 셀은 300ms miss. marks 가 바뀌면 자동 초기화 */
export function useFollow(marks: Mark[]): {
  idx: number; total: number; wrong: number; done: boolean; tap: (pos: FretPos) => Outcome; reset: () => void
  states: Record<string, FretState>
} {
  const sig = sigOf(marks)
  const [st, setSt] = useState(() => followInit(sig))
  const cur = st.sig === sig ? st : followInit(sig)
  const order = followOrder(marks)
  // 틀린 셀 표시는 300ms 뒤 지운다(같은 셀을 다시 틀려도 wrong 이 바뀌어 타이머가 다시 돈다)
  useEffect(() => {
    if (!cur.missKey) return
    const t = setTimeout(() => setSt((p) => (p.missKey ? { ...p, missKey: null } : p)), MISS_MS)
    return () => clearTimeout(t)
  }, [cur.missKey, cur.wrong])
  const tap = (pos: FretPos): Outcome => {
    const r = followTap(order, cur.idx, pos)
    if (r === 'miss') setSt({ ...cur, wrong: cur.wrong + 1, missKey: posKey(pos) })
    else if (cur.idx < order.length) setSt({ ...cur, idx: cur.idx + 1, missKey: null })
    return r
  }
  const reset = () => setSt(followInit(sig))
  return { idx: cur.idx, total: order.length, wrong: cur.wrong, done: cur.idx >= order.length, tap, reset, states: followStates(order, cur.idx, cur.missKey) }
}

// ── 스와이프(순수) ────────────────────────────────────────────────────────────
/** 한 손가락 이동(dx, dy) 을 가로 스와이프로 볼지: 가로 min 이상이고 세로보다 크면 방향(-1 = 왼쪽, 1 = 오른쪽), 아니면 0(탭·스크롤) */
export function swipeDir(dx: number, dy: number, min = 80): -1 | 0 | 1 {
  if (Math.abs(dx) < min || Math.abs(dy) > Math.abs(dx)) return 0
  return dx < 0 ? -1 : 1
}
