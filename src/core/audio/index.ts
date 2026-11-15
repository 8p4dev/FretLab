// 사운드 엔진 — 공유 계약 orchestration_fretlab.md §3.4 (에이전트 C 소유).
// 설계: docs/plans/agent_C_audio.md(KS) · agent_C_tones.md(샘플 톤).
// 노트(샘플 버퍼 소스, 로드 전엔 KS 합성 폴백 → gain) → 톤 버스 → 마스터(리미터 → 볼륨) → destination.
// 샘플은 public/tones/(같은 origin, precache 밖)에서 첫 제스처·톤 변경 때 지연 로드한다.
import { getSettings } from '../settings'
import type { Midi, Tone } from '../types'
import { midiToHz, pickZone, pluckBuffer, pluckPeriod, volumeToGain, zoneRate, type Zone } from './synth'

export * from './synth'

const BUF_SEC = 2.5
/** 톤별 노트 감쇠 시간상수(초) — 길수록 서스테인 */
const DECAY: Record<Tone, number> = { clean: 1, distortion: 1.5 }

let ctx: AudioContext | undefined
let master: GainNode
let buses: Record<Tone, AudioNode>
const buffers = new Map<Midi, AudioBuffer>()
/** 톤별 샘플: 로드 요청(동시 1회)과 로드가 끝난 존들 */
const loading: Partial<Record<Tone, Promise<void>>> = {}
const samples: Partial<Record<Tone, (Zone & { buf: AudioBuffer })[]>> = {}
const active = new Map<Midi, { src: AudioBufferSourceNode; g: GainNode }>()

function chain(nodes: AudioNode[], out: AudioNode): AudioNode {
  nodes.reduce((a, b) => (a.connect(b), b)).connect(out)
  return nodes[0]
}
const filter = (c: AudioContext, type: BiquadFilterType, frequency: number, Q = 0.7, gain = 0) =>
  new BiquadFilterNode(c, { type, frequency, Q, gain })
const gain = (c: AudioContext, value: number) => new GainNode(c, { gain: value })

function setup(c: AudioContext): void {
  master = gain(c, 0)
  const limiter = new DynamicsCompressorNode(c, { threshold: -6, knee: 4, ratio: 12, attack: 0.002, release: 0.12 })
  limiter.connect(master).connect(c.destination)
  // 샘플이 이미 그 소리다 — 버스는 레벨 맞춤(디스토션 샘플 RMS ≈ 클린의 2.7배 → 0.4)과 가벼운 캐비닛 로우패스만(디스토션을 또 찌그러뜨리지 않는다)
  buses = {
    clean: chain([gain(c, 1)], limiter),
    distortion: chain([filter(c, 'lowpass', 6000), gain(c, 0.4)], limiter),
  }
}

/** 톤 샘플 지연 로드(멱등). 실패(오프라인 등)는 조용히 — KS 폴백이 계속 울린다 */
function loadTone(c: AudioContext, tone: Tone): void {
  // ponytail: 실패한 톤은 이 세션에서 재시도하지 않는다. 필요해지면 catch 에서 loading[tone] 을 지운다.
  loading[tone] ??= (async () => {
    const get = async (path: string) => {
      const r = await fetch(`${import.meta.env.BASE_URL}tones/${path}`)
      if (!r.ok) throw new Error(path)
      return r
    }
    const { zones } = (await (await get(`${tone}.json`)).json()) as { zones: Zone[] }
    samples[tone] = await Promise.all(
      zones.map(async (z) => ({ ...z, buf: await c.decodeAudioData(await (await get(`${tone}/${z.file}`)).arrayBuffer()) })),
    )
  })().catch(() => {})
}

/** 첫 사용자 제스처(pointerdown 등)에서 호출 — AudioContext 생성·resume + 현재 톤 샘플 prefetch. 여러 번 불러도 안전 */
export function unlockAudio(): void {
  if (typeof AudioContext === 'undefined') return
  if (!ctx) {
    ctx = new AudioContext({ latencyHint: 'interactive' })
    setup(ctx)
    // 탭 밖에 갔다 오면 suspended 일 수 있다(iOS) — 보이면 다시 켠다
    document.addEventListener('visibilitychange', () => { if (!document.hidden && ctx?.state !== 'running') void ctx?.resume().catch(() => {}) })
  }
  if (ctx.state !== 'running') void ctx.resume().catch(() => {})
  loadTone(ctx, getSettings().tone)
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
  const { tone, volume, muted, sustain, mono } = getSettings()
  const t = c.currentTime
  master.gain.setValueAtTime(muted ? 0 : volumeToGain(volume), t)
  if (muted) return

  // 같은 음 재타격(단음 모드면 울리던 음 전부): 15 ms 페이드아웃
  for (const [m, prev] of active) {
    if (!mono && m !== midi) continue
    prev.g.gain.cancelScheduledValues(t)
    prev.g.gain.setValueAtTime(prev.g.gain.value, t)
    prev.g.gain.linearRampToValueAtTime(0, t + 0.015)
    prev.src.stop(t + 0.02)
    active.delete(m)
  }

  // 소스는 하나만: 톤 샘플이 로드됐으면 샘플, 아니면 KS 폴백
  const hz = midiToHz(midi)
  const z = samples[tone] && pickZone(samples[tone], midi)
  const src = new AudioBufferSourceNode(c, z ? {
    buffer: z.buf,
    playbackRate: zoneRate(z, midi),
    loop: z.loopStart >= 1 && z.loopStart < z.loopEnd,
    loopStart: z.loopStart / z.sampleRate,
    loopEnd: z.loopEnd / z.sampleRate,
  } : {
    buffer: bufferFor(c, midi),
    playbackRate: (hz * (pluckPeriod(hz, c.sampleRate) + 0.5)) / c.sampleRate,
  })
  const v = Math.max(0, Math.min(1, opts?.velocity ?? 0.8))
  const g = gain(c, 0.2 + 0.8 * v)
  const decay = (DECAY[tone] ?? DECAY.clean) * 4 ** (2 * sustain - 1) // 슬라이더 0..1 → 1/4배..4배
  const len = z ? Math.min(Math.max(BUF_SEC, decay * 4), 8) : BUF_SEC // KS 버퍼는 2.5초뿐, 루프 샘플은 감쇠만큼 더 울린다
  g.gain.setTargetAtTime(0, t + 0.03, decay)
  g.gain.setTargetAtTime(0, t + len - 0.2, 0.04) // 루프 샘플은 끝이 없다 — 끊기 전 빠른 감쇠(클릭 방지)
  src.connect(g).connect(buses[tone] ?? buses.clean)
  src.onended = () => { src.disconnect(); g.disconnect(); if (active.get(midi)?.src === src) active.delete(midi) }
  src.start(t)
  src.stop(t + len)
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
