# 워커 D — 학습 모드 (`src/features/study/**`)

작성 2026-11-14. 오케스트레이션 plan `orchestration_fretlab.md` §1 R7(+R2 연습 레이아웃), 계약 §3.1 §3.3 §3.4 §3.5 §3.6 §3.7 §3.8.

## 접근 방식

- **상태 로직은 순수 함수로**: `logic.ts` 안에 훅(`useFill`/`useFollow`) 과 그 밑의 순수 리듀서(`gradeFill`, `fillStates`, `followOrder`, `followTap`, `followStates`)를 같이 둔다. 훅은 리듀서를 `useState` 로 감싼 얇은 껍질. 리듀서만 `logic.check.ts` 가 `tsx` 로 검사한다(머지 전까지 Fretboard 가 스텁이라 화면으로는 확인 불가).
- **marks 가 바뀌면 자동 초기화**: 훅은 `marks.map(posKey).join()` 서명을 state 에 같이 저장하고, 서명이 다르면 그 렌더부터 초기 상태로 본다(useEffect 지연 없음). 포지션/스케일을 바꾸면 채우기·따라치기가 바로 처음으로 돌아간다. 그립(E)이 훅을 그대로 써도 같은 동작.
- **표시 상태(states)** 는 계약 §3.5 의미 그대로: 채우기 전 `picked`, 채점 뒤 정답 `hit`·오답 `miss`·놓친 자리 `dim`(채점 뒤에는 포지션 마크를 다시 보이게 넘겨 라벨이 드러난다). 따라치기는 현재 `target`, 지난 `hit`, 틀린 셀 `miss` 300ms.
- **레이아웃**: DrillDown TreeHeader(제목 + `.seg` 모드 탭 + 오른쪽 도구) + flash 패턴(모바일 하단 고정 `.flash-nav` → `.study-bar`, 요약 `.flash-summary` → `.study-summary`). 토큰·키프레임만 쓰고 색은 `--ok`/`--danger` 만.
- **기록**: `stats.ts` 는 localStorage `fretlab:stats` 한 키에 `{[key]: {attempts, correct, total, last}}`. 따라치기는 `correct = 음 수, total = 음 수 + 틀린 탭` 으로 적는다(정답률 = 맞은 탭 / 전체 탭).
- **들어보기 하이라이트**: `playSequence` 는 진행 콜백이 없어 같은 간격(220ms) 의 `setInterval` 로 `target` 을 옮긴다(선택 사항, 스텁에서도 눈으로 확인 가능해 넣음).
- 검토한 대안: (a) 모드 컴포넌트를 `key` 로 리마운트해 초기화 — 그립 E 가 훅을 쓸 때 같은 처리를 또 해야 해서 서명 비교로 대신. (b) stats 를 모드별 파일로 — 한 함수 두 개면 충분.

## 수정/생성 파일

- `src/features/study/logic.ts` — 순수 리듀서 + `useFill`/`useFollow`(계약 §3.7 이름·반환 형태 유지)
- `src/features/study/stats.ts` — `recordResult`, `statsFor`, `statsKey`
- `src/features/study/StudyPage.tsx` — 레이아웃·3 모드·키보드
- `src/features/study/study.css` — 레이아웃·바·요약
- `src/features/study/logic.check.ts` — 자가 검사(`npx tsx src/features/study/logic.check.ts`; package.json 은 건드리지 않음)
- `docs/plans/agent_D_study.md` — 이 문서

소유 범위 밖 파일 수정 없음.

## 단계

- [x] 0. `npm install`, 스텁 기준 typecheck/lint/check 통과 확인
- [x] 1. plan 작성
- [x] 2. `logic.ts`: 순수 리듀서(gradeFill·fillStates·followOrder·followTap·followStates) + 훅
- [x] 3. `logic.check.ts`: 채점 수치(hit/miss/missing), follow 순서·hit/miss/done 전이, 끝난 뒤 tap → done, 빈 marks
- [x] 4. `stats.ts`: recordResult/statsFor/statsKey(A5 키)
- [x] 5. `StudyPage.tsx`: head(ScaleBar + 모드 탭 + OptionsButton) · 포지션 줄 · Fretboard · 모드별 바
- [x] 6. 보기: 탭 → playNote(마크 있는 자리만), [들어보기] 토글 + target 하이라이트
- [x] 7. 채우기: picked → [채점] → 요약 카드 + [다시]/[다음 포지션], 채점 전 [초기화]
- [x] 8. 따라치기: hit/miss/shake/haptic, 요약(총·틀림·시간)
- [x] 9. 기록: 채점/완료 시 recordResult, 요약에 "정답률 n%(k회)"
- [x] 10. 키보드: Enter = 채점/다시, ←/→ = 포지션
- [x] 11. `study.css`: 모바일 `.study-bar` 하단 고정, 가로폰 흐름, 요약 스타일
- [x] 12. 검증: typecheck · lint · check · build · logic.check · dev 서버 8034 에서 390/1440 스크린샷(임시 Playwright 스크립트, 커밋 안 함)
- [x] 13. 커밋(의미 단위) · 보고

## 검증 방법

| 단계 | 확인 |
|---|---|
| 2·3 | `npx tsx src/features/study/logic.check.ts` → `logic.check ok` |
| 4 | logic.check 에 stats 순수 부분 포함(localStorage 없을 때 메모리 fallback) |
| 5~11 | `npm run typecheck && npm run lint && npm run build`, `npx vite --port 8034` 로 390/1440 에서 세 모드 전환·바·요약 확인(스텁 Fretboard 는 글자만 찍으므로 탭은 확인 불가) |
| 전체 | `npm run check`(음악 엔진 검사가 깨지지 않았는지) |

## 변경 사항

- **모바일 프렛 창(오케스트레이터 요청, B 머지 뒤)**: 390 폭에 16칸을 그리면 라벨이 ~5px 라 읽히지 않는다. `≤760` 폭에서 보이는 범위가 9칸을 넘으면 `fretWindows()`(logic.ts, 순수·검사됨)로 고르게 나눠 ◂ ▸ 로 넘긴다. 창 번호는 StudyPage 로컬 state(설정 저장 없음), 포지션이 바뀌면 0. 채점·따라치기 순서는 포지션 전체 기준 그대로(Fretboard 가 범위 밖 마크·상태를 그리지 않아 `frets` 만 바꾼다). `target`(따라치기 현재 음·들어보기 재생 음)이 창 밖이면 그 창으로 자동 이동. 스와이프는 넣지 않음(버튼으로 충분, 필요하면 추가).
- **자가 검사의 assert**: tsconfig 에 node 타입이 없어(`types: [vite/client]`) `node:assert` 대신 파일 안의 작은 assert 객체를 쓴다.
- **스톱워치·miss 타이머는 effect 로**: oxlint react 규칙(immutability/purity)이 핸들러 안 ref 변경·`Date.now` 를 경고해 state + useEffect 로 바꿨다(경고 0).

## 결과

2026-11-14. B·C·F·E 가 main 에 머지된 뒤 `git merge main` 으로 받아 실물 Fretboard 위에서 확인(A 음악 엔진은 아직 스텁 → positions 는 full 1개).

- `npm run typecheck` 0 · `npm run lint` 0(경고 0) · `npm run check` ok(music·audio·search) · `npx tsx src/features/study/logic.check.ts` → `logic.check ok` · `npm run build` OK(JS 19.23 KB + CSS 5.14 KB gzip, 전체 합계 ≤ 60 KB).
- dev 서버 `npx vite --port 8034` + 임시 Playwright 스크립트(Edge, 커밋 안 함) — 390×844(터치)·1440×900, 라이트/다크:
  - 가로 넘침: 보기/채우기/채점 뒤/따라치기/완주/전체 15프렛 전부 `scrollWidth == innerWidth`.
  - 보기: [들어보기] `aria-pressed=true` + target 셀 표시, 다시 누르면 중단.
  - 채우기: 셀 6개 탭 → picked 6 → [채점] → hit 3·miss 3·dim 36(나머지 정답) + 요약 "맞음 3 틀림 3 놓침 39 · 정답률 7%(1회)" → [다시] 로 초기화. Enter 로 채점/다시 동작.
  - 따라치기: target 을 순서대로 42번 탭(1번 일부러 틀림) → 완주 요약 "음 42 틀림 1 1.9초 · 정답률 98%(1회)". 틀린 탭은 셀 miss + shake.
  - 모바일 전체(0–15): 창 2개(0–7, 8–15) + "프렛 0–7 · 1/2" 줄, 하단 바 `position: fixed`. 1440 에서는 창 줄 없음(16칸 그대로).
  - 콘솔/페이지 오류 0.
- 미해결: 없음. 접근 가능한 이름 — 모드 탭 `aria-label` 보기/채우기/따라치기, 버튼 `채점` `다시` `다음 포지션` `들어보기` `초기화`. 포지션 줄 ◂ ▸ 는 `이전으로`/`다음으로`(E2E 의 `다음 포지션` 과 이름이 겹치지 않게), 프렛 창 ◂ ▸ 는 `이전 프렛 창`/`다음 프렛 창`.
