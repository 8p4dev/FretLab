// 전역 툴팁 1개 — 01 §3.5 · 02 §3.5. 쓰는 쪽은 아이콘 전용 컨트롤에 aria-label + data-tip="…" 만 붙인다.
// document 위임: 터치 길게 누르기 500ms(카드 끌기 250ms 와 간격) / 호버·포커스 400ms. 컨트롤 위 8px, 상단 60px 안이면 아래(data-tip-pos),
// 좌우 8px 클램프, visualViewport 높이 안에서만, 떼면·스크롤하면 즉시 제거. App 에 <TooltipLayer/> 를 한 번 마운트한다.
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks'

type Tip = { text: string; x: number; y: number; pos: 'above' | 'below' }
const find = (e: Event) => (e.target instanceof Element ? e.target.closest<HTMLElement>('[data-tip]') : null)

export function TooltipLayer() {
  const [tip, setTip] = useState<Tip | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let timer = 0
    let target: HTMLElement | null = null
    let start: { x: number; y: number } | null = null
    const hide = () => { clearTimeout(timer); target = null; start = null; setTip(null) }
    const show = (el: HTMLElement) => {
      const text = el.getAttribute('data-tip')
      if (!text || !el.isConnected) return
      const r = el.getBoundingClientRect()
      const vh = visualViewport?.height ?? innerHeight
      if (r.bottom < 0 || r.top > vh) return
      const pos = r.top < 60 ? 'below' : 'above'
      setTip({ text, x: r.left + r.width / 2, y: pos === 'above' ? r.top - 8 : r.bottom + 8, pos })
    }
    const schedule = (el: HTMLElement, ms: number) => { clearTimeout(timer); target = el; timer = window.setTimeout(() => show(el), ms) }
    const onPointerDown = (e: PointerEvent) => {
      const el = find(e)
      if (e.pointerType === 'touch' && el) { start = { x: e.clientX, y: e.clientY }; schedule(el, 500) }
      else hide()
    }
    const onPointerMove = (e: PointerEvent) => { if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) hide() }
    const onOver = (e: MouseEvent) => {
      if (!matchMedia('(hover: hover)').matches) return
      const el = find(e)
      if (el && el !== target) schedule(el, 400)
    }
    const onOut = (e: MouseEvent) => {
      const el = find(e)
      if (el && el === target && !(e.relatedTarget instanceof Node && el.contains(e.relatedTarget))) hide()
    }
    const onFocusIn = (e: FocusEvent) => { const el = find(e); if (el?.matches(':focus-visible')) schedule(el, 400) }
    const onContextMenu = (e: Event) => { if (find(e) && start) e.preventDefault() }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') hide() }
    const opts = { passive: true } as const
    document.addEventListener('pointerdown', onPointerDown, opts)
    document.addEventListener('pointermove', onPointerMove, opts)
    document.addEventListener('pointerup', hide, opts)
    document.addEventListener('pointercancel', hide, opts)
    document.addEventListener('mouseover', onOver, opts)
    document.addEventListener('mouseout', onOut, opts)
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', hide)
    document.addEventListener('contextmenu', onContextMenu)
    document.addEventListener('keydown', onKey)
    document.addEventListener('scroll', hide, { capture: true, passive: true })
    return () => {
      hide()
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', hide)
      document.removeEventListener('pointercancel', hide)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', hide)
      document.removeEventListener('contextmenu', onContextMenu)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('scroll', hide, { capture: true })
    }
  }, [])

  // 그린 뒤 폭을 재서 좌우 8px 안으로 클램프, 위쪽이면 자기 높이만큼 올린다
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !tip) return
    const w = el.offsetWidth, h = el.offsetHeight
    const left = Math.min(Math.max(8, tip.x - w / 2), innerWidth - 8 - w)
    el.style.left = `${Math.round(left)}px`
    el.style.top = `${Math.round(tip.pos === 'above' ? tip.y - h : tip.y)}px`
  }, [tip])

  if (!tip) return null
  return <div ref={ref} className="tip" role="tooltip" data-tip-pos={tip.pos}>{tip.text}</div>
}
