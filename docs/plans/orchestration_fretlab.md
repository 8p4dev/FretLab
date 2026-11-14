# 오케스트레이션 — FretLab: 일렉기타 스케일 암기 웹앱

작성 2026-11-14, 오케스트레이터. 참조 코드베이스: `C:\drilldown\app`(DrillDown — 디자인 시스템 `docs/specs/01_design_system.md`, 레이아웃 `02_layout_mobile.md`, 오케스트레이션 양식 `docs/plans/orchestration_ui_first.md`).
사용자 결정(2026-11-14 질문 응답): **Preact + 시스템 폰트**, **Web Audio 합성**(샘플 없음), 그립 모드 = **가로 전체화면**, 스케일 범위 = 기본 60종 + **포지션 시스템(CAGED 5 / 3NPS 7)** + **대체 튜닝**. 왼손 모드는 선택하지 않음(범위 밖).

## 0. 범위와 산출물

- 서버 없음. 정적 PWA 하나. 데이터(설정·학습 기록)는 `localStorage`.
- 화면 2개: **연습**(`#/`, `#/study/<view|fill|follow>`)과 **그립**(`#/grip`, 셸 없이 전체화면).
- 완료 기준(전체): `npm run typecheck`·`lint`·`check`·`build` 통과, E2E(§5) 통과, 첫 로드 JS+CSS **gzip ≤ 60 KB**, 외부 요청 0, 오디오 에셋 0, 390/1440 × 라이트/다크 스크린샷이 DrillDown 룩(무채색 + 초록/빨강, 반경 0/2px, 그림자 없음)과 일치.

## 1. 요구사항 → 구체화·완료 기준

| # | 요구 | 구체화 | 완료 기준 | 담당 |
|---|---|---|---|---|
| R1 | 스케일 암기 웹앱 | 루트 12 × 스케일 × 튜닝 → 프렛보드 위 음 표시. 표기 음이름(#/b)·도수·인터벌·없음 | `marksFor()` 가 모든 줄·프렛에서 옳은 음을 낸다(`music.check.ts`) | A |
| R2 | PC·모바일 | 390/768/1440 가로 넘침 0. 터치 표적 ≥ 44px(coarse). 프렛보드는 폭에 맞춰 SVG viewBox 스케일, 모바일에서는 프렛 범위를 가로 스크롤 대신 포지션/범위로 줄인다 | 3폭 스크린샷, `scrollWidth ≤ innerWidth` | B·D·F |
| R3 | 스케일 전부 | 약 60종: 메이저·내추럴/하모닉/멜로딕 마이너·7 모드·메이저/마이너 펜타토닉·메이저/마이너 블루스·하모닉 마이너 7모드·멜로딕 마이너 7모드·디미니시(WH/HW)·홀톤·어그먼트·비밥 4종(도미넌트·메이저·마이너·도리안)·민속(헝가리안 마이너·더블 하모닉·네아폴리탄 메이저/마이너·페르시안·히라조시·인센·이와토·구모이·이집션·중국·스패니시 집시=프리지안 도미넌트·에니그매틱·프로메테우스 등). 그룹별 분류 + 영문/한글 이름 + 별칭 | `SCALES.length ≥ 55`, 간격 유효성(오름차순, 0 시작, <12, 중복 없음) 검사 통과 | A |
| R3b | 포지션 | `caged`: 5 포지션(펜타토닉·7음 다이어토닉은 표준 박스, 그 외 음 수는 루트 기준 5개 프렛 창으로 fallback), `3nps`: 7 포지션(7음 스케일만, 그 외는 caged fallback). 포지션은 프렛 범위 `[lo,hi]` + 마크 부분집합 | 각 시스템이 지정 개수의 포지션을 내고, 포지션 안 마크 ⊂ 전체 마크, 인접 포지션이 넥을 덮는다(검사) | A |
| R3c | 대체 튜닝 | 스탠다드·Drop D·반음 다운(Eb)·Drop C·Open G·Open D·DADGAD·7현 스탠다드(B) | `TUNINGS.length ≥ 8`, 7현에서 프렛보드 줄 수 7 | A(데이터) · B(7현 렌더) |
| R4 | DrillDown 레이아웃·스타일 | `src/index.css` 토큰·버튼·세그먼트·시트·토스트·툴팁·상단 바를 그대로 이식(완료). 색은 토큰만, 유채색은 `--ok`/`--danger` 만, 반경 0/2px, 그림자 0, 아이콘 Lucide 인라인, 폰트 시스템 | `grep -r "box-shadow\|#[0-9a-f]\{3,6\}" src/features` 가 토큰 정의 외 0건(프렛보드 SVG 도 `var(--…)` 로) | 전원 |
| R5 | 기타 소리 3종 | Web Audio: Karplus-Strong(또는 동급) 현 합성 → `acoustic`(바디 공진 저역 필터) / `rock`(소프트 클리핑 WaveShaper + 캐비닛 로우패스) / `metal`(하드 클리핑 + 프리 하이패스 + 게이트). 톤·볼륨·음소거는 `getSettings()`. 동시 발음 ≥ 6(멀티터치) | 세 톤이 청감상 구분됨(워커 보고), 첫 제스처 뒤 iOS 에서 소리 남(unlock), 에셋 0 | C |
| R6 | 연주자 시점 | `view: 'player'` 에서 CSS 3D(`perspective` + `rotateX` + 약한 `rotateZ`)로 위에서 내려다본 넥. `tilt` 0..1 슬라이더. flat ↔ player 전환은 모션 토큰 | 라벨 가독 유지(SVG text 는 기울지 않게 counter-rotate 또는 크기 보정), 터치 히트가 기울인 상태에서도 맞음 | B |
| R7 | 학습 모드 | **보기**(마크 전부, 탭 → 소리, [들어보기] 오름차순 재생) · **채우기**(마크 숨김, 포지션 범위 안 스케일 자리 전부 찍고 [채점] → hit 초록·miss 빨강·missing 점선, 요약) · **따라치기**(다음 음 target 표시, 맞으면 소리+진행, 틀리면 shake, 끝나면 요약). 결과는 `stats.ts` 에 키별 누적(정답률·시도 수) | 세 모드 E2E(§5) 통과 | D |
| R8 | 그립 모드 | `#/grip`: 전체화면(`requestFullscreen`) + `screen.orientation.lock('landscape')`(지원 기기만, 실패 무시) + Wake Lock(가능하면). 줄 6개가 긴 축, **4~5프렛 창**이 화면을 채움(`fill`), 좌우 스와이프/화살표로 창 이동, 멀티터치 누름마다 소리. 오버레이: 스케일 요약(`ScaleBar compact`), 포지션 ◂ ▸, 모드 보기/따라치기, 나가기. 세로로 들면 "가로로 돌려 주세요" 안내 | 390×844 가로(844×390)에서 프렛 1칸 ≥ 120px 폭, 줄 간격 ≥ 56px. 두 손가락 동시 터치 → 2음 | E |
| R9 | 아주 가벼움 | Preact(≈4 KB), 시스템 폰트, 에셋 0, 외부 요청 0. 첫 로드 gzip ≤ 60 KB(현재 스텁 13.4 KB) | `vite build` 출력 합계 | 전원(QA 측정) |
| R10 | 선택 UI | `ScaleBar` 시트: 루트 12 그리드 · 스케일 그룹별 목록 + 검색 · 포지션 시스템(전체/CAGED/3NPS) + 순번. `OptionsButton` 시트: 튜닝 · 표기 · 프렛 수(12/15/22/24) · 사운드(3종·볼륨·음소거·미리듣기) · 시점(flat/player + 기울기) | 모든 설정이 `patchSettings` 로 저장되고 새로고침 후 유지 | F |

## 2. 가정 및 미결

- A1 **UI 언어 한국어**(DrillDown 과 같음). 스케일 이름은 한글 + 영문 병기.
- A2 줄 번호: `string 0 = 가장 낮은 줄(6번줄)`. 프렛보드 그림은 표준 다이어그램(너트 왼쪽, 낮은 줄 아래). 왼손 모드 없음.
- A3 "기존 비슷한 앱" 기준 = GuitarScales·Fret Trainer·Guitar Scales & Patterns 류의 스케일 목록. 60종 목록은 A 가 확정해 plan 에 적는다.
- A4 CAGED 는 음 수 5·7 에서만 표준 박스, 그 외 fallback(§1 R3b). 3NPS 는 7음 전용.
- A5 학습 기록은 로컬만(간격 반복 없음). 키 = `${root}:${scaleId}:${tuningId}:${system}:${position}:${mode}`.
- A6 iOS 는 `orientation.lock`·Vibration 미지원 → 안내 문구와 시각 피드백만. 전체화면은 standalone PWA 설치 시 자연히 됨.
- A7 사운드 품질은 "기타 느낌"이 목표. 실제 녹음 수준은 범위 밖(사용자 결정).
- A8 PWA 아이콘 PNG 3개는 QA 단계에서 Playwright 로 `favicon.svg` 를 래스터화해 만든다(1차 워커는 건드리지 않음).
- 미결: 없음(사용자 질문 4건 모두 응답 받음).

## 3. 공유 계약 (groundwork 커밋에 전부 반영됨 — 바꿔야 하면 멈추고 보고)

### 3.1 라우터·앱 셸 (오케스트레이터 소유)
- `src/router.ts`: `Route = { name:'study'; mode: StudyMode } | { name:'grip' }`, `href.study(mode?)`, `href.grip()`, `useRoute()`.
- `src/App.tsx`: 상단 바 `[■ FretLab] 연습 그립 … <ThemeToggle/>`, `main > <StudyPage mode/>`, `grip` 라우트는 `<GripPage/>` 만(셸 없음). 첫 `pointerdown` 에서 `unlockAudio()`.
- `src/index.css`: DrillDown 토큰·전역 규칙(버튼 `.primary .danger .ok .ghost .link`, `.seg`, `.card`, `.badge`, `.empty`, `.sheet`, `.toast`, `.tip`, 모션 `rise pop shake`). 토큰 이름·값 변경 금지. 하단 고정 바 클래스는 `.study-bar`(index.css 가 토스트 위치에 참조).

### 3.2 공유 타입 `src/core/types.ts` (오케스트레이터 소유)
`Pc Midi Accidental ScaleGroup Scale Tuning FretPos posKey() Mark LabelMode PositionSystem Position Tone StudyMode FretView FretState Settings` — 파일 주석이 정의다.

### 3.3 음악 엔진 `src/core/music/index.ts` (A 소유, 스텁 있음)
| 내보내기 | 계약 |
|---|---|
| `NOTE_NAMES`, `noteName(pc, acc)`, `midiToPc(m)`, `midiAt(tuning, pos)`, `intervalName(semitone)` | 순수 함수 |
| `SCALE_GROUPS`, `SCALES`, `scaleById(id)` | 없는 id 는 `SCALES[0]`(메이저) |
| `TUNINGS`, `tuningById(id)` | 없는 id 는 스탠다드 |
| `scalePcs(root, scale)`, `marksFor(root, scale, tuning, fretCount)` | marks 정렬: string ↑, fret ↑ |
| `positions(root, scale, tuning, system, fretCount)` | `full` 1개 / `caged` 5개 / `3nps` 7개(fallback 규칙 §1 R3b). 각 `Position.marks` 는 `marksFor` 결과의 부분집합(같은 객체 참조 아니어도 됨) |
| `labelOf(mark, mode, acc)` | `'none'` → `''` |
A 는 파일을 `notes.ts scales.ts tunings.ts fretboard.ts positions.ts` 로 나눠도 되지만 **index.ts 가 전부 re-export** 해야 한다. 자가 검사 `src/core/music/music.check.ts`(`npm run check`).

### 3.4 사운드 `src/core/audio/index.ts` (C 소유, 스텁 있음)
`unlockAudio()`, `playNote(midi, {velocity?})`, `playSequence(midis, gapMs?) → stop()`. 톤·볼륨·음소거는 **호출 시 `getSettings()`** 로 읽는다(settings 변경을 구독하지 않아도 됨, 단 음소거는 즉시 반영). 모듈 로드 시 AudioContext 를 만들지 않는다(unlock 때).

### 3.5 프렛보드 `src/features/fretboard/Fretboard.tsx` (B 소유, 스텁 있음)
`Fretboard(props: FretboardProps)` — `tuning frets marks labelMode accidental states? view tilt? fill? onTap? className?`. 파일 주석이 정의다. 추가 규칙: 루트 마크는 채움 `--text` + 글자 `--bg`(반전), 일반 마크는 `--surface` 면 + `--border-strong` 테두리; `states`: `hit`=`--ok` 채움, `miss`=`--danger` 채움, `target`=`--text` 2px outline + pulse(모션 토큰), `dim`=opacity .35, `picked`=`--text-2` 채움. 인레이 점(3·5·7·9·12·15·17·19·21·24)은 `--border`. 탭 표적은 각 (string, fret) 셀 전체(투명 rect). `data-pos="s:f"` 속성을 셀에 둔다(E2E 셀렉터).

### 3.6 설정 `src/core/settings.ts` (오케스트레이터 소유)
`DEFAULTS`, `getSettings()`, `patchSettings(partial)`, `useSettings()`. `system` 이 바뀌면 `position` 은 0. 저장 키 `fretlab:settings`. 구독 훅 `src/core/store.ts: useStore(subscribe, read)`.

### 3.7 학습 로직 `src/features/study/logic.ts` (D 소유, 스텁 있음) — **E(그립)도 import**
`useFill(marks)` → `{ picked, toggle(pos), graded, grade(), reset(), states, result }`, `useFollow(marks)` → `{ idx, total, wrong, done, tap(pos) → 'hit'|'miss'|'done', reset(), states }`. 따라치기 순서 = marks 정렬 순(string ↑, fret ↑ = 포지션 안 오름차순). 기록 `src/features/study/stats.ts`(D 소유): `recordResult(key, {correct, total})`, `statsFor(key)`.

### 3.8 선택 UI `src/features/picker/ScaleBar.tsx` (F 소유, 스텁 있음)
`ScaleBar({ compact? })`, `OptionsButton()`. 둘 다 `useSettings`/`patchSettings` 로 직접 읽고 쓴다. 시트는 `src/ui/Sheet.tsx`. `compact` 는 그립 오버레이용(한 줄, 작은 글자).

### 3.9 공용 UI (오케스트레이터 소유, DrillDown 이식 완료)
`src/ui/Icon.tsx`(`Icon({d,size,label})`), `src/ui/icons.ts`(`I.*` 36개 — 더 필요하면 **보고**, 오케스트레이터가 추가), `src/ui/theme.ts`+`ThemeToggle.tsx`, `src/ui/Sheet.tsx`, `src/ui/Tooltip.tsx`(`data-tip`), `src/features/Toast.tsx`(`toast(text, action?, ms?)`, `hint(id, text)`), `src/features/feel.ts`(`haptic('tap'|'success'|'warn')`).

## 4. 작업 분할 (1차 병렬 6명 → 2차 QA 1명)

| 에이전트 | 담당 요구사항 | 수정 소유 파일 | 읽기만 하는 파일 | 선행 의존성 | dev 포트 |
|---|---|---|---|---|---|
| **A** 음악 엔진 | R1 R3 R3b R3c(데이터) | `src/core/music/**`, `docs/plans/agent_A_music.md` | `src/core/types.ts` | — | 8031 |
| **B** 프렛보드 | R2(프렛보드) R6 R3c(7현 렌더) | `src/features/fretboard/**`, `docs/plans/agent_B_fretboard.md` | `types.ts`, `core/music/index.ts`(라벨) | — | 8032 |
| **C** 사운드 | R5 | `src/core/audio/**`, `docs/plans/agent_C_audio.md` | `types.ts`, `settings.ts` | — | 8033 |
| **D** 학습 모드 | R7 | `src/features/study/**`, `docs/plans/agent_D_study.md` | fretboard/picker/music/audio(계약 이름으로 import) | — (스텁 위에 개발) | 8034 |
| **E** 그립 모드 | R8 | `src/features/grip/**`, `docs/plans/agent_E_grip.md` | fretboard/picker/study/logic/audio(계약) | — (스텁 위에 개발) | 8035 |
| **F** 선택 UI | R10 | `src/features/picker/**`, `docs/plans/agent_F_picker.md` | music/settings/ui | — | 8036 |
| **QA** (2차) | R2 R4 R9 통합 검증, E2E, PWA 아이콘 | `e2e/**`, `public/pwa-*.png`, `docs/plans/agent_QA_fretlab.md`, `docs/QA_fretlab.md` | 전부 | 1차 전원 머지 | 8037 |

공용 파일(`package.json`, `vite.config.ts`, `tsconfig*`, `index.html`, `src/index.css`, `src/App.tsx`, `src/router.ts`, `src/core/types.ts`, `src/core/settings.ts`, `src/core/store.ts`, `src/ui/**`, `src/features/Toast.tsx`, `src/features/feel.ts`)은 오케스트레이터만 고친다. 새 의존성 추가 금지(필요하면 보고). 워커는 자기 CSS 파일에만 스타일을 쓴다.
스텁 교체 규칙: 소유자는 스텁 파일을 자유로이 덮어쓰되 **계약 시그니처는 유지**. 다른 워커는 머지 전까지 스텁 위에서 빌드·동작 확인(예: D 는 스텁 `Fretboard` 가 글자만 찍으므로 상태 로직을 `logic.ts` 자가 검사(`tsx`)로 확인).

## 5. 머지 순서와 통합 검증

1. **A → B → C → F → D → E** (파일 배타 — 충돌 예상 없음. 순서는 의존 방향: 데이터 → 렌더 → 소리 → 선택 → 학습 → 그립).
2. 머지마다 `npm run typecheck && npm run lint && npm run check && npm run build`. 전부 끝나면 dev 서버로 연습 3모드·그립 수동 확인(오케스트레이터).
3. **E2E(QA 워커, Playwright, Edge 채널)** — 흐름 3개만: (a) 연습 보기: 스케일 시트에서 `A` + `마이너 펜타토닉` 선택 → 프렛보드에 루트 마크(15프렛 기준 개수)(`[data-pos]` + 루트 속성) 보임, 표기 전환 시 라벨 바뀜 (b) 채우기: CAGED 1포지션에서 모든 스케일 자리 탭 → [채점] → hit = 전체·miss 0 요약 (c) 그립: `#/grip` 진입(844×390) → 셸 없음, 프렛 셀 탭 시 상태 변화·오류 0. 추가로 390/1440 × 라이트/다크 스크린샷 8장 → `docs/QA_fretlab.md`, 번들 크기 표, 가로 넘침 검사, `aria-label` 누락 0, 토큰 밖 색 0.
4. 결과(완료·미완료·계획 대비 변경)를 §6 에 기록하고 사용자에게 보고.

## 6. 결과

### 6.1 완료 항목 (요구 R1~R10 전부)

| 요구 | 결과 | 증거 |
|---|---|---|
| R1·R3·R3b·R3c | 스케일 65종(≥55)·튜닝 8종(7현 포함)·포지션 full 1 / CAGED 5 / 3NPS 7(알고리즘 계산), 표기 음이름 #/b·도수·인터벌·없음 | `npm run check`(74,880 포지션 조합), QA §5 A·F |
| R2 | 390/768/1440 가로 넘침 0, 터치 표적 44px, 모바일은 9칸 창으로 분할 | QA §3 자동 검사, `docs/qa/*.png` |
| R4 | DrillDown 토큰·전역 규칙 이식, 토큰 밖 색 0·box-shadow 0 | QA §3 |
| R5 | Web Audio 합성 3톤(acoustic/rock/metal), 에셋 0, 폴리포니 6+ | C plan 측정(RMS·스펙트럼 중심), QA E① 두 손가락 2음 |
| R6 | 연주자 시점 CSS 3D(`tilt` 0..1), 기울인 상태 히트테스트 정확 | B plan |
| R7 | 보기·채우기·따라치기 + 기록(`fretlab:stats`) + 키보드 | E2E (a)(b) |
| R8 | 그립: 전체화면·가로 잠금·Wake Lock·4~5프렛 창·스와이프·멀티터치·따라치기 | E2E (c), 수정 후 셀 150×54 px(띠 접힘 63 px) |
| R9 | 첫 로드 JS 21.99 + CSS 5.16 = **27.15 KB gzip**(예산 60), 외부 요청 0, 에셋 0, PWA precache 4건 | `vite build`, QA §3 |
| R10 | 스케일 시트(루트 12·검색·그룹 65종·포지션)·옵션 시트(튜닝·표기·프렛 수·사운드·시점), 새로고침 유지 | F plan, E2E (a) |

통합 검증(2026-11-14 최종): `npm run typecheck` 0 · `lint` 0 · `check` 4종 ok · `build` OK · **`npm run e2e` 3/3**(우회 없이) · PWA 아이콘 3개.

### 6.2 QA 결함 처리 (`docs/QA_fretlab.md` §1)

| # | 처리 |
|---|---|
| 1 높음 | 오케스트레이터 수정: `playwright.config.ts` webServer 에 `--host 127.0.0.1` → `npm run e2e` 그대로 3/3 |
| 2 높음 | 오케스트레이터 소규모 수정(B 파일 1줄): `.fretboard.fill svg { max-height: none }` → 그립 셀 103.9×37.5 → **150×54 px**(띠 접힘 뒤 150×63). 줄 간격은 띠가 보이는 동안 54 px 로 목표 56 에 2 px 못 미침 — 접히면 충족, 허용 |
| 3 중간 | 오케스트레이터 소규모 수정: `.fretboard svg` max-height 60vh → 45vh → 1440×900 채우기에서 [채점]/[다시] 바 y=589(화면 안) |
| 4 낮음 | 결정: 이름 유지(도수 = 스케일 순번, 인터벌 = 1·b3 류). plan §5 문구만 정정 |
| 5 낮음 | 알려진 제한으로 유지(마크 위 스와이프 시작 시 음 1회, 체감 경미) |

### 6.3 계획 대비 변경점·미완료

- 변경: A 의 CAGED fallback 창 규칙(루트 프렛 + round(12k/5))·3NPS 비7음 fallback 이 system 값을 유지(`agent_A_music.md`), D 의 모바일 9칸 창 분할(B 보고에 따른 추가), 포지션 ◂ ▸ aria-label '이전으로/다음으로'.
- 미완료: 없음. 범위 밖(사용자 미선택·가정): 왼손 모드, 간격 반복, 실제 녹음 샘플 음질, 키보드 셀 탐색(aria), 실제 스피커 청감 확인은 사용자 몫.
- 실행: `npm install && npm run dev`(개발) / `npm run build && npm run preview`(정적) / `npm run e2e`.

## 진행 기록

- groundwork(2026-11-14): git init, Vite 7 + Preact 10 + TS 5.9 + oxlint + vite-plugin-pwa, DrillDown `index.css`·`ui/*`·Toast·feel 이식(React → preact/hooks, `useSyncExternalStore` → `core/store.ts`), 공유 타입·설정 스토어·라우터·앱 셸, 스텁 6개. typecheck 0 / lint 0 / check ok / build OK(JS 9.82 KB + CSS 3.54 KB gzip).
- 1차 dispatch(2026-11-14, 시작 커밋 5b9bf4f, Run `run_da7d6e276c81`, 워크트리 `C:/Users/User/orca/workspaces/FretLab/agent-*`): A ctx_c8f2283aeb8c(agent-A-music) · B ctx_cd545bd7fce3(agent-B-fretboard) · C ctx_618c508885d2(agent-C-audio) · D ctx_6be6483080f7(agent-D-study) · E ctx_3644ef4181ee(agent-E-grip) · F ctx_781a0390d0ed(agent-F-picker). 지시 원문은 오케스트레이터 scratch `fretlab-specs/spec_*.md`.
- C 완료 → **머지 main**(5802666 기준, fast-forward 아님·충돌 0). typecheck 0 / lint 0 / check ok / audio.check ok / build OK(JS 10.30 KB + CSS 3.54 KB gzip). C 미결: 실제 스피커 청감은 통합 후 사용자 확인, `audio.check` 는 `npx tsx src/core/audio/audio.check.ts`(package.json 은 오케스트레이터가 통합 때 `check` 스크립트에 합침).
- F 완료 → **머지 main**(43e67c5, 충돌 0). typecheck 0 / lint 0 / check ok(music·audio·search) / build OK(JS 13.07 KB + CSS 3.87 KB gzip). `check` 스크립트에 search.check 합침. F 참고: ScaleBar 버튼과 시트 dialog 의 접근 가능한 이름이 같아('스케일 선택'·'옵션') E2E 는 role 로 구분.
- B 완료 → **머지 main**(f4e7178, 충돌 0). typecheck 0 / lint 0 / check ok / build OK(JS 14.41 KB + CSS 4.36 KB gzip). B 보고: 390 폭에 16칸을 그리면 라벨 ≈5px → D 에게 `send`(msg_a7df2ee94f64): ≤760 폭·full 또는 9칸 초과 포지션은 StudyPage 가 9칸 이하 창으로 나눠 넘기게. 키보드 셀 탐색은 범위 밖.
- E 완료 → **머지 main**(0f40f8b, 충돌 0). typecheck 0 / lint 0 / check ok / build OK(JS 16.18 KB + CSS 4.75 KB gzip). E 미결(QA 로 이관): ① 실물 Fretboard 위에서 두 손가락 동시 탭 → 2음 재검증 ② B 가 `onTap` 을 pointerdown 에서 쏘므로 스와이프 시작 때 음 1회가 남음(계약대로 — 악기 반응성 우선, 알려진 제한으로 기록).
- D 완료 → **머지 main**(320fa46, 충돌 0 — D 는 main 을 미리 받아 실물 Fretboard 위에서 확인함). typecheck 0 / lint 0 / check ok(4종, logic.check 합침) / build OK(JS 19.23 KB + CSS 5.15 KB gzip). ≤760 폭 9칸 프렛 창 분할 반영. 포지션 ◂ ▸ 는 aria-label '이전으로/다음으로'. D 미결: 실제 5/7 포지션 동작은 A 머지 뒤 QA.
- 오케스트레이터 스모크(A 머지 전, 스텁 엔진): `vite preview` + Playwright(Edge) 4화면(1440 보기·채우기, 390 따라치기, 844×390 그립) 콘솔 오류 0 · 가로 넘침 0 · 프렛 셀 96/96/48/30 · 스크린샷 육안 확인 OK(DrillDown 룩 일치, 모바일 9칸 창 "프렛 0–7 · 1/2").
- A 완료 → **머지 main**(충돌 0). 스케일 65·튜닝 8·포지션 full 1/caged 5/3nps 7(알고리즘, 74,880 조합 검사). typecheck 0 / lint 0 / check ok / build OK(JS 21.99 KB + CSS 5.15 KB gzip). **1차 6명 전원 머지 완료.** A plan 대비 변경 2건은 `agent_A_music.md` 변경 사항 절.
- 2차 QA dispatch(시작 커밋 3726d87): ctx_feee6bfae380(agent-QA-fretlab). 산출물 `e2e/fretlab.spec.ts`·`docs/QA_fretlab.md`·`docs/qa/*.png`·`public/pwa-*.png`.
- QA 완료 → **머지 main**(8ede49f). 결함 #1~#3 오케스트레이터 직접 수정(playwright host, fretboard.css 2줄) 후 typecheck 0 / lint 0 / build OK / **e2e 3/3**. §6 에 최종 결과 기록.
