// 테마 토글 — DrillDown 01 §3.7: 2칸 세그먼트(light sun / dark moon) 36×32. 선택 칸 반전, role=group, 각 칸 aria-pressed + 툴팁.
import { I } from './icons'
import { Icon } from './Icon'
import { useTheme, type Theme } from './theme'
import { haptic } from '../features/feel'

const CELLS: { v: Theme; icon: string; label: string }[] = [
  { v: 'light', icon: I.sun, label: '라이트' },
  { v: 'dark', icon: I.moon, label: '다크' },
]

export default function ThemeToggle() {
  const { theme, set } = useTheme()
  return (
    <div role="group" aria-label="테마" className="seg theme-toggle">
      {CELLS.map((c) => (
        <button key={c.v} type="button" aria-pressed={theme === c.v} aria-label={c.label} data-tip={c.label} onClick={() => { set(c.v); haptic('tap') }}>
          <Icon d={c.icon} size={16} />
        </button>
      ))}
    </div>
  )
}
