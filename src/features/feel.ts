// 촉각 피드백 — 공유 계약 docs/plans/orchestration_visual_polish.md §3.2 (오케스트레이터 소유)
// Vibration API 가 있는 기기(주로 Android)에서만 진동. iOS 는 미지원 → 시각 피드백만 남는다.
export type Haptic = 'tap' | 'success' | 'warn'

const PATTERN: Record<Haptic, number | number[]> = { tap: 8, success: [10, 40, 14], warn: [24, 30, 24] }
const reduced = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null

export function haptic(kind: Haptic = 'tap'): void {
  if (reduced?.matches || typeof navigator === 'undefined' || !('vibrate' in navigator)) return
  try {
    navigator.vibrate(PATTERN[kind])
  } catch { /* 사용자 제스처 밖 호출 등 — 무시 */ }
}
