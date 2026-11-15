// 설정 스토어 — 공유 계약 orchestration_fretlab.md §3.6 (오케스트레이터 소유). localStorage 'fretlab:settings', 모듈 단일 인스턴스.
import { useStore } from './store'
import type { Settings } from './types'

export const DEFAULTS: Settings = {
  root: 9, scaleId: 'minor-pentatonic', tuningId: 'standard', accidental: 'sharp', labelMode: 'note',
  tone: 'clean', volume: .8, muted: false, system: 'full', position: 0, fretCount: 22, tilt: 0, lang: 'en',
  sustain: .5, mono: false,
}
const KEY = 'fretlab:settings'
const subs = new Set<() => void>()

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<Settings> & { view?: string }
      // 6차: view 옵션 삭제 — 평면이었으면 기울기 0
      if (p.view === 'flat') p.tilt = 0
      delete p.view
      // 4차: 옛 톤 이름(acoustic/rock/metal) → clean/distortion
      const old = p.tone as string | undefined
      if (old === 'acoustic') p.tone = 'clean'
      else if (old === 'rock' || old === 'metal') p.tone = 'distortion'
      return { ...DEFAULTS, ...p }
    }
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
/** 슬라이더 드래그 중: 저장·재렌더 없이 프렛보드 CSS 변수만 바꾼다(QA6 #2). 놓을 때 patchSettings({ tilt }) */
export function setTiltLive(v: number): void {
  document.querySelectorAll<HTMLElement>('.fretboard').forEach((el) => { el.style.setProperty('--tilt', String(v)); el.dataset.view = v > 0 ? 'player' : 'flat' })
}
/** 화면은 이 훅으로 읽고 patchSettings 로 쓴다 */
export function useSettings(): Settings {
  return useStore(subscribe, getSettings)
}
