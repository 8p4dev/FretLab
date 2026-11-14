// 공유 타입 — 공유 계약 orchestration_fretlab.md §3.2 (오케스트레이터 소유). 바꿔야 하면 멈추고 보고한다.

/** 피치 클래스 0..11, 0 = C */
export type Pc = number
/** MIDI 번호. E2(6번줄 개방) = 40 */
export type Midi = number
export type Accidental = 'sharp' | 'flat'

export type ScaleGroup =
  | 'major' | 'minor' | 'pentatonic' | 'blues' | 'modes' | 'harmonicMinor' | 'melodicMinor' | 'symmetric' | 'bebop' | 'world' | 'other'
export type Scale = {
  id: string
  /** 영문 이름 (예: "Major (Ionian)") */
  name: string
  /** 한글 이름 (예: "메이저 (이오니안)") */
  nameKo: string
  /** 일본어 이름 (6차, A 가 채움) */
  nameJa?: string
  /** 루트로부터 반음 간격, 오름차순, 첫 값 0, 12 미만. 예: 메이저 [0,2,4,5,7,9,11] */
  intervals: number[]
  group: ScaleGroup
  aliases?: string[]
}

export type Tuning = {
  id: string
  /** 영문 이름 (예: "Standard (E A D G B E)") */
  name: string
  nameKo?: string
  nameJa?: string
  /** 낮은 줄 → 높은 줄 MIDI. 스탠다드 6현 = [40,45,50,55,59,64]. 7현은 길이 7 */
  strings: Midi[]
}

/** 프렛 위치. string 0 = 가장 낮은 줄(6번줄), fret 0 = 개방 */
export type FretPos = { string: number; fret: number }
/** 위치 키 "<string>:<fret>" — states 맵·Set 의 키 */
export const posKey = (p: FretPos): string => `${p.string}:${p.fret}`

/** 프렛보드 위 스케일 음 하나 */
export type Mark = FretPos & {
  pc: Pc
  midi: Midi
  /** 스케일 안 순번 1..n (루트 = 1) */
  degree: number
  /** 루트로부터 반음 0..11 */
  semitone: number
  root: boolean
}

export type LabelMode = 'note' | 'degree' | 'interval' | 'none'
export type PositionSystem = 'full' | 'caged' | '3nps'
export type Position = {
  system: PositionSystem
  /** 0 부터. full 은 항상 0 */
  index: number
  /** 포함 범위 [lo, hi] (프렛) */
  frets: [number, number]
  /** 이 포지션에 속하는 음(marks 의 부분집합). full 은 전부 */
  marks: Mark[]
}

/** 4차(톤 라운드)에서 클린/디스토션 2종으로 변경. 샘플: 클린 = FluidR3 GM 27, 디스토션 = Aspirin GM 30 */
export type Tone = 'clean' | 'distortion'
/** UI 언어 (6차). 기본 en */
export type Lang = 'en' | 'ko' | 'ja'
export type StudyMode = 'view' | 'fill' | 'follow'

/** 프렛 하나의 표시 상태(학습 모드가 넘긴다). 없는 키 = 기본 */
export type FretState = 'hit' | 'miss' | 'target' | 'dim' | 'picked'

export type Settings = {
  root: Pc
  scaleId: string
  tuningId: string
  accidental: Accidental
  labelMode: LabelMode
  tone: Tone
  /** 0..1 */
  volume: number
  muted: boolean
  system: PositionSystem
  /** 포지션 순번. system 이 바뀌면 0 으로 */
  position: number
  /** 보이는 마지막 프렛(개방 제외) 12..24 */
  fretCount: number
  /** 연주자 시점 기울기 0..1. 0 = 평면(6차: view 옵션 삭제) */
  tilt: number
  lang: Lang
}
