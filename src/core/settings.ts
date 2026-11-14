// 설정 스토어 — 공유 계약 orchestration_fretlab.md §3.6 (오케스트레이터 소유). localStorage 'fretlab:settings', 모듈 단일 인스턴스.
import { useStore } from './store'
import type { Settings } from './types'

export const DEFAULTS: Settings = {
  root: 9, scaleId: 'minor-pentatonic', tuningId: 'standard', accidental: 'sharp', labelMode: 'note',
  tone: 'rock', volume: .8, muted: false, system: 'full', position: 0, fretCount: 15, view: 'flat', tilt: .6,
}
const KEY = 'fretlab:settings'
const subs = new Set<() => void>()

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) }
  } catch { /* 사생활 모드 등 */ }
  return DEFAULTS
}
let state: Settings = load()

export const getSettings = (): Settings => state
export function patchSettings(p: Partial<Settings>): void {
  // 시스템이 바뀌면 포지션은 처음으로
  if (p.system !== undefined && p.system !== state.system && p.position === undefined) p = { ...p, position: 0 }
  state = { ...state, ...p }
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* 무시 */ }
  subs.forEach((f) => f())
}
const subscribe = (f: () => void) => (subs.add(f), () => void subs.delete(f))
/** 화면은 이 훅으로 읽고 patchSettings 로 쓴다 */
export function useSettings(): Settings {
  return useStore(subscribe, getSettings)
}
