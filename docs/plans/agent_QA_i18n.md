# 워커 QA — 6차(i18n) 통합 검증: 반응속도 · E2E en · 레이아웃 재감사

작성 2026-11-14. 범위: `orchestration_fretlab_i18n.md` §1 Q1 · Q2 · L2 재감사. 시작 커밋 54d9192(웨이브 1 A6·D6·E6·F6 머지). 다른 워커 파일은 **고치지 않고** `docs/QA_fretlab_i18n.md` 에 번호로 보고한다(`e2e/**` 만 내 소유).

## 접근 방식

- **Q2 E2E** `e2e/fretlab.spec.ts`: 기존 4개를 en 접근 이름 + 재설계된 시트 구조로 고치고 (e) 언어 전환 추가. 지시문이 못박은 이름(`Scale`·`Root`·`Position system`·`Options`·`Close`·`Done`·`Grade`·`Start`·`Language`)은 리터럴로(접근 이름 계약을 테스트가 고정). 1440 은 3열이라 탭 클릭이 필요 없다(탭은 ≤ 760px 에서만 보임). `FRETS = 22`.
  - 대안: 문구를 `strings.ts` 에서 import → 앱이 이름을 바꿔도 테스트가 따라가 계약 검사가 사라져 기각.
- **Q1 반응속도**: scratchpad 의 임시 Playwright 스크립트(커밋 안 함)로 `vite preview`(4183, dist)에 붙는다. 측정 시각은 전부 페이지 안 `performance.now()`.
  - 입력 시각 = capture 단계 `pointerdown` 리스너의 `performance.now()`(같은 태스크 안) — `event.timeStamp` 는 CDP 합성 입력에서 신뢰하기 어려워 쓰지 않는다. 따라서 **OS·터치 하드웨어 입력 지연과 오디오 출력 지연(`outputLatency`)은 포함되지 않는다** — 보고서에 `baseLatency`/`outputLatency` 를 따로 적는다.
  - ① `AudioBufferSourceNode.prototype.start` 패치 → 호출 시각 − 입력 시각. 첫 탭(AudioContext 생성 + KS 버퍼 계산)과 이후 탭(같은 음 재타격 · 새 음)을 구분.
  - ② `MutationObserver`(class 에 `pressed`) → 그 뒤 rAF 콜백 시각 − 입력 시각.
  - ③ 클릭 → 더블 rAF(다음 프레임 커밋 뒤). 모드 전환(보기→채우기→따라치기), 스케일 시트 열기, 옵션 시트 열기.
  - ④ 드래그 중 rAF 간격 배열 + `PerformanceObserver('longtask')`. 기울기 슬라이더(1440 = 헤더 퀵 슬라이더, 390 = 옵션 시트 슬라이더), 채우기 드래그.
  - ⑤ 톤 로드: `performance.getEntriesByType('resource')` 의 `tones/` 항목 + 로드 완료(= 샘플로 재생되기 시작)까지 벽시계.
  - ⑥ `navigation` 항목(responseEnd·DCL·load) + FCP + 번들 gzip.
  - 1440 PC(스로틀 없음)와 390 터치(`isMobile`·`hasTouch` + CDP `Emulation.setCPUThrottlingRate` 4) 각 10회 → 중앙값·p95(n=10 이라 p95 = 최댓값에 가까움을 명시).
- **L2 재감사**: 임시 스크립트로 6화면(보기·채우기·따라치기·그립 + 스케일 시트·옵션 시트) × 390/768/1440 × en/ja/ko. 그립은 터치 전용(G1)이라 390 세로·844×390 가로·768 은 터치 컨텍스트, 1440 은 PC 안내 화면. 검사: 문서 가로 넘침, 보이는 요소의 rect 가 뷰포트 밖, 버튼·세그·탭·링크의 `scrollWidth > clientWidth`, 버튼 안 줄바꿈(높이), 콘솔·페이지 오류. 스크린샷 8장 `docs/qa/i18n-*.png`.
- 한국어 하드코딩 grep: `src/**/*.tsx` 에서 주석 제거 후 `[가-힣]`.

## 수정/생성 파일

- `e2e/fretlab.spec.ts`
- `docs/qa/i18n-*.png` 8장
- `docs/QA_perf.md`, `docs/QA_fretlab_i18n.md`
- `docs/plans/agent_QA_i18n.md`(이 문서)

## 작업 목록

- [x] 1. plan 작성, `npm install`
- [x] 2. E2E 4개 en·새 구조로 갱신 + (e) 추가 → `npm run e2e` 5/5
- [x] 3. Q1 측정 스크립트 → `docs/QA_perf.md`
- [x] 4. L2 감사 스크립트(54 조합 + 그립 가로) + 한국어 grep
- [x] 5. 스크린샷 8장(≤ 150 KB)
- [x] 6. 번들 표, `BASE_PATH=/FretLab/` 빌드 자산 경로
- [x] 7. 보고서 `docs/QA_fretlab_i18n.md`
- [x] 8. typecheck/lint/check/build + e2e 5/5, 커밋

## 검증 방법

| 단계 | 확인 |
|---|---|
| 2 | `npm run e2e` 출력 `5 passed` |
| 3·4 | 임시 스크립트 출력(JSON) → 보고서 표 |
| 5 | `ls -l docs/qa/i18n-*` 8장 각 ≤ 153600 B |
| 6 | `dist/assets` gzip 합, `dist/index.html` 의 `/FretLab/` 경로 |
| 8 | 다섯 명령 종료코드 0 |

## 변경 사항 (plan 대비)

- 작업 중 L6(번역 검토)이 main 80517df 에 머지돼 오케스트레이터 지시로 `git merge main` 했다. E2E 의 `Picked n / m answers` → `Picked n of m`. Q1·L2·번들 숫자는 전부 머지 뒤 빌드로 다시 쟀다.
- E2E `beforeEach` 의 `localStorage.clear()` 는 새로고침 때도 돌아 (e) 의 "새로고침 뒤 유지" 를 지운다 → 탭당 한 번만 지우게(`sessionStorage` 표시).
- E2E (b) 에 완료 상태의 `.study-bar` `Next position` 검사를 더했다(지시문의 범위 한정 항목).
- Q1 에 계획에 없던 행 추가: Fast 4G 가정의 톤 로드·첫 로드(로컬 서버 숫자만으로는 "일반적으로 얼마나 느린지" 를 말할 수 없어서), `new AudioContext()` 와 KS 버퍼 계산 시간을 따로 쟀다(100 ms 초과 원인을 추정이 아니라 측정으로).
- ② 의 페인트 시각은 rAF 콜백이 아니라 rAF + 메시지 채널(그 프레임 커밋 직후)로 쟀다.
- 폰 채우기 드래그 측정은 매 회 `Reset` 을 누르지 않는다 — 드래그 직후의 탭이 가끔 삼켜져(보고서 결함 4) 측정이 멈췄기 때문. 쓸기는 켜든 끄든 같은 렌더 일이다.
- 톤 로드 완료 판정을 "디코드 수 = 요청 수" 에서 "디코드 수 = 존 수(10·11)" 로 고쳤다 — 느린 망에서 첫 mp3 만 끝나도 완료로 잡혔다(첫 실행의 4G 숫자는 버림).
- L2 는 설정 2종(기본 CAGED · 긴 이름)과 그립용 뷰포트 2개(768 터치 세로 · 844×390 터치 가로)를 더해 화면 상태 246개.

## 결과 (2026-11-14)

- `npm run e2e` **5/5**(머지된 main 기준), `typecheck`·`lint`·`check`·`build` 통과.
- `docs/QA_perf.md`: 일반 반응 = 한 프레임 안팎(탭→소리 호출 0.2 / 0.9 ms, 탭→눌림 2.4 / 14 ms, 전환·시트 ≈ 10 ms). 느린 곳 = 첫 탭(최대 234 ms, AudioContext 생성), 폰 기울기 드래그(p95 58 ms), 톤 로드(4G 0.7 초), 첫 로드(폰 247 ms).
- `docs/QA_fretlab_i18n.md`: 결함 중간 1(그립 시작 화면 폰 세로 가로 잘림 — E) · 낮음 2 · 참고 2. 높음 없음. L2 246개 중 콘솔 오류 0, 줄바꿈 0, 겹침 0.
- 번들 JS + CSS 36.01 kB gzip, `BASE_PATH=/FretLab/` 자산 경로 확인.
- 스크린샷 8장(53~139 KB). 임시 스크립트는 scratchpad, 커밋 안 함.
