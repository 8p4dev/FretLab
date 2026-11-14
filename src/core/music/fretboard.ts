// 음이름·마크·라벨 — 공유 계약 §3.3 (에이전트 A 소유)
import type { Accidental, LabelMode, Mark, Midi, Pc, Scale, Tuning } from '../types'

export const NOTE_NAMES: Record<Accidental, readonly string[]> = {
  sharp: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
  flat: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'],
}
const INTERVALS = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7']

export const noteName = (pc: Pc, acc: Accidental): string => NOTE_NAMES[acc][((pc % 12) + 12) % 12]
export const midiToPc = (m: Midi): Pc => ((m % 12) + 12) % 12
export const midiAt = (tuning: Tuning, p: { string: number; fret: number }): Midi => tuning.strings[p.string] + p.fret
/** 루트로부터 반음 → 도수 표기 (1, b2, 2, b3 …) */
export const intervalName = (semitone: number): string => INTERVALS[((semitone % 12) + 12) % 12]

export const scalePcs = (root: Pc, scale: Scale): Pc[] => scale.intervals.map((i) => (root + i) % 12)

/** 모든 줄 × 0..fretCount 프렛에서 스케일에 속하는 음. 정렬: string 오름차순, fret 오름차순 */
export function marksFor(root: Pc, scale: Scale, tuning: Tuning, fretCount: number): Mark[] {
  const out: Mark[] = []
  tuning.strings.forEach((open, string) => {
    for (let fret = 0; fret <= fretCount; fret++) {
      const midi = open + fret
      const semitone = (midiToPc(midi) - root + 12) % 12
      const i = scale.intervals.indexOf(semitone)
      if (i >= 0) out.push({ string, fret, pc: midiToPc(midi), midi, degree: i + 1, semitone, root: i === 0 })
    }
  })
  return out
}

export function labelOf(m: Mark, mode: LabelMode, acc: Accidental): string {
  if (mode === 'note') return noteName(m.pc, acc)
  if (mode === 'degree') return String(m.degree)
  if (mode === 'interval') return intervalName(m.semitone)
  return ''
}
