# 에이전트 B — 프렛보드 UI·인터랙션 개선 plan (2차)

작성 2026-11-14. 범위: 2차 plan `orchestration_fretlab_ux.md` §1 U1~U6. 계약 §3.5(`FretboardProps` 이름·의미 불변, `drag?: boolean` 은 타입만 있음 → 구현). E2E 셀렉터(`[data-pos]` `.fb-mark` `.root` `.st-*` `.fb-label`) 유지, 줄 이름은 `.fb-string-name`.

## 접근 방식
- **U1 줄 이름 열**: `geometry.layout()` 에 왼쪽 열 폭 `nameW`(= `numFont × 1.9`, "F#"/"Bb" 두 글자) 를 더해 `x(f)` 를 그만큼 민다. 이름 `<text class="fb-string-name">` 은 `x = x(lo) − 4`, `text-anchor: end`, `y = y(s)` — `lo === 0`(개방 셀 왼편)·`lo > 0`(첫 프렛선 왼편) 모두 같은 식. 이름은 `noteName(midiToPc(open), accidental)`. 비 fill 9칸: viewBox 548 → 571(셀 폭 −4%). fill 은 `cw = (w − padX·2 − nameW)/cols`.
- **U2 눌림**: `pressed` 는 `useRef(new Set<string>())` + `useState` 카운터로 강제 리렌더(멀티터치 2점 동시 탭 → Set 에 둘 다). `fire(key)` 가 onTap + Set 추가 + 160ms `setTimeout` 삭제. 마크가 있는 자리는 `.fb-mark.pressed`(`fb-press` 키프레임, `--t-fast`), 없는 자리는 `.fb-cell.pressed` 틴트.
- **U3 전환**: `.fb-mark { transition: fill, stroke --t-fast; transform-box: fill-box; transform-origin: center }`, `.st-hit { animation: pop --t-med }`. miss 는 색만.
- **U4 drag**: 순수 판정 `firstEntry(seen, pointerId, key)`(geometry.ts, `npx tsx` 로 검사) + Fretboard 에서 `setPointerCapture` → `pointermove` 마다 `document.elementFromPoint().closest('[data-pos]')` → 처음 들어가는 셀이면 `fire`. up/cancel 로 포인터 삭제. `.fretboard[data-drag] svg { touch-action: none }`. `drag` 가 아니면 Map 에 등록하지 않으므로 move 는 아무것도 안 함(동작 변화 0).
- **U5 호버**: `@media (hover: hover)` 안에서 `.fb-cell:hover` 틴트, `.fretboard[data-tap] .fb-cell { cursor: pointer }`.
- **U6 fill 번호**: fill 이면 `numFont = max(10, min(16, sg·.34))`, `numH = numFont × 1.4`(13 → 18.2, 16 → 22.4). sg ↔ numH 가 서로 의존하므로 numH=18 로 sg 를 한 번 구해 numFont 를 정한 뒤 다시 계산(2패스).
- 검토한 대안: 눌림을 `useState<Set>` 로 — 매 탭 새 Set 생성·멀티터치 동시 setState 배치 문제 → ref + 카운터 채택. 드래그 판정을 셀마다 `pointerenter` 로 — 캡처 중엔 안 오므로 `elementFromPoint` 채택(plan 지시와 동일).

## 파일
- `src/features/fretboard/geometry.ts` — `nameW`, U6 numFont/numH, `firstEntry`
- `src/features/fretboard/Fretboard.tsx` — 줄 이름, pressed, drag, data-tap/data-drag
- `src/features/fretboard/fretboard.css` — `.fb-string-name`, `.pressed`, `fb-press`, 전환, 호버
- `docs/plans/agent_B_fretboard_ux.md` — 이 문서

## 작업
- [x] 1. geometry.ts: nameW·x 이동, fill numFont·numH, `firstEntry`
- [x] 2. Fretboard.tsx: 줄 이름 열(U1), pressed(U2), drag(U4), data-tap/data-drag
- [x] 3. fretboard.css: U2 U3 U5 규칙 + `fb-press`
- [x] 4. `npm run typecheck && npm run lint && npm run check && npm run build`
- [x] 5. 검증 ① 390 폭 9칸: 줄 이름 표시·라벨 ≥ 10px·가로 넘침 0 (Playwright, 8042)
- [x] 6. 검증 ② drag: `npx tsx` 로 `firstEntry` + 임시 하네스(미커밋)에 Fretboard drag 를 띄워 pointerdown→move(셀 3개)→up 에 onTap 3회
- [x] 7. 검증 ③ pressed class 160ms 안에 붙었다 떨어짐, fill 844×390 번호 ≥ 14px, 7현 줄 이름 정렬
- [x] 8. 결과 기록·커밋

## 검증 방법
- 1~3: 4 의 명령 4종.
- 5~7: `npx vite --port 8042` + Playwright 임시 스크립트(scratchpad, 커밋 안 함). 라벨 px = `font-size 속성 × (svg.clientWidth / viewBox.w)`. pressed 는 `MutationObserver` 로 class 추가/제거 시각 기록.

## 변경 사항 (계획 대비)
- `.fb-string-name` 의 `text-anchor: end` 는 `.fretboard .fb-string-name` 으로 써야 전역 `.fretboard text { text-anchor: middle }`(특이도 0,1,1) 을 이긴다 — 임시 스크립트의 "이름이 보드 왼쪽에 있는가" 검사가 처음에 실패해 잡았다.
- fill 의 번호 띠 높이는 상수 18 대신 `numFont × 1.4`(2패스) — U6 "NUM_H 비례" 그대로. 비 fill 은 18 유지.
- `firstEntry` 를 geometry.ts 에 둔 이유: Fretboard.tsx 는 css 를 import 해 `tsx` 로 못 돌린다.

## 결과 (2026-11-14)
- `npm run typecheck`·`lint`·`check`·`build` 전부 통과. 번들 JS 22.39 KB + CSS 5.27 KB gzip(예산 60 KB 안). fretboard 에 hex·box-shadow 0, 새 키프레임 `fb-press` 1개.
- 순수 검사(`npx tsx`, scratchpad, 미커밋): `firstEntry` — 등록 안 된 포인터 false, 시작 셀 재진입 false, 새 셀 true ×2, 되돌아옴 false, 셀 밖(null) false, 포인터 2 독립, up 뒤 false. `layout(6,0,8).w` 548 → 571(셀 −4% ≤ 8%), `layout(6,5,9,{844,390}).numFont` 16·h 390·w 844(넘침 0).
- Playwright(Edge, 임시 스크립트·임시 하네스 `drag.check.html/tsx`, 둘 다 삭제):
  - ① 390 연습 보기(기본, 0–7 8칸): 줄 이름 `E A D G B E` 모두 보임·줄 y 와 일치·보드 왼쪽, 라벨 11.2px, 이름·번호 8.7px, 셀 42.8px, 가로 넘침 0. 하네스 390 × 9칸(0–8): 라벨 10.7px ≥ 10, 셀 41px(이전 42.7 → −4%), 넘침 0. 7현(B E A D G B E)·`lo=5` 도 정렬·넘침 0.
  - ② drag(하네스, `drag=true`): pointerdown 0:1 → move 0:2 0:3 0:4 → 0:3 으로 되돌아옴 → up ⇒ onTap `[0:1, 0:2, 0:3, 0:4]`(재호출 없음), svg `touch-action: none`. `drag=false` 같은 제스처 ⇒ `[0:1]` 1회, `touch-action: pan-y`. 연습 보기 모드(drag 없음)에서도 같은 제스처에 pressed 는 0:1 한 셀만.
  - ③ pressed(연습 390, 터치 탭): 마크 있는 자리 `fb-mark root pressed`(+라벨) 0ms 에 붙고 163ms 뒤 제거, 마크 없는 자리 `fb-cell pressed` 173ms 뒤 제거(타이머 160ms + 리렌더).
  - U5 1440 보기: 셀 호버 fill `color(srgb … / 0.06)`, `cursor: pointer`(onTap 있을 때).
  - U6 그립 844×390(보드 756×337): 번호·줄 이름 16px ≥ 14, 라벨 23px.
  - 스크린샷 4장(scratchpad): study-390, harness-390-9cols, harness-390-7str-lo5, grip-844x390, study-1440-hover.
- 미해결: 없음. 계약 변경 요청: 없음. 참고: D 가 `drag={mode==='fill' && !fill.graded}` 를 넘기면 드래그 중 각 셀마다 `.pressed` 도 같이 붙는다(한 경로 `fire`).
