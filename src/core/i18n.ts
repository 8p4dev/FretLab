// i18n — 공유 계약 orchestration_fretlab_i18n.md §3 (오케스트레이터 소유). 사전은 모듈별 strings.ts 에 Str 객체로 두고 tr/useT 로 고른다.
import { getSettings, useSettings } from './settings'

export type Lang = 'en' | 'ko' | 'ja'
export const LANGS: { id: Lang; label: string }[] = [{ id: 'en', label: 'English' }, { id: 'ko', label: '한국어' }, { id: 'ja', label: '日本語' }]
/** 한 문구의 세 언어 */
export type Str = { en: string; ko: string; ja: string }

export const tr = (s: Str, lang: Lang = getSettings().lang): string => s[lang] ?? s.en
/** `{n}` 자리 치환 */
export const fmt = (s: string, vars: Record<string, string | number>): string => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
/** 스케일·그룹·튜닝 이름: name = 영문, nameKo/nameJa 없으면 영문 */
export const localName = (x: { name: string; nameKo?: string; nameJa?: string }, lang: Lang = getSettings().lang): string =>
  (lang === 'ko' ? x.nameKo : lang === 'ja' ? x.nameJa : undefined) ?? x.name
/** 화면용: 언어가 바뀌면 다시 렌더 */
export function useT(): { t: (s: Str) => string; lang: Lang } {
  const { lang } = useSettings()
  return { t: (s) => tr(s, lang), lang }
}
