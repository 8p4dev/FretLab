// 기기 판정 (오케스트레이터 소유). 그립 모드는 터치 기기만 (orchestration_fretlab_i18n.md G1)
export const isTouchDevice = (): boolean =>
  typeof matchMedia !== 'undefined' && (matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0)
