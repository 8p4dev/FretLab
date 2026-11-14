// 학습 기록 — 공유 계약 orchestration_fretlab.md §3.7·A5 (에이전트 D 소유). localStorage 'fretlab:stats', 키별 누적(간격 반복 없음).
import type { PositionSystem, StudyMode } from '../../core/types'
import { fmt, tr } from '../../core/i18n'
import type { Lang } from '../../core/i18n'
import { S } from './strings'

export type Stat = { attempts: number; correct: number; total: number; /** 마지막 기록 시각(ms) */ last: number }
const KEY = 'fretlab:stats'
const EMPTY: Stat = { attempts: 0, correct: 0, total: 0, last: 0 }

/** A5: `${root}:${scaleId}:${tuningId}:${system}:${position}:${mode}` */
export const statsKey = (s: { root: number; scaleId: string; tuningId: string; system: PositionSystem; position: number }, mode: StudyMode): string =>
  `${s.root}:${s.scaleId}:${s.tuningId}:${s.system}:${s.position}:${mode}`

let mem: Record<string, Stat> | null = null
function load(): Record<string, Stat> {
  if (mem) return mem
  try { mem = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, Stat> } catch { mem = {} }
  return mem
}

export function recordResult(key: string, r: { correct: number; total: number }): Stat {
  const all = load(), p = all[key] ?? EMPTY
  const s: Stat = { attempts: p.attempts + 1, correct: p.correct + r.correct, total: p.total + r.total, last: Date.now() }
  all[key] = s
  try { localStorage.setItem(KEY, JSON.stringify(all)) } catch { /* 사생활 모드 등 — 메모리에만 */ }
  return s
}
export const statsFor = (key: string): Stat => load()[key] ?? EMPTY
/** 요약 한 줄: "Accuracy 80% (3 tries)" · 기록 없으면 ''. lang 생략 = 현재 설정 언어 */
export const statsLine = (s: Stat, lang?: Lang): string =>
  s.attempts ? fmt(tr(S.stats, lang), { p: Math.round((s.correct / Math.max(1, s.total)) * 100), n: s.attempts }) : ''
