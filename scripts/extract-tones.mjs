// 톤 샘플 추출(1회 실행, 산출물 커밋) — `node scripts/extract-tones.mjs`. Node 내장만.
// WebAudioFont 프리셋 js → public/tones/<tone>/<n>.mp3 + public/tones/<tone>.json. 설계: docs/plans/agent_C_tones.md
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import https from 'node:https'

const SRC = 'https://surikov.github.io/webaudiofontdata/sound/'
const TONES = { clean: '0270_FluidR3_GM_sf2_file', distortion: '0300_Aspirin_sf2_file' }
const LO = 36, HI = 92 // 앱이 내는 음역(가장 낮은 튜닝의 6번줄 개방 ~ 1번줄 24프렛 근처)
const OUT = new URL('../public/tones/', import.meta.url)

const get = (url) => new Promise((resolve, reject) => {
  https.get(url, (res) => {
    if (res.statusCode !== 200) return reject(new Error(`${url} → ${res.statusCode}`))
    const chunks = []
    res.on('data', (c) => chunks.push(c)).on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  }).on('error', reject)
})

/** `{ midi:30 ,originalPitch:3800 , … ,file:'SUQz…' }` 블록들 → 객체 배열 */
function parseZones(js) {
  return [...js.matchAll(/\{([^{}]*)\}/g)].map(([, body]) => {
    const z = {}
    for (const [, k, num, str] of body.matchAll(/(\w+)\s*:\s*(?:(-?[\d.]+)|'([^']*)')/g)) z[k] = str ?? Number(num)
    return z
  }).filter((z) => z.file)
}

let fail = false
for (const [tone, name] of Object.entries(TONES)) {
  const src = parseZones(await get(`${SRC}${name}.js`))
  // WebAudioFontPlayer.findZone 과 같은 규칙: 키 범위가 맞는 존 중 **마지막** 것. 음마다 고른 뒤 연속 구간으로 묶는다.
  const zones = []
  for (let m = LO; m <= HI; m++) {
    const z = src.findLast((s) => s.keyRangeLow <= m && m <= s.keyRangeHigh)
    if (!z) throw new Error(`${tone}: midi ${m} 에 맞는 존 없음`)
    const last = zones.at(-1)
    // 원본에 같은 샘플·같은 튜닝이 키 범위만 달리 중복돼 있다 → 한 존으로
    const same = (a, b) => ['file', 'originalPitch', 'coarseTune', 'fineTune', 'sampleRate', 'loopStart', 'loopEnd'].every((k) => a[k] === b[k])
    if (last && same(last.z, z)) last.hi = m
    else zones.push({ z, lo: m, hi: m })
  }
  const dir = new URL(`${tone}/`, OUT)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  const files = [] // 같은 base64 내용은 한 번만 쓴다
  let bytes = 0
  const out = zones.map(({ z, lo, hi }) => {
    let n = files.indexOf(z.file)
    if (n < 0) {
      n = files.push(z.file) - 1
      const mp3 = Buffer.from(z.file, 'base64')
      if (mp3.subarray(0, 3).toString('latin1') !== 'ID3') throw new Error(`${tone}/${n}: mp3(ID3) 가 아님`)
      writeFileSync(new URL(`${n}.mp3`, dir), mp3)
      bytes += mp3.length
    }
    return {
      lo, hi, root: z.originalPitch / 100, coarse: z.coarseTune, fine: z.fineTune,
      sampleRate: z.sampleRate, loopStart: z.loopStart, loopEnd: z.loopEnd, file: `${n}.mp3`,
    }
  })
  writeFileSync(new URL(`${tone}.json`, OUT), JSON.stringify({ zones: out }) + '\n')
  const kb = bytes / 1024
  console.log(`${tone}: 원본 존 ${src.length} → 존 ${out.length}, mp3 ${files.length}개 ${kb.toFixed(1)} KB`)
  for (const z of out) console.log(`  ${z.lo}-${z.hi} root ${z.root} fine ${z.fine} ${z.sampleRate} Hz loop ${z.loopStart}-${z.loopEnd} ${z.file}`)
  if (kb > 200) { console.error(`${tone}: 200 KB 초과`); fail = true }
}
if (fail) process.exit(1)
