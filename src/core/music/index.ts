// 음악 이론 엔진 — 공유 계약 orchestration_fretlab.md §3.3 (에이전트 A 소유). 구현은 fretboard/scales/tunings/positions 에 있고 여기서 전부 re-export 한다.
export { NOTE_NAMES, noteName, midiToPc, midiAt, intervalName, scalePcs, marksFor, labelOf } from './fretboard'
export { SCALE_GROUPS, SCALES, scaleById } from './scales'
export { TUNINGS, tuningById } from './tunings'
export { positions } from './positions'
