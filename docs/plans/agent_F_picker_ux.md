# 에이전트 F(2차) — 선택 UI 개선 U15~U22 (`src/features/picker/**`)

작성 2026-11-14. 2차 plan `orchestration_fretlab_ux.md` §1 F 표. 1차 `agent_F_picker.md` 의 후속.

## 접근 방식

- 전부 `ScaleBar.tsx` 한 파일 + `picker.css` 몇 줄. 새 컴포넌트·파일 없음(스케일 구성 줄은 JSX 한 줄).
- U15·U16: `Sheet` 가 열릴 때 닫기 버튼에 포커스를 옮기므로, `open` 이 true 로 바뀔 때 `requestAnimationFrame` 안에서 ① `[aria-pressed=true]` 스케일 버튼 `scrollIntoView({block:'center'})` ② `(pointer: fine)` 이면 검색 입력 `.focus()`. 둘 다 `useEffect([open])` 하나. 검색어는 `onClose` 에서 `''` 로.
- U17: `scalePcs(root, scale)` + `scale.intervals.map(intervalName)` 로 `<p class="picker-formula tnum muted">` — '스케일' 제목 바로 아래. `useSettings` 가 바뀌면 자동 갱신.
- U18: `<output class="tnum muted">` 를 range 오른쪽에. 볼륨 `Math.round(v*100)%`, 기울기도 같은 표기.
- U19: 루트 버튼 onClick 에 `playNote(48 + pc)` 추가.
- U20: 순번 `Seg` 옵션에 세 번째 항목으로 tip 을 넣을 수 있게 `Seg` 가 `[value, text, tip?]` 을 받고 `data-tip` 만 단다(aria-label 없음). U22 톤도 같은 경로.
- U21: 옵션 시트 맨 아래 `<button class="link">기본값으로</button>` → `patchSettings(DEFAULTS)`.
- 대안: scrollIntoView 를 ref 배열로 — 버튼 65개 ref 보관보다 `querySelector('[aria-pressed=true]')` 한 줄이 짧다.

## 수정 파일

- `src/features/picker/ScaleBar.tsx`
- `src/features/picker/picker.css`
- `docs/plans/agent_F_picker_ux.md`

## 단계

- [x] 1. U15 scrollIntoView + 닫을 때 검색어 초기화, U16 PC 검색 포커스
- [x] 2. U17 구성 줄 + `.picker-formula` css
- [x] 3. U18 output 값, U19 루트 미리듣기, U21 기본값으로
- [x] 4. U20·U22 `data-tip`(Seg 확장)
- [x] 5. typecheck · lint · check · build
- [x] 6. `npx vite --port 8046` + Playwright 임시 스크립트(커밋 금지): ① 히라조시 선택 → 재오픈 시 버튼 뷰포트 안 ② 구성 줄 `1 b3 4 5 b7 · A C D E G` ③ 볼륨 `80%` ④ 기본값으로 → localStorage DEFAULTS
- [x] 7. 커밋

## 검증 방법

| 단계 | 확인 |
|---|---|
| 1 | Playwright: 히라조시 선택 후 닫고 다시 열어 `[aria-pressed=true]` 의 rect 가 시트 안 · 1440 에서 `document.activeElement` 가 검색 입력 |
| 2 | `.picker-formula` textContent 비교 |
| 3 | `output` textContent · localStorage 비교 |
| 4 | `[data-tip]` 속성 값, 접근 이름 `1` 그대로 |
| 5 | 4개 명령 종료 코드 0 |

## 변경 사항
- U16 포커스는 `focus({ preventScroll: true })` 로 — 검색 입력 포커스가 시트를 맨 위로 되돌려 U15 의 scrollIntoView 를 무효화했기 때문(1440 검증에서 발견, 수정 뒤 통과).
- U17 구성 줄은 `scale.intervals.map(intervalName)` 로 도수를 만든다(`scalePcs` 는 음이름 쪽).

## 결과 (2026-11-14)
- 검증: `npm run typecheck` 0 오류 · `npm run lint` 0 · `npm run check` 4개 ok · `npm run build` OK(JS 22.38 KB + CSS 5.22 KB gzip, 예산 60 KB 안).
- `npx vite --port 8046` + Playwright(Edge) 임시 스크립트(커밋 안 함), 1440×900(pointer: fine) / 390×844(isMobile·touch):
  - ① 히라조시 선택 → Esc → 다시 열기: `[aria-pressed=true]` 버튼 rect 가 시트·뷰포트 안(1440 top 484 / 390 top 424, 시트 scrollTop 2483). 닫은 뒤 검색어 `''`.
  - ② 구성 줄 기본 `1 b3 4 5 b7 · A C D E G`, 히라조시 `1 2 b3 5 b6 · A B C E F`, 루트 C 로 바꾸면 `1 2 b3 5 b6 · C D D# G G#`(즉시 갱신). 390 에서 1줄(높이 19.75px).
  - ③ 옵션 시트 `output` = `80%`·`60%`, 볼륨 .3 으로 바꾸면 `30%`.
  - ④ 표기 도수·시점 연주자·볼륨 .3 뒤 "기본값으로" → `localStorage['fretlab:settings']` 13개 키 전부 DEFAULTS 와 동일, output 다시 `80%`·`60%`.
  - U16: 1440 에서 열자마자 `document.activeElement` = 검색 입력, 390 에서는 닫기 버튼(Sheet 기본) 유지.
  - U20: CAGED 순번 버튼 `data-tip` = `1–5 프렛 · 3–7 프렛 · 5–10 프렛 · 8–12 프렛 · 10–14 프렛`, `aria-label` 없음, `getByRole('button', {name:'1', exact:true})` 1개.
  - U22: 톤 `data-tip` = 맑고 짧게 / 오버드라이브 / 하이게인. U19: 루트 탭 → settings.root 반영(소리는 헤드리스라 호출 경로만).
  - `scrollWidth - innerWidth = 0`, 콘솔·페이지 오류 0. 스크린샷(스크래치 폴더): 390/1440 × 스케일 시트·옵션 시트.
- 미해결 이슈 없음. 계약 변경 없음. 아이콘 추가 없음.
