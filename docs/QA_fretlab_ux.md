# FretLab QA 보고서 (2차 UX · U1~U30 통합 검증)

2026-11-14, 워커 QA. 기준 커밋 a74eb05(2차 B·F·D·E 전원 머지 + 오케스트레이터 U29·U30). 환경: Windows 11 · Node 24.19 · Edge 채널 Playwright 1.65 · `vite preview`(빌드 결과, 127.0.0.1). 임시 스크립트(CDP `Input.dispatchTouchEvent` 터치, `navigator.vibrate`·`AudioBufferSourceNode.start` 스파이)는 커밋하지 않았고 결과 숫자만 옮겼다. 1차 보고서 `docs/QA_fretlab.md` 의 후속.

## 1. 결함 목록

| # | 심각도 | 화면 | 내용 · 재현 | 소유 | 근거 |
|---|---|---|---|---|---|
| 1 | 낮음 | 연습 따라치기(PC) | 키보드 힌트 줄이 따라치기에서도 `Enter 채점·다시 · ← → 포지션 · 1–9 포지션` 이다. 따라치기에는 채점이 없고 Enter 는 완주 뒤 [다시]만 한다(`kbdHint` 가 `mode !== 'view'` 로 한 문구를 쓴다). 재현: 1440 → 따라치기 → 바 아래 힌트. 수정안: follow 는 `Enter 다시` | D(`StudyPage.tsx` `kbdHint`) | §5 U11 측정값 `hintFollow` |
| 2 | 참고 | 연습 채우기 390 | 채우기(미채점)에서는 보드 스와이프가 프렛 창을 옮기지 않고 지나간 셀을 찍는다(U9 사양: 드래그 선택 우선). 전체 시스템처럼 창이 2개(0–7 / 8–15)일 때 채우기 중 창 이동은 ◂ ▸ 버튼만 가능하다. 사양대로라 결함 아님 — 사용자 혼동 여부는 오케스트레이터 판단 | D(기록) | §5 U9 `fill: 0–7 → 0–7`, 스와이프로 5칸 picked |

높음·중간 결함 없음. 1차 결함 #1~#5 의 현재 상태는 §7.

## 2. E2E (`e2e/fretlab.spec.ts`) — 4/4 통과

`npm run e2e`(우회 env 없음 — 1차 결함 #1 은 `playwright.config.ts` 의 `--host 127.0.0.1` 로 해결됨). 정답 자리는 `src/core/music` 의 `positions()` 로 테스트에서 직접 계산. 매 테스트 `localStorage.clear()` + `AudioBufferSourceNode.prototype.start` 스파이.

| 흐름 | 검사 | 결과 |
|---|---|---|
| (a) 연습 보기 1440 | A 마이너 펜타토닉 → 셀 96·마크 42·루트 8 → 도수 `1..5` → 인터벌 `1 b3 4 5 b7` · 콘솔 오류 0 | ok 768 ms |
| (b) 채우기 1440 | CAGED 1(2–5) 정답 12 탭 → 채점 → `12맞음 0틀림 0놓침`, hit 12·miss 0 | ok 689 ms |
| (d) **채우기 쓸어 찍기 1440**(신규) | CAGED 1 → `#/study/fill` → 바 `찍음 0 / 정답 12` → 같은 줄에서 정답 간격이 가장 좁은 두 자리(6번줄 3·5프렛) 사이 연속 3칸을 `mouse.down → move(각 셀 중심 경유, steps 6) → 되돌아오기 → up` → `.fb-mark.st-picked` **3**(되돌아온 셀 재토글 없음) · 지나간 셀 3개 전부 그 셀 사각 안에 picked 마크 · 바 `찍음 3 / 정답 12` · 콘솔 오류 0 | ok 607 ms |
| (c) 그립 844×390 터치 | 시작 → `.topnav` 0 → 두 셀 탭 소리 2회 → 따라치기 첫 target 탭 → hit 1 · target 다음 음 셀 중심(±2 px) · 소리 +1 | ok 323 ms |

## 3. U1~U30 항목별 확인

확인 = 임시 스크립트·E2E·스크린샷으로 동작 확인. 근거의 숫자는 §5.

| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| U1 | 줄 이름 열 | **확인** | 스탠다드 `E A D G B E`, 7현 `B E A D G B E`(줄 7), Drop D `D A D G B E`, Eb 튜닝 b 표기 `Eb Ab Db Gb Bb Eb` / # 표기 `D# G# C# F# A# D#`, 그립에서도 `E A D G B E`. 390 9칸 창: 이름 y 와 줄 y 차 ≤ 0.4 px, 이름 오른끝 30 / 줄 시작 32 px, 글자 11 px ≥ 10, 셀 42.8 px(1차 44.8 → −4.5 % ≤ 8 %), 가로 넘침 0 |
| U2 | 눌림 피드백 | **확인** | 390 CDP 두 손가락 동시 터치(0:0·1:0 마크 자리) 중 `.fb-mark.pressed` **2**, 마크 없는 자리 2점 → `.fb-cell.pressed` 최대 2, 300 ms 뒤 `.pressed` 0 |
| U3 | state 전환 모션 | **확인** | `.fb-mark` computed `transition: fill 0.12s, stroke 0.12s`(reduced-motion 때 0.001s), 채점 뒤 `.st-hit` `animation-name: pop` |
| U4 | 드래그 선택 | **확인** | E2E (d) 마우스 + 390 터치 쓸기 3칸 → picked 3 · `찍음 3 / 정답 12`. `drag` 없는 보기 모드는 E2E (a)·(c) 그대로 |
| U5 | PC 호버 | **확인** | 1440 보기 셀 호버 fill `color(srgb .067 .067 .067 / 0.06)`, `cursor: pointer` |
| U6 | fill 번호 글자 | **확인** | 그립 844×390 줄 이름 글자 상자 21 px(font 16) — 스크린샷에서 번호·이름 가독 |
| U7 | 채우기 진행 | **확인** | `찍음 0 / 정답 12` → 쓸기 뒤 `찍음 3 / 정답 12`(E2E (d)), 390 바에서 span 122 px + 버튼 85·143 px, 바 넘침 0 |
| U8 | 채우기 drag + haptic | **확인** | `drag` 전달(쓸기 동작) + 토글마다 `vibrate(8)` ×2 |
| U9 | 보드 스와이프 | **확인** | 390 보기: 왼쪽 → `프렛 8–15 · 2 / 2`, 오른쪽 → `0–7 · 1 / 2`, 대각선(세로 200 > 가로 120) → 변화 없음. 채우기(미채점): 스와이프 → 창 `0–7` 유지, 5칸 picked(결함 #2 참고) |
| U10 | 결과 보이기 | **확인** | 390 채우기 채점 뒤 요약 y 555–766(뷰포트 844, 고정 바 784 위), 390 따라치기 완주 요약 y 555–766, 1440 채점 뒤 요약 589–807 + 바 822–854 ≤ 900(1차 #3 해결). 채점·완주 `vibrate([10,40,14])` |
| U11 | 키보드 + 힌트 | **확인**(문구 결함 #1) | 1440 `.study-kbd` block `← → 포지션 · Space 들어보기 · 1–9 포지션`(보기) / `Enter 채점·다시 · …`(채우기), 390 `none`, 768 `block`. `3` → `포지션 3 / 5 · 7–10 프렛`, `→` → 4/5, Space → 들어보기 `aria-pressed=true`, Esc → false. 들어보기 버튼에 포커스 둔 채 Space → 토글 1회(중복 없음) |
| U12 | 따라치기 다음 음 | **확인** | `0 / 12 · 다음 G · 6번줄` → 2 hit → `2 / 12 · 다음 C · 5번줄`(스크린샷 follow-390) |
| U13 | 완주 아르페지오 | **확인** | 남은 10 탭 뒤 `start` 호출 +13 = 탭 10 + 아르페지오 3 |
| U14 | 보기 탭 haptic | **확인** | 마크 탭 → `vibrate(8)` + 소리 1회 |
| U15 | 현재 선택으로 스크롤 | **확인** | 히라조시 선택 상태로 1440 시트 열기 → 선택 버튼 y 484–515, 시트 52–900 안. 390 도 안. 닫은 뒤 재열기 검색어 `''` |
| U16 | PC 검색 포커스 | **확인** | 1440 열자마자 `activeElement` = `input[search] 스케일 검색`, '펜타' 타이핑 → 3종. 390(coarse) 은 닫기 버튼 |
| U17 | 스케일 구성 | **확인** | `1 b3 4 5 b7 · A C D E G`, 히라조시 `1 2 b3 5 b6 · A B C E F`, 루트 C → `… · C D# F G A#` 즉시 갱신 |
| U18 | 슬라이더 값 | **확인** | `output` `30%`·`60%`(볼륨 .3·기울기 .6) |
| U19 | 루트 미리듣기 | **확인** | 루트 C 탭 → `start` +1 |
| U20 | 포지션 순번 툴팁 | **확인** | `data-tip` `0–4 프렛 · 3–6 · 5–8 · 8–11 · 10–13`(C 마이너 펜타 CAGED), `aria-label` 없음(E2E (b) `name:'1'` 통과) |
| U21 | 기본값 복원 | **확인** | 도수·연주자·볼륨 .3 뒤 "기본값으로" → `fretlab:settings` 13 키 전부 DEFAULTS, output `80%`·`60%` |
| U22 | 톤 툴팁 | **확인** | `맑고 짧게 / 오버드라이브 / 하이게인` |
| U23 | 접힌 띠 핸들 | **확인** | 3.6 s 뒤 `data-hidden`, `.grip-edge` 844×24, `::after` 28×4 px `rgb(122,122,122)`(다크 `--border-strong`) radius 2px, 탭 → 펼침. 스크린샷 grip-collapsed |
| U24 | 띠에 옵션 | **확인** | 띠 옵션 → `.sheet` 1, 4.2 s 뒤에도 띠 유지, 표기 도수 → 보드 라벨 `E G A C D` → `4 5 1 2 3`, 닫은 뒤 6.6 s 안에 접힘 |
| U25 | 시작 화면 스케일 | **확인** | 시작 화면 `A 마이너 펜타토닉 · 스탠다드 · 전체` → 시트에서 C 메이저 → `C 메이저 (이오니안) · 스탠다드 · 전체` → 시작 → 띠 `C 메이저 (이오니안) · 전체`, 창 0–4 마크 18 = `marksFor` 18 |
| U26 | PC ←/→ | **확인** | 1440 그립 `0–4프렛` → `→` `1–5` → `←` `0–4`(svg aria-label) |
| U27 | 창 이동 haptic | **확인** | ▸ 탭 → `vibrate(8)`, 스와이프 → +1 (창 `2–6프렛`) |
| U28 | 완료 토스트 시간 | **확인** | `완료 — 틀림 0 · 0.2초` |
| U29 | latencyHint | **확인**(코드) | `src/core/audio/index.ts:46` `new AudioContext({ latencyHint: 'interactive' })` |
| U30 | visibilitychange resume | **확인**(코드) | `index.ts:49` `visibilitychange` → `ctx.resume()`. 헤드리스에서 탭 전환 재현 불가 |

터치 쓸기 중 세로 스크롤(U4 `touch-action: none`): 390×420 채우기(스크롤 범위 94 px)에서 셀 중심(3:3)부터 위로 120 px 드래그 → `scrollY` 0 유지 + 3칸 picked. 양성 대조: 헤더에서 같은 제스처 → `scrollY` 94.

## 4. 스크린샷 (`docs/qa/`, 10장 전부 ≤ 35 KB)

| 화면 | 라이트 | 다크 |
|---|---|---|
| 연습 보기 | [view-1440-light](qa/view-1440-light.png) (줄 이름 열·Space 힌트) | [view-390-dark](qa/view-390-dark.png) (9칸 창 0–7 · 1/2) |
| 채우기(채점 후, 정답 11 + 오답 1) | [fill-graded-390-light](qa/fill-graded-390-light.png) (요약이 고정 바 위) | [fill-graded-1440-dark](qa/fill-graded-1440-dark.png) (바가 900 px 안 — 1차 #3 해결) |
| 채우기 쓸어 찍는 중(마우스 down, 3칸) | [fill-drag-1440-light](qa/fill-drag-1440-light.png) (`찍음 3 / 정답 12`) | — |
| 따라치기(2/12 진행) | [follow-390-light](qa/follow-390-light.png) (`2 / 12 · 다음 C · 5번줄`) | [follow-1440-dark](qa/follow-1440-dark.png) |
| 그립 844×390 | [grip-844x390-light](qa/grip-844x390-light.png) (띠에 옵션 톱니) | [grip-844x390-dark](qa/grip-844x390-dark.png) |
| 그립 띠 접힘 | — | [grip-collapsed-844x390-dark](qa/grip-collapsed-844x390-dark.png) (상단 중앙 핸들) |

룩: 무채색 토큰 + 초록/빨강만, 반경 2 px, 그림자 없음 — 1차와 동일.

## 5. 자동 검사

| 항목 | 결과 |
|---|---|
| 가로 넘침 `scrollWidth − innerWidth` | 4화면(보기·채우기·따라치기·그립 시작) × 390/768/1440 + 스케일/옵션 시트 × 3폭 + 그립 844×390(띠 보임·접힘) = **20/20 모두 0 px** |
| 아이콘 전용 버튼/링크 `aria-label` 누락 | 같은 20 상태 = **0** |
| `src/features/**/*.{css,tsx}` 토큰 밖 색(`#hex` `rgb(` `hsl(`)·`box-shadow` | **0** (8 파일; tsx `fill=/stroke=/color=` 리터럴 0). 키프레임: `fb-pulse`·`fb-press`(B) + 전역 `pop/rise/shake` 만 |
| 콘솔/페이지 오류 | 스크린샷·검사·재검증·E2E 전 세션 합계 **0** |
| 외부 요청(127.0.0.1 외 호스트) | **0** |
| 그립 844×390 셀 크기(띠 접힘) | **143.5 × 62.3 px** ≥ R8 120/56 — 1차 #2 해결 |

### 번들 (`npm run build`)

| 파일 | 원본 | gzip |
|---|---|---|
| `assets/index-*.js` | 62.05 kB | **23.58 kB** |
| `assets/index-*.css` | 23.36 kB | **5.46 kB** |
| `index.html` | 1.29 kB | 0.68 kB |
| precache | 4 entries, 84.67 KiB | |
| **JS+CSS gzip 합계** | | **29.04 kB ≤ 예산 60 kB** (1차 27.14 → +1.90) |

## 6. 검증 명령

`npm run typecheck` 0 · `npm run lint` 0 · `npm run check` ok(music 65 스케일·8 튜닝·74,880 조합, audio, search, logic) · `npm run build` OK · `npm run e2e` **4 passed (9.6 s)**.

## 7. 1차 결함 현재 상태

| 1차 # | 내용 | 상태 |
|---|---|---|
| 1 | E2E webServer `[::1]` 리슨 | **해결** — `playwright.config.ts` command 에 `--host 127.0.0.1`, `npm run e2e` 가 그대로 4/4 |
| 2 | 그립 프렛보드 60vh 캡 | **해결** — `.fretboard.fill svg { max-height: none }`, 셀 143.5×62.3 px |
| 3 | 1440 채점 뒤 바가 900 px 아래 | **해결** — `max-height: 45vh` + 요약 `scrollIntoView`, 바 822–854 |
| 4 | 도수/인터벌 이름 | 변경 없음(오케스트레이터 결정 대기). E2E (a) 는 둘 다 검사 |
| 5 | 그립 마크 위 스와이프 시작 음 1회 | 변경 없음(알려진 제한, 낮음). 2차에서 `onTap`/`dragging()` 경로 변경 없음 |
