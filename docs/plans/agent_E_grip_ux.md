# 에이전트 E — 그립 모드 2차 UX (`src/features/grip/**`)

작성 2026-11-14. 2차 plan `orchestration_fretlab_ux.md` §1 U23~U28. 1차 plan `agent_E_grip.md` 위에 더한다.

## 접근 방식

- 파일은 그대로 2개(`GripPage.tsx`·`grip.css`). 새 컴포넌트·훅 없음.
- U23 핸들: `.grip-edge::after` 로 28×4 pill(`--border-strong`, radius 2px). 탭 표적(24px 띠)은 그대로.
- U24 띠 옵션: `OptionsButton`(F export) 를 음소거 왼쪽에 import 만. 접힘 타이머는 `arm()` 하나로 — 만료 때 `document.querySelector('.sheet')` 가 있으면 접지 않고 다시 3초 재무장(시트가 닫힌 뒤 ≤3초 안에 접힘). 시트는 `position: fixed` 라 `.grip-bar` 의 `overflow: hidden` 에 안 잘리고, 그립 래퍼에 `transform` 은 주지 않는다.
  - 대안 검토: Sheet 의 open 상태를 props 로 받기 — 계약 변경이라 불가. DOM 질의가 가장 짧다.
- U25 시작 화면: 타일 위 `.grip-intro-row`(ScaleBar 기본형 + OptionsButton), 타일 아래 `p.muted` 설명(plan 문장 그대로). 버튼 이름 `시작 — …` 유지(E2E `/^시작/`).
- U26 키보드: `Grip`(활성)에서만 `document.keydown` 구독. `←`/`→` → `shift(∓1)`. `e.target.closest('input, select, [role=dialog]')` 면 무시. Escape 는 기존 `fullscreenchange` 복귀 그대로(코드 변경 없음).
- U27 haptic: 창 이동은 전부 `shift()` 를 지나므로 거기서 lo 가 실제로 바뀔 때만 `haptic('tap')`.
- U28 소요 시간: 모듈 변수 `followT0`(1차와 같은 이유 — oxlint ref 대입 경고). 따라치기 첫 탭에 `performance.now()`, `'done'` 때 `((now - t0)/1000).toFixed(1)` 초. 모드 전환·창 이동(= `visible` 변경)·완료 때 0 으로 리셋.

## 수정/생성 파일

- `src/features/grip/GripPage.tsx`
- `src/features/grip/grip.css`
- `docs/plans/agent_E_grip_ux.md` (이 문서)

소유 범위 밖 수정 없음. 새 아이콘 없음(OptionsButton 이 톱니를 가짐).

## 단계별 작업

- [x] 1. plan 작성(이 문서)
- [x] 2. U23 `.grip-edge::after` 핸들
- [x] 3. U24 띠에 `<OptionsButton />` + 시트 열림 중 접힘 금지(`arm()` 재무장)
- [x] 4. U25 시작 화면 ScaleBar/OptionsButton 한 줄 + 설명
- [x] 5. U26 `←`/`→` 키보드 창 이동
- [x] 6. U27 `shift()` 안 `haptic('tap')`
- [x] 7. U28 완료 토스트 소요 시간
- [x] 8. `npm run typecheck && npm run lint && npm run check && npm run build`
- [x] 9. `npx vite --port 8045` + Playwright 임시 스크립트(844×390, isMobile, hasTouch, 커밋 안 함): ① 3초 뒤 접힘 + 핸들 스크린샷 ② 띠 옵션 → 시트, 열린 동안 띠 유지 ③ 시작 화면 스케일 버튼 → 결과 기록
- [x] 10. 커밋

## 검증 방법

| 단계 | 확인 |
|---|---|
| 2~7 | typecheck·lint 0 오류 |
| 2 | Playwright: 3.3초 뒤 `.grip-bar-wrap[data-hidden]` + `.grip-edge` 의 `::after` 크기 28×4 (`getComputedStyle(el, '::after')`) + 스크린샷 |
| 3 | Playwright: 띠의 `옵션` 버튼 탭 → `.sheet` 존재, 4초 뒤에도 `data-hidden` 없음; 닫은 뒤 ≤6초 안에 접힘 |
| 4 | Playwright: `#/grip` 시작 화면에 `스케일 선택`·`옵션` 버튼 보임 + 스크린샷 |
| 5 | Playwright(PC 1440×900): `ArrowRight` → 프렛 창 1칸 이동, `.sheet` 안에서는 무시 |
| 7 | Playwright: 따라치기 완주 → 토스트 텍스트 `/완료 — 틀림 \d+ · \d+\.\d초/` |
| 8 | build 통과, gzip 크기 기록 |

## 변경 사항 (계획 대비)

- U28 타이머 리셋을 `visible`/`mode` effect 로 하지 않는다 — `positions()` 가 렌더마다 새 배열을 돌려주므로 `visible` 참조가 매 렌더 바뀌어 탭마다 리셋됐다(첫 실행 토스트 `0.0초`). 대신 `useFollow` 가 마크 서명으로 리셋한다는 점을 이용해 **`idx === 0 && wrong === 0` 인 탭**에서 시작 시각을 찍는다(모드 전환·창 이동·완료 뒤 전부 새 라운드로 잡힘). effect 하나 줄었다.
- 접힘 타이머 `arm` 을 컴포넌트 안 클로저로 두면 oxlint `react(globals)` 가 모듈 변수 대입을 경고해, 모듈 함수 `armHide(hide)` 로 뺐다. `shift` 는 keydown effect 의존성 때문에 `useCallback([lo, maxLo])`.

## 결과 (2026-11-14)

- `npm run typecheck` 0 오류 · `npm run lint` 경고 0(기준 커밋과 동일) · `npm run check` 4/4 ok · `npm run build` OK — JS 22.34 KB + CSS 5.24 KB gzip(기준 22.30 / 5.24 → 그립 2차 몫 +0.04 KB).
- Playwright 임시 스크립트(scratchpad `grip-ux.mjs`, 커밋 안 함, Edge 채널 · `npx vite --port 8045`) — 콘솔/페이지 오류 0:
  - 844×390 `isMobile`·`hasTouch`
    - ③ 시작 화면: `스케일 선택`(기본형, `data-compact` 없음)·`옵션` 버튼 보임, 설명 문장 plan 그대로, 스케일 버튼 탭 → 시트 열림(`.topnav` 0). 스크린샷 `ux-intro.png`·`ux-intro-sheet.png`.
    - ① 시작 3.4초 뒤 `data-hidden` + `.grip-edge` 844×24 + `::after` 28×4 `rgb(138,138,138)`(`--border-strong`) radius 2px. 스크린샷 `ux-hidden-handle.png`(상단 중앙 pill). 핸들 탭 → 펼침.
    - ② 띠의 `옵션` 탭 → `.sheet` 1, 4초 뒤에도 띠 유지(`data-hidden` 없음), 시트에서 표기 → 도수 바꾸면 보드 라벨 즉시 `4`. 닫은 뒤 6.5초 안에 접힘. 스크린샷 `ux-bar-options-sheet.png`.
    - U28 따라치기 창 안 마크 전부 탭 → 토스트 `완료 — 틀림 0 · 0.9초`. `ux-follow-done.png`.
  - PC 1440×900: 창 0–4 → `ArrowRight` 1–5 → 2–6 → `ArrowLeft` 1–5. 옵션 시트 열린 채 `ArrowRight` 무시(1–5 유지), `Escape` 로 시트만 닫히고 그립 활성 유지.
  - U27 haptic 은 `navigator.vibrate` 가 헤드리스에 없어 호출 경로(`shift()`)만 코드로 확인.
- E2E 이름 유지: `시작 — …` 버튼, group `모드`·`보기/따라치기`, `.topnav` 없음, `[data-pos]`.

## 미해결 · 확인 요청

- 없음. 계약 변경 요청 없음, 새 아이콘 없음(OptionsButton 이 톱니를 가짐).
- 시트 열림 감지는 `document.querySelector('.sheet')` 폴링(3초 주기)이라 시트를 닫은 뒤 접히기까지 최대 3초 — 의도된 범위.
