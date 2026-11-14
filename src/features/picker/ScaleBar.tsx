// 스케일·옵션 선택 UI — 공유 계약 orchestration_fretlab.md §3.8 (에이전트 F 소유).
// ScaleBar: 현재 선택 요약 버튼("A 마이너 펜타토닉 · 스탠다드 · CAGED 2/5") → 시트(루트 12 · 스케일 구성 줄 · 검색+그룹 목록 · 포지션 시스템/순번).
// OptionsButton: 톱니 → 시트(튜닝 · 표기 · 프렛 수 · 사운드 3종/볼륨/음소거/미리듣기 · 시점 flat/player + 기울기 · 기본값으로).
// 상태는 전부 useSettings/patchSettings. 데이터 길이(SCALES·TUNINGS·positions)에 무관하게 그린다.
// 2차(U15~U22): 열릴 때 현재 스케일로 스크롤 + PC 검색 포커스(Sheet 의 첫 포커스 뒤 rAF), 구성 줄, 슬라이더 값, 루트 미리듣기, data-tip 툴팁, 기본값 복원.
import { useEffect, useRef, useState } from 'preact/hooks'
import { DEFAULTS, patchSettings, useSettings } from '../../core/settings'
import { SCALES, SCALE_GROUPS, TUNINGS, intervalName, noteName, positions, scaleById, scalePcs, tuningById } from '../../core/music'
import { playNote } from '../../core/audio'
import type { Accidental, FretView, LabelMode, PositionSystem, Tone } from '../../core/types'
import { Sheet } from '../../ui/Sheet'
import { I } from '../../ui/icons'
import { Icon } from '../../ui/Icon'
import { matchScale } from './search'
import './picker.css'

type Opts<T> = readonly (readonly [T, string, string?])[] // [값, 글자, 툴팁?]
const SYSTEMS: Opts<PositionSystem> = [['full', '전체'], ['caged', 'CAGED'], ['3nps', '3NPS']]
const LABELS: Opts<LabelMode> = [['note', '음이름'], ['degree', '도수'], ['interval', '인터벌'], ['none', '없음']]
const ACCIDENTALS: Opts<Accidental> = [['sharp', '#'], ['flat', 'b']]
const FRETS: Opts<number> = [[12, '12'], [15, '15'], [22, '22'], [24, '24']]
const TONES: Opts<Tone> = [['acoustic', '어쿠스틱', '맑고 짧게'], ['rock', '록', '오버드라이브'], ['metal', '메탈', '하이게인']]
const VIEWS: Opts<FretView> = [['flat', '평면'], ['player', '연주자']]
const PREVIEW_MIDI = 57 // A3 — 톤 미리듣기
const ROOT_MIDI = 48 // C3 — 루트 미리듣기 옥타브
const pct = (v: number) => `${Math.round(v * 100)}%`

/** 세그먼트(.seg) — 선택 = aria-pressed 반전(index.css 전역 규칙). 툴팁은 data-tip 만(접근 이름은 글자 그대로 — E2E) */
function Seg<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: Opts<T>; onChange: (v: T) => void }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([v, text, tip]) => (
        <button key={String(v)} type="button" aria-pressed={v === value} data-tip={tip} onClick={() => onChange(v)}>{text}</button>
      ))}
    </div>
  )
}

function Head({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <header className="sheet-head">
      <h2>{title}</h2>
      <button type="button" className="ghost" aria-label="닫기" data-tip="닫기" onClick={onClose}><Icon d={I.x} size={20} /></button>
    </header>
  )
}

export function ScaleBar({ compact }: { compact?: boolean }) {
  const s = useSettings()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const box = useRef<HTMLDivElement>(null)
  const scale = scaleById(s.scaleId), tuning = tuningById(s.tuningId)
  const all = positions(s.root, scale, tuning, s.system, s.fretCount)
  const count = all.length
  const position = Math.min(s.position, count - 1)
  const sysName = SYSTEMS.find(([id]) => id === s.system)?.[1] ?? s.system
  const order = `${position + 1}/${count}`
  const posText = s.system === 'full' ? '전체' : compact ? order : `${sysName} ${order}`
  const head = `${noteName(s.root, s.accidental)} ${scale.nameKo}`
  const summary = compact ? `${head} · ${posText}` : `${head} · ${tuning.name.replace(/\s*\(.*\)\s*$/, '')} · ${posText}`
  const formula = `${scale.intervals.map(intervalName).join(' ')} · ${scalePcs(s.root, scale).map((pc) => noteName(pc, s.accidental)).join(' ')}`
  const groups = SCALE_GROUPS
    .map((g) => ({ ...g, list: SCALES.filter((x) => x.group === g.id && matchScale(x, q)) }))
    .filter((g) => g.list.length)
  const close = () => { setOpen(false); setQ('') }

  // Sheet 가 닫기 버튼에 포커스를 준 뒤(rAF) 현재 스케일로 스크롤, PC 는 검색 입력에 포커스(coarse 는 키보드가 올라오므로 금지)
  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => {
      const el = box.current
      el?.querySelector('.picker-list > [aria-pressed="true"]')?.scrollIntoView({ block: 'center' })
      // preventScroll: 포커스가 입력을 보이게 다시 스크롤해 위의 scrollIntoView 를 되돌리지 않게
      if (matchMedia('(pointer: fine)').matches) el?.querySelector<HTMLInputElement>('input[type="search"]')?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(id)
  }, [open])

  return (
    <>
      <button
        type="button" className="scale-bar" aria-label="스케일 선택" aria-haspopup="dialog" aria-expanded={open}
        data-compact={compact || undefined} onClick={() => setOpen(true)}
      >
        <span className="scale-bar-text">{summary}</span>
        <Icon d={I.chevronDown} size={16} />
      </button>
      <Sheet open={open} onClose={close} label="스케일 선택">
        <div className="picker" ref={box}>
          <Head title="스케일 선택" onClose={close} />

          <h3 className="muted">루트</h3>
          <div className="picker-grid" role="group" aria-label="루트">
            {Array.from({ length: 12 }, (_, pc) => (
              <button key={pc} type="button" aria-pressed={pc === s.root} onClick={() => { patchSettings({ root: pc }); playNote(ROOT_MIDI + pc) }}>{noteName(pc, s.accidental)}</button>
            ))}
          </div>

          <h3 className="muted">스케일</h3>
          <p className="picker-formula tnum muted">{formula}</p>
          <input type="search" aria-label="스케일 검색" placeholder="스케일 검색 (한글·영문·별칭)" value={q} onInput={(e) => setQ(e.currentTarget.value)} />
          {groups.length === 0 && <p className="muted">일치하는 스케일이 없습니다</p>}
          {groups.map((g) => (
            <section key={g.id} className="picker-group">
              <h3 className="muted">{g.nameKo}</h3>
              <div className="picker-list">
                {g.list.map((x) => (
                  <button key={x.id} type="button" aria-pressed={x.id === s.scaleId} onClick={() => patchSettings({ scaleId: x.id })}>
                    <span>{x.nameKo}</span><small>{x.name}</small>
                  </button>
                ))}
              </div>
            </section>
          ))}

          <h3 className="muted">포지션</h3>
          <div className="picker-row">
            <Seg label="포지션 시스템" value={s.system} options={SYSTEMS} onChange={(system) => patchSettings({ system })} />
            {s.system !== 'full' && (
              <Seg
                label="포지션 순번" value={position}
                options={all.map((p, i) => [i, String(i + 1), `${p.frets[0]}–${p.frets[1]} 프렛`] as const)}
                onChange={(p) => patchSettings({ position: p })}
              />
            )}
          </div>
        </div>
      </Sheet>
    </>
  )
}

export function OptionsButton() {
  const s = useSettings()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className="ghost" aria-label="옵션" data-tip="옵션" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
        <Icon d={I.settings} size={20} />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} label="옵션">
        <div className="picker">
          <Head title="옵션" onClose={() => setOpen(false)} />

          <label className="picker-row">튜닝
            <select value={s.tuningId} onChange={(e) => patchSettings({ tuningId: e.currentTarget.value })}>
              {TUNINGS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>

          <div className="picker-row"><span>표기</span>
            <span className="picker-segs">
              <Seg label="표기" value={s.labelMode} options={LABELS} onChange={(labelMode) => patchSettings({ labelMode })} />
              <Seg label="임시표" value={s.accidental} options={ACCIDENTALS} onChange={(accidental) => patchSettings({ accidental })} />
            </span>
          </div>

          <div className="picker-row"><span>프렛 수</span>
            <Seg label="프렛 수" value={s.fretCount} options={FRETS} onChange={(fretCount) => patchSettings({ fretCount })} />
          </div>

          <h3 className="muted">사운드</h3>
          <div className="picker-row"><span>톤</span>
            <Seg label="톤" value={s.tone} options={TONES} onChange={(tone) => { patchSettings({ tone }); playNote(PREVIEW_MIDI) }} />
          </div>
          <label className="picker-row">볼륨
            <input type="range" min={0} max={1} step={0.05} value={s.volume} onInput={(e) => patchSettings({ volume: Number(e.currentTarget.value) })} />
            <output className="tnum muted">{pct(s.volume)}</output>
          </label>
          <label className="picker-row picker-check">
            <input type="checkbox" checked={s.muted} onChange={(e) => patchSettings({ muted: e.currentTarget.checked })} />음소거
          </label>

          <h3 className="muted">시점</h3>
          <div className="picker-row"><span>시점</span>
            <Seg label="시점" value={s.view} options={VIEWS} onChange={(view) => patchSettings({ view })} />
          </div>
          <label className="picker-row">기울기
            <input type="range" min={0} max={1} step={0.05} value={s.tilt} disabled={s.view !== 'player'} onInput={(e) => patchSettings({ tilt: Number(e.currentTarget.value) })} />
            <output className="tnum muted">{pct(s.tilt)}</output>
          </label>

          <button type="button" className="link picker-reset" onClick={() => patchSettings(DEFAULTS)}>기본값으로</button>
        </div>
      </Sheet>
    </>
  )
}
