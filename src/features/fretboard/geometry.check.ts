// 자가 검사 — `npx tsx src/features/fretboard/geometry.check.ts`. 실패하면 throw.
import { K, isWound, layout, stringPx, wirePos, wirePx } from './geometry.ts'

const assert = (ok: unknown, msg: string): void => {
  if (!ok) throw new Error(msg)
}
const near = (a: number, b: number): boolean => Math.abs(a - b) < 1e-6

// 1. x(f) 단조 증가, 칸 폭 양수, 칸이 이어짐, 폭 합 = 지판 폭 — 전체 창과 부분 창 모두
const WINDOWS: [number, number][] = [[0, 12], [0, 15], [0, 22], [0, 24], [0, 8], [1, 5], [5, 9], [4, 8], [12, 17], [17, 21], [20, 24], [0, 0], [3, 3]]
for (const [lo, hi] of WINDOWS) {
  for (const fill of [undefined, { w: 844, h: 390 }]) {
    const L = layout(6, lo, hi, fill), tag = `[${lo},${hi}]${fill ? ' fill' : ''}`
    let sum = 0
    for (let f = lo; f <= hi; f++) {
      assert(L.cwAt(f) > 0, `${tag} 칸 ${f} 폭 ≤ 0`)
      if (f > lo) assert(L.x(f) > L.x(f - 1) && near(L.x(f), L.x(f - 1) + L.cwAt(f - 1)), `${tag} x(${f}) 가 이어지지 않음`)
      if (f > 1 && f > lo) assert(L.cwAt(f) < L.cwAt(f - 1), `${tag} 칸 ${f} 이 앞 칸보다 넓음`)
      if (f > 0) sum += L.cwAt(f)
      assert(L.markAt(f) <= L.sg * 0.74 + 1e-9 && L.markAt(f) <= L.cwAt(f) * 0.86 + 1e-9, `${tag} 마크 ${f} 지름`)
    }
    assert(near(sum, L.boardW), `${tag} 프렛 칸 폭 합 ${sum} ≠ 지판 폭 ${L.boardW}`)
    assert(near(L.x(hi) + L.cwAt(hi), L.boardX + L.boardW), `${tag} 마지막 칸 오른쪽 ≠ 지판 오른쪽`)
    assert(near(L.x(lo) + L.cw * L.cols, L.boardX + L.boardW), `${tag} 전체 폭`)
    assert(near(L.w, L.boardX + L.boardW + L.padX), `${tag} viewBox 폭`)
    if (fill) assert(near(L.w, fill.w) && near(L.h, fill.h), `${tag} fill 크기 ${L.w}×${L.h}`)
  }
}

// 2. 15프렛 칸 / 1프렛 칸 ≥ 0.7 (프렛 수 옵션 15·22·24), K 가 그 최대값(+.01 이면 0–24 에서 깨짐)
const ratio = (hi: number, k = K): number =>
  (wirePos(15, 0, hi, k) - wirePos(14, 0, hi, k)) / (wirePos(1, 0, hi, k) - wirePos(0, 0, hi, k))
for (const hi of [15, 22, 24]) {
  const L = layout(6, 0, hi)
  assert(near(L.cwAt(15) / L.cwAt(1), ratio(hi)), `0–${hi} layout 과 wirePos 불일치`)
  assert(ratio(hi) >= 0.7, `0–${hi}: 15/1 칸 비율 ${ratio(hi).toFixed(4)} < 0.7`)
}
assert(ratio(24, K + 0.01) < 0.7, `K=${K} 가 최대가 아님(K+.01 도 통과)`)
assert(K > 0.3, 'K 가 너무 작다(실물 비율이 안 보임)')

// 3. 줄 y: 6/7현 등간격(sg), 낮은 줄이 아래, 지판 위아래 여백 = sg × .45, 인레이 중심 = 지판 가운데
for (const n of [6, 7]) {
  for (const fill of [undefined, { w: 844, h: 390 }]) {
    const L = layout(n, 0, 12, fill)
    for (let s = 1; s < n; s++) assert(near(L.y(s - 1) - L.y(s), L.sg), `${n}현 줄 간격 ${s}`)
    assert(near(L.y(n - 1) - L.top, L.sg * 0.45) && near(L.bottom - L.y(0), L.sg * 0.45), `${n}현 지판 여백`)
    assert(near(L.midY, (L.y(0) + L.y(n - 1)) / 2), `${n}현 midY`)
    assert(L.numY > L.bottom && L.numY <= L.h, `${n}현 번호 위치`)
  }
}

// 4. 그립(844×390 fill): 4~5칸 창의 모든 셀 ≥ 120×56
for (const [lo, hi] of [[1, 5], [5, 9], [5, 8], [12, 16], [20, 24]]) {
  const L = layout(6, lo, hi, { w: 844, h: 390 })
  assert(L.sg >= 56, `그립 [${lo},${hi}] 줄 간격 ${L.sg.toFixed(1)} < 56`)
  for (let f = lo; f <= hi; f++) assert(L.cwAt(f) >= 120, `그립 [${lo},${hi}] 칸 ${f} 폭 ${L.cwAt(f).toFixed(1)} < 120`)
}

// 5. 줄 굵기: 낮은 줄일수록 굵다, 범위, 플레인 3줄
for (const n of [6, 7]) {
  for (const fill of [false, true]) {
    const [min, max] = fill ? [1.5, 5.5] : [1.2, 4]
    assert(near(stringPx(n - 1, n, fill), min) && near(stringPx(0, n, fill), max), `${n}현 줄 굵기 범위`)
    for (let s = 1; s < n; s++) assert(stringPx(s, n, fill) < stringPx(s - 1, n, fill), `${n}현 줄 굵기 순서 ${s}`)
  }
  assert([...Array(n).keys()].filter((s) => !isWound(s, n)).length === 3 && !isWound(n - 1, n) && isWound(0, n), `${n}현 와운드`)
}

// 6. 프렛 와이어: 2~5px, 칸 폭의 6.5%
assert(wirePx(10) === 2 && wirePx(500) === 5 && near(wirePx(60), 3.9), 'wirePx')

console.log(`geometry.check ok — K=${K}, 15/1 칸 비율 0–15 ${ratio(15).toFixed(3)} · 0–22 ${ratio(22).toFixed(3)} · 0–24 ${ratio(24).toFixed(3)}`)
