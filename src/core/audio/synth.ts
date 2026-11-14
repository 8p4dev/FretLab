// 순수 계산(DOM 없음) — audio.check.ts 가 Node 에서 검사한다.
import type { Midi } from '../types'

export const midiToHz = (m: Midi): number => 440 * 2 ** ((m - 69) / 12)

/** Karplus-Strong 지연선 길이. 2점 평균 필터가 0.5 샘플을 더하므로 실제 주기는 N+0.5 */
export const pluckPeriod = (hz: number, sampleRate: number): number => Math.max(2, Math.round(sampleRate / hz - 0.5))

/**
 * Karplus-Strong 플럭. 노이즈 버스트(1극 로우패스로 둥글게) → 지연선 + 2점 평균 + 루프 손실.
 * 손실 rho 는 음높이와 무관하게 T60 ≈ t60 초가 되도록 잡는다. 끝 50 ms 는 선형 페이드(클릭 방지).
 * 반환 버퍼의 실제 음높이는 sampleRate/(N+0.5) 이므로 재생 시 playbackRate = hz·(N+0.5)/sampleRate 로 보정한다.
 */
export function pluckBuffer(hz: number, sampleRate: number, seconds = 2.5, t60 = 2.2): Float32Array<ArrayBuffer> {
  const N = pluckPeriod(hz, sampleRate)
  const len = Math.floor(sampleRate * seconds)
  const out = new Float32Array(len)
  const rho = 0.001 ** (1 / (hz * t60))
  let lp = 0
  for (let i = 0; i < N; i++) { lp += 0.6 * ((Math.random() * 2 - 1) - lp); out[i] = lp }
  for (let i = N + 1; i < len; i++) out[i] = rho * 0.5 * (out[i - N] + out[i - N - 1])
  out[N] = rho * 0.5 * out[0]
  const fade = Math.min(len, Math.floor(sampleRate * 0.05))
  for (let i = 0; i < fade; i++) out[len - 1 - i] *= i / fade
  return out
}

/** tanh 소프트 클리핑 커브(WaveShaper 용). 입력 [-1,1] → 출력 [-1,1] 단조 */
export function softClipCurve(n = 1024, drive = 3): Float32Array<ArrayBuffer> {
  const c = new Float32Array(n), k = Math.tanh(drive)
  for (let i = 0; i < n; i++) c[i] = Math.tanh(drive * ((2 * i) / (n - 1) - 1)) / k
  return c
}

/** 하드 클리핑 커브. |x| ≤ 1/drive 구간은 선형, 그 밖은 ±1 */
export function hardClipCurve(n = 1024, drive = 4): Float32Array<ArrayBuffer> {
  const c = new Float32Array(n)
  for (let i = 0; i < n; i++) c[i] = Math.max(-1, Math.min(1, drive * ((2 * i) / (n - 1) - 1)))
  return c
}

/** 볼륨 슬라이더 0..1 → 선형 gain. 제곱 = 대략 dB 곡선(0.5 → −12 dB) */
export const volumeToGain = (v: number): number => Math.max(0, Math.min(1, v)) ** 2
