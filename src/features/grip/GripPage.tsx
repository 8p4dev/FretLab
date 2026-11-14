// 그립 모드 — 가로 전체화면, 폰을 넥처럼 잡고 누른다 (에이전트 E 소유). plan: docs/plans/agent_E_grip.md
// 흐름: [시작](사용자 제스처) → 전체화면·가로 잠금·Wake Lock(전부 실패 무시) → 4~5프렛 창을 가득 채운 프렛보드 + 위쪽 얇은 오버레이.
// ESC 로 전체화면이 풀리면 시작 화면으로 돌아간다. 세로로 들면 프렛보드 대신 "가로로 돌려 주세요".
// 2차(agent_E_grip_ux.md): 접힌 띠 핸들 · 띠/시작 화면에 OptionsButton · PC ←/→ · 창 이동 haptic · 완료 토스트 소요 시간.
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { href } from '../../router'
import { patchSettings, useSettings } from '../../core/settings'
import { midiAt, positions, scaleById, tuningById } from '../../core/music'
import { playNote } from '../../core/audio'
import { posKey, type FretPos } from '../../core/types'
import { Fretboard } from '../fretboard/Fretboard'
import { OptionsButton, ScaleBar } from '../picker/ScaleBar'
import { useFollow } from '../study/logic'
import { toast } from '../Toast'
import { haptic } from '../feel'
import { Icon } from '../../ui/Icon'
import { I } from '../../ui/icons'
import './grip.css'

const HIDE_MS = 3000
const SWIPE_PX = 80
const TAP_SLOP_PX = 20
// 폭 844 기준 프렛 1칸 ≥ 120px, 줄 간격 ≥ 56px 이 되는 칸 수
const colsFor = (width: number) => Math.min(5, Math.max(4, Math.floor(width / 150)))
// 그립 화면은 한 번에 하나뿐 — 해제 함수·오버레이 타이머는 모듈 변수로 둔다
let release: (() => void) | null = null
let hideTimer = 0
let followT0 = 0 // 따라치기 첫 탭 시각(완료 토스트 소요 시간)
/** 3초 뒤 띠를 접는다. 시트(옵션·스케일)가 열려 있으면 접지 않고 다시 3초 */
function armHide(hide: () => void) {
  clearTimeout(hideTimer)
  hideTimer = window.setTimeout(() => (document.querySelector('.sheet') ? armHide(hide) : hide()), HIDE_MS)
}

function useMedia(q: string): boolean {
  const [m, set] = useState(() => matchMedia(q).matches)
  useEffect(() => {
    const mq = matchMedia(q)
    const on = () => set(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [q])
  return m
}

/** 전체화면·가로 잠금·Wake Lock 을 켜고, 끝나면 전부 해제. 지원 안 하거나 거부되면 조용히 넘어간다 */
async function enter(): Promise<() => void> {
  let lock: { release(): Promise<void> } | null = null
  try { await document.documentElement.requestFullscreen() } catch { /* iOS 등 미지원 */ }
  // lib.dom 에 lock 타입이 없어 느슨하게 부른다
  const so = screen.orientation as unknown as { lock?: (o: string) => Promise<void>; unlock?: () => void } | undefined
  try { await so?.lock?.('landscape') } catch { /* PC·iOS: 잠금 불가 */ }
  try { lock = (await navigator.wakeLock?.request('screen')) ?? null } catch { /* 배터리 절약 모드 등 */ }
  return () => {
    try { so?.unlock?.() } catch { /* 무시 */ }
    lock?.release().catch(() => {})
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
  }
}

export default function GripPage() {
  const s = useSettings()
  const [active, setActive] = useState(false)
  const portrait = useMedia('(orientation: portrait)')

  // 전체화면 상태 동기화 + 언마운트(나가기) 때 해제
  useEffect(() => {
    if (!active) return
    const on = () => { if (!document.fullscreenElement) setActive(false) }
    document.addEventListener('fullscreenchange', on)
    return () => {
      document.removeEventListener('fullscreenchange', on)
      release?.()
      release = null
    }
  }, [active])

  const start = async () => {
    release = await enter()
    setActive(true)
  }

  if (!active) {
    return (
      <div className="grip grip-intro">
        <div className="grip-intro-row"><ScaleBar /><OptionsButton /></div>
        <button type="button" className="empty grip-start" onClick={start}>
          <Icon d={I.maximize} size={64} />
          <span>시작 — 가로 전체화면으로 연다</span>
        </button>
        <p className="grip-help muted">폰을 가로로 눕혀 넥처럼 잡고 프렛을 누르세요 · 띠는 3초 뒤 접힙니다 · ✕ 또는 ESC 로 나가기</p>
        <a href={href.study()}>나가기</a>
      </div>
    )
  }
  return <Grip portrait={portrait} s={s} />
}

type S = ReturnType<typeof useSettings>

function Grip({ portrait, s }: { portrait: boolean; s: S }) {
  const scale = scaleById(s.scaleId), tuning = tuningById(s.tuningId)
  const all = positions(s.root, scale, tuning, s.system, s.fretCount)
  const pos = all[s.position] ?? all[0]
  const [mode, setMode] = useState<'view' | 'follow'>('view')

  // 프렛 창: 폭에서 칸 수, 포지션의 첫 프렛에서 시작
  const [width, setWidth] = useState(innerWidth)
  useEffect(() => {
    const on = () => setWidth(innerWidth)
    addEventListener('resize', on)
    return () => removeEventListener('resize', on)
  }, [])
  const cols = colsFor(width)
  const maxLo = Math.max(0, s.fretCount - cols + 1)
  const first = pos.frets[0]
  const [rawLo, setLo] = useState(first)
  useEffect(() => setLo(first), [first, pos.index])
  const lo = Math.min(maxLo, Math.max(0, rawLo))
  const hi = Math.min(lo + cols - 1, s.fretCount)
  const shift = useCallback((d: number) => {
    const next = Math.min(maxLo, Math.max(0, lo + d))
    if (next === lo) return
    setLo(next)
    haptic('tap')
  }, [lo, maxLo])
  // PC: ←/→ 로 창 1칸. 시트·입력 안에서는 무시
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      if (e.target instanceof Element && e.target.closest('input, select, [role=dialog]')) return
      e.preventDefault()
      shift(e.key === 'ArrowLeft' ? -1 : 1)
    }
    document.addEventListener('keydown', on)
    return () => document.removeEventListener('keydown', on)
  }, [shift])

  // 창 안의 마크(따라치기 대상·소리 나는 자리)
  const visible = useMemo(() => pos.marks.filter((m) => m.fret >= lo && m.fret <= hi), [pos, lo, hi])
  const markAt = useMemo(() => new Map(visible.map((m) => [posKey(m), m])), [visible])
  const follow = useFollow(visible)

  // 스와이프 vs 탭: 포인터마다 시작점·최대 이동량. 20px 넘으면 그 포인터의 탭은 무시
  const ptrs = useRef(new Map<number, { x: number; moved: number }>())
  const onDown = (e: PointerEvent) => ptrs.current.set(e.pointerId, { x: e.clientX, moved: 0 })
  const onMove = (e: PointerEvent) => {
    const p = ptrs.current.get(e.pointerId)
    if (p) p.moved = Math.max(p.moved, Math.abs(e.clientX - p.x))
  }
  const onUp = (e: PointerEvent) => {
    const p = ptrs.current.get(e.pointerId)
    ptrs.current.delete(e.pointerId)
    if (!p || ptrs.current.size > 0) return // 한 손가락만 스와이프
    const dx = e.clientX - p.x
    if (Math.abs(dx) >= SWIPE_PX) shift(dx < 0 ? 1 : -1)
  }
  const dragging = () => [...ptrs.current.values()].some((p) => p.moved > TAP_SLOP_PX)

  const onTap = (p: FretPos) => {
    if (dragging()) return
    const m = markAt.get(posKey(p))
    if (mode === 'follow') {
      if (follow.idx === 0 && follow.wrong === 0) followT0 = performance.now() // 새 라운드(모드 전환·창 이동·완료 뒤)의 첫 탭
      const r = follow.tap(p)
      if (r === 'miss') { haptic('warn'); return }
      // 마지막 음은 맞은 것이므로 wrong 은 이 시점 값이 최종값
      if (r === 'done') {
        toast(`완료 — 틀림 ${follow.wrong} · ${((performance.now() - followT0) / 1000).toFixed(1)}초`)
        followT0 = 0
        haptic('success'); follow.reset()
      }
    } else if (!m) return
    playNote(midiAt(tuning, p))
    haptic('tap')
  }

  // 오버레이: 3초 동안 터치가 없으면 접힘, 위쪽 가장자리 탭으로 펼침. 시트(옵션·스케일)가 열려 있으면 접지 않고 재무장
  const [barShown, setBarShown] = useState(true)
  const hide = () => setBarShown(false)
  const wake = () => { setBarShown(true); armHide(hide) }
  useEffect(() => { armHide(() => setBarShown(false)); return () => clearTimeout(hideTimer) }, [])

  const exit = () => { location.hash = href.study() }

  return (
    <div className="grip" onPointerDownCapture={wake}>
      <div className="grip-bar-wrap" data-hidden={barShown ? undefined : ''}>
        <div className="grip-bar">
          <ScaleBar compact />
          <span className="grip-pos tnum">
            <button type="button" className="ghost" aria-label="이전 포지션" disabled={all.length < 2}
              onClick={() => patchSettings({ position: (s.position - 1 + all.length) % all.length })}><Icon d={I.chevronLeft} size={20} /></button>
            {s.position + 1}/{all.length}
            <button type="button" className="ghost" aria-label="다음 포지션" disabled={all.length < 2}
              onClick={() => patchSettings({ position: (s.position + 1) % all.length })}><Icon d={I.chevronRight} size={20} /></button>
          </span>
          <div className="seg" role="group" aria-label="모드">
            <button type="button" aria-pressed={mode === 'view'} onClick={() => setMode('view')}>보기</button>
            <button type="button" aria-pressed={mode === 'follow'} onClick={() => { setMode('follow'); follow.reset() }}>따라치기</button>
          </div>
          {mode === 'follow' && <span className="grip-progress tnum muted">{Math.min(follow.idx + 1, follow.total)}/{follow.total}</span>}
          <span className="grip-spacer" />
          <OptionsButton />
          <button type="button" className="ghost" aria-label={s.muted ? '소리 켜기' : '음소거'} aria-pressed={s.muted}
            onClick={() => patchSettings({ muted: !s.muted })}><Icon d={s.muted ? I.volumeX : I.volume2} size={20} /></button>
          <button type="button" className="ghost" aria-label="나가기" onClick={exit}><Icon d={I.x} size={20} /></button>
        </div>
      </div>
      {!barShown && <button type="button" className="grip-edge" aria-label="메뉴 펼치기" onClick={wake} />}

      {portrait ? (
        <div className="grip-rotate muted"><Icon d={I.smartphone} size={64} /><span>가로로 돌려 주세요</span></div>
      ) : (
        <div className="grip-board" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <button type="button" className="ghost grip-arrow" aria-label="낮은 프렛으로" disabled={lo <= 0} onClick={() => shift(-1)}><Icon d={I.chevronLeft} size={20} /></button>
          <Fretboard fill view="flat" tuning={tuning} frets={[lo, hi]} marks={pos.marks} labelMode={s.labelMode} accidental={s.accidental}
            states={mode === 'follow' ? follow.states : undefined} onTap={onTap} />
          <button type="button" className="ghost grip-arrow" aria-label="높은 프렛으로" disabled={lo >= maxLo} onClick={() => shift(1)}><Icon d={I.chevronRight} size={20} /></button>
        </div>
      )}
    </div>
  )
}
