# 에이전트 E — 그립 6차: 모바일 전용 · i18n · 레이아웃 (`src/features/grip/**`)

작성 2026-11-14. 6차 plan `orchestration_fretlab_i18n.md` §1 G1 · I3(grip) · L2. 1·2차 plan(`agent_E_grip.md`·`agent_E_grip_ux.md`) 위에 더한다.

## 접근 방식

- **G1**: `GripPage` 가 훅 뒤에서 `isTouchDevice()`(`src/core/device.ts`)를 보고 false 면 안내만 반환 — `I.smartphone` + 문구 + `href.study()` 링크. 기존 `.grip.grip-intro` 레이아웃을 그대로 쓰고 문구용 `.grip-note` 한 줄만 추가.
  - 대안: 라우터에서 리다이렉트 — `router.ts`/`App.tsx` 는 소유 밖이고 plan 이 "안내 렌더"를 요구하므로 기각.
- **I3**: `src/features/grip/strings.ts` 에 `S`(Str 객체) + `useT()`·`fmt()`. `GripPage.tsx` 의 지역 타입 `S`(설정) 는 `S`(문구)와 이름이 겹쳐 `Settings`(`core/types`) import 로 바꾼다. 토스트는 `fmt(t(S.done), { w, s })`.
- **L2**: 띠는 이미 ScaleBar compact 가 `flex: 0 1 auto` + 말줄임이라 나머지(포지션·세그·옵션·음소거·나가기)가 `flex: none` 으로 버틴다. 844×390·932×430 × en/ja 로 찍어 넘침을 확인하고, 넘치면 세그 패딩 축소로 해결.
- ScaleBar/OptionsButton 내부 문구는 F(picker) 소유 — 이 브랜치에서는 아직 한국어. 머지 뒤 ja 요약이 길어져도 말줄임으로 흡수된다.

## 수정/생성 파일

- 생성 `src/features/grip/strings.ts`
- 수정 `src/features/grip/GripPage.tsx`, `src/features/grip/grip.css`
- 이 문서. 소유 밖 파일 수정 없음.

## 단계

- [x] 1. `strings.ts` 작성(en 먼저, ko/ja)
- [x] 2. `GripPage.tsx`: 전 문구 `t()` 로 교체, 토스트 `fmt`
- [x] 3. G1 안내 화면 + `.grip-note`
- [x] 4. typecheck/lint/check/build, 한국어 하드코딩 grep 0
- [x] 5. `npx vite --port 8045` + Playwright 스크린샷(844×390·932×430 터치, 1440 PC × en/ja), 넘침 측정·수정
- [x] 6. 결과 기록·커밋

## 검증 방법

- 1~3: `npm run typecheck`
- 4: `npm run typecheck && npm run lint && npm run check && npm run build`, `grep -rP "[가-힣]" --include=*.tsx src/features/grip` = 0
- 5: 임시 Playwright 스크립트(커밋 안 함)로 스크린샷 + `.grip-bar` 의 `scrollWidth <= clientWidth`, 버튼 높이 한 줄 여부 측정

## 변경 사항

- L2 에서 계획에 없던 기존 버그를 고쳤다: `grip.css` 의 세로 전용 `@media (orientation: portrait) { .grip-pos, … { display: none } }` 가 `.grip-pos { display: inline-flex }` **앞**에 있어 같은 명시도에서 져, 세로 띠에 포지션 ◂ 2/5 ▸ 가 그대로 보이고 ScaleBar 가 58px 잘렸다. 미디어 규칙을 뒤로 옮겼다.
- 세그 패딩 축소는 필요 없었다(넘침 없음). 대신 안내·설명 문단에 `text-wrap: balance`(ja 가 "タッチ / 端末で", "バーは3 / 秒後" 로 어색하게 끊기던 것).

## 결과 (2026-11-14)

검증: `npm run typecheck && npm run lint && npm run check && npm run build` 전부 통과(exit 0). `grep -rP "[가-힣]" --include=*.tsx src/features/grip` 는 주석만(문자열·JSX 0건). E2E 는 실행하지 않음.

`npx vite --port 8045` + Playwright(Edge, 임시 스크립트·스크린샷은 커밋 안 함), `#/grip`, CAGED 2/5, en·ja·ko:

| 화면 | 뷰포트 | 결과 |
|---|---|---|
| 시작 타일 | 844×390 · 932×430 · 390×844 (isMobile/hasTouch) | 타일·설명·나가기 번역됨, 가로 넘침 0 |
| 그립(따라치기) | 844×390 · 932×430 | 띠 한 줄(높이 53px), `scrollWidth == clientWidth`, ScaleBar 잘림 0. 세그 폭 en 53+64 · ja 49+76 · ko 49+76px, 한 줄(44px). 띠 고정 요소 합계 ≈ 430px → 844 에서 ScaleBar 몫 ≈ 400px |
| 그립 세로 | 390×844 | 전: 포지션 버튼이 보이고 ScaleBar 58px 말줄임 → 후: ScaleBar + 옵션·음소거·나가기만, 잘림 0. "Rotate to landscape" 안내 |
| PC 안내(G1) | 1440×900 (터치 없음) | 아이콘 + 안내문 + "Back to practice" 만 렌더, 시작 타일 없음 |

aria-label(이전/다음 포지션·모드·음소거·나가기·낮은/높은 프렛으로) 도 세 언어로 바뀌는 것을 DOM 에서 확인.

## 미해결·참고

- ScaleBar/OptionsButton 안쪽 문구(요약 "A 마이너 펜타토닉 · 2/5", aria-label "스케일 선택"·"옵션")는 F(picker) 소유라 이 브랜치에서는 한국어다. F 머지 뒤 en/ja 요약이 길어지면 띠에서는 말줄임으로 흡수된다(넘치지 않음) — 실제 문구로는 머지 뒤 QA 재확인 필요.
- 완료 토스트(`S.done`)와 접힌 띠의 "Show menu" 는 브라우저에서 직접 띄워 보지 않았다(typecheck + 코드 경로만). 
- `I.smartphone` 의 홈 버튼 점(`M12 18h.01`)은 64px 에서 거의 안 보인다 — 아이콘 문제(소유 밖), 동작에는 영향 없음.
