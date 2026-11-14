// 앱 셸 — 오케스트레이터 소유 (orchestration_fretlab.md §3.1). 상단 바: [■ FretLab] 연습 그립 … [테마]. 그립 화면은 셸 없이 전체화면.
import { useEffect } from 'preact/hooks'
import { href, useRoute } from './router'
import { Toaster } from './features/Toast'
import { TooltipLayer } from './ui/Tooltip'
import ThemeToggle from './ui/ThemeToggle'
import StudyPage from './features/study/StudyPage'
import GripPage from './features/grip/GripPage'
import { unlockAudio } from './core/audio'

export default function App() {
  const r = useRoute()
  // 첫 제스처에서 오디오 잠금 해제(iOS). 한 번만
  useEffect(() => {
    const on = () => { unlockAudio(); removeEventListener('pointerdown', on) }
    addEventListener('pointerdown', on, { passive: true })
    return () => removeEventListener('pointerdown', on)
  }, [])
  useEffect(() => { document.title = r.name === 'grip' ? '그립 — FretLab' : 'FretLab' }, [r])
  if (r.name === 'grip') return <><GripPage /><Toaster /></>
  return (
    <>
      <nav className="topnav">
        <a className="brand" href={href.study()} aria-label="FretLab"><span className="brand-mark" aria-hidden />FretLab</a>
        <a aria-current={r.name === 'study' ? 'page' : undefined} href={href.study()}>연습</a>
        <a href={href.grip()}>그립</a>
        <span className="topnav-spacer" />
        <ThemeToggle />
      </nav>
      <main>
        <StudyPage mode={r.mode} />
      </main>
      <Toaster />
      <TooltipLayer />
    </>
  )
}
