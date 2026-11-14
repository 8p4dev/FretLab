// 프렛보드 — 공유 계약 orchestration_fretlab.md §3.5 (에이전트 B 소유).
// 실물 그리기(3차 R1): 색은 fretboard.css 의 --fb-*, 칸 폭은 geometry.wirePos. 줄·프렛 굵기는 화면 px 기준(ResizeObserver 배율).
// 5차 3D: 같은 viewBox 의 SVG 레이어 — 보드(z 0) · 옆면(지판 아래 가장자리에서 -90° 접힘) · 줄+너트 윗면(z HS) · 마크·라벨·탭 셀(z 2HS) + 스테이지 밖 번호.
// view=player 는 스테이지 CSS 3D(fretboard.css), fill 은 부모 px 를 읽어 1단위 = 1px 로 그린다(그립 모드).
import { useEffect, useRef, useState } from 'preact/hooks'
import type { Accidental, FretPos, FretState, FretView, LabelMode, Mark, Tuning } from '../../core/types'
import { posKey } from '../../core/types'
import { labelOf, midiToPc, noteName } from '../../core/music'
import { DOUBLE_INLAY, INLAY, firstEntry, isWound, layout, showNumber, stringPx, wirePx } from './geometry'
import './fretboard.css'

export type FretboardProps = {
  tuning: Tuning
  /** 보이는 프렛 범위 [lo, hi] (포함). 0 = 개방(너트 왼쪽) */
  frets: [number, number]
  /** 그릴 마크. 채우기 모드처럼 숨길 때는 [] 를 넘기고 states 로만 표시 */
  marks: Mark[]
  labelMode: LabelMode
  accidental: Accidental
  /** posKey → 상태. 마크 없는 자리도 상태를 가질 수 있다(채우기 모드의 picked·miss) */
  states?: Record<string, FretState>
  view: FretView
  /** 0..1, view=player 때만 */
  tilt?: number
  /** true 면 부모 크기를 가득 채운다(그립). false 면 폭 100%·높이 비율 고정 */
  fill?: boolean
  /** 프렛 자리(마크 유무 무관) 탭. 멀티터치는 pointer 이벤트마다 한 번씩 */
  onTap?: (pos: FretPos) => void
  /** true 면 pointerdown 뒤 포인터가 처음 들어가는 셀마다 onTap(쓸어 찍기, 채우기). 계약 §3.5 (2차 plan U4) */
  drag?: boolean
  className?: string
}

const NS = 'vector-effect'
const PRESS_MS = 160
/** 줄·너트 윗면이 지판에서 뜬 높이(화면 px). fretboard.css 의 translateZ 와 같은 값 */
const HS = 3

const grad = (id: string, vertical: boolean, stops: [number, string][]) => (
  <linearGradient id={id} x1="0" y1="0" x2={vertical ? 0 : 1} y2={vertical ? 1 : 0}>
    {stops.map(([o, c]) => <stop key={c + o} offset={o} class={`fb-c-${c}`} />)}
  </linearGradient>
)

export function Fretboard(p: FretboardProps) {
  const [lo, hi] = p.frets
  const n = p.tuning.strings.length
  const states = p.states ?? {}
  const ref = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<{ w: number; h: number } | undefined>()
  // U2 눌림: ref Set + 카운터로 리렌더(멀티터치 동시 탭도 둘 다 보관). U4: 포인터별 들어간 셀
  const pressed = useRef(new Set<string>())
  const [, bump] = useState(0)
  const dragSeen = useRef(new Map<number, Set<string>>())

  // 부모 크기: fill 은 레이아웃(1단위 = 1px), 비 fill 은 px 고정 굵기(줄·프렛)를 위한 배율만
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])

  const L = layout(n, lo, hi, p.fill ? box : undefined)
  // 화면 px → viewBox 단위. 첫 렌더(관측 전)는 1
  const scale = (!p.fill && box && Math.min(box.w / L.w, box.h / L.h)) || 1
  const u = (px: number) => px / scale

  const fire = (key: string) => {
    const [s, f] = key.split(':').map(Number)
    p.onTap?.({ string: s, fret: f })
    pressed.current.add(key); bump((t) => t + 1)
    setTimeout(() => { pressed.current.delete(key); bump((t) => t + 1) }, PRESS_MS)
  }
  const keyAt = (el: Element | null) => el?.closest?.('[data-pos]')?.getAttribute('data-pos')
  const onDown = (e: PointerEvent) => {
    const key = keyAt(e.target as Element)
    if (!key || !p.onTap) return
    if (p.drag) {
      dragSeen.current.set(e.pointerId, new Set([key]))
      ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    }
    fire(key)
  }
  const onMove = (e: PointerEvent) => {
    if (!dragSeen.current.has(e.pointerId)) return
    const key = keyAt(document.elementFromPoint(e.clientX, e.clientY))
    if (key && firstEntry(dragSeen.current, e.pointerId, key)) fire(key)
  }
  const onUp = (e: PointerEvent) => { dragSeen.current.delete(e.pointerId) }

  // 마크(원) + 마크 없는 자리의 state(라벨 없는 마커)
  const marked = new Set<string>()
  const drawn = new Set<string>()
  const markNodes: preact.JSX.Element[] = []
  const pushMark = (s: number, f: number, m: Mark | undefined, st: FretState | undefined) => {
    if (f < lo || f > hi || s < 0 || s >= n) return
    const key = `${s}:${f}`
    drawn.add(key)
    const cx = L.cx(f), cy = L.y(s), d = L.markAt(f)
    const cls = `fb-mark${m?.root ? ' root' : ''}${st ? ` st-${st}` : ''}${pressed.current.has(key) ? ' pressed' : ''}`
    markNodes.push(<circle key={`m${key}`} class={cls} cx={cx} cy={cy} r={d / 2} {...{ [NS]: 'non-scaling-stroke' }} />)
    const label = m && p.labelMode !== 'none' ? labelOf(m, p.labelMode, p.accidental) : ''
    if (label) markNodes.push(<text key={`t${key}`} class={cls.replace('fb-mark', 'fb-label')} x={cx} y={cy} dy=".36em" font-size={d * 0.6}>{label}</text>)
  }
  for (const m of p.marks) { marked.add(posKey(m)); pushMark(m.string, m.fret, m, states[posKey(m)]) }
  for (const k in states) {
    if (marked.has(k)) continue
    const [s, f] = k.split(':').map(Number)
    pushMark(s, f, undefined, states[k])
  }

  // 지판: 와이어 a(왼쪽 끝) ~ hi. 창이 너트에서 시작하지 않으면 왼쪽으로도 지판이 조금 더 이어진다
  const a = Math.max(lo, 1) - 1
  const hasBoard = hi > a
  const boardH = L.bottom - L.top
  const wireW = u(wirePx(L.cw * scale)), nutW = wireW * 2.5
  const over = Math.min(L.padX, wireW)
  const left = a > 0 ? L.boardX - over : L.boardX, right = L.boardX + L.boardW + over
  const edge = L.sg * 0.07
  // 옆면(5차 P2): 넥 두께 hn, 보드 위로 솟은 높이 hs. 옆면 SVG 는 y = bottom 선에서 접힌다 — 선 아래가 넥 옆면, 위가 너트 앞면·프렛 끝
  const hn = L.sg * 0.55, hs = u(HS), sideR = L.sg * 0.075, sideY = L.bottom + hn * 0.42
  const side: preact.JSX.Element[] = []
  let nut: preact.JSX.Element | undefined

  const cells: preact.JSX.Element[] = []
  const nums: preact.JSX.Element[] = []
  const wires: preact.JSX.Element[] = []
  const dots: preact.JSX.Element[] = []
  for (let f = a; hasBoard && f <= hi; f++) {
    const x = L.wireX(f)
    if (f === 0) {
      nut = <rect class="fb-nut" x={x - nutW} y={L.top} width={nutW} height={boardH} rx={u(1.5)} {...{ [NS]: 'non-scaling-stroke' }} />
      side.push(<rect key="nf" class="fb-nut-front" x={x - nutW} y={L.bottom - hs} width={nutW} height={hs + hn * 0.5} />)
    } else {
      wires.push(
        <rect key={`ws${f}`} class="fb-shadow fb-cast" x={x + wireW / 2} y={L.top} width={u(1.5)} height={boardH} />,
        <rect key={`w${f}`} class="fb-fret" fill="url(#fb-g-fret)" x={x - wireW / 2} y={L.top} width={wireW} height={boardH} />,
      )
      side.push(<rect key={`we${f}`} class="fb-fret-end" x={x - wireW / 2} y={L.bottom - hs / 3} width={wireW} height={hs / 3 + hn * 0.16} />)
    }
  }
  for (let f = lo; f <= hi; f++) {
    const x = L.x(f), cx = L.cx(f)
    if (INLAY.has(f)) {
      // 사이드 도트: 지판 인레이와 같은 cx
      for (const dx of DOUBLE_INLAY.has(f) ? [-1.6, 1.6] : [0]) side.push(<circle key={`sd${f}${dx}`} class="fb-dot" cx={cx + dx * sideR} cy={sideY} r={sideR} />)
      // 2점은 줄 사이에: 줄 수가 짝수면 ±1칸, 홀수면 ±½칸
      const off = n % 2 ? L.sg / 2 : L.sg
      if (DOUBLE_INLAY.has(f)) dots.push(<circle key={`d${f}a`} class="fb-dot" cx={cx} cy={L.midY - off} r={L.dot} />, <circle key={`d${f}b`} class="fb-dot" cx={cx} cy={L.midY + off} r={L.dot} />)
      else dots.push(<circle key={`d${f}`} class="fb-dot" cx={cx} cy={L.midY} r={L.dot} />)
    }
    if (showNumber(f, lo, L.cols)) nums.push(<text key={`n${f}`} class="fb-num" x={cx} y={L.numY} font-size={L.numFont}>{f}</text>)
    for (let s = 0; s < n; s++) {
      const key = `${s}:${f}`
      const press = !drawn.has(key) && pressed.current.has(key) // 마크 있는 자리는 마크가 반응한다
      cells.push(<rect key={`c${key}`} class={`fb-cell${press ? ' pressed' : ''}`} data-pos={key} x={x} y={L.y(s) - L.sg / 2} width={L.cwAt(f)} height={L.sg} />)
    }
  }
  // 줄: 지판에 떨군 그림자(보드 레이어) → 몸통(위가 밝은 그라디언트) → 와운드는 권선 무늬(굵을 때만)
  const sx = lo === 0 ? L.x(0) : left
  const shadows: preact.JSX.Element[] = []
  const strings = p.tuning.strings.flatMap((_, s) => {
    const px = stringPx(s, n, p.fill), th = u(px), y = L.y(s), wound = isWound(s, n)
    if (hasBoard) shadows.push(<rect key={`ss${s}`} class="fb-shadow fb-drop" x={left} y={y + th / 2 + u(1)} width={right - left} height={Math.max(u(1), th * 0.6)} />)
    return [
      <rect key={`s${s}`} class={`fb-string${wound ? ' wound' : ''}`} fill={`url(#fb-g-${wound ? 'wound' : 'plain'})`} x={sx} y={y - th / 2} width={right - sx} height={th} />,
      wound && px >= 3 && <line key={`sw${s}`} class="fb-winding" x1={sx} y1={y} x2={right} y2={y} stroke-width={th} stroke-dasharray={`${u(0.8)} ${u(1.4)}`} />,
    ]
  })
  // U1 줄 이름 열: 개방 셀(lo=0) 또는 지판 왼쪽 끝(lo>0) 왼편
  const names = p.tuning.strings.map((open, s) => (
    <text key={`sn${s}`} class="fb-string-name" x={sx - 4} y={L.y(s)} dy=".36em" font-size={L.numFont}>{noteName(midiToPc(open), p.accidental)}</text>
  ))

  const vb = `0 0 ${L.w} ${L.h}`, pct = (v: number) => `${(v / L.h) * 100}%`
  return (
    <div ref={ref} class={`fretboard${p.fill ? ' fill' : ''} ${p.className ?? ''}`} data-view={p.view} data-tap={p.onTap ? '' : undefined} data-drag={p.drag ? '' : undefined} style={{ '--tilt': p.view === 'player' ? p.tilt ?? 0.6 : 0, '--fb-u': 1 / scale, '--fb-hn': hn * scale }}>
      <div class="fb-stage" style={{ transformOrigin: `50% ${pct(L.bottom)}` }}>
        <svg class="fb-base" viewBox={vb} aria-hidden="true">
          <defs>
            {grad('fb-g-board', true, [[0, 'wood'], [0.5, 'wood-hi'], [1, 'wood']])}
            {grad('fb-g-fret', false, [[0, 'fret-lo'], [0.3, 'fret-hi'], [0.65, 'fret'], [1, 'fret-lo']])}
            {grad('fb-g-plain', true, [[0, 'str-hi'], [0.45, 'str-plain'], [1, 'str-lo']])}
            {grad('fb-g-wound', true, [[0, 'str-wound'], [0.3, 'str-hi'], [0.6, 'str-wound'], [1, 'str-lo']])}
            {grad('fb-g-side', true, [[0, 'nut'], [0.13, 'nut'], [0.13, 'side'], [1, 'side-lo']])}
          </defs>
          {hasBoard && <rect fill="url(#fb-g-board)" x={left} y={L.top} width={right - left} height={boardH} />}
          {hasBoard && <rect class="fb-edge" x={left} y={L.top} width={right - left} height={edge} />}
          {hasBoard && <rect class="fb-edge" x={left} y={L.bottom - edge} width={right - left} height={edge} />}
          {dots}{wires}{shadows}{names}
        </svg>
        {hasBoard && (
          <svg class="fb-side" viewBox={`0 ${L.bottom - hs} ${L.w} ${hs + hn}`} aria-hidden="true" style={{ top: pct(L.bottom - hs), height: pct(hs + hn), transformOrigin: `50% ${(hs / (hs + hn)) * 100}%` }}>
            <rect fill="url(#fb-g-side)" x={left} y={L.bottom} width={right - left} height={hn} />
            {side}
          </svg>
        )}
        <svg class="fb-z1" viewBox={vb} aria-hidden="true">{nut}{strings}</svg>
        <svg class="fb-z2" viewBox={vb} role="img" aria-label={`프렛보드 ${p.tuning.name} ${lo}–${hi}프렛`} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          {markNodes}{cells}
        </svg>
      </div>
      <svg viewBox={vb} aria-hidden="true">{nums}</svg>
    </div>
  )
}
