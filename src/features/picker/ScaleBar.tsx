// 스케일·옵션 선택 UI — 공유 계약 orchestration_fretlab.md §3.8 (에이전트 F 소유).
// ScaleBar: 현재 선택 요약 버튼("A Minor Pentatonic · Standard · CAGED 2/5") → 시트.
//   6차(L1): 고정 헤더(요약 + 닫기) · 모바일은 탭 Root/Scale/Position, PC 는 3열 · 스케일 구역 = 검색 + 그룹 칩 + 현재 줄 + 목록(여기만 스크롤) · 하단 Done.
// OptionsButton: 톱니 → 시트(튜닝 · 표기 · 프렛 수 · 사운드 · 기울기(0 = 평면) · 언어 · 기본값으로).
// 상태는 전부 useSettings/patchSettings(선택 즉시 저장). 문구는 strings.ts + useT(), 스케일·그룹·튜닝 이름은 localName.
import { useEffect, useRef, useState } from 'preact/hooks'
import { DEFAULTS, patchSettings, setTiltLive, useSettings } from '../../core/settings'
import { SCALES, SCALE_GROUPS, TUNINGS, intervalName, noteName, positions, scaleById, scalePcs, tuningById } from '../../core/music'
import { playNote } from '../../core/audio'
import { LANGS, fmt, localName, useT, type Lang, type Str } from '../../core/i18n'
import type { Accidental, LabelMode, PositionSystem, ScaleGroup, Tone } from '../../core/types'
import { Sheet } from '../../ui/Sheet'
import { I } from '../../ui/icons'
import { Icon } from '../../ui/Icon'
import { matchScale } from './search'
import { GROUP_EN, S } from './strings'
import './picker.css'

type Opts<T> = readonly (readonly [T, Str | string, Str?])[] // [값, 글자, 툴팁?]
const SYSTEMS: Opts<PositionSystem> = [['full', S.full], ['caged', 'CAGED'], ['3nps', '3NPS']]
const LABELS: Opts<LabelMode> = [['note', S.labelNote], ['degree', S.labelDegree], ['interval', S.labelInterval], ['none', S.labelNone]]
const ACCIDENTALS: Opts<Accidental> = [['sharp', '#'], ['flat', 'b']]
const FRETS: Opts<number> = [[12, '12'], [15, '15'], [22, '22'], [24, '24']]
const TONES: Opts<Tone> = [['clean', S.clean, S.cleanTip], ['distortion', S.distortion, S.distortionTip]]
type Tab = 'root' | 'scale' | 'position'
const TABS: readonly (readonly [Tab, Str])[] = [['root', S.root], ['scale', S.scale], ['position', S.position]]
const PREVIEW_MIDI = 57 // A3 — 톤 미리듣기
const ROOT_MIDI = 48 // C3 — 루트 미리듣기 옥타브
const pct = (v: number) => `${Math.round(v * 100)}%`

/** 세그먼트(.seg) — 선택 = aria-pressed 반전(index.css 전역 규칙). 툴팁은 data-tip 만(접근 이름은 글자 그대로 — E2E) */
function Seg<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: Opts<T>; onChange: (v: T) => void }) {
  const { t } = useT()
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([v, text, tip]) => (
        <button key={String(v)} type="button" aria-pressed={v === value} data-tip={tip && t(tip)} onClick={() => onChange(v)}>{typeof text === 'string' ? text : t(text)}</button>
      ))}
    </div>
  )
}

function CloseButton({ onClose }: { onClose: () => void }) {
  const { t } = useT()
  return <button type="button" className="ghost" aria-label={t(S.close)} data-tip={t(S.close)} onClick={onClose}><Icon d={I.x} size={20} /></button>
}

export function ScaleBar({ compact }: { compact?: boolean }) {
  const s = useSettings()
  const { t, lang } = useT()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [group, setGroup] = useState<ScaleGroup | ''>('')
  const [tab, setTab] = useState<Tab>('scale')
  const box = useRef<HTMLDivElement>(null)
  const scale = scaleById(s.scaleId), tuning = tuningById(s.tuningId)
  const all = positions(s.root, scale, tuning, s.system, s.fretCount)
  const count = all.length
  const position = Math.min(s.position, count - 1)
  const order = `${position + 1}/${count}`
  const posText = s.system === 'full' ? t(S.full) : compact ? order : `${s.system.toUpperCase()} ${order}`
  const head = `${noteName(s.root, s.accidental)} ${localName(scale, lang)}`
  const summary = compact ? `${head} · ${posText}` : `${head} · ${localName(tuning, lang).replace(/\s*\(.*\)\s*$/, '')} · ${posText}`
  const formula = `${scale.intervals.map(intervalName).join(' ')} · ${scalePcs(s.root, scale).map((pc) => noteName(pc, s.accidental)).join(' ')}`
  // SCALE_GROUPS 는 A6 뒤 name(영문)을 가진다. 혹시 비면 GROUP_EN
  const groupName = (g: (typeof SCALE_GROUPS)[number]) => localName({ ...g, name: g.name || GROUP_EN[g.id] }, lang)
  const groups = SCALE_GROUPS
    .filter((g) => !group || g.id === group)
    .map((g) => ({ g, list: SCALES.filter((x) => x.group === g.id && matchScale(x, q)) }))
    .filter((x) => x.list.length)
  const close = () => { setOpen(false); setQ(''); setGroup('') }
  const fretsOf = (p: (typeof all)[number]) => fmt(t(S.frets), { lo: p.frets[0], hi: p.frets[1] })

  // 열 때·스케일 탭으로 올 때 현재 스케일로 스크롤(목록만 스크롤된다)
  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => box.current?.querySelector('.picker-list > [aria-pressed="true"]')?.scrollIntoView({ block: 'center' }))
    return () => cancelAnimationFrame(id)
  }, [open, tab])
  // Sheet 가 닫기 버튼에 포커스를 준 뒤(rAF) PC 는 검색 입력에 포커스(coarse 는 키보드가 올라오므로 금지)
  useEffect(() => {
    if (!open || !matchMedia('(pointer: fine)').matches) return
    const id = requestAnimationFrame(() => box.current?.querySelector<HTMLInputElement>('input[type="search"]')?.focus({ preventScroll: true }))
    return () => cancelAnimationFrame(id)
  }, [open])

  return (
    <>
      <button
        type="button" className="scale-bar" aria-label={t(S.scale)} aria-haspopup="dialog" aria-expanded={open}
        data-compact={compact || undefined} onClick={() => setOpen(true)}
      >
        <span className="scale-bar-text">{summary}</span>
        <Icon d={I.chevronDown} size={16} />
      </button>
      <Sheet open={open} onClose={close} label={t(S.scale)}>
        <div className="picker picker-scale" ref={box}>
          <header className="sheet-head">
            <h2>{head} <small className="muted">{posText}</small></h2>
            <CloseButton onClose={close} />
          </header>

          <div className="seg picker-tabs" role="tablist" aria-label={t(S.sections)}>
            {TABS.map(([id, text]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{t(text)}</button>
            ))}
          </div>

          <div className="picker-cols">
            <section className="picker-col" data-on={tab === 'root' || undefined}>
              <h3 className="muted">{t(S.root)}</h3>
              <div className="picker-grid" role="group" aria-label={t(S.root)}>
                {Array.from({ length: 12 }, (_, pc) => (
                  <button key={pc} type="button" aria-pressed={pc === s.root} onClick={() => { patchSettings({ root: pc }); playNote(ROOT_MIDI + pc) }}>{noteName(pc, s.accidental)}</button>
                ))}
              </div>
            </section>

            <section className="picker-col picker-col-scale" data-on={tab === 'scale' || undefined}>
              <h3 className="muted">{t(S.scale)}</h3>
              <input type="search" aria-label={t(S.search)} placeholder={t(S.search)} value={q} onInput={(e) => setQ(e.currentTarget.value)} />
              <div className="picker-chips" role="group" aria-label={t(S.scaleGroup)}>
                <button type="button" aria-pressed={!group} onClick={() => setGroup('')}>{t(S.all)}</button>
                {SCALE_GROUPS.map((g) => (
                  <button key={g.id} type="button" aria-pressed={group === g.id} onClick={() => setGroup(g.id)}>{groupName(g)}</button>
                ))}
              </div>
              <p className="picker-current">
                <span className="badge on">{t(S.current)}</span>
                <b>{localName(scale, lang)}</b>
                <span className="tnum muted">{formula}</span>
              </p>
              <div className="picker-scroll">
                {groups.length === 0 && <p className="muted">{t(S.noMatch)}</p>}
                {groups.map(({ g, list }) => (
                  <section key={g.id} className="picker-group">
                    <h3 className="muted">{groupName(g)}</h3>
                    <div className="picker-list">
                      {list.map((x) => {
                        const name = localName(x, lang)
                        return (
                          <button key={x.id} type="button" aria-pressed={x.id === s.scaleId} onClick={() => patchSettings({ scaleId: x.id })}>
                            <span>{name}</span>{name !== x.name && <small>{x.name}</small>}
                          </button>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </section>

            <section className="picker-col" data-on={tab === 'position' || undefined}>
              <h3 className="muted">{t(S.position)}</h3>
              <Seg label={t(S.positionSystem)} value={s.system} options={SYSTEMS} onChange={(system) => patchSettings({ system })} />
              {s.system === 'full'
                ? <p className="picker-formula tnum muted">{fretsOf(all[0])}</p>
                : (
                  <div className="picker-pos" role="group" aria-label={t(S.position)}>
                    {all.map((p, i) => (
                      <button key={i} type="button" aria-pressed={i === position} data-tip={fretsOf(p)} onClick={() => patchSettings({ position: i })}>
                        {i + 1}<small className="tnum" aria-hidden="true">{p.frets[0]}–{p.frets[1]}</small>
                      </button>
                    ))}
                  </div>
                )}
            </section>
          </div>

          <button type="button" className="primary picker-done" onClick={close}>{t(S.done)}</button>
        </div>
      </Sheet>
    </>
  )
}

export function OptionsButton() {
  const s = useSettings()
  const { t, lang } = useT()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className="ghost" aria-label={t(S.options)} data-tip={t(S.options)} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
        <Icon d={I.settings} size={20} />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} label={t(S.options)}>
        <div className="picker">
          <header className="sheet-head">
            <h2>{t(S.options)}</h2>
            <CloseButton onClose={() => setOpen(false)} />
          </header>

          <label className="picker-row">{t(S.tuning)}
            <select value={s.tuningId} onChange={(e) => patchSettings({ tuningId: e.currentTarget.value })}>
              {TUNINGS.map((x) => <option key={x.id} value={x.id}>{localName(x, lang)}</option>)}
            </select>
          </label>

          <div className="picker-row"><span>{t(S.labels)}</span>
            <span className="picker-segs">
              <Seg label={t(S.labels)} value={s.labelMode} options={LABELS} onChange={(labelMode) => patchSettings({ labelMode })} />
              <Seg label={t(S.accidentals)} value={s.accidental} options={ACCIDENTALS} onChange={(accidental) => patchSettings({ accidental })} />
            </span>
          </div>

          <div className="picker-row"><span>{t(S.fretCount)}</span>
            <Seg label={t(S.fretCount)} value={s.fretCount} options={FRETS} onChange={(fretCount) => patchSettings({ fretCount })} />
          </div>

          <h3 className="muted">{t(S.sound)}</h3>
          <div className="picker-row"><span>{t(S.tone)}</span>
            <Seg label={t(S.tone)} value={s.tone} options={TONES} onChange={(tone) => { patchSettings({ tone }); playNote(PREVIEW_MIDI) }} />
          </div>
          <label className="picker-row">{t(S.volume)}
            <input type="range" min={0} max={1} step={0.05} value={s.volume} onInput={(e) => patchSettings({ volume: Number(e.currentTarget.value) })} />
            <output className="tnum muted">{pct(s.volume)}</output>
          </label>
          <label className="picker-row picker-check">
            <input type="checkbox" checked={s.muted} onChange={(e) => patchSettings({ muted: e.currentTarget.checked })} />{t(S.mute)}
          </label>
          <label className="picker-row">{t(S.noteLength)}
            <input type="range" min={0} max={1} step={0.05} value={s.sustain} onInput={(e) => patchSettings({ sustain: Number(e.currentTarget.value) })} onChange={() => playNote(PREVIEW_MIDI)} />
            <output className="tnum muted">{pct(s.sustain)}</output>
          </label>
          <label className="picker-row picker-check">
            <input type="checkbox" checked={s.mono} onChange={(e) => patchSettings({ mono: e.currentTarget.checked })} />{t(S.mono)}
          </label>

          <h3 className="muted">{t(S.view)}</h3>
          <label className="picker-row">{t(S.tilt)}
            <input type="range" min={0} max={1} step={0.05} value={s.tilt} onInput={(e) => setTiltLive(Number(e.currentTarget.value))} onChange={(e) => patchSettings({ tilt: Number(e.currentTarget.value) })} />
            <output className="tnum muted">{s.tilt ? pct(s.tilt) : t(S.flat)}</output>
          </label>
          <label className="picker-row">{t(S.language)}
            <select value={s.lang} onChange={(e) => patchSettings({ lang: e.currentTarget.value as Lang })}>
              {LANGS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
            </select>
          </label>

          <button type="button" className="link picker-reset" onClick={() => patchSettings(DEFAULTS)}>{t(S.reset)}</button>
        </div>
      </Sheet>
    </>
  )
}
