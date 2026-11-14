// 사운드 엔진 — 공유 계약 orchestration_fretlab.md §3.4 (에이전트 C 소유). Web Audio 합성만, 에셋 0.
// 설계: docs/plans/agent_C_audio.md. 노트(KS 버퍼 소스 → gain) → 톤 버스(공유 EQ/디스토션) → 마스터(리미터 → 볼륨) → destination.
import { getSettings } from '../settings'
import type { Midi, Tone } from '../types'
import { hardClipCurve, midiToHz, pluckBuffer, pluckPeriod, softClipCurve, volumeToGain } from './synth'

export * from './synth'

const BUF_SEC = 2.5
/** 톤별 노트 감쇠 시간상수(초) — 길수록 서스테인 */
const DECAY: Record<Tone, number> = { acoustic: 0.45, rock: 0.8, metal: 1.2 }

let ctx: AudioContext | undefined
let master: GainNode
let buses: Record<Tone, AudioNode>
const buffers = new Map<Midi, AudioBuffer>()
const active = new Map<Midi, { src: AudioBufferSourceNode; g: GainNode }>()

function chain(nodes: AudioNode[], out: AudioNode): AudioNode {
  nodes.reduce((a, b) => (a.connect(b), b)).connect(out)
  return nodes[0]
}
const filter = (c: AudioContext, type: BiquadFilterType, frequency: number, Q = 0.7, gain = 0) =>
  new BiquadFilterNode(c, { type, frequency, Q, gain })
const gain = (c: AudioContext, value: number) => new GainNode(c, { gain: value })
const shaper = (c: AudioContext, curve: Float32Array<ArrayBuffer>) => new WaveShaperNode(c, { curve, oversample: '2x' })

function setup(c: AudioContext): void {
  master = gain(c, 0)
  const limiter = new DynamicsCompressorNode(c, { threshold: -6, knee: 4, ratio: 12, attack: 0.002, release: 0.12 })
  limiter.connect(master).connect(c.destination)
  buses = {
    acoustic: chain([filter(c, 'peaking', 170, 1.2, 6), filter(c, 'lowpass', 5000)], limiter),
    rock: chain([gain(c, 8), shaper(c, softClipCurve()), filter(c, 'lowpass', 4500), gain(c, 0.35)], limiter),
    metal: chain([
      filter(c, 'highpass', 120), gain(c, 40), shaper(c, hardClipCurve()),
      filter(c, 'peaking', 800, 0.8, -12), filter(c, 'lowpass', 6000), gain(c, 0.3),
    ], limiter),
  }
}

/** 첫 사용자 제스처(pointerdown 등)에서 호출 — AudioContext 생성·resume. 여러 번 불러도 안전 */
export function unlockAudio(): void {
  if (typeof AudioContext === 'undefined') return
  if (!ctx) { ctx = new AudioContext(); setup(ctx) }
  if (ctx.state !== 'running') void ctx.resume().catch(() => {})
}

function bufferFor(c: AudioContext, midi: Midi): AudioBuffer {
  let b = buffers.get(midi)
  if (!b) {
    b = new AudioBuffer({ length: Math.floor(c.sampleRate * BUF_SEC), sampleRate: c.sampleRate })
    b.copyToChannel(pluckBuffer(midiToHz(midi), c.sampleRate, BUF_SEC), 0)
    buffers.set(midi, b)
  }
  return b
}

/** 음 하나. velocity 0..1 */
export function playNote(midi: Midi, opts?: { velocity?: number }): void {
  unlockAudio()
  const c = ctx
  if (!c) return
  const { tone, volume, muted } = getSettings()
  const t = c.currentTime
  master.gain.setValueAtTime(muted ? 0 : volumeToGain(volume), t)
  if (muted) return

  // 같은 음 재타격: 이전 음은 15 ms 페이드아웃
  const prev = active.get(midi)
  if (prev) {
    prev.g.gain.cancelScheduledValues(t)
    prev.g.gain.setValueAtTime(prev.g.gain.value, t)
    prev.g.gain.linearRampToValueAtTime(0, t + 0.015)
    prev.src.stop(t + 0.02)
    active.delete(midi)
  }

  const hz = midiToHz(midi)
  const src = new AudioBufferSourceNode(c, {
    buffer: bufferFor(c, midi),
    playbackRate: (hz * (pluckPeriod(hz, c.sampleRate) + 0.5)) / c.sampleRate,
  })
  const v = Math.max(0, Math.min(1, opts?.velocity ?? 0.8))
  const g = gain(c, 0.2 + 0.8 * v)
  g.gain.setTargetAtTime(0, t + 0.03, DECAY[tone] ?? DECAY.rock)
  src.connect(g).connect(buses[tone] ?? buses.rock)
  src.onended = () => { src.disconnect(); g.disconnect(); if (active.get(midi)?.src === src) active.delete(midi) }
  src.start(t)
  active.set(midi, { src, g })
}

/** 순서대로 재생(들어보기). 반환값은 중단 함수 */
export function playSequence(midis: Midi[], gapMs = 220): () => void {
  let i = 0, timer: ReturnType<typeof setTimeout> | undefined
  const tick = () => {
    if (i >= midis.length) return
    playNote(midis[i++])
    timer = setTimeout(tick, gapMs)
  }
  tick()
  return () => clearTimeout(timer)
}
