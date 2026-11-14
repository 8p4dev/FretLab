// 그립 모드 문구 (에이전트 E 소유). plan: docs/plans/agent_E_i18n.md
import type { Str } from '../../core/i18n'
export const S = {
  start: { en: 'Start — open in landscape fullscreen', ko: '시작 — 가로 전체화면으로 열기', ja: 'スタート — 横向きの全画面で開く' },
  help: {
    en: 'Hold your phone sideways like a guitar neck and press the frets · The bar hides after 3 seconds · Exit with ✕ or Esc',
    ko: '폰을 가로로 눕혀 넥처럼 잡고 프렛을 누르세요 · 띠는 3초 뒤 접힙니다 · ✕ 또는 Esc 로 나가기',
    ja: 'スマートフォンを横にしてネックのように持ち、フレットを押さえます · バーは3秒後に隠れます · ✕ または Esc で終了',
  },
  exit: { en: 'Exit', ko: '나가기', ja: '終了' },
  mode: { en: 'Mode', ko: '모드', ja: 'モード' },
  view: { en: 'View', ko: '보기', ja: '表示' },
  follow: { en: 'Follow', ko: '따라치기', ja: '追いかけ' },
  prevPos: { en: 'Previous position', ko: '이전 포지션', ja: '前のポジション' },
  nextPos: { en: 'Next position', ko: '다음 포지션', ja: '次のポジション' },
  mute: { en: 'Mute', ko: '음소거', ja: 'ミュート' },
  unmute: { en: 'Unmute', ko: '음소거 해제', ja: 'ミュート解除' },
  showMenu: { en: 'Show menu', ko: '메뉴 보기', ja: 'メニューを表示' },
  lower: { en: 'Lower frets', ko: '낮은 프렛으로', ja: '低いフレットへ' },
  higher: { en: 'Higher frets', ko: '높은 프렛으로', ja: '高いフレットへ' },
  rotate: { en: 'Rotate to landscape', ko: '가로로 돌려 주세요', ja: '横向きにしてください' },
  /** 따라치기 완료 토스트: {w} 틀린 횟수, {s} 초 */
  done: { en: 'Done — {w} wrong · {s}s', ko: '완료 — 틀림 {w} · {s}초', ja: '完了 — ミス {w} · {s}秒' },
  touchOnly: {
    en: 'Grip mode is for phones and tablets. Open FretLab on a touch device.',
    ko: '그립 모드는 폰·태블릿 전용입니다. 터치 기기에서 FretLab 을 열어 주세요.',
    ja: 'グリップモードはスマートフォン・タブレット専用です。タッチ端末で FretLab を開いてください。',
  },
  back: { en: 'Back to practice', ko: '연습으로 돌아가기', ja: '練習に戻る' },
} satisfies Record<string, Str>
