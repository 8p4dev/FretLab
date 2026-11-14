# 워커 D — 연습 화면 인터랙션 개선 (2차, `src/features/study/**`)

작성 2026-11-14. 2차 plan `orchestration_fretlab_ux.md` §1 U7~U14, 계약 1차 §3.2~§3.8 · 2차 §2 §4. 1차 plan `agent_D_study.md` 의 구조(훅 + 순수 리듀서, StudyPage 로컬 창 state) 위에 얹는다.

## 접근 방식

- **스와이프(U9)는 순수 판정 + 얇은 핸들러**: `logic.ts` 에 `swipeDir(dx, dy, min = 80) → -1 | 0 | 1`(세로가 가로보다 크면 0 = 스크롤로 보고 무시) 을 두고 `logic.check.ts` 로 검사. StudyPage 는 `.study-board` 에 pointerdown/up 두 핸들러만: 한 손가락(`pointerType !== 'mouse'`, 동시 포인터 1개) 시작점을 ref 에 저장, up 에서 `swipeDir` → 창(`wins.length > 1`) 이동, 없으면 포지션(`all.length > 1`) 이동. `mode === 'fill' && !fill.graded` 면 핸들러를 달지 않는다(B 의 drag 선택과 충돌). `.study-board { touch-action: pan-y }` 로 세로 스크롤은 브라우저에, 가로는 우리가 받는다. 그립의 ptrs 패턴을 참고했지만 복사하지 않고 1 포인터 + 2 핸들러로 줄였다.
- **드래그(U8)**: `drag={mode === 'fill' && !fill.graded}` 만 넘긴다(구현은 B). 토글마다 `haptic('tap')` 은 `onTap` 의 fill 분기에서.
- **진행 표시(U7·U12)**: 채우기 바에 `.study-progress` `찍음 <strong>k</strong> / 정답 n`. 따라치기는 기존 `k / n` 뒤에 `· 다음 <strong>라벨</strong> · m번줄`(`labelOf(target, labelMode === 'none' ? 'note' : labelMode, accidental)`, m = `strings.length - target.string`, string 0 = 가장 낮은 줄). target 은 이미 export 된 `followOrder(marks)[follow.idx]` 로 얻는다(훅 반환 형태 변경 없음 — E 가 import).
- **결과 보이기(U10)**: `Summary` 안에서 `ref` + 마운트 effect 로 `scrollIntoView({ block: 'nearest', behavior })`, behavior 는 `matchMedia('(prefers-reduced-motion: reduce)')` 로 `auto`/`smooth`. 채점·완주 시 `haptic('success')`.
- **키보드(U11)**: 기존 keydown effect 에 Space(보기: 들어보기 토글)·`1`~`9`(`system !== 'full'`, n ≤ all.length)·Escape(들어보기 중지) 추가. 힌트 줄 `.study-kbd muted` 는 바 아래, 모드에 맞는 항목만 ` · ` 로 이어 붙인다. CSS 기본 `display: none`, `@media (hover: hover) and (min-width: 761px)` 에서만 `display: block`.
- **완주 아르페지오(U13)**: 따라치기 `done` 때 `playSequence([r, r + 7, r + 12], 120)`, r = `marks.find((m) => m.root)?.midi`(없으면 생략). 마지막 음 `playNote` 와 겹치지 않게 `GAP_MS` 뒤 시작.
- **U14**: 보기 모드에서 마크 있는 자리 탭 때 `haptic('tap')`.
- 검토한 대안: (a) 스와이프를 Fretboard 안에 — B 소유라 불가, 래퍼에서 처리. (b) 스와이프 판정을 핸들러 인라인 — 검사할 수 없어 순수 함수로 분리(3줄). (c) 요약 스크롤을 StudyPage effect 로 — Summary 컴포넌트 안에 두면 두 모드가 한 코드.

## 수정/생성 파일

- `src/features/study/StudyPage.tsx` — U7~U14 전부
- `src/features/study/logic.ts` — `swipeDir` 추가(기존 export 유지)
- `src/features/study/logic.check.ts` — `swipeDir` 검사
- `src/features/study/study.css` — `.study-board touch-action`, `.study-kbd`
- `docs/plans/agent_D_study_ux.md` — 이 문서

소유 범위 밖 파일 수정 없음. 새 의존성 없음.

## 단계

- [x] 0. `npm install`, plan 작성
- [x] 1. `logic.ts` `swipeDir` + `logic.check.ts` 검사 → `npx tsx src/features/study/logic.check.ts`
- [x] 2. U7 채우기 진행 표시 · U8 drag prop + haptic · U14 보기 haptic
- [x] 3. U9 `.study-board` 스와이프(pointer) + css `touch-action: pan-y`
- [x] 4. U10 Summary scrollIntoView + haptic('success')
- [x] 5. U11 Space/1-9/Esc + `.study-kbd` 힌트 줄(PC 전용 css)
- [x] 6. U12 다음 음 안내 · U13 완주 아르페지오
- [x] 7. `npm run typecheck && npm run lint && npm run check && npm run build`
- [x] 8. `npx vite --port 8044` + 임시 Playwright(커밋 안 함): ① 390 보기 스와이프 → `프렛 8–15 · 2/2` ② 채우기 `찍음 k / 정답 n` ③ 채점 뒤 요약 뷰포트 안 ④ 따라치기 `다음 C · 5번줄` ⑤ 1440 힌트 표시 · 390 숨김
- [x] 9. 커밋 · 보고

## 검증 방법

| 단계 | 확인 |
|---|---|
| 1 | `npx tsx src/features/study/logic.check.ts` → `logic.check ok` |
| 2~6 | typecheck · lint(경고 0) · build |
| 8 | dev 8044 + Playwright(Edge, 390×844 터치 / 1440×900): CDP 터치 스와이프, 텍스트·boundingBox·`getComputedStyle(.study-kbd).display` 확인, 콘솔 오류 0 |

## 변경 사항

- **U9 스와이프의 pointerType**: plan 은 "coarse" 라 했는데 StudyPage 에 미디어쿼리 훅을 하나 더 두는 대신 이벤트의 `pointerType !== 'mouse'`(터치·펜) 로 판정했다. PC 마우스 드래그는 스와이프가 아니고, 하이브리드 기기의 터치는 폭과 무관하게 스와이프가 자연스럽다.
- **U13 아르페지오 시작 시점**: 마지막 음 `playNote` 와 동시에 울리면 겹쳐 지저분해 `GAP_MS`(220ms) 뒤에 시작한다.
- **U12 위치**: 기존 `k / n · 틀림 w` 뒤에 ` · 다음 C · 5번줄` 을 같은 `.study-progress` 안에 이어 붙였다(바에 span 이 하나).

## 결과

2026-11-14. B 의 `drag` 구현은 아직 이 워크트리에 없다(prop 만 넘김 → 머지 뒤 QA 가 쓸어 찍기 확인).

- `npm run typecheck` 0 · `npm run lint` 0(경고 0) · `npm run check` ok(music·audio·search·logic — `swipeDir` 검사 포함) · `npm run build` OK(JS 22.59 KB + CSS 5.20 KB gzip, 합계 ≤ 60 KB).
- `npx vite --port 8044` + 임시 Playwright(Edge, 커밋 안 함), 콘솔/페이지 오류 0:
  - ① 390×844 터치(C 메이저 · 전체): CDP 터치 스와이프 왼쪽 → `프렛 8–15 · 2 / 2`, 오른쪽 → `프렛 0–7 · 1 / 2`, 가로 90·세로 200 의 대각선 → 변화 없음(스크롤로 간주). CAGED(창 1개)에서는 스와이프 → `포지션 5 / 5`(포지션 이동).
  - ② 채우기: 바에 `찍음 0 / 정답 59` → 셀 3개 탭 → `찍음 3 / 정답 59`.
  - ③ 채점 뒤 `채점 결과` region boundingBox y 418~628(844 안) — 요약이 뷰포트 안.
  - ④ 따라치기: 전체 모드 `0 / 59 · 다음 E · 6번줄` → 1 hit → `1 / 59 · 다음 F · 6번줄`; CAGED 1 포지션에서 4 hit 뒤 `4 / 18 · 다음 C · 5번줄`.
  - ⑤ 1440×900: `.study-kbd` display block, 보기 `← → 포지션 · Space 들어보기 · 1–9 포지션`, 채우기 `Enter 채점·다시 · ← → 포지션 · 1–9 포지션`; 키 `3` → `포지션 3 / 5`, Space → 들어보기 `aria-pressed=true`, Esc → false. 390 에서는 `.study-kbd` display none.
  - 스크린샷: 390 스와이프 뒤 · 채점 뒤 · 따라치기, 1440 보기(힌트 줄 포함) — 임시 폴더, 커밋 안 함.
- 완주 아르페지오(U13)·haptic(U8·U10·U14)은 코드 경로만 확인(헤드리스에서 소리·진동은 검증 불가). E2E 가 쓰는 이름(`채점`·`다시`·`다음 포지션`·`채점 결과`·`포지션 1 / 5`·`이전으로`/`다음으로`·`.study-bar`)은 그대로.
- 미해결: 없음. 계약 변경 요청: 없음.
