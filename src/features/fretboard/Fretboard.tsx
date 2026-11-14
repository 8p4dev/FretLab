// 프렛보드 — 공유 계약 orchestration_fretlab.md §3.5 (에이전트 B 소유). SVG 하나에 줄·프렛·너트·인레이·번호·마크·라벨·탭 셀.
// view=player 는 래퍼 CSS 3D(fretboard.css), fill 은 ResizeObserver 로 부모 px 를 읽어 1단위 = 1px 로 그린다(그립 모드).
import { useEffect, useRef, useState } from 'preact/hooks'
import type { Accidental, FretPos, FretState, FretView, LabelMode, Mark, Tuning } from '../../core/types'
import { posKey } from '../../core/types'
import { labelOf } from '../../core/music'
import { DOUBLE_INLAY, INLAY, layout, showNumber, stringWidth } from './geometry'
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
  className?: string
}

const NS = 'vector-effect'

export function Fretboard(p: FretboardProps) {
  const [lo, hi] = p.frets
  const n = p.tuning.strings.length
  const states = p.states ?? {}
  const ref = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<{ w: number; h: number } | undefined>()

  // fill: 부모 크기를 따라간다
  useEffect(() => {
    if (!p.fill || !ref.current) { setBox(undefined); return }
    const el = ref.current
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [p.fill])

  const L = layout(n, lo, hi, p.fill ? box : undefined)
  const half = L.mark / 2

  const onDown = (e: PointerEvent) => {
    const pos = (e.target as Element).getAttribute?.('data-pos')
    if (!pos || !p.onTap) return
    const [s, f] = pos.split(':').map(Number)
    p.onTap({ string: s, fret: f })
  }

  // 마크 + 마크 없는 자리의 state(라벨 없는 마커)
  const marked = new Set<string>()
  const markNodes: preact.JSX.Element[] = []
  const pushMark = (s: number, f: number, m: Mark | undefined, st: FretState | undefined) => {
    if (f < lo || f > hi || s < 0 || s >= n) return
    const cx = L.x(f) + L.cw / 2, cy = L.y(s)
    const cls = `fb-mark${m?.root ? ' root' : ''}${st ? ` st-${st}` : ''}`
    markNodes.push(<rect key={`m${s}:${f}`} class={cls} x={cx - half} y={cy - half} width={L.mark} height={L.mark} rx={2} {...{ [NS]: 'non-scaling-stroke' }} />)
    const label = m && p.labelMode !== 'none' ? labelOf(m, p.labelMode, p.accidental) : ''
    if (label) markNodes.push(<text key={`t${s}:${f}`} class={cls.replace('fb-mark', 'fb-label')} x={cx} y={cy} dy=".36em" font-size={L.font}>{label}</text>)
  }
  for (const m of p.marks) { marked.add(posKey(m)); pushMark(m.string, m.fret, m, states[posKey(m)]) }
  for (const k in states) {
    if (marked.has(k)) continue
    const [s, f] = k.split(':').map(Number)
    pushMark(s, f, undefined, states[k])
  }

  const cells: preact.JSX.Element[] = []
  const nums: preact.JSX.Element[] = []
  const wires: preact.JSX.Element[] = []
  const dots: preact.JSX.Element[] = []
  const top = L.y(n - 1) - L.sg * 0.45, bottom = L.y(0) + L.sg * 0.45
  if (lo > 0) wires.push(<line key="w0" class="fb-fret" x1={L.x(lo)} y1={top} x2={L.x(lo)} y2={bottom} {...{ [NS]: 'non-scaling-stroke' }} />)
  for (let f = lo; f <= hi; f++) {
    const x = L.x(f), xr = x + L.cw, cx = x + L.cw / 2
    if (f === 0) wires.push(<line key="nut" class="fb-nut" x1={xr} y1={top} x2={xr} y2={bottom} {...{ [NS]: 'non-scaling-stroke' }} />)
    else wires.push(<line key={`w${f}`} class="fb-fret" x1={xr} y1={top} x2={xr} y2={bottom} {...{ [NS]: 'non-scaling-stroke' }} />)
    if (INLAY.has(f)) {
      // 2점은 줄 사이에: 줄 수가 짝수면 ±1칸, 홀수면 ±½칸
      const off = n % 2 ? L.sg / 2 : L.sg
      if (DOUBLE_INLAY.has(f)) dots.push(<circle key={`d${f}a`} class="fb-dot" cx={cx} cy={L.midY - off} r={L.dot} />, <circle key={`d${f}b`} class="fb-dot" cx={cx} cy={L.midY + off} r={L.dot} />)
      else dots.push(<circle key={`d${f}`} class="fb-dot" cx={cx} cy={L.midY} r={L.dot} />)
    }
    if (showNumber(f, lo, L.cols)) nums.push(<text key={`n${f}`} class="fb-num" x={cx} y={L.numY} font-size={L.numFont}>{f}</text>)
    for (let s = 0; s < n; s++) {
      cells.push(<rect key={`c${s}:${f}`} class="fb-cell" data-pos={`${s}:${f}`} x={x} y={L.y(s) - L.sg / 2} width={L.cw} height={L.sg} />)
    }
  }
  const strings = p.tuning.strings.map((_, s) => (
    <line key={`s${s}`} class="fb-string" x1={L.x(lo)} y1={L.y(s)} x2={L.x(hi) + L.cw} y2={L.y(s)} stroke-width={stringWidth(s, n)} {...{ [NS]: 'non-scaling-stroke' }} />
  ))

  return (
    <div ref={ref} class={`fretboard${p.fill ? ' fill' : ''} ${p.className ?? ''}`} data-view={p.view} style={{ '--tilt': p.view === 'player' ? p.tilt ?? 0.6 : 0 }}>
      <div class="fb-stage">
        <svg viewBox={`0 0 ${L.w} ${L.h}`} role="img" aria-label={`프렛보드 ${p.tuning.name} ${lo}–${hi}프렛`} onPointerDown={onDown}>
          {dots}{wires}{strings}{nums}{markNodes}{cells}
        </svg>
      </div>
    </div>
  )
}
