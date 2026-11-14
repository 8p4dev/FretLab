# 에이전트 F — 스케일·옵션 선택 UI (`src/features/picker/**`)

작성 2026-11-14. 오케스트레이션 plan `orchestration_fretlab.md` §1 R10 · §3.8.

## 접근 방식

- 상태는 전부 `useSettings()`/`patchSettings()`(§3.6). 로컬 state 는 시트 열림 2개 + 검색어만.
- 시트는 `src/ui/Sheet.tsx` 그대로. 헤더는 DrillDown 관례(`header.sheet-head > h2 + button.ghost[aria-label=닫기]`).
- 컨트롤은 전역 규칙 재사용: 세그먼트 `.seg > button[aria-pressed]`, 그리드·목록 버튼은 기본 `button` + `aria-pressed` 반전(`button.ghost[aria-pressed=true]` 규칙), `select`·`input` 은 네이티브. picker.css 는 **배치만**(루트 12칸 그리드, 섹션 간격, compact 글자 크기, range 색).
- 검색 매칭은 순수 함수 `search.ts: matchScale(scale, query)` 로 분리 → `search.check.ts` 가 `npx tsx` 로 검사. 정규화 = 소문자 + 공백 제거, 대상 = nameKo · name · aliases · id.
- 데이터 길이 무관: `SCALE_GROUPS` 순회 → 그룹별 `SCALES.filter(group)`, 빈 그룹은 숨김. 포지션 순번은 `positions(...)` 길이로 1..N 생성.
- 대안 검토: 스케일 목록을 `<select>` 로 하면 코드는 짧지만 한글/영문/별칭 검색·그룹 구분·연속 비교가 안 되므로 버튼 목록 채택. 커스텀 슬라이더/토글은 만들지 않음(네이티브 range·checkbox).

## 수정/생성 파일

- `src/features/picker/ScaleBar.tsx` — `ScaleBar({compact})`, `OptionsButton()` (export 이름·시그니처 유지)
- `src/features/picker/search.ts` — `normalize()`, `matchScale()` 순수 함수
- `src/features/picker/search.check.ts` — `npx tsx` 자가 검사
- `src/features/picker/picker.css` — 배치 전용
- `docs/plans/agent_F_picker.md` — 이 문서

## 단계

- [x] 1. `search.ts` + `search.check.ts`(한글·영문·별칭·대소문자·공백) — `npx tsx src/features/picker/search.check.ts`
- [x] 2. `ScaleBar`: 요약 버튼(compact 포함) + 시트(루트 12 그리드 · 검색 + 그룹 섹션 · 포지션 시스템 `.seg` + 순번 1..N) — typecheck, dev 서버에서 선택 → 요약 갱신 · 새로고침 유지
- [x] 3. `OptionsButton`: 시트(튜닝 select · 표기 seg + #/b · 프렛 수 seg · 사운드 seg/볼륨/음소거 · 시점 seg/기울기) — typecheck, dev 서버에서 변경 → localStorage 반영
- [x] 4. `picker.css` 배치(토큰만, 그림자 0, hover 는 `@media (hover: hover)`)
- [x] 5. `npm run typecheck && npm run lint && npm run check && npm run build` 통과
- [x] 6. `npx vite --port 8036` + Playwright 임시 스크립트로 390/1440 시트 2개 스크린샷·설정 유지 확인 → 결과 아래 기록(스크립트 커밋 금지)
- [x] 7. 의미 단위 커밋

## 검증 방법

| 단계 | 확인 |
|---|---|
| 1 | `npx tsx src/features/picker/search.check.ts` → `search.check ok` |
| 2·3 | `npm run typecheck`; dev 서버에서 시트 열고 조작 후 `localStorage['fretlab:settings']` 값·새로고침 후 UI 일치 |
| 4 | `grep -n "box-shadow\|#[0-9a-f]" src/features/picker/picker.css` 0건 |
| 5 | 4개 명령 모두 종료 코드 0 |
| 6 | 스크린샷 390/1440 각 시트, `document.scrollingElement.scrollWidth <= innerWidth` |

## 결과 (2026-11-14)

- 검증: `npm run typecheck` 0 오류 · `npm run lint` 0 · `npm run check` ok · `npm run build` OK(JS 11.93 KB + CSS 3.87 KB gzip, 스텁 대비 +2.1/+0.3 KB) · `npx tsx src/features/picker/search.check.ts` → `search.check ok`(13건).
- `npx vite --port 8036` + Playwright(Edge) 임시 스크립트(커밋 안 함), 390×844 / 1440×900 각각:
  - 스케일 시트: 루트 C 선택, 검색 "major" → 메이저만 남음, "zzz" → "일치하는 스케일이 없습니다", CAGED 선택 → 순번 세그먼트 1..N(스텁 N=1) 표시. 요약 "C 메이저 (이오니안) · 스탠다드 · CAGED 1/1".
  - 옵션 시트: 표기 도수 · b · 프렛 22 · 톤 메탈 · 볼륨 .5 · 음소거 · 시점 연주자 · 기울기 .3(평면일 때 disabled 확인) · 튜닝 select.
  - Esc 로 닫힘, 새로고침 후 `localStorage['fretlab:settings']` 13개 키 전부 유지되고 요약 동일. `scrollWidth - innerWidth = 0`, 콘솔 오류 0.
  - compact: 높이 25.5px · 글자 11.25px(`--fs-xs`) 한 줄(nowrap + ellipsis). 시트 안 Tab 순환: 닫기 → C → C#.
- 스크린샷(임시, 스크래치 폴더): 390/1440 × 스케일 시트·옵션 시트·요약 버튼. 룩: 무채색 토큰만, 선택 = 반전, 반경 2px, 그림자 0.
- 미해결/참고: `ScaleBar` 버튼(`aria-label="스케일 선택"`, 스텁 그대로)과 시트 `dialog`(`label="스케일 선택"`)가 같은 접근 이름 — E2E 는 `getByRole('button'|'dialog', {name})` 로 구분해야 한다(`getByLabel` 은 둘 다 매칭). `옵션` 도 같음. 아이콘 추가 요청 없음, 계약 변경 없음.
