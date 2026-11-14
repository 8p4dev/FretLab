// 스케일·옵션 선택 UI — 공유 계약 orchestration_fretlab.md §3.8 (에이전트 F 소유).
// ScaleBar: 현재 선택 요약 버튼("A 마이너 펜타토닉 · 스탠다드 · CAGED 2/5") → 시트(루트 12 · 스케일 검색+그룹 목록 · 포지션 시스템/순번).
// OptionsButton: 톱니 → 시트(튜닝 · 표기 · 프렛 수 · 사운드 3종/볼륨/음소거/미리듣기 · 시점 flat/player + 기울기).
// 상태는 전부 useSettings/patchSettings. 데이터 길이(SCALES·TUNINGS·positions)에 무관하게 그린다.
import { useState } from 'preact/hooks'
import { patchSettings, useSettings } from '../../core/settings'
import { SCALES, SCALE_GROUPS, TUNINGS, noteName, positions, scaleById, tuningById } from '../../core/music'
import { playNote } from '../../core/audio'
import type { Accidental, FretView, LabelMode, PositionSystem, Tone } from '../../core/types'
import { Sheet } from '../../ui/Sheet'
import { I } from '../../ui/icons'
import { Icon } from '../../ui/Icon'
import { matchScale } from './search'
import './picker.css'

type Opts<T> = readonly (readonly [T, string])[]
const SYSTEMS: Opts<PositionSystem> = [['full', '전체'], ['caged', 'CAGED'], ['3nps', '3NPS']]
const LABELS: Opts<LabelMode> = [['note', '음이름'], ['degree', '도수'], ['interval', '인터벌'], ['none', '없음']]
const ACCIDENTALS: Opts<Accidental> = [['sharp', '#'], ['flat', 'b']]
const FRETS: Opts<number> = [[12, '12'], [15, '15'], [22, '22'], [24, '24']]
const TONES: Opts<Tone> = [['acoustic', '어쿠스틱'], ['rock', '록'], ['metal', '메탈']]
const VIEWS: Opts<FretView> = [['flat', '평면'], ['player', '연주자']]
const PREVIEW_MIDI = 57 // A3 — 톤 미리듣기

/** 세그먼트(.seg) — 선택 = aria-pressed 반전(index.css 전역 규칙) */
function Seg<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: Opts<T>; onChange: (v: T) => void }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={String(v)} type="button" aria-pressed={v === value} onClick={() => onChange(v)}>{text}</button>
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
  const scale = scaleById(s.scaleId), tuning = tuningById(s.tuningId)
  const count = positions(s.root, scale, tuning, s.system, s.fretCount).length
  const position = Math.min(s.position, count - 1)
  const sysName = SYSTEMS.find(([id]) => id === s.system)?.[1] ?? s.system
  const order = `${position + 1}/${count}`
  const posText = s.system === 'full' ? '전체' : compact ? order : `${sysName} ${order}`
  const head = `${noteName(s.root, s.accidental)} ${scale.nameKo}`
  const summary = compact ? `${head} · ${posText}` : `${head} · ${tuning.name.replace(/\s*\(.*\)\s*$/, '')} · ${posText}`
  const groups = SCALE_GROUPS
    .map((g) => ({ ...g, list: SCALES.filter((x) => x.group === g.id && matchScale(x, q)) }))
    .filter((g) => g.list.length)

  return (
    <>
      <button
        type="button" className="scale-bar" aria-label="스케일 선택" aria-haspopup="dialog" aria-expanded={open}
        data-compact={compact || undefined} onClick={() => setOpen(true)}
      >
        <span className="scale-bar-text">{summary}</span>
        <Icon d={I.chevronDown} size={16} />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} label="스케일 선택">
        <div className="picker">
          <Head title="스케일 선택" onClose={() => setOpen(false)} />

          <h3 className="muted">루트</h3>
          <div className="picker-grid" role="group" aria-label="루트">
            {Array.from({ length: 12 }, (_, pc) => (
              <button key={pc} type="button" aria-pressed={pc === s.root} onClick={() => patchSettings({ root: pc })}>{noteName(pc, s.accidental)}</button>
            ))}
          </div>

          <h3 className="muted">스케일</h3>
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
                options={Array.from({ length: count }, (_, i) => [i, String(i + 1)] as const)}
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
          </label>
        </div>
      </Sheet>
    </>
  )
}
