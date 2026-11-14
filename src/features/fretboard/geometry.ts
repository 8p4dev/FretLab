// 프렛보드 기하 — 순수 함수. 단위: 비 fill 은 viewBox 단위(셀 60×36), fill 은 px(부모 크기로 역산). B 소유.

/** 인레이 점이 있는 프렛. 12·24 는 2점 */
export const INLAY = new Set([3, 5, 7, 9, 12, 15, 17, 19, 21, 24])
export const DOUBLE_INLAY = new Set([12, 24])

const NUM_H = 18 // 프렛 번호 띠 높이

export type Layout = {
  w: number; h: number
  /** 셀(프렛 한 칸) 폭, 줄 간격 */
  cw: number; sg: number
  /** 마크 한 변, 라벨 글자 크기, 번호 글자 크기, 인레이 반지름 */
  mark: number; font: number; numFont: number; dot: number
  /** 프렛 f 셀의 왼쪽 x */
  x: (f: number) => number
  /** 줄 s 의 y (0 = 가장 낮은 줄 = 아래) */
  y: (s: number) => number
  /** 번호 글자 기준선 y, 인레이 중심 y */
  numY: number; midY: number
  cols: number
}

/**
 * n 줄, 프렛 [lo,hi]. fill 이면 (w,h) px 를 가득 채우도록 셀 크기를 역산한다.
 * 프렛 폭은 균등(실제 기타처럼 줄지 않음 — 가독 우선).
 */
export function layout(n: number, lo: number, hi: number, fill?: { w: number; h: number }): Layout {
  const cols = hi - lo + 1
  const padX = 4
  let cw = 60, sg = 36
  if (fill && fill.w > 0 && fill.h > 0) {
    cw = (fill.w - padX * 2) / cols
    // 위아래 여백 .45sg(마크 반쪽) + 번호 띠
    sg = (fill.h - NUM_H) / (n - 1 + 0.9)
  }
  const padT = sg * 0.45
  const w = padX * 2 + cw * cols
  const h = padT + sg * (n - 1) + sg * 0.45 + NUM_H
  const mark = Math.min(sg * 0.78, cw * 0.9)
  return {
    w, h, cw, sg, cols, mark,
    font: mark * 0.56,
    numFont: Math.max(10, Math.min(13, sg * 0.34)),
    dot: sg * 0.13,
    x: (f) => padX + (f - lo) * cw,
    y: (s) => padT + (n - 1 - s) * sg,
    numY: padT + sg * (n - 1) + sg * 0.45 + NUM_H - 4,
    midY: padT + (sg * (n - 1)) / 2,
  }
}

/** 프렛 번호를 보일지: 칸이 적으면 전부, 많으면 인레이 프렛 + 첫 칸(lo>0) */
export const showNumber = (f: number, lo: number, cols: number): boolean =>
  f > 0 && (cols <= 13 || INLAY.has(f) || f === lo)

/** 줄 굵기(px): 낮은 줄이 굵다 */
export const stringWidth = (s: number, n: number): number => 1 + (n - 1 - s) * 0.45
