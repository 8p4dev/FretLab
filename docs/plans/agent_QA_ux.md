# 워커 QA — 2차(UI·인터랙션 개선) 통합 검증

작성 2026-11-14. 범위: `orchestration_fretlab_ux.md` U1~U30 머지 뒤 통합 검증. 시작 커밋 a74eb05(B2·F2·D2·E2 전원 머지). 다른 워커 파일은 **고치지 않고** `docs/QA_fretlab_ux.md` 에 번호로 보고한다.

## 접근 방식

- **E2E** `e2e/fretlab.spec.ts` 기존 3개 유지 + **(d) 채우기 쓸어 찍기** 1개 추가. 1440 CAGED 1 → `#/study/fill` → 정답 중 같은 줄 연속 2~3칸을 `mouse.down → move(각 셀 중심, steps) → up` 으로 쓸기 → 지나간 셀 전부 `.st-picked`, 같은 셀 중복 토글 없음(= picked 수가 쓸어 간 셀 수와 정확히 같음), 바에 `찍음 k / 정답 n`. 같은 줄 연속 셀은 `positions()` 결과에서 고른다(앱 DOM 비의존). 테스트 약화 금지 — 앱 결함이면 `test.fixme` + 보고.
- **모듈 간 재검증·자동 검사·스크린샷**은 scratchpad 의 임시 Playwright 스크립트(커밋 안 함)로 `vite preview`(dist, 포트 4183 또는 별도 포트)에 붙어 돌린다. 결과 숫자만 보고서에 옮긴다. 1차와 같은 방식(aria-label·넘침·색·콘솔·외부 요청·번들).
  - 터치 제스처(U4+U8, U9, U2)는 CDP `Input.dispatchTouchEvent` — Playwright `touchscreen` 은 tap 만 있어 드래그·동시 2점이 안 된다.
- 대안 검토: (a) E2E 에 재검증 항목까지 넣기 → 완료 기준이 "4/4" 이고 재검증은 환경 의존(터치·타이머)이 커서 임시 스크립트로. (b) 터치 드래그를 `page.mouse` 로 대체 → U4 의 `touch-action: none`(세로 스크롤 억제)은 터치에서만 의미가 있으므로 CDP 터치로.

## 수정/생성 파일

- `e2e/fretlab.spec.ts` — (d) 추가
- `docs/qa/*.png` — 8장 갱신(같은 이름 덮어쓰기) + `fill-drag-1440-light.png`, `grip-collapsed-844x390-dark.png`
- `docs/QA_fretlab_ux.md` — 보고서
- `docs/plans/agent_QA_ux.md` — 이 문서

## 작업 목록

- [x] 1. plan 작성, `npm install`
- [x] 2. E2E (d) 작성 → `npm run e2e` 4/4
- [x] 3. 모듈 간 재검증(임시 스크립트): U4+U8 터치 쓸기·스크롤 없음 / U9 스와이프(보기 이동·채우기 정지) / U24 띠 옵션·시트 중 띠 유지·도수 라벨 / U25 시작 화면 스케일 변경 / U1 줄 이름(스탠다드·7현·Drop D·Eb b표기·그립) / U2 두 손가락 `.pressed` 2 / U10 요약 뷰포트 안(채우기·따라치기) / U11 힌트·Space/Esc/숫자 / U15·U16 포커스·선택 보임 / U23 핸들
- [x] 4. 자동 검사: 가로 넘침 4화면×3폭+그립, aria-label, 토큰 밖 색·box-shadow, 콘솔 오류, 외부 요청, 번들 표
- [x] 5. 스크린샷 10장 `docs/qa/` (≤150 KB)
- [x] 6. 보고서 `docs/QA_fretlab_ux.md`
- [x] 7. `npm run typecheck && lint && check && build` + e2e 4/4, 커밋

## 검증 방법

| 단계 | 확인 |
|---|---|
| 2 | `npm run e2e` 출력 `4 passed` |
| 3·4 | 임시 스크립트 출력(콘솔) → 보고서 표 |
| 5 | `ls -l docs/qa` 10장 각 ≤ 153600 B |
| 7 | 다섯 명령 종료코드 0 |

## 변경 사항 (plan 대비)

- E2E (d) 는 "같은 줄 연속 2~3칸" 을 `positions()` 에서 **같은 줄의 정답 간격이 가장 좁은 두 자리 사이**(펜타토닉이라 정답이 바로 붙지 않아 비정답 1칸 포함, 6번줄 3→4→5)로 고르고, 끝에서 시작 셀로 **되돌아온 뒤** up 해 "같은 셀 중복 토글 없음" 을 직접 검사한다(약화 아님, 강화). 지나간 셀의 picked 확인은 마크 rect 에 `data-pos` 가 없어 셀 사각 안에 `.fb-mark.st-picked` 가 있는지 좌표로 대응.
- 터치 쓸기 중 세로 스크롤 검사에 양성 대조(헤더에서 같은 제스처 → 스크롤됨)를 넣었다 — 첫 시도는 터치 시작점이 하단 고정 바 위에 떨어져 무의미한 0 이었다.
- haptic 검증은 "코드 경로만" 대신 `navigator.vibrate` 를 `addInitScript` 로 스텁해 호출 패턴을 셌다. 단 `haptic()` 이 `prefers-reduced-motion` 이면 침묵하므로 그 검사만 `reducedMotion` 없이 돌렸다. `tsx` 로 돌리는 임시 스크립트에서 함수형 init script 는 esbuild `__name` 헬퍼 때문에 깨져 문자열로 넘겼다(E2E 는 Playwright 가 직접 컴파일해 무관).
- 추가로 U3·U5·U12·U13·U17~U22·U26·U28 도 임시 스크립트로 확인해 U1~U30 표를 전부 "확인" 으로 채웠다(U29·U30 은 코드 확인).

## 결과 (2026-11-14)

- `npm run e2e` **4/4**(우회 env 없음), 스크린샷 10장(12~34 KB), 보고서 `docs/QA_fretlab_ux.md`.
- 결함: 낮음 1건(#1 따라치기 키보드 힌트 문구 `Enter 채점·다시` — D) + 참고 1건(#2 채우기 중 스와이프는 창 이동 안 함 — 사양대로). 높음·중간 없음. 1차 #1·#2·#3 해결 확인, #4·#5 변경 없음.
- U1~U30 전부 확인. 자동 검사 전부 0(넘침 20/20·aria-label·토큰 밖 색·그림자·콘솔·외부 요청), 그립 셀 143.5×62.3 px ≥ R8, 번들 29.04 kB gzip ≤ 60.
- `npm run typecheck`·`lint`·`check`·`build` 통과. 임시 스크립트는 `test-results/`(gitignore)·scratchpad, 커밋 안 함.
