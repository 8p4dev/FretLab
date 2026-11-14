# 오케스트레이션 2차 — FretLab UI·인터랙션 개선

작성 2026-11-14, 오케스트레이터. 1차 plan `orchestration_fretlab.md`(§3 공유 계약·§4 소유권은 그대로 유효)의 후속. 사용자 요청: "UI, 인터랙티브적으로 개선할 점 모두 찾고 적용".
근거: 소스 전부(`src/**`)와 QA 보고서(`docs/QA_fretlab.md`)·스크린샷 8장을 읽고 뽑은 항목. 기능 추가가 아니라 **이미 있는 흐름의 반응·안내·조작감**을 올리는 것이 범위. 새 의존성 0, 토큰 밖 색 0, 번들 예산(JS+CSS gzip ≤ 60 KB) 유지.

## 0. 발견 요약 (무엇이 부족한가)

| 영역 | 현재 | 문제 |
|---|---|---|
| 프렛보드 | 탭하면 소리만 난다. 마크·셀에 눌림/호버 반응 없음. state 가 바뀔 때 색이 즉시 바뀜 | 터치 피드백 부재 → "눌렸나?" 불확실. 특히 소리를 끈 상태·그립 모드 |
| 프렛보드 | 줄 이름(E A D G B E)이 어디에도 없다 | 튜닝을 바꿔도 어느 줄이 무슨 음인지 모름. 암기 앱의 기본 정보 |
| 채우기 | 자리를 하나씩 탭. 몇 개를 찍었는지·정답이 몇 개인지 표시 없음 | 12~20 자리를 찍는 동안 진행 감각 없음. 드래그로 쓸어 찍기 불가 |
| 채우기/따라치기 | 채점·완주 요약이 프렛보드 아래에 생김(390 에서는 화면 밖) | 결과를 보려면 스크롤 |
| 따라치기 | 다음 음은 보드 위 pulse 만 | 어떤 음(이름·줄)인지 글로도 알려주면 암기에 도움 |
| 연습(모바일) | 프렛 창·포지션은 ◂ ▸ 버튼으로만 | 보드 위 스와이프가 자연스러움(그립은 이미 됨) |
| 연습(PC) | Enter/←/→ 단축키가 있는데 안내 없음. Space 없음 | 발견 불가 |
| 스케일 시트 | 65종 목록에서 현재 선택이 화면 밖일 수 있음. PC 에서 검색창 포커스 안 됨 | 열 때마다 찾아 내려가야 함 |
| 스케일 시트 | 스케일의 구성(1 b3 4 5 b7 / A C D E G)이 어디에도 없음 | 외우려는 대상 자체가 글로 안 보임 |
| 옵션 시트 | 볼륨·기울기 슬라이더에 값 표시 없음. 기본값 복원 없음 | |
| 그립 | 띠가 접히면 위쪽 24px 투명 버튼만 남음(보이지 않음) | 다시 펼치는 법을 알 수 없음 |
| 그립 | 띠에서 표기·톤 등을 바꿀 수 없음. 시작 화면에서 스케일 확인 불가 | 설정 바꾸려면 나갔다 와야 함 |
| 그립(PC) | 키보드로 창 이동 불가 | |
| 오디오 | `AudioContext` 기본 latencyHint. 탭 밖으로 갔다 오면 suspended 일 수 있음 | 터치 → 소리 지연 |

## 1. 개선 항목 (U1 ~ U31)과 완료 기준

### B 프렛보드 (`src/features/fretboard/**`)
| # | 항목 | 완료 기준 |
|---|---|---|
| U1 | **줄 이름 열**: 보드 왼쪽에 개방현 음이름(`noteName(midiToPc(open), accidental)`) 을 줄마다 `.fb-string-name`(`--muted`, numFont 크기, text-anchor end)으로. `lo === 0` 이면 너트 왼쪽 개방 셀 왼편, `lo > 0` 이면 첫 프렛선 왼편. fill(그립)에도 | 6/7현 모두 줄 이름이 줄 y 에 정확히 정렬, 390 폭 9칸 창에서 라벨 가독 유지(셀 폭 감소 ≤ 8%), 가로 넘침 0 |
| U2 | **눌림 피드백**: `onTap` 이 나가는 pointerdown 마다 그 posKey 를 160ms 동안 `pressed` 로 보관(Set, 멀티터치) → `.fb-mark.pressed` 는 `fb-press` 키프레임(scale 1.15 → 1, `transform-box: fill-box; transform-origin: center`), 마크가 없는 자리는 `.fb-cell.pressed` 에 `fill: color-mix(in srgb, var(--text) 10%, transparent)` | 탭마다 보이는 반응이 있다(스크린샷·임시 스크립트로 class 확인). reduced-motion 은 index.css 전역 규칙이 처리 |
| U3 | **state 전환 모션**: `.fb-mark { transition: fill var(--t-fast), stroke var(--t-fast) }`, `st-hit` 로 바뀔 때 `pop var(--t-med)`, `st-miss` 는 `shake` 대신 색만(보드 전체 shake 는 D) | 채점 때 hit 가 튀어오름 |
| U4 | **드래그 선택** `drag?: boolean`(계약 §3.5 에 추가됨, 타입은 이미 있음): true 면 pointerdown 뒤 `setPointerCapture` + pointermove 마다 `document.elementFromPoint` 로 `[data-pos]` 를 찾아 **같은 포인터가 처음 들어가는 셀마다** `onTap` 1회(시작 셀 포함, 되돌아와도 재호출 없음). pointerup/cancel 로 종료. `drag` 일 때 svg `touch-action: none` | 채우기에서 손가락을 가로로 쓸면 지나간 자리가 전부 찍힌다(같은 셀 2회 토글 없음). `drag` 가 아니면 동작 변화 0 |
| U5 | **PC 호버**: `@media (hover: hover)` 안에서 `.fb-cell:hover { fill: color-mix(in srgb, var(--text) 6%, transparent) }`, `onTap` 이 있을 때만 `cursor: pointer`(`.fretboard[data-tap] .fb-cell`) | 보기/채우기에서 마우스 올리면 셀이 보인다 |
| U6 | fill 모드 번호 띠 글자: `numFont` 상한 13 → fill 이면 `min(16, sg*.34)`, 번호 띠 높이 NUM_H 도 비례 | 844×390 그립에서 번호 ≥ 14px |

### D 연습 (`src/features/study/**`)
| # | 항목 | 완료 기준 |
|---|---|---|
| U7 | **채우기 진행**: 바에 `찍음 <strong>k</strong> / 정답 n` (`.study-progress`), k = `fill.picked.size`, n = `marks.length` | 찍을 때마다 갱신 |
| U8 | **채우기 드래그**: `<Fretboard drag={mode === 'fill' && !fill.graded}>` + 토글마다 `haptic('tap')` | 쓸어 찍기 동작(B U4 머지 뒤 확인; 당신 워크트리에선 prop 만 넘긴다) |
| U9 | **보드 스와이프**(coarse): `.study-board` 에서 한 손가락 가로 80px 이상 → 창(`wins.length > 1`)이 있으면 창 이동, 없으면 포지션 이동(`all.length > 1`). 세로 이동이 더 크면 무시(스크롤). `mode === 'fill' && !graded` 면 스와이프 끔(드래그 선택과 충돌) | 390 보기에서 좌우 스와이프로 `프렛 0–7 · 1/2` → `8–15 · 2/2` |
| U10 | **결과 보이기**: 요약 카드가 마운트되면 `scrollIntoView({ block: 'nearest', behavior: 'smooth' })`(reduced-motion 이면 `auto`). 채점·완주 때 `haptic('success')` | 390 채우기에서 채점 뒤 요약이 보인다 |
| U11 | **키보드**: Space = 들어보기 토글(보기 모드), 숫자 `1`~`9` = 포지션 n(`system !== 'full'`), Esc = 들어보기 중지. PC(`@media (hover: hover) and (min-width: 761px)`)에서만 바 아래 한 줄 `.study-kbd muted`: `Enter 채점·다시 · ← → 포지션 · Space 들어보기 · 1–9 포지션`(모드에 맞는 것만) | 단축키 동작 + 390 에서 힌트 숨김 |
| U12 | **따라치기 다음 음 안내**: progress 에 `다음 <strong>{labelOf(target, labelMode === 'none' ? 'note' : labelMode, accidental)}</strong> · {n - string}번줄`. 완주 뒤엔 없음 | 2/12 진행 중 "다음 C · 5번줄" 표시 |
| U13 | **완주 사운드**: 따라치기 완주 때 `playSequence([rootMidi, rootMidi + 7, rootMidi + 12], 120)`(rootMidi = 포지션 안 첫 루트 마크의 midi, 없으면 생략) | 완주 때 짧은 아르페지오 |
| U14 | 보기 모드 마크 탭 시 `haptic('tap')` | |

### F 선택 UI (`src/features/picker/**`)
| # | 항목 | 완료 기준 |
|---|---|---|
| U15 | **현재 선택으로 스크롤**: 스케일 시트가 열릴 때(검색어 없음) 선택된 스케일 버튼을 `scrollIntoView({ block: 'center' })`. 닫을 때 검색어 초기화 | 65종 중 '민속' 스케일 선택 상태로 열면 그 버튼이 보인다 |
| U16 | **PC 검색 포커스**: `matchMedia('(pointer: fine)')` 이면 시트 열릴 때 검색 입력 포커스(coarse 는 키보드가 올라오므로 금지) | PC 에서 열자마자 타이핑 가능 |
| U17 | **스케일 구성 표시**: 시트 '스케일' 제목 옆/아래 한 줄 `.picker-formula tnum muted`: `1 b3 4 5 b7` + ` · ` + `A C D E G`(`intervalName`·`noteName`·`scalePcs`). ScaleBar 버튼(비 compact)에는 넣지 않는다 | 선택 바꿀 때마다 갱신 |
| U18 | **슬라이더 값**: 볼륨·기울기 오른쪽에 `<output class="tnum muted">80%</output>` | |
| U19 | **루트 미리듣기**: 루트 버튼 누르면 `patchSettings` + `playNote(48 + pc)`(C3 옥타브) | 루트 탭 때 소리 |
| U20 | **포지션 순번 툴팁**: 순번 버튼에 `data-tip="2–5 프렛"`(`positions()[i].frets`) + `aria-label="포지션 1 (2–5 프렛)"` 는 **금지**(E2E 가 `name: '1', exact: true` 로 찾는다) — `data-tip` 만 | 호버 툴팁 |
| U21 | **기본값 복원**: 옵션 시트 맨 아래 `button.link` "기본값으로" → `patchSettings(DEFAULTS)`(`src/core/settings.ts` export) | 눌러서 전부 기본값 |
| U22 | 톤 세그먼트 미리듣기는 유지. 톤 버튼에 `data-tip`(어쿠스틱: 맑고 짧게 / 록: 오버드라이브 / 메탈: 하이게인) | |

### E 그립 (`src/features/grip/**`)
| # | 항목 | 완료 기준 |
|---|---|---|
| U23 | **접힌 띠 핸들**: `.grip-edge` 가 보이게 — 상단 중앙 28×4px pill(`--border-strong`, radius 2px)을 `::after` 로. 탭 표적은 그대로 24px 띠 | 띠가 접힌 뒤 위쪽에 작은 핸들이 보인다 |
| U24 | **띠에 옵션**: `<OptionsButton />`(F export) 를 음소거 버튼 왼쪽에. 시트가 열려 있는 동안 띠 자동 접힘 금지(`document.querySelector('.sheet')` 가 있으면 타이머 재무장) | 그립 안에서 표기/톤 변경 가능 |
| U25 | **시작 화면**: 타일 위에 `<ScaleBar />` + `<OptionsButton />` 한 줄, 타일 아래 한 줄 설명(`muted`): "폰을 가로로 눕혀 넥처럼 잡고 프렛을 누르세요 · 띠는 3초 뒤 접힙니다 · ✕ 또는 ESC 로 나가기" | 시작 전에 스케일 선택 가능 |
| U26 | **PC 키보드**: 활성 상태에서 `←`/`→` = 창 1칸 이동, `Escape` 는 브라우저가 전체화면을 풀면 기존 `fullscreenchange` 로 복귀 | |
| U27 | 창 이동(스와이프·◂ ▸·키)마다 `haptic('tap')` | |
| U28 | 따라치기 완료 토스트에 소요 시간 추가 `완료 — 틀림 n · 12.3초`(첫 탭 ~ 마지막 탭) | |

### C 오디오 — 오케스트레이터가 직접(2줄)
| # | 항목 |
|---|---|
| U29 | `new AudioContext({ latencyHint: 'interactive' })` |
| U30 | `visibilitychange` 로 돌아오면 `ctx.resume()` |

### 범위 밖 (하지 않음, 이유)
- U31 키보드로 셀 포커스 이동(프렛보드 접근성): 1차에서 범위 밖으로 둔 항목. SVG 셀 96~150개에 roving tabindex 는 별도 작업.
- 그립 "마크 위에서 스와이프 시작 시 음 1회": pointerdown 즉시 발음이 멀티터치 반응성의 핵심이라 유지(QA #5 결정 그대로).
- 왼손 모드·간격 반복: 1차 사용자 미선택.

## 2. 공유 계약 변경 (1차 §3 에 더함)
- §3.5 `FretboardProps.drag?: boolean` — 오케스트레이터가 타입만 추가했고(B 머지 전까지 무동작), B 가 구현(U4), D 가 사용(U8).
- 그 외 export 이름·시그니처 변경 없음. `DEFAULTS`(settings)·`labelOf`·`intervalName`·`scalePcs`·`noteName`·`midiToPc`(music)·`OptionsButton`·`ScaleBar`(picker)·`haptic`(feel)·`toast`(Toast)·`playNote`·`playSequence`(audio)는 이미 export 돼 있다.
- CSS 전역(`src/index.css`)은 바꾸지 않는다. 새 키프레임은 각 워커 css 에 `fb-press` 하나만(B).

## 3. 분할·소유권 (파일 배타)
| 워커 | 항목 | 수정 가능 | 포트 |
|---|---|---|---|
| B 프렛보드 | U1–U6 | `src/features/fretboard/**`, `docs/plans/agent_B_fretboard_ux.md` | 8042 |
| D 연습 | U7–U14 | `src/features/study/**`, `docs/plans/agent_D_study_ux.md` | 8044 |
| F 선택 UI | U15–U22 | `src/features/picker/**`, `docs/plans/agent_F_picker_ux.md` | 8046 |
| E 그립 | U23–U28 | `src/features/grip/**`, `docs/plans/agent_E_grip_ux.md` | 8045 |
| QA(2단계) | 머지 뒤 E2E 3/3 + 새 항목 재검증·스크린샷 | `e2e/**`, `docs/qa/**`, `docs/QA_fretlab_ux.md`, `docs/plans/agent_QA_ux.md` | 4183 |

머지 순서: B → F → D → E(D 는 B 의 `drag` 구현, E 는 F 의 OptionsButton 을 쓰지만 둘 다 이미 export/타입이 있어 각자 워크트리에서 typecheck 가 통과한다). 머지마다 typecheck/lint/check/build. 그 다음 `npm run e2e` → QA 워커.

## 4. E2E 영향
기존 `e2e/fretlab.spec.ts` 3개는 그대로 통과해야 한다. 주의: 접근 가능한 이름(`스케일 선택`·`옵션`·`닫기`·`채점`·`시작`·`모드`·`루트`·`표기`·`포지션 시스템`·`포지션 순번`·순번 버튼 `1`)과 클래스(`.fb-mark`·`.root`·`.st-*`·`.fb-label`·`[data-pos]`)는 바꾸지 않는다. 줄 이름 `<text>` 는 `.fb-label` 이 아닌 `.fb-string-name` 으로.

## 5. 결과 (2026-11-14)

### 5.1 완료
U1~U30 전부 적용·머지(B 7da92ce · F 542e58e · D b1ca93e · E 7065387 · C/계약 4294313 · QA 5d57f0e). QA 보고서 `docs/QA_fretlab_ux.md`: U1~U30 전부 확인, 높음·중간 결함 0, 낮음 1(따라치기 PC 힌트 문구 → 오케스트레이터가 `kbdHint` 에서 follow 는 `Enter 다시` 로 수정), 참고 1(채우기 미채점 중 스와이프는 드래그 선택 우선 — 사양 유지, 창 이동은 ◂ ▸).
검증(main 최종): typecheck 0 · lint 0 · check 4/4 · build JS 23.58 + CSS 5.46 = **29.04 KB gzip**(예산 60, 1차 대비 +1.9 KB) · `npm run e2e` **4/4**(쓸어 찍기 (d) 추가) · 자동 검사(가로 넘침 20/20 · aria-label · 토큰 밖 색 · 그림자 · 콘솔 오류 · 외부 요청) 전부 0.
1차 결함 재확인: #1 E2E 호스트 해결, #2 그립 셀 143.5×62.3 px(요구 120×56 충족), #3 1440 채점 바 900px 안, #4 도수=순번/인터벌=b3 유지(plan 문구 정정 완료), #5 알려진 제한 유지.

### 5.2 범위 밖·미결
- U31 프렛보드 키보드 셀 포커스(접근성) — 별도 작업.
- 실기기 체감(haptic·오디오 지연·쓸어 찍기 손맛)은 Playwright 로 호출 횟수만 확인 — 사용자 실기기 확인 필요.


## 진행 기록
- 2026-11-14 조사·plan 작성, 계약 §3.5 `drag` 타입 추가, C U29–U30 직접 적용, 워커 4명 디스패치.
- 2026-11-14 F→E→D→B 순 머지(각각 typecheck/lint/check/build 통과), E2E 3/3 → QA 워커 → 머지, 결함 #1 수정, E2E 4/4. §5 기록.
