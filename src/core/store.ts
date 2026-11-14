// 외부 스토어 구독 훅 — preact/hooks 에는 useSyncExternalStore 가 없어(compat 전용) 같은 뜻의 작은 훅을 둔다. 공유 계약 orchestration_fretlab.md §3.6
import { useEffect, useState } from 'preact/hooks'

export function useStore<T>(subscribe: (f: () => void) => () => void, read: () => T): T {
  const [v, set] = useState(read)
  useEffect(() => {
    set(read())
    return subscribe(() => set(read()))
  }, [subscribe, read])
  return v
}
