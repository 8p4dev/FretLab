// 스케일 검색 매칭 — 순수 함수 (F 소유). 한글 이름·영문 이름·별칭·id 를 소문자 + 공백 제거로 비교한다. 검사: search.check.ts
import type { Scale } from '../../core/types'

export const normalize = (s: string): string => s.toLowerCase().replace(/\s+/g, '')

/** 빈 검색어는 전부 매칭 */
export function matchScale(scale: Scale, query: string): boolean {
  const q = normalize(query)
  if (!q) return true
  return [scale.nameKo, scale.name, scale.id, ...(scale.aliases ?? [])].some((t) => normalize(t).includes(q))
}
