// 기기 판정 (오케스트레이터 소유). 그립 모드는 터치 기기만 (orchestration_fretlab_i18n.md G1)
import { useEffect, useState } from 'preact/hooks'

export const isTouchDevice = (): boolean =>
  typeof matchMedia !== 'undefined' && (matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0)

/** 미디어쿼리가 맞는 동안 true. matchMedia 가 없으면(SSR 등) false */
export function useMedia(query: string): boolean {
  const [v, set] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(query).matches)
  useEffect(() => {
    if (typeof matchMedia === 'undefined') return
    const mq = matchMedia(query), on = () => set(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return v
}
