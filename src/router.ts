// 라우터 — 공유 계약 orchestration_fretlab.md §3.1 (오케스트레이터 소유). 해시 라우터. 스케일·키 등은 URL 이 아니라 settings 에 있다.
import { useEffect, useState } from 'preact/hooks'
import type { StudyMode } from './core/types'

export type Route = { name: 'study'; mode: StudyMode } | { name: 'grip' }

const MODES: StudyMode[] = ['view', 'fill', 'follow']

function parse(hash: string): Route {
  const p = hash.replace(/^#/, '').split('/').filter(Boolean)
  if (p[0] === 'grip') return { name: 'grip' }
  if (p[0] === 'study') return { name: 'study', mode: MODES.find((m) => m === p[1]) ?? 'view' }
  return { name: 'study', mode: 'view' }
}

export const href = {
  study: (mode: StudyMode = 'view') => (mode === 'view' ? '#/' : `#/study/${mode}`),
  grip: () => '#/grip',
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(location.hash))
  useEffect(() => {
    const on = () => setRoute(parse(location.hash))
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  return route
}
