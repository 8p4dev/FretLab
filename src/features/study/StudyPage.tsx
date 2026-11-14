// 연습 화면 — 보기/채우기/따라치기 (에이전트 D 소유). 레이아웃: DrillDown TreeHeader(ScaleBar + .seg 모드 탭 + 도구) + flash 패턴(모바일 하단 고정 .study-bar, 요약 .study-summary)
import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import type { FretPos, FretState, Mark, StudyMode } from '../../core/types'
import { posKey } from '../../core/types'
import { patchSettings, useSettings } from '../../core/settings'
import { labelOf, midiAt, positions, scaleById, tuningById } from '../../core/music'
import { playNote, playSequence } from '../../core/audio'
import { href } from '../../router'
import { haptic } from '../feel'
import { Fretboard } from '../fretboard/Fretboard'
import { ScaleBar, OptionsButton } from '../picker/ScaleBar'
import { I } from '../../ui/icons'
import { Icon } from '../../ui/Icon'
import { followOrder, fretWindows, swipeDir, useFill, useFollow } from './logic'
import { recordResult, statsFor, statsKey, statsLine } from './stats'
import './study.css'

const MODES: { m: StudyMode; label: string }[] = [{ m: 'view', label: '보기' }, { m: 'fill', label: '채우기' }, { m: 'follow', label: '따라치기' }]
const GAP_MS = 220
const NARROW = '(max-width: 760px)'
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** ≤760 폭이면 true(프렛 창 분할 기준, study.css 의 모바일 분기와 같은 값) */
function useNarrow(): boolean {
  const [v, set] = useState(() => matchMedia(NARROW).matches)
  useEffect(() => {
    const mq = matchMedia(NARROW), on = () => set(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return v
}

export default function StudyPage({ mode }: { mode: StudyMode }) {
  const s = useSettings()
  const scale = scaleById(s.scaleId), tuning = tuningById(s.tuningId)
  const all = useMemo(() => positions(s.root, scale, tuning, s.system, s.fretCount), [s.root, scale, tuning, s.system, s.fretCount])
  const pi = Math.min(s.position, all.length - 1)
  const pos = all[pi]
  const marks = pos.marks
  const go = (d: number) => patchSettings({ position: (pi + d + all.length) % all.length })

  const fill = useFill(marks)
  const follow = useFollow(marks)
  const [shake, setShake] = useState(false)
  // 따라치기 스톱워치: 첫 탭(맞든 틀리든)에 시작, 끝나면 elapsed. 렌더 밖(effect)에서만 시계를 읽는다
  const started = follow.idx > 0 || follow.wrong > 0
  const [t0, setT0] = useState(0)
  const [elapsed, setElapsed] = useState<number | null>(null)
  useEffect(() => { setT0(started ? Date.now() : 0) }, [started])
  useEffect(() => { setElapsed(follow.done && follow.total ? Date.now() - t0 : null) }, [follow.done, follow.total, t0])
  const key = statsKey({ ...s, position: pi }, mode)
  const stat = statsFor(key) // 기록은 채점/완료 setState 뒤 다시 읽힌다

  // 들어보기: playSequence 는 진행 콜백이 없어 같은 간격으로 target 을 옮긴다
  const [playIdx, setPlayIdx] = useState(-1)
  const stopRef = useRef<() => void>(() => {})
  const stopListen = () => { stopRef.current(); stopRef.current = () => {}; setPlayIdx(-1) }
  const listen = () => {
    if (playIdx >= 0) return stopListen()
    const sorted = [...marks].sort((a, b) => a.midi - b.midi)
    if (!sorted.length) return
    const stop = playSequence(sorted.map((m) => m.midi), GAP_MS)
    let i = 0
    setPlayIdx(0)
    const t = setInterval(() => { if (++i >= sorted.length) stopListen(); else setPlayIdx(i) }, GAP_MS)
    stopRef.current = () => { stop(); clearInterval(t) }
  }
  useEffect(() => () => stopRef.current(), [])
  useEffect(() => { stopListen() }, [mode, pos])

  const grade = () => {
    const r = fill.grade()
    haptic('success')
    recordResult(key, { correct: r.hit, total: marks.length })
  }
  const onTap = (p: FretPos) => {
    if (mode === 'view') {
      if (marks.some((m) => m.string === p.string && m.fret === p.fret)) { playNote(midiAt(tuning, p)); haptic('tap') }
    } else if (mode === 'fill') { fill.toggle(p); haptic('tap') }
    else if (!follow.done) {
      const r = follow.tap(p)
      if (r === 'miss') { haptic('warn'); setShake(true); setTimeout(() => setShake(false), 300); return }
      playNote(midiAt(tuning, p)); haptic('tap')
      if (r === 'done') {
        recordResult(key, { correct: follow.total, total: follow.total + follow.wrong })
        haptic('success')
        // 완주 아르페지오(루트·5도·옥타브): 마지막 음과 겹치지 않게 한 박 뒤
        const r0 = marks.find((m) => m.root)?.midi
        if (r0 !== undefined) setTimeout(() => playSequence([r0, r0 + 7, r0 + 12], 120), GAP_MS)
      }
    }
  }
  const retry = () => { fill.reset(); follow.reset() }

  // 키보드(PC): Enter = 채점/다시, ←/→ = 포지션, 1~9 = 포지션 n, Space = 들어보기(보기), Esc = 들어보기 중지
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.closest('input, textarea, select, [contenteditable], [role=dialog]'))) return
      const digit = e.key.length === 1 && e.key >= '1' && e.key <= '9' ? Number(e.key) : 0
      if (e.key === 'ArrowLeft' && all.length > 1) { e.preventDefault(); go(-1) }
      else if (e.key === 'ArrowRight' && all.length > 1) { e.preventDefault(); go(1) }
      else if (digit && s.system !== 'full' && digit <= all.length) patchSettings({ position: digit - 1 })
      else if (e.key === ' ' && mode === 'view') { e.preventDefault(); listen() }
      else if (e.key === 'Escape' && playIdx >= 0) stopListen()
      else if (e.key === 'Enter' && mode !== 'view') {
        e.preventDefault()
        if (mode === 'fill') { if (fill.graded) retry(); else if (fill.picked.size) grade() }
        else if (follow.done) retry()
      }
    }
    addEventListener('keydown', on)
    return () => removeEventListener('keydown', on)
  })

  // 모드별 Fretboard 입력
  let shown: Mark[] = marks, states: Record<string, FretState> | undefined
  if (mode === 'fill') { shown = fill.graded ? marks : []; states = fill.states }
  else if (mode === 'follow') states = follow.states
  else if (playIdx >= 0) { const m = [...marks].sort((a, b) => a.midi - b.midi)[playIdx]; if (m) states = { [posKey(m)]: 'target' } }

  // 모바일(≤760) 프렛 창: 9칸 넘는 범위는 창으로 나눠 ◂ ▸ 로 넘긴다(StudyPage 로컬). 채점·순서는 포지션 전체 기준 그대로.
  // Fretboard 는 범위 밖 마크·상태를 그리지 않으므로 frets 만 바꾸면 된다. target 이 창 밖이면 그 창으로 자동 이동
  const narrow = useNarrow()
  const wins = useMemo(() => (narrow ? fretWindows(pos.frets) : [pos.frets]), [narrow, pos])
  const [win, setWin] = useState(0)
  const wi = Math.min(win, wins.length - 1)
  useEffect(() => { setWin(0) }, [pos])
  const targetKey = states && Object.keys(states).find((k) => states[k] === 'target')
  useEffect(() => {
    if (!targetKey) return
    const f = Number(targetKey.split(':')[1])
    const i = wins.findIndex(([lo, hi]) => f >= lo && f <= hi)
    if (i >= 0) setWin(i)
  }, [targetKey, wins])
  const goWin = (d: number) => setWin((wi + d + wins.length) % wins.length)

  // 보드 스와이프(터치·펜, 한 손가락): 가로 80px 이상이면 창 → 없으면 포지션 이동. 채우기(채점 전)는 드래그 선택과 충돌하므로 끈다
  const drag = mode === 'fill' && !fill.graded
  const ptrs = useRef(new Map<number, { x: number; y: number }>())
  const onBoardDown = (e: PointerEvent) => { if (e.pointerType !== 'mouse') ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY }) }
  const onBoardUp = (e: PointerEvent) => {
    const st = ptrs.current.get(e.pointerId)
    ptrs.current.delete(e.pointerId)
    if (!st || ptrs.current.size > 0) return // 한 손가락만
    const d = swipeDir(e.clientX - st.x, e.clientY - st.y)
    if (!d) return
    if (wins.length > 1) goWin(d)
    else if (all.length > 1) go(d)
  }
  const boardEvents = drag ? {} : { onPointerDown: onBoardDown, onPointerUp: onBoardUp, onPointerCancel: onBoardUp }

  // 따라치기 다음 음(U12): string 0 = 가장 낮은 줄 → n번줄
  const target = mode === 'follow' && !follow.done ? followOrder(marks)[follow.idx] : undefined

  const finished = mode === 'fill' ? fill.graded : mode === 'follow' && follow.done
  const nextPos = all.length > 1 && <button type="button" onClick={() => go(1)}>다음 포지션<Icon d={I.arrowRight} /></button>

  return (
    <div className="study" data-mode={mode}>
      <header className="study-head">
        <ScaleBar />
        <nav className="seg" aria-label="학습 모드">
          {MODES.map(({ m, label }) => <a key={m} href={href.study(m)} aria-label={label} aria-current={m === mode ? 'page' : undefined}>{label}</a>)}
        </nav>
        <span className="study-spacer" />
        <OptionsButton />
      </header>

      {s.system !== 'full' && (
        <div className="study-pos">
          <button type="button" className="ghost" aria-label="이전으로" onClick={() => go(-1)}><Icon d={I.chevronLeft} size={20} /></button>
          <span className="tnum">포지션 <strong>{pi + 1}</strong> / {all.length} <span className="muted">· {pos.frets[0]}–{pos.frets[1]} 프렛</span></span>
          <button type="button" className="ghost" aria-label="다음으로" onClick={() => go(1)}><Icon d={I.chevronRight} size={20} /></button>
        </div>
      )}

      {wins.length > 1 && (
        <div className="study-pos study-win">
          <button type="button" className="ghost" aria-label="이전 프렛 창" onClick={() => goWin(-1)}><Icon d={I.chevronLeft} size={20} /></button>
          <span className="tnum">프렛 <strong>{wins[wi][0]}–{wins[wi][1]}</strong> <span className="muted">· {wi + 1} / {wins.length}</span></span>
          <button type="button" className="ghost" aria-label="다음 프렛 창" onClick={() => goWin(1)}><Icon d={I.chevronRight} size={20} /></button>
        </div>
      )}

      <div className={`study-board${shake ? ' shake' : ''}`} {...boardEvents}>
        <Fretboard tuning={tuning} frets={wins[wi]} marks={shown} states={states} labelMode={s.labelMode} accidental={s.accidental} view={s.view} tilt={s.tilt} onTap={onTap} drag={drag} />
      </div>

      {mode === 'fill' && fill.result && <Summary title="채점 결과" nums={[['맞음', fill.result.hit, 'ok'], ['틀림', fill.result.miss, 'danger'], ['놓침', fill.result.missing]]} line={statsLine(stat)} />}
      {mode === 'follow' && follow.done && follow.total > 0 && (
        <Summary title="완주" nums={[['음', follow.total, 'ok'], ['틀림', follow.wrong, 'danger'], ['초', Math.round((elapsed ?? 0) / 100) / 10]]} line={statsLine(stat)} />
      )}
      {mode === 'follow' && follow.total === 0 && <p className="empty">이 포지션에는 음이 없습니다.</p>}

      <div className="study-bar actions">
        {mode === 'view' && (
          <button type="button" aria-label="들어보기" aria-pressed={playIdx >= 0} disabled={!marks.length} onClick={listen}>
            <Icon d={playIdx >= 0 ? I.square : I.play} />들어보기
          </button>
        )}
        {mode === 'fill' && !fill.graded && <>
          <span className="study-progress tnum muted">찍음 <strong>{fill.picked.size}</strong> / 정답 {marks.length}</span>
          <button type="button" disabled={!fill.picked.size} onClick={fill.reset}><Icon d={I.rotateCcw} />초기화</button>
          <button type="button" className="primary" disabled={!fill.picked.size} onClick={grade}><Icon d={I.checkCheck} />채점</button>
        </>}
        {mode === 'follow' && !follow.done && <>
          <span className="study-progress tnum muted">
            <strong>{follow.idx}</strong> / {follow.total}{follow.wrong > 0 && <> · 틀림 {follow.wrong}</>}
            {target && <> · 다음 <strong>{labelOf(target, s.labelMode === 'none' ? 'note' : s.labelMode, s.accidental)}</strong> · {tuning.strings.length - target.string}번줄</>}
          </span>
          <button type="button" disabled={!follow.idx} onClick={retry}><Icon d={I.rotateCcw} />다시</button>
        </>}
        {finished && <>
          <button type="button" className="primary" onClick={retry}><Icon d={I.rotateCcw} />다시</button>
          {nextPos}
        </>}
      </div>
      <p className="study-kbd muted">{kbdHint(mode, s.system !== 'full' && all.length > 1)}</p>
    </div>
  )
}

/** PC 단축키 안내(모드에 맞는 것만). 표시 여부는 study.css 의 hover+폭 미디어쿼리 */
function kbdHint(mode: StudyMode, hasPos: boolean): string {
  const items = [mode === 'fill' && 'Enter 채점·다시', mode === 'follow' && 'Enter 다시', hasPos && '← → 포지션', mode === 'view' && 'Space 들어보기', hasPos && '1–9 포지션']
  return items.filter(Boolean).join(' · ')
}

/** 요약 카드(DrillDown .flash-summary): 숫자가 주인공 */
function Summary({ title, nums, line }: { title: string; nums: [string, number, ('ok' | 'danger')?][]; line: string }) {
  // 마운트 때 뷰포트 안으로(390 에서는 프렛보드 아래라 화면 밖일 수 있다)
  const ref = useRef<HTMLElement>(null)
  useEffect(() => { ref.current?.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' }) }, [])
  return (
    <section ref={ref} className="study-summary card" aria-label={title}>
      <h2>{title}</h2>
      <p className="study-summary-nums">
        {nums.map(([label, n, tone]) => <span key={label} className={tone}><strong>{n}</strong>{label}</span>)}
      </p>
      {line && <p className="muted">{line}</p>}
    </section>
  )
}

