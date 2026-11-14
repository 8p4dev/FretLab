// 하단 시트 — 02 §3.2 규칙 4(a): 바닥 고정, bottom: var(--kb), max-height = 100dvh − kb − nav. 바깥 탭·Esc 닫기(onClose 가 없으면 닫히지 않는다 — 병합 시트), role=dialog,
// 열릴 때 첫 포커스 가능 요소로, 닫힐 때 원래 자리로, Tab 은 시트 안에서 순환. body 스크롤 잠금 없음(시트 자체가 overscroll-behavior: contain).
import { type ComponentChildren } from 'preact'
import { useEffect, useRef } from 'preact/hooks'

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Sheet({ open, onClose, label, children }: { open: boolean; onClose?: () => void; label: string; children: ComponentChildren }) {
  const ref = useRef<HTMLDivElement>(null)

  // 포커스 이동은 open 이 바뀔 때만(부모 재렌더로 입력 포커스를 뺏지 않게)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement
    const el = ref.current
    ;(el?.querySelector<HTMLElement>(FOCUSABLE) ?? el)?.focus()
    return () => { if (prev instanceof HTMLElement) prev.focus() }
  }, [open])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) { e.preventDefault(); onClose(); return }
      if (e.key !== 'Tab' || !ref.current) return
      const f = ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (!f.length) { e.preventDefault(); return }
      const first = f[0], last = f[f.length - 1], cur = document.activeElement
      if (e.shiftKey && (cur === first || !ref.current.contains(cur))) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && (cur === last || !ref.current.contains(cur))) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div ref={ref} className="sheet" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        {children}
      </div>
    </>
  )
}
