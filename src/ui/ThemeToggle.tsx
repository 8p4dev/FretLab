// 테마 토글 — DrillDown 01 §3.7: 2칸 세그먼트(light sun / dark moon) 36×32. 선택 칸 반전, role=group, 각 칸 aria-pressed + 툴팁.
import { I } from './icons'
import { Icon } from './Icon'
import { useTheme, type Theme } from './theme'
import { haptic } from '../features/feel'
import { useT, type Str } from '../core/i18n'
import { S } from '../strings'

const CELLS: { v: Theme; icon: string; label: Str }[] = [
  { v: 'light', icon: I.sun, label: S.light },
  { v: 'dark', icon: I.moon, label: S.dark },
]

export default function ThemeToggle() {
  const { theme, set } = useTheme()
  const { t } = useT()
  return (
    <div role="group" aria-label={t(S.theme)} className="seg theme-toggle">
      {CELLS.map((c) => (
        <button key={c.v} type="button" aria-pressed={theme === c.v} aria-label={t(c.label)} data-tip={t(c.label)} onClick={() => { set(c.v); haptic('tap') }}>
          <Icon d={c.icon} size={16} />
        </button>
      ))}
    </div>
  )
}
