// 인라인 SVG 아이콘 — 공유 계약 docs/plans/orchestration_ui_first.md §3.2 (DS 소유). 규격: 01_design_system.md §3.5
// 16px(인라인·탭·배지, stroke 2) / 20px(상단 바·툴바·아이콘 전용 버튼, stroke 1.75). currentColor.
// d 는 ./icons.ts(I.*) 또는 ./icons.all.ts 의 자식 요소 문자열(정적·신뢰 문자열). label 이 있으면 role=img, 없으면 장식(aria-hidden).

export function Icon({ d, size = 16, label, className }: { d: string; size?: 16 | 20 | 24 | 64; label?: string; className?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={size === 16 ? 2 : 1.75} strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden={label ? undefined : true} role={label ? 'img' : undefined} aria-label={label}
      dangerouslySetInnerHTML={{ __html: d }}
    />
  )
}
