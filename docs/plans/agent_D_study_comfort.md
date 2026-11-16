# 워커 D — 연습 화면 편의 (7차, `src/features/study/**` · `src/index.css` · `src/core/device.ts`)

작성 2026-11-16. 7차 plan `orchestration_fretlab_comfort.md` §1 C2(값 전달)·C3·C4·C9, §3.1 계약. 6차 `agent_D_i18n.md` 구조 위에 얹는다.

## 접근 방식
- **C2**: `src/core/device.ts` 에 `useMedia(query): boolean`(matchMedia + change 리스너, 미지원이면 false). StudyPage 의 로컬 `useNarrow` 는 같은 일을 하므로 지우고 `useMedia` 로 바꾼다. `portraitPhone` 이면 `stringGap={1.45}`, 아니면 `undefined`. 동작은 B7 — 이 워크트리에서는 prop 전달만 확인한다.
- **C3**: `main:has(.study) { max-width: 1360px }`(index.css). 헤더는 두 안을 찍어 비교: (a) 헤더도 1360 전체 폭, (b) 헤더만 `max-width: 960px; margin-inline: auto`. 결과는 아래 "C3 헤더 비교".
- **C4**: `.study-tilt` 를 기본 표시로. 좁은 헤더(≤760 또는 가로 폰)에서는 라벨 글자 `display: none`(input 의 `aria-label` 이 이름), 슬라이더 4.5rem. JS 변경 없음(핸들러 그대로).
- **C9**: 가로 폰 `(max-height: 500px) and (pointer: coarse)` 에서 헤더 `nowrap` 한 줄 + `ScaleBar compact`(튜닝 이름을 뺀 짧은 요약; 터치 표적은 study.css 에서 `--tap` 로 되돌린다), 헤더·포지션 줄 여백 축소, `main` 위아래 패딩 축소. 보드 높이는 `.fb-base { max-height: 45vh }`(= 175px, fretboard.css)에 걸리므로 `.study-board` 범위 선택자로 가로 폰에서만 상한을 다시 준다(fretboard.css 는 건드리지 않는다).
- 대안: 가로 폰용 별도 헤더 컴포넌트 → 중복이라 기각. CSS 컨테이너 쿼리 → 미디어쿼리로 충분.

## 수정/생성 파일
- 수정 `src/core/device.ts`, `src/features/study/StudyPage.tsx`, `src/features/study/study.css`, `src/index.css`
- 생성 `docs/plans/agent_D_study_comfort.md`, `docs/qa/comfort-study-*.png`
- `src/App.tsx` 는 수정 불필요(예상). 소유 범위 밖 수정 없음.

## 단계
- [x] 1. plan 작성
- [x] 2. `useMedia` + StudyPage `stringGap` 전달 → typecheck, Playwright 로 390 세로에서 prop 분기 확인
- [x] 3. C3 넓은 보드 + 헤더 두 안 비교 → 1920×1080 · 1440×900 보드 폭 측정
- [x] 4. C4 폰 슬라이더 → 390×844 조작 시 `--tilt` 변화, 헤더 overflow 없음(en/ko/ja)
- [x] 5. C9 가로 폰 → 844×390 보드 높이 ≥ 200px
- [x] 6. typecheck/lint/check/build/e2e, 스크린샷, 커밋, 보고

## 검증 방법
`npm run typecheck && npm run lint && npm run check && npm run build && npm run e2e`. `npx vite --host 127.0.0.1 --port 8044 --strictPort` + Playwright 임시 스크립트(`node_modules/.tmp/`, 커밋 안 함)로 치수·스크린샷.

## 변경 사항
- **가로 폰도 프렛 창으로 나눈다**(plan 에 없던 동작 변경). 기본 설정(전체 넥 0–22)을 807px 폭에 그리면 비율상 높이가 132px 라 헤더를 아무리 줄여도 200px 가 안 된다. `split = narrow || landscapePhone` 로 세로 폰과 같은 창(0–7 · 8–15 · 16–22)을 쓰면 225px.
- `useNarrow`(StudyPage 로컬) 삭제 → `useMedia` 로 대체(같은 일).
- 슬라이더 포커스 표시: 전역 `input:focus` 의 inset 테두리가 range 에서는 위아래 굵은 선으로 남아(터치 뒤 계속 보임) `.study-tilt input` 만 `:focus-visible` 외곽선으로 바꿨다.
- `src/App.tsx` 는 수정하지 않았다.

## C3 헤더 비교 (1920×1080)
- (a) 헤더 1360 전체 폭: ScaleBar·톱니가 보드 양 끝에 맞지만 모드 탭과 기울기 사이가 770px 비고, CAGED 처럼 좁은 보드(45vh 상한 → 가운데 477px)에서는 조작부가 보드에서 멀리 흩어진다.
- (b) 헤더 960 가운데: 조작부가 한 덩어리로 가운데에 모이고(빈 간격 370px), 가운데 정렬인 포지션 줄·좁은 보드·행동 바와 축이 맞는다. → **(b) 채택**.

## 측정 (Playwright, Edge, `npx vite --port 8044`)
| 화면 | 결과 |
|---|---|
| 390×844 세로(터치) en/ko/ja | 헤더 scrollWidth 365 = clientWidth 365, 도구 줄 365 = 365, 문서 390 = 390. 도구 줄 한 줄: 모드 탭 162(en)/191(ko·ja) · 슬라이더 68×44(4.5rem) · 톱니 44. 라벨 글자 숨김 |
| 390×844 슬라이더 조작 | `--tilt` 0 → 탭(75% 지점) 1 · `data-view` flat → player · 저장 tilt 1. 옵션 시트의 기울기 슬라이더 값 1(동기). 다시 0.5 → `--tilt` 0.5, 저장 0.5 |
| 390×844 `stringGap` | `portraitPhone` 참 → 1.45 전달(타입 통과). 이 워크트리는 B7 구현 전이라 보드 높이는 그대로 164px(전체 넥 창 0–7), CAGED 310px |
| 1920×1080 전체 넥 22프렛 | `.fretboard` 폭 **1360px**(전 960), 높이 222, 헤더 960 가운데 한 줄(34px) |
| 1440×900 전체 넥 | 폭 **1360px**, 높이 222. CAGED 는 1360×405(45vh 상한, 그림은 가운데) |
| 1024×768 | 폭 987px(main 패딩만), 헤더 960 한 줄 |
| 844×390 가로(터치) 전체 넥 | 헤더 한 줄 46px(ScaleBar compact "A Minor Pentatonic · Full" 174px, 터치 44px 유지), 보드 **807×225px**(전: 헤더 2줄, 보드 45vh = 175px 상한) |
| 844×390 CAGED(ko) · 3NPS(ja) | 헤더 한 줄, 보드 807×225px, 가로 넘침 0 |

- `45vh` 상한: 세로 폰 844 높이에서 380px. 전체 넥 창은 1.45 배가 돼도 ≈ 240px 라 걸리지 않는다. CAGED(5칸)는 지금도 310px 이고 1.45 배면 380px 상한에 걸려 폭이 화면보다 조금 좁게(가운데) 그려지지만 칸 높이는 60px 이상이라 그대로 둔다(머지 후 확인 필요).
- 스크린샷: `docs/qa/comfort-study-390-tilt.png` · `-1920.png` · `-1440-caged.png` · `-844x390.png` · `-844x390-caged.png`.

## 검증 결과
- `npm run typecheck && npm run lint && npm run check && npm run build` 통과(check 5종 ok, 46 modules, JS gzip 29.74 kB · CSS 6.84 kB).
- `npm run e2e` 5 passed.

## 미해결 · 참고
- 세로 폰의 큰 보드는 B7 머지 후에야 보인다(값 전달만 확인).
- 기울기 > 0 일 때 보드 위에 빈 공간이 생기는 것은 C1(B7) 범위.
