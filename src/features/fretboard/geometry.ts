// 프렛보드 기하 — 순수 함수. 단위: 비 fill 은 viewBox 단위(평균 셀 60×36), fill 은 px(부모 크기로 역산). B 소유.
// 검사: `npx tsx src/features/fretboard/geometry.check.ts`

/** 인레이 점이 있는 프렛. 12·24 는 2점 */
export const INLAY = new Set([3, 5, 7, 9, 12, 15, 17, 19, 21, 24])
export const DOUBLE_INLAY = new Set([12, 24])

/**
 * 실물 비율 혼합 계수(3차 R1 간격). 0 = 균등, 1 = 실물(12평균율).
 * 0–24 창에서 15프렛 칸 ≥ 1프렛 칸 × 0.7 이 되는 최대값(≈ .396)을 내림. 창이 좁을수록 비율은 더 좋아진다.
 */
export const K = 0.39

/** 너트에서 프렛 f 까지 거리(스케일 길이 = 1) */
/** 바깥 줄에서 지판 가장자리까지(줄 간격 배수). 실물 ≈ 3mm / 7~10mm */
const EDGE = 0.45

const real = (f: number): number => 1 - 2 ** (-f / 12)

/** 와이어 f 의 위치 0..1 — 지판 창이 와이어 a(왼쪽 끝) ~ b(오른쪽 끝)일 때. 와이어 0 = 너트. k 는 검사용 */
export const wirePos = (f: number, a: number, b: number, k = K): number =>
  b <= a ? 0 : ((1 - k) * (f - a)) / (b - a) + (k * (real(f) - real(a))) / (real(b) - real(a))

export type Layout = {
  w: number; h: number
  /** 평균 칸 폭(개방 칸 폭도 이 값), 줄 간격 */
  cw: number; sg: number
  /** 평균 칸 기준 마크 지름·라벨 글자 크기(칸마다 다른 값은 markAt), 번호 글자 크기, 인레이 반지름 */
  mark: number; font: number; numFont: number; dot: number
  /** 프렛 f 칸의 왼쪽 x / 폭 / 중심 x. 0 = 개방(너트 왼쪽, 지판 밖) */
  x: (f: number) => number
  cwAt: (f: number) => number
  cx: (f: number) => number
  /** 프렛 f 칸의 마크 지름 = min(줄 간격 × .74, 칸 폭 × .86) */
  markAt: (f: number) => number
  /** 와이어 f 의 x (0 = 너트). 칸 f 의 오른쪽 끝 */
  wireX: (f: number) => number
  /** 줄 s 의 y (0 = 가장 낮은 줄 = 아래) */
  y: (s: number) => number
  /** 지판 사각: 왼쪽 x, 폭, 위·아래 y */
  boardX: number; boardW: number; top: number; bottom: number
  /** 번호 글자 기준선 y, 인레이 중심 y */
  numY: number; midY: number
  padX: number
  cols: number
}

/**
 * n 줄, 프렛 [lo,hi]. fill 이면 (w,h) px 를 가득 채우도록 셀 크기를 역산한다.
 * 칸 폭은 실물 비율을 K 만큼 섞는다(wirePos). 왼쪽에 줄 이름 열(numFont × 1.9), 지판 위아래 여백은 줄 간격 × EDGE.
 */
export function layout(n: number, lo: number, hi: number, fill?: { w: number; h: number }): Layout {
  const cols = hi - lo + 1
  const padX = 4
  let cw = 60, sg = 36, numH = 18
  const numFontOf = (sg: number) => Math.max(10, Math.min(fill ? 16 : 13, sg * 0.34)) // U6: fill 은 상한 16
  if (fill && fill.w > 0 && fill.h > 0) {
    // 번호 띠 높이가 글자에 비례하므로 2패스
    numH = numFontOf((fill.h - numH) / (n - 1 + 2 * EDGE)) * 1.4
    sg = (fill.h - numH) / (n - 1 + 2 * EDGE)
  }
  const numFont = numFontOf(sg)
  const nameW = numFont * 1.9
  if (fill && fill.w > 0) cw = (fill.w - padX * 2 - nameW) / cols
  const open = lo === 0 ? 1 : 0
  const a = lo - 1 + open // 지판 왼쪽 끝 와이어
  const boardX = padX + nameW + open * cw, boardW = cw * (cols - open)
  const wireX = (f: number) => boardX + boardW * wirePos(f, a, hi)
  const x = (f: number) => (f === 0 ? padX + nameW : wireX(f - 1))
  const cwAt = (f: number) => (f === 0 ? cw : wireX(f) - wireX(f - 1))
  const markAt = (f: number) => Math.min(sg * 0.74, cwAt(f) * 0.86)
  const top = 0, bottom = sg * (n - 1 + 2 * EDGE)
  const mark = Math.min(sg * 0.74, cw * 0.86)
  return {
    w: padX * 2 + nameW + cw * cols, h: bottom + numH,
    cw, sg, cols, mark, numFont, padX,
    font: mark * 0.6,
    dot: sg * 0.16,
    x, cwAt, markAt, wireX,
    cx: (f) => x(f) + cwAt(f) / 2,
    y: (s) => sg * (n - 1 - s + EDGE),
    boardX, boardW, top, bottom,
    numY: bottom + numH - 4,
    midY: bottom / 2,
  }
}

/** 프렛 번호를 보일지: 칸이 적으면 전부, 많으면 인레이 프렛 + 첫 칸(lo>0) */
export const showNumber = (f: number, lo: number, cols: number): boolean =>
  f > 0 && (cols <= 13 || INLAY.has(f) || f === lo)

/** 줄 게이지(1/1000 인치), 높은 줄부터. 7현은 .059 추가 */
const GAUGE = [10, 13, 17, 26, 36, 46, 59]
const gaugeOf = (s: number, n: number): number => GAUGE[Math.min(Math.max(n - 1 - s, 0), GAUGE.length - 1)]

/** 줄 굵기(화면 px): 게이지에 비례. 가장 가는 줄 1.2 ~ 가장 굵은 줄 4, fill(그립)은 1.5 ~ 5.5 */
export const stringPx = (s: number, n: number, fill?: boolean): number => {
  const t = (gaugeOf(s, n) - GAUGE[0]) / (gaugeOf(0, n) - GAUGE[0])
  return fill ? 1.5 + t * 4 : 1.2 + t * 2.8
}

/** 와운드 줄인지: 높은 쪽 3줄만 플레인 */
export const isWound = (s: number, n: number): boolean => n - 1 - s >= 3

/** 프렛 와이어 굵기(화면 px): 실물 2.4mm / 1프렛 칸 36mm ≈ 칸 폭의 6.5%, 2~5px. 너트는 이 값 × 2.5 */
export const wirePx = (cellPx: number): number => Math.max(2, Math.min(5, cellPx * 0.065))

/** 드래그 선택(U4): 포인터 id 가 셀 key 에 처음 들어가면 true(기록), 이미 들어갔던 셀·등록 안 된 포인터·key 없음은 false */
export const firstEntry = (seen: Map<number, Set<string>>, id: number, key: string | null | undefined): boolean => {
  const set = seen.get(id)
  if (!set || !key || set.has(key)) return false
  set.add(key)
  return true
}
