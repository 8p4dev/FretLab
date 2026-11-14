// 연습 화면 문구 (에이전트 D 소유). {b} = 굵게 표시되는 값(StudyPage 의 em), 나머지 {x} 는 fmt 치환
import type { Str } from '../../core/i18n'

export const S = {
  modes: { en: 'Practice mode', ko: '연습 모드', ja: '練習モード' },
  view: { en: 'View', ko: '보기', ja: '表示' },
  fill: { en: 'Fill', ko: '채우기', ja: '穴埋め' },
  follow: { en: 'Follow', ko: '따라치기', ja: '追いかけ' },
  tilt: { en: 'Tilt', ko: '기울기', ja: '傾き' },

  pos: { en: 'Position {b} / {total}', ko: '포지션 {b} / {total}', ja: 'ポジション {b} / {total}' },
  posFrets: { en: 'frets {lo}–{hi}', ko: '{lo}–{hi}프렛', ja: '{lo}–{hi}フレット' },
  prevPos: { en: 'Previous position', ko: '이전 포지션', ja: '前のポジション' },
  nextPos: { en: 'Next position', ko: '다음 포지션', ja: '次のポジション' },
  win: { en: 'Frets {b}', ko: '프렛 {b}', ja: 'フレット {b}' },
  prevWin: { en: 'Previous frets', ko: '이전 프렛 범위', ja: '前のフレット範囲' },
  nextWin: { en: 'Next frets', ko: '다음 프렛 범위', ja: '次のフレット範囲' },

  listen: { en: 'Listen', ko: '들어보기', ja: '試聴' },
  reset: { en: 'Reset', ko: '초기화', ja: 'リセット' },
  grade: { en: 'Grade', ko: '채점', ja: '採点' },
  retry: { en: 'Retry', ko: '다시', ja: 'もう一度' },

  picked: { en: 'Picked {b} of {n}', ko: '찍음 {b} / 정답 {n}', ja: '選択 {b} / 正解 {n}' },
  followProg: { en: '{b} / {n}', ko: '{b} / {n}', ja: '{b} / {n}' },
  wrongN: { en: '{w} wrong', ko: '틀림 {w}', ja: 'ミス {w}' },
  nextNote: { en: 'Next {b} · string {s}', ko: '다음 {b} · {s}번줄', ja: '次 {b} · {s}弦' },

  results: { en: 'Results', ko: '채점 결과', ja: '採点結果' },
  done: { en: 'Done', ko: '완료', ja: '完了' },
  correct: { en: 'Correct', ko: '맞음', ja: '正解' },
  wrong: { en: 'Wrong', ko: '틀림', ja: 'ミス' },
  missed: { en: 'Missed', ko: '놓침', ja: '見逃し' },
  notes: { en: 'Notes', ko: '음', ja: '音' },
  seconds: { en: 'Seconds', ko: '초', ja: '秒' },
  stats: { en: 'Accuracy {p}% ({n} tries)', ko: '정답률 {p}% ({n}회)', ja: '正答率 {p}% ({n}回)' },
  empty: { en: 'No notes in this position.', ko: '이 포지션에는 음이 없습니다.', ja: 'このポジションには音がありません。' },

  kbdGrade: { en: 'Enter grade / retry', ko: 'Enter 채점·다시', ja: 'Enter 採点・もう一度' },
  kbdRetry: { en: 'Enter retry', ko: 'Enter 다시', ja: 'Enter もう一度' },
  kbdPos: { en: '← → position', ko: '← → 포지션', ja: '← → ポジション' },
  kbdListen: { en: 'Space listen', ko: 'Space 들어보기', ja: 'Space 試聴' },
  kbdDigit: { en: '1–9 position', ko: '1–9 포지션', ja: '1–9 ポジション' },
} satisfies Record<string, Str>
