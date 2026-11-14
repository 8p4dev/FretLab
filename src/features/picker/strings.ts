// 선택 UI 문구 (F 소유) — orchestration_fretlab_i18n.md §3. en 값이 E2E 접근 이름의 기준이다.
import type { Str } from '../../core/i18n'
import type { ScaleGroup } from '../../core/types'

export const S = {
  // 공통
  close: { en: 'Close', ko: '닫기', ja: '閉じる' },
  done: { en: 'Done', ko: '완료', ja: '完了' },
  // 스케일 시트
  scale: { en: 'Scale', ko: '스케일', ja: 'スケール' },
  root: { en: 'Root', ko: '루트', ja: 'ルート' },
  position: { en: 'Position', ko: '포지션', ja: 'ポジション' },
  positionSystem: { en: 'Position system', ko: '포지션 시스템', ja: 'ポジションシステム' },
  sections: { en: 'Sections', ko: '구역', ja: 'セクション' },
  full: { en: 'Full', ko: '전체', ja: '全体' },
  search: { en: 'Search scales', ko: '스케일 검색', ja: 'スケールを検索' },
  scaleGroup: { en: 'Scale group', ko: '스케일 그룹', ja: 'スケールグループ' },
  all: { en: 'All', ko: '전체', ja: 'すべて' },
  current: { en: 'Current', ko: '현재', ja: '現在' },
  noMatch: { en: 'No matching scales', ko: '일치하는 스케일이 없습니다', ja: '一致するスケールがありません' },
  /** {lo}–{hi} */
  frets: { en: 'Frets {lo}–{hi}', ko: '{lo}–{hi}프렛', ja: '{lo}–{hi}フレット' },
  // 옵션 시트
  options: { en: 'Options', ko: '옵션', ja: 'オプション' },
  tuning: { en: 'Tuning', ko: '튜닝', ja: 'チューニング' },
  labels: { en: 'Labels', ko: '표기', ja: 'ラベル' },
  labelNote: { en: 'Note', ko: '음이름', ja: '音名' },
  labelDegree: { en: 'Degree', ko: '도수', ja: '度数' },
  labelInterval: { en: 'Interval', ko: '인터벌', ja: '音程' },
  labelNone: { en: 'None', ko: '없음', ja: 'なし' },
  accidentals: { en: 'Accidentals', ko: '임시표', ja: '臨時記号' },
  fretCount: { en: 'Frets', ko: '프렛 수', ja: 'フレット数' },
  sound: { en: 'Sound', ko: '사운드', ja: 'サウンド' },
  tone: { en: 'Tone', ko: '톤', ja: 'トーン' },
  clean: { en: 'Clean', ko: '클린', ja: 'クリーン' },
  cleanTip: { en: 'Straight from the pickup', ko: '픽업 그대로', ja: 'ピックアップそのまま' },
  distortion: { en: 'Distortion', ko: '디스토션', ja: 'ディストーション' },
  distortionTip: { en: 'High gain', ko: '하이게인', ja: 'ハイゲイン' },
  volume: { en: 'Volume', ko: '볼륨', ja: '音量' },
  mute: { en: 'Mute', ko: '음소거', ja: 'ミュート' },
  view: { en: 'View', ko: '보기', ja: '表示' },
  tilt: { en: 'Tilt', ko: '기울기', ja: '傾き' },
  flat: { en: 'Flat', ko: '평면', ja: '平面' },
  language: { en: 'Language', ko: '언어', ja: '言語' },
  reset: { en: 'Reset to defaults', ko: '기본값으로 되돌리기', ja: '初期設定に戻す' },
} satisfies Record<string, Str>

/** 그룹 영문 이름 — SCALE_GROUPS 에 name 이 없을 때의 폴백(localName 의 name 자리) */
export const GROUP_EN: Record<ScaleGroup, string> = {
  major: 'Major', minor: 'Minor', pentatonic: 'Pentatonic', blues: 'Blues', modes: 'Modes',
  harmonicMinor: 'Harmonic Minor Modes', melodicMinor: 'Melodic Minor Modes',
  symmetric: 'Symmetric', bebop: 'Bebop', world: 'World', other: 'Other',
}
