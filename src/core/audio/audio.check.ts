// 자가 검사(순수 부분) — `npx tsx src/core/audio/audio.check.ts`. Web Audio 는 Node 에 없어 index.ts 는 검사하지 않는다.
import { hardClipCurve, midiToHz, pickZone, pluckBuffer, pluckPeriod, softClipCurve, volumeToGain, zoneRate, type Zone } from './synth.ts'

const ok = (cond: boolean, msg: string) => { if (!cond) throw new Error(msg) }
const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps

// 주파수
ok(near(midiToHz(69), 440), 'midi 69 = 440')
ok(near(midiToHz(57), 220), 'midi 57 = 220')
ok(near(midiToHz(81), 880), 'midi 81 = 880')
ok(near(midiToHz(40), 82.4068892, 1e-5), 'midi 40 = E2')

// 지연선 길이와 피치 보정: 보정 후 오차 0
for (const m of [40, 57, 69, 88]) {
  const hz = midiToHz(m), sr = 48000, N = pluckPeriod(hz, sr)
  ok(near(hz * (N + 0.5) / sr * (sr / (N + 0.5)), hz), `pitch correction ${m}`)
  ok(N >= 2 && Math.abs(sr / (N + 0.5) - hz) / hz < 0.012, `period ${m}: raw error`)
}

// 버퍼: 길이, 범위, 끝 0, 감쇠
const sr = 44100, sec = 2.5
const buf = pluckBuffer(midiToHz(57), sr, sec)
ok(buf.length === Math.floor(sr * sec), 'buffer length')
let peak = 0
for (const v of buf) { ok(Number.isFinite(v), 'finite'); peak = Math.max(peak, Math.abs(v)) }
ok(peak <= 1 && peak > 0.2, `peak in range (${peak})`)
ok(buf[buf.length - 1] === 0, 'ends at zero')
const rms = (a: Float32Array) => Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length)
const head = rms(buf.subarray(0, sr * 0.2)), mid = rms(buf.subarray(sr, sr * 1.2)), tail = rms(buf.subarray(sr * 2.3))
ok(head > mid && mid > tail, `decays (${head} > ${mid} > ${tail})`)
ok(tail < head * 0.05, 'tail quiet (T60)')

// 클리핑 커브: 범위, 단조, 홀대칭
for (const c of [softClipCurve(), hardClipCurve()]) {
  ok(c.length === 1024, 'curve length')
  ok(near(c[0], -1) && near(c[c.length - 1], 1), 'curve ends ±1')
  for (let i = 1; i < c.length; i++) ok(c[i] >= c[i - 1] && c[i] >= -1 && c[i] <= 1, 'curve monotone in [-1,1]')
  for (let i = 0; i < c.length; i++) ok(near(c[i], -c[c.length - 1 - i], 1e-6), 'curve odd-symmetric')
}
ok(softClipCurve()[512] < hardClipCurve()[512] + 0.01 && hardClipCurve(1024, 4)[640] === 1, 'hard clips flat')

// 볼륨
ok(volumeToGain(0) === 0 && volumeToGain(1) === 1 && volumeToGain(2) === 1 && volumeToGain(-1) === 0, 'volume clamps')
ok(volumeToGain(0.5) < 0.5 && volumeToGain(0.5) > volumeToGain(0.3), 'volume curve')

// 샘플 존 선택·playbackRate
const zone = (lo: number, hi: number, root: number, fine = 0): Zone =>
  ({ lo, hi, root, coarse: 0, fine, sampleRate: 22050, loopStart: 100, loopEnd: 200, file: `${root}.mp3` })
const zones = [zone(36, 44, 40), zone(45, 49, 45), zone(50, 54, 50, -10)]
ok(pickZone(zones, 45).root === 45 && near(zoneRate(pickZone(zones, 45), 45), 1), 'midi 45 → root 45, rate 1')
ok(near(zoneRate(pickZone(zones, 47), 47), 2 ** (2 / 12)), 'midi 47 → 2^(2/12)')
ok(pickZone(zones, 36).root === 40 && near(zoneRate(zones[0], 36), 2 ** (-4 / 12)), 'midi 36 → root 40 아래로')
ok(pickZone(zones, 20).root === 40 && pickZone(zones, 100).root === 50, '범위 밖 → 가장 가까운 root')
ok(near(zoneRate(zones[2], 50), 2 ** (-10 / 1200)), 'fine −10 센트 → rate 2^(−10/1200)')
ok(near(zoneRate({ ...zones[1], coarse: 1 }, 45), 2 ** (1 / 12)), 'coarse 1 → 반음 위')

console.log('audio.check ok')
