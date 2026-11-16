# 에이전트 F(7차) — 스케일 바·선택 시트 편의 (`src/features/picker/**`)

작성 2026-11-16. 7차 plan `orchestration_fretlab_comfort.md` §1 C5 · C6 · C7. 6차 `agent_F_i18n.md` 의 후속.

## 접근 방식

- **C5 스케일 바 두 줄**: `.scale-bar-text` 안을 `<span.scale-bar-name>루트 + 스케일</span><span.scale-bar-sep> · </span><span.scale-bar-sub>튜닝 · 포지션</span>` 으로 나눈다. 넓은 폭은 전부 inline 이라 지금과 같은 한 줄(텍스트도 동일 → E2E `toContainText` 유지). `@media (max-width: 760px)` 에서 `compact` 가 아니면 `.scale-bar-text` 를 세로 flex 로: 이름은 굵게 + ellipsis, sub 는 `--fs-xs` muted, 구분점은 숨김. `compact`(그립 띠)는 지금처럼 `이름 · 순번` 한 줄.
  - 대안: 이름을 두 줄로 줄바꿈 — 헤더 높이가 이름 길이에 따라 출렁여서 기각. JS 로 폭 측정 — CSS 로 충분해서 기각.
- **C6 현재 항목 보이게**: 먼저 실제 증상을 Playwright 로 잰다(현재 항목 rect vs 목록 스크롤 영역 rect). `scrollIntoView` 는 `overflow: hidden` 인 조상(`.picker-col-scale`, `.sheet`)까지 스크롤할 수 있어 고정 영역 밑으로 밀릴 수 있다 → 조상을 건드리지 않게 스크롤 컨테이너의 `scrollTop` 만 직접 계산해 가운데로 맞춘다. 루트·포지션 열은 스크롤 없이 전부 보이는지 측정만 한다.
- **C7 칩 페이드**: `.picker-chips` 에 `mask-image: linear-gradient(to right, #000 calc(100% - 2.5rem), transparent)`(색 토큰이 아니라 알파 마스크 — 배경색과 무관하게 라이트/다크 모두 맞는다). 스크롤이 끝에 닿으면 `onScroll` 한 줄로 `data-end` 를 달아 마스크를 끈다. PC 줄바꿈 배치는 마스크 없음.
  - 대안: `animation-timeline: scroll()` — Firefox 미지원이라 기각. `::after` 그라디언트 — 스크롤 컨테이너 안에서 고정하려면 래퍼가 필요해 기각.
- **보너스**: 기울기 `output` 은 드래그 중 `setTiltLive` 만 불러 값이 안 바뀐다 → 드래그 중 값을 로컬 state 로 보여 준다. 음 길이는 `onInput` 에서 `patchSettings` 라 이미 즉시 갱신. 터치 표적은 390 터치 에뮬레이션에서 시트 안 컨트롤 높이를 재서 44px 미만만 고친다.

## 수정/생성 파일

- `src/features/picker/ScaleBar.tsx` · `picker.css`
- `docs/plans/agent_F_picker_comfort.md`
- `docs/qa/comfort-picker-*.png`

## 단계

- [x] 1. 기준 측정(수정 전): 시트 열림 직후 현재 항목 위치, 스케일 바 잘림
- [x] 2. C5 스케일 바 두 줄(JSX + CSS)
- [x] 3. C6 현재 항목 스크롤
- [x] 4. C7 칩 페이드 + 끝에서 사라짐
- [x] 5. 보너스: 기울기 output 즉시 갱신, 터치 표적 점검
- [x] 6. typecheck · lint · check · build
- [x] 7. `npx vite --port 8046` + Playwright: 390×844 en/ja 긴 이름, 1440 한 줄, 시트 현재 항목 rect, 칩 페이드, 스크린샷
- [x] 8. `npm run e2e` 5/5
- [x] 9. 커밋

## 검증 방법

| 단계 | 확인 |
|---|---|
| 2 | 390: `.scale-bar-name`·`.scale-bar-sub` 가 서로 다른 줄, sub `scrollWidth ≤ clientWidth`, 버튼이 뷰포트 안. 1440: 한 줄(높이 그대로). 그립 compact: 한 줄 |
| 3 | 시트 열림 직후(폰 탭·PC 3열) 현재 스케일 버튼 rect 가 `.picker-scroll` rect 안에 완전히 포함, `.picker-col-scale`·`.sheet` 의 `scrollTop` 0 |
| 4 | 스크린샷(처음: 오른쪽 페이드, 끝까지 스크롤: 페이드 없음), `data-end` 토글 |
| 5 | range 에 input 이벤트만 보낸 뒤 output 글자, 컨트롤 높이 ≥ 44 |
| 6·8 | 종료 코드 0, e2e 5 passed |

## 변경 사항
- **C6 는 코드 변경 없음.** 수정 전 기준 측정에서 증상이 재현되지 않았다: 시트 열림 직후 현재 스케일 버튼이 이미 목록 스크롤 영역 안에 완전히 들어온다(6차의 `scrollIntoView({ block: 'center' })`). "Current" 줄은 sticky 가 아니라 목록 밖 고정 형제라 겹칠 수 없고, `elementFromPoint` 로 버튼 위·아래 끝이 실제로 가려지지 않는 것도 확인했다. 스크린샷에서 "Current" 줄 바로 아래에 반쯤 잘려 보이는 것은 현재 항목이 아니라 그 위의 이웃 항목(스크롤 경계)이다. `scrollTop` 직접 계산으로 바꾸는 안은 고칠 증상이 없어 넣지 않았다.
- 지시문의 스케일 id `melodic-minor-mode-4` 는 없다. Lydian Dominant 의 id 는 `lydian-dominant`. 긴 이름 검증은 `lydian-dominant`(en)와 가장 긴 이름 `natural-minor`("ナチュラルマイナー (エオリアン)", ja/ko)로 했다.
- 칩 마스크 색은 `#000` 대신 `var(--text)`(불투명이면 무엇이든 같다 — "색은 토큰만" 규칙을 글자 그대로 지키려고).
- 보너스에서 발견: "기본값으로 되돌리기" 버튼 높이가 터치에서 18px 였다(`button.link { min-height: 0 }` 가 `.picker-reset` 보다 셌다) → `.picker .picker-reset` 로 44px.

## 결과 (2026-11-16)
- `npm run typecheck` 0 · `npm run lint` 0 · `npm run check` 5종 ok · `npm run build` OK · `npm run e2e` 5 passed.
- Playwright(Edge) 임시 스크립트, dev(8046) + 빌드 결과(`vite preview` 8046) 둘 다.
  - C5 390×844 터치: en "C# Lydian Dominant / 7-string standard · CAGED 2/5", ja "C# ナチュラルマイナー (エオリアン) / 7弦レギュラー · CAGED 2/5", ko 모두 두 줄, 이름·sub `scrollWidth = clientWidth`(잘림 없음), 버튼 높이 44px 그대로(수정 전 한 줄일 때도 44px), 문서 가로 넘침 0. 320 폭 ja 도 잘림 없음. 1440·844×390: 한 줄, 글자 수정 전과 동일.
  - C6 시트 열림 직후 현재 항목 완전 표시: 8개 뷰포트(390×844 터치/마우스/reduced-motion, 390×664, 768×1024, 844×390, 1440×900, 1920×1080) × 6개 스케일 = 48/48. 예: 390 lydian-dominant 현재 항목 663–707, 목록 영역 589–781, "Current" 줄 528–585. 탭 Root/Position 은 스크롤 없이 전부 보이고 현재 항목 표시, Scale 탭으로 돌아와도 같은 자리. 1440 3열도 루트·포지션 현재 항목 표시.
  - C7 390: 칩 줄 `scrollWidth` 882(en)/1082(ja)/766(ko) > 364, 처음엔 마스크 있음, 끝까지 밀면 `data-end` + 마스크 none. 1440(줄바꿈)은 마스크 없음.
  - 보너스: range 에 input 이벤트만 보낸 뒤 음 길이 `90%`, 기울기 `35%`(수정 전 `Flat` 그대로). 시트 안 44px 미만은 체크박스 input(15px)뿐인데 감싼 label 행이 44px.
- 스크린샷: `docs/qa/comfort-picker-bar-390-en.png` · `-bar-390-ja.png` · `-sheet-390-en.png`(칩 페이드 + 현재 항목) · `-chips-end-390-en.png` · `-sheet-1440-dark.png`.

## 미해결
- 그립 띠의 `compact` 스케일 바는 E2E (c) 통과로만 확인했다(전체 화면 진입이 필요해 임시 스크립트로 직접 재지는 못함). compact 경로의 글자는 수정 전과 같다.
