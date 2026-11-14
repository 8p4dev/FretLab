# 에이전트 F(6차) — 스케일 시트 재설계 · 옵션(기울기·언어) · i18n (`src/features/picker/**`)

작성 2026-11-14. 6차 plan `orchestration_fretlab_i18n.md` §1 L1 · S2 · I3 · L2. 2차 `agent_F_picker_ux.md` 의 후속.

## 접근 방식

- **L1 시트 구조**(`ScaleBar.tsx` 한 파일, 새 컴포넌트 없음): `Sheet`(수정 금지) 안에 `.picker.picker-scale` = 세로 flex `[헤더(요약 + 닫기)] [탭 Root/Scale/Position] [3 구역] [Done]`. 시트 자체 스크롤은 끄고(`.sheet:has(.picker-scale) { overflow: hidden; display: flex }` — picker.css 에서만, index.css 는 이미 `:has(.sheet)` 를 쓴다) 스케일 목록만 `overflow: auto`.
  - 모바일(≤ 760px): 탭 `role="tablist"`/`role="tab"` + `aria-selected`(모양은 `.seg`). 활성 구역만 `display` — CSS 만으로(`[data-on]`). 시트 높이 고정(탭을 바꿔도 시트가 출렁이지 않게). 탭을 `tab` 역할로 두는 이유: 버튼 `Scale`(스케일 바)·group `Root`·`Position` 과 접근 이름이 겹치지 않는다. 대안 `aria-pressed` 버튼은 `getByRole('button', {name:'Scale'})` 가 2개가 돼 기각.
  - PC(≥ 761px): 탭 숨김, 3열 grid(루트 | 스케일 | 포지션), 시트 폭 52rem, 높이 `min(80vh, 40rem)`.
  - 스케일 구역: 검색(고정) → 그룹 칩(전체 + 11, `aria-pressed`, 한 줄 가로 스크롤) → "현재" 줄(이름 + 구성 줄, 버튼 아님 — 같은 이름의 버튼이 2개가 되지 않게) → 목록(스크롤).
  - 포지션 구역: 시스템 `.seg` + 순번 버튼(숫자 + 작은 프렛 범위, 접근 이름은 숫자만 — 2차와 동일, 범위는 `aria-hidden` + `data-tip`).
  - 열 때(그리고 스케일 탭으로 올 때) 현재 스케일로 스크롤 + PC 검색 포커스 — 2차 `useEffect` 를 `[open, tab]` 으로.
- **S2**: 기울기 `output` 은 0 이면 `Flat`. 언어 `<select>`(`LANGS`) → `patchSettings({ lang })`.
- **I3**: `strings.ts` 에 `S`(Str) + `GROUP_EN`(그룹 영문 이름 — `SCALE_GROUPS` 에 `name` 이 아직 없어 `localName({ name: GROUP_EN[id], ...g })` 로 폴백, A 가 `name`/`nameJa` 를 넣으면 그쪽이 이긴다). 스케일·튜닝은 `localName`. 목록은 현지 이름 + (en 이 아니면) 영문 작게. `search.ts` 는 `nameJa` 추가 + 정규화에서 `・` 제거.
- 대안: 탭 대신 아코디언 — 포지션까지 여전히 스크롤이라 기각. 시트 3개로 분리 — 연속 비교(루트 ↔ 포지션)가 끊겨 기각.

## 수정/생성 파일

- `src/features/picker/ScaleBar.tsx` · `picker.css` · `search.ts` · `search.check.ts`
- `src/features/picker/strings.ts`(신규)
- `docs/plans/agent_F_i18n.md`

## 단계

- [x] 1. `strings.ts`(en/ko/ja) + `search.ts` nameJa + `search.check.ts`
- [x] 2. `ScaleBar` 시트 재설계(JSX) + i18n
- [x] 3. `OptionsButton` i18n + 기울기 Flat + 언어 select
- [x] 4. `picker.css` 모바일 탭 / PC 3열 / 칩 / 포지션 버튼
- [x] 5. typecheck · lint · check · build · 한국어 grep 0
- [x] 6. `npx vite --port 8046` + Playwright 임시 스크립트: ① 390 탭 3개 각각 스크롤 없이 도달 ② 1440 3열 ③ 언어 select 즉시 전환 ④ 'ペンタ' 매칭 ⑤ L2 390/768/1440 × en/ja 넘침·잘림
- [x] 7. 커밋

## 검증 방법

| 단계 | 확인 |
|---|---|
| 1 | `npm run check`(search.check: nameJa·`・`) |
| 2~4 | Playwright: 각 탭에서 대상 컨트롤 rect 가 뷰포트 안 · 시트 `scrollTop` 0, 1440 에서 3 구역 동시 표시·시트 폭 832px·높이 ≤ 80vh, 열 때 선택 스케일 rect 가 목록 안 |
| 3 | select 를 `ja` 로 → 헤더·버튼 글자 즉시 일본어, `localStorage` lang |
| 5 | 4개 명령 종료 코드 0, `grep -P "[가-힣]"` strings.ts 밖 0 |
| 6 | 스크린샷 육안 + `scrollWidth ≤ innerWidth` + 버튼 줄바꿈(높이) 검사 |

## 변경 사항
- 루트·칩·스케일·순번의 선택 반전 규칙을 `.picker :is(...) > button[aria-pressed='true']` 로 올렸다 — 전역 `button:hover` 가 배경만 밝게 바꿔 PC 에서 방금 누른 버튼의 글자가 사라졌기 때문(1440 스크린샷에서 발견).
- 낮은 화면(`max-height: 480px`, 가로 폰 844×390)은 예외: 시트 높이 = 허용 최대(80vh 제한 없음), 스케일 열은 검색·칩 고정을 풀고 열 전체를 스크롤 — 고정하면 목록 자리가 0 이었다. 칩도 이 높이에서는 한 줄 가로 스크롤.
- 모바일 시트 높이는 36rem 고정(탭을 바꿔도 출렁이지 않게). 루트 그리드는 모바일 4×3(좁고 낮은 화면은 6×2), 3열 배치에서는 3×4.
- 2차의 스케일 목록 2열(≥ 560px)은 삭제 — 스케일 열 폭이 20~24rem 이라 1열.
- 스크롤/포커스 effect 를 둘로 나눔: 스크롤은 `[open, tab]`, PC 검색 포커스는 `[open]`(탭 전환 때 포커스를 뺏지 않게).
- 접근 이름 메모(QA):
  - 탭은 `role="tab"`(Root / Scale / Position, `aria-selected`) — 버튼 `Scale` 은 스케일 바 하나뿐이다.
  - 그룹 칩은 group `Scale group` 안 버튼(All · Major · … · Other). 스케일 이름과 exact 로는 겹치지 않는다.
  - 순번 버튼 이름은 숫자만(`1`). 프렛 범위는 `aria-hidden` 작은 글자 + `data-tip`(`Frets 8–11`).
  - "현재" 줄은 버튼이 아니다. 검색은 searchbox `Search scales`.
  - 언어는 **`<select>`(label `Language`, combobox)** — 지시문의 "group `Language`" 와 다르다(S2 가 select 를 명시). 옵션 시트의 group 은 `Labels` · `Accidentals` · `Frets` · `Tone`.

## 결과 (2026-11-14)
- `npm run typecheck` 0 · `npm run lint` 0 · `npm run check` 5종 ok(search.check 에 ペンタ·가운뎃점·공백 4건 추가) · `npm run build` OK(JS 26.76 KB + CSS 6.60 KB gzip).
- 한국어 하드코딩: `grep -P "[가-힣]" -r src/features/picker` 는 strings.ts(ko 값)·search.check.ts(검사 데이터)·주석에서만 나온다. JSX·문자열 리터럴 0건.
- `npx vite --port 8046` + Playwright(Edge) 임시 스크립트(스크래치 폴더, 커밋 안 함). 390×844(터치) · 768×1024 · 1440×900 × en/ja + 844×390(터치, ja). A 의 `nameJa` 가 아직 없어 브라우저 검증은 응답에만 3종(マイナー・ペンタトニック 등)을 주입했다(`page.route`, 파일 무수정).
  - ① 390: 시트 540px 고정 · 시트 자체 스크롤 0. 탭 Root → 12칸 전부 뷰포트 안, `C` 선택 뒤에도 루트 탭 유지. 탭 Position → CAGED 5칸 전부 뷰포트 안(`1 / 8–11` …). 탭 Scale → 검색·칩·현재 줄 고정, 열 때 선택 스케일이 목록 안.
  - ② 1440: 탭 없음, 3열 동시 표시, 시트 780×600(52rem, root 15px · 80vh = 720 이하), 열자마자 검색 포커스. 768: 폭 768 · 3열.
  - ③ 옵션 언어 select en → ja: 열려 있는 시트 제목이 즉시 `オプション`, ja → ko 는 `옵션`, localStorage `lang` 저장. 기울기 output 0 = `Flat` / `フラット` / `평면`.
  - ④ 검색 `ペンタ` → 2건(メジャー・ / マイナー・ペンタトニック). 칩 Pentatonic → 그룹 1개. Done → 닫힘, 다시 열면 칩·검색 초기화 + 선택 스케일 보임.
  - 콘솔·페이지 오류 0, `scrollWidth − innerWidth` 0(7개 구성 전부).
- L2 감사(전 → 후):
  - 스케일 시트 390: 루트 → 검색 → 65종 → 포지션 한 줄 스크롤(2차 측정 scrollTop 2483) → 탭 3개, 시트 스크롤 0.
  - PC 선택 버튼 호버 시 글자 사라짐 → 수정(변경 사항 첫 항목).
  - 844×390 ja: 3열에서 칩이 3줄로 줄바꿈되어 목록 0줄 · 검색이 열 밖으로 밀림 → 열 통째 스크롤 + 칩 한 줄.
  - 옵션 390 en/ja/ko: 튜닝 긴 이름(`… (Eb Ab Db Gb Bb Eb)`) select 한 줄, Labels 세그 4칸 + #/b 한 줄, 언어 select 한 줄. 자동 검사(시트 밖으로 나감 · 버튼 높이 > 50px · scrollWidth > clientWidth) 전부 0.
  - ja 탭/세그: ルート · スケール · ポジション 3등분 한 줄, 全体 · CAGED · 3NPS 한 줄.
- 미해결 / 통합 때 확인:
  - 그룹 이름: `SCALE_GROUPS` 에 영문 `name` 이 없어 `strings.ts` 의 `GROUP_EN` 으로 폴백한다. A 가 `nameJa`(와 `name`)를 넣으면 자동으로 그쪽을 쓴다. A 머지 전인 이 워크트리에서는 ja 에서도 그룹 칩이 영문이고 스케일·튜닝 이름도 영문/옛 값이다 — 실제 A 데이터로 `ペンタ` 검색·ja 이름 길이는 머지 뒤 QA 가 다시 본다.
  - 844×390 3열에서 루트 4번째 줄(A · A# · B)은 열 안 스크롤이 조금 필요하다.
- 계약 변경 요청 없음. 아이콘 추가 없음.

