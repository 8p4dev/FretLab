# 에이전트 E — 그립 모드 (`src/features/grip/**`)

작성 2026-11-14. 오케스트레이션 plan `orchestration_fretlab.md` §1 R8, 계약 §3.1 §3.3 §3.4 §3.5 §3.6 §3.7 §3.8.

## 접근 방식

- **파일 2개만**: `GripPage.tsx`(상태·전체화면·창·오버레이·따라치기 전부) + `grip.css`. 별도 훅 파일·컴포넌트 분리는 하지 않는다(사용처 1곳).
- **진입 상태 머신**: `active=false` → `.empty` 타일 [시작] 버튼. 클릭(사용자 제스처) → `requestFullscreen()`·`orientation.lock('landscape')`·`wakeLock.request('screen')` 전부 try/catch, 실패 무시 → `active=true`. `fullscreenchange` 에서 `fullscreenElement` 가 없어지면(ESC) `active=false` 로 되돌린다. 언마운트(나가기) 때 effect cleanup 이 전부 해제.
  - 대안 검토: 진입 즉시 자동 전체화면 — 사용자 제스처 없이는 브라우저가 거부하므로 불가. [시작] 버튼이 필수.
- **방향**: `matchMedia('(orientation: portrait)')` 구독 훅. 세로면 프렛보드 자리에 `I.smartphone` + "가로로 돌려 주세요". 오버레이는 그대로 둔다(나가기 가능).
- **프렛 창**: `cols = min(5, max(4, floor(innerWidth/150)))`, `lo` 는 포지션 바뀔 때 `pos.frets[0]` 으로 리셋, `hi = min(lo+cols-1, fretCount)`, `lo ∈ [0, fretCount-cols+1]`. `<Fretboard fill frets=[lo,hi]>`.
- **스와이프 vs 탭**: 프렛보드 래퍼에서 pointer 이벤트로 시작점·이동량을 기록. 80px 넘는 수평 이동 → 1프렛 이동. `onTap` 핸들러는 그 포인터가 20px 넘게 움직였으면 무시(탭 취소). B 의 Fretboard 가 `onTap` 을 pointerdown 에서 쏘면 취소가 불가능하므로 그 경우 스와이프 시작 음 1회가 남는다 — 머지 뒤 확인 항목.
- **오버레이 접힘**: CSS grid `1fr → 0fr` 전환(DrillDown flash-kids 패턴, `--t-med`·`--ease-out`). 3초 타이머는 그립 루트의 `pointerdown`(capture)마다 리셋. 접힌 동안 상단 24px 투명 띠(`.grip-edge`) 탭 → 펼침.
- **소리**: `onTap(pos)` 가 마크 자리면 `playNote(midiAt(tuning,pos))` + `haptic('tap')`. Fretboard 가 포인터마다 `onTap` 을 한 번씩 쏘므로(계약) 두 손가락 = 두 번 호출 = 두 음. 별도 멀티터치 코드 없음.
- **따라치기**: `useFollow(visibleMarks)`(창 안 마크, useMemo 로 참조 고정). `tap` 결과 hit → 소리, miss → `haptic('warn')`. `done` 이 true 가 되는 effect 에서 `toast('완료 — 틀림 n')` + `reset()`.
- **나가기**: 버튼(`.ghost`, `I.x`) → `location.hash = href.study()`. 해제는 언마운트 cleanup 이 맡는다.

## 수정/생성 파일

- `src/features/grip/GripPage.tsx` (덮어쓰기, default export 유지)
- `src/features/grip/grip.css` (덮어쓰기)
- `docs/plans/agent_E_grip.md` (이 문서)

소유 범위 밖 파일 수정 없음. 필요한 아이콘(`smartphone volume2 volumeX x chevronLeft chevronRight maximize`)은 전부 `I.*` 에 있다.

## 단계별 작업

- [x] 0. `npm install`, 계약·스텁·토큰 읽기
- [x] 1. plan 작성(이 문서)
- [x] 2. `GripPage.tsx`: 시작 화면 + 전체화면/방향/웨이크락 진입·해제 + `fullscreenchange` 동기화
- [x] 3. 방향 훅 + 세로 안내
- [x] 4. 프렛 창 계산 + ◂ ▸ + 스와이프(탭 취소 포함)
- [x] 5. 오버레이(ScaleBar compact · 포지션 · 모드 seg · 음소거 · 나가기) + 3초 접힘 + 가장자리 탭 + 안전 영역
- [x] 6. 소리(`playNote`·`haptic`) + 따라치기(`useFollow` · 토스트 · reset)
- [x] 7. `grip.css`(토큰만)
- [x] 8. `npm run typecheck && npm run lint && npm run check && npm run build`
- [x] 9. Playwright 임시 스크립트(커밋 안 함): 844×390 isMobile/hasTouch 스크린샷, 터치 2점 → 두 셀 반응 확인 → 결과 아래 기록
- [x] 10. 커밋

## 검증 방법

| 단계 | 확인 |
|---|---|
| 2~7 | `npm run typecheck`·`lint` 0 오류, `npx vite --port 8035` 로 `#/grip` 열어 시작→오버레이→나가기 흐름 |
| 4 | Playwright: 844 폭에서 `cols=5`(frets 0–4 표시), ▸ 로 1칸 이동 |
| 6 | Playwright: `[data-pos]` 셀이 스텁이라 없음 → 래퍼에 `dispatchEvent(pointerdown ×2)` 로 두 포인터 → `onTap` 경로 대신 `window.__gripTaps` 같은 훅은 두지 않고, 콘솔 오류 0 + 두 포인터가 각각 처리되는지 스와이프 가드 로그로 확인(스텁 한계 — 실물 Fretboard 머지 뒤 QA 가 셀 탭으로 재검증) |
| 8 | `npm run build` 통과, gzip 크기 기록 |

## 변경 사항 (계획 대비)

- 따라치기 완료 처리는 `done` 을 보는 effect 가 아니라 `onTap` 에서 `tap()` 이 `'done'` 을 돌려줄 때 바로 한다(마지막 음은 맞은 것이므로 그 시점 `wrong` 이 최종값). exhaustive-deps 경고와 effect 한 개를 없앴다.
- 해제 함수·오버레이 타이머는 `useRef` 대신 모듈 변수(그립 화면은 동시에 하나뿐). oxlint `react(immutability)` 가 ref 대입을 경고해서다.
- 세로 모드에서는 오버레이에 스케일 이름·음소거·나가기만 남긴다(포지션·모드 세그먼트는 숨김) — 390px 폭에서 띠가 넘쳤다.
- 접힌 띠는 `grid 0fr` 만으로는 패딩·선 7px 가 남아 `padding-block: 0; border-bottom-width: 0` 도 같이 전환한다.

## 결과 (2026-11-14)

- `npm run typecheck` 0 오류 · `npm run lint` 경고 0 · `npm run check` ok · `npm run build` OK — JS 11.77 KB + CSS 3.96 KB gzip(스텁 전체 포함, 그립 몫 ≈ +2 KB).
- Playwright 임시 스크립트(scratchpad, 커밋 안 함, Edge 채널·844×390·`isMobile`·`hasTouch`) 결과 — 콘솔/페이지 오류 0:
  - `#/grip` 진입: 상단 바(`.topnav`) 없음. [시작] 탭 → 오버레이 + `Fretboard fill` 프렛 0–4(폭 844 → 5칸).
  - ▸ 버튼 → 1–5. 왼쪽 100px 스와이프 → 2–6, 오른쪽 스와이프 → 1–5. 두 손가락이 동시에 있는 동안의 이동은 스와이프로 치지 않음(변화 없음).
  - `page.touchscreen.tap` 두 번 → 오류 0. **두 셀 반응은 스텁 Fretboard 에 셀(`[data-pos]`)이 없어 확인 불가** — 계약상 Fretboard 가 포인터마다 `onTap` 을 한 번씩 쏘므로 B 머지 뒤 QA 가 셀 탭으로 재검증해야 한다(§5 3(c)).
  - 모드 세그먼트 [따라치기] 선택·진행 표시, 음소거 토글(아이콘·aria-label 전환), 포지션 1/1(스텁은 full 1개).
  - 3.3초 뒤 띠 접힘(높이 0) → 위쪽 가장자리 탭으로 펼침.
  - 390×844(세로) → "가로로 돌려 주세요" 안내. 나가기 → `#/`, 셸 복귀.
  - PC(1440×900, 마우스): 진입·▸ 동작. 전체화면 요청은 헤드리스에서 거부되지만 무시되고 진행된다.
- 스크린샷: scratchpad `grip-intro/landscape/follow/hidden/portrait/pc.png`(커밋 안 함).

## 미해결 · 확인 요청

- Fretboard(B)가 `onTap` 을 pointerdown 에서 쏘면 스와이프 시작 음이 1회 난다(탭 취소 불가). pointerup/click 이면 20px 슬롭으로 취소된다. 머지 뒤 확인.
- `useFollow`(D)가 `marks` 배열 참조가 바뀔 때 리셋하는지에 따라, 창을 옮기면 따라치기 진행이 초기화된다(창 안 마크만 대상이므로 의도된 동작).
- 계약 변경 요청 없음. 새 아이콘 필요 없음.
