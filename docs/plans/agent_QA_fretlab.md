# 워커 QA — 통합 검증·E2E·PWA 아이콘 (2차)

작성 2026-11-14. 범위: 오케스트레이션 plan §5 3단계. 시작 커밋 3726d87(1차 6명 전원 머지). 다른 워커 파일은 **고치지 않고** `docs/QA_fretlab.md` 에 번호로 보고한다.

## 접근 방식

- **E2E** `e2e/fretlab.spec.ts` 하나, `test.describe` 없이 흐름 3개(`view`·`fill`·`grip`). 셀렉터는 접근 가능한 이름(role + name)과 `[data-pos]`·`.fb-mark.root` 만. 정답 자리는 `src/core/music` 의 `positions()` 를 테스트에서 직접 import 해 계산한다(앱 DOM 에 의존하지 않는 독립 기준). 각 테스트는 `addInitScript` 로 `localStorage.clear()` → 기본값.
  - 소리 호출 횟수: `playNote` 는 모듈 내부 함수라 window 스파이가 안 되므로 `AudioBufferSourceNode.prototype.start` 를 `addInitScript` 로 감싸 호출 수를 센다(`playNote` 1회 = 소스 1개 `start`). 음소거면 0 이므로 기본값(muted=false) 로 둔다.
  - 그립 터치는 `page.touchscreen.tap` 2회(Playwright 는 동시 두 포인터를 못 만들므로 "연달아" 로 검증, 동시성은 `dispatchEvent(pointerdown)` ×2 로 보강).
- **스크린샷·자동 검사·아이콘·미결 재검증**은 scratchpad 의 임시 Playwright 스크립트(커밋 안 함)로 `vite preview` 에 붙어 돌린다. 결과 숫자만 보고서에 적는다.
- **아이콘**: `favicon.svg` 를 그대로 쓰지 않고(다크 미디어쿼리가 있어 헤드리스 색이 불확실) `#f4f4f4` 바탕 + `#111` 사각 HTML 을 `page.setContent` 로 그려 `screenshot({clip})` 으로 PNG. maskable 은 사각을 60% 크기(여백 20%).
- 대안 검토: (a) 정답 자리를 보기 모드 DOM 에서 수집 → 앱이 틀리면 테스트도 같이 틀리므로 기각, `positions()` 직접 계산 채택. (b) E2E 안에 스크린샷/검사까지 넣기 → 완료 기준이 "3/3" 이므로 흐름 3개만 두고 나머지는 임시 스크립트.

## 수정/생성 파일

- `e2e/fretlab.spec.ts` — E2E 3개
- `public/pwa-192.png` `public/pwa-512.png` `public/pwa-maskable-512.png` — 아이콘
- `docs/qa/*.png` — 스크린샷 8장(≤150 KB)
- `docs/QA_fretlab.md` — 보고서
- `docs/plans/agent_QA_fretlab.md` — 이 문서

## 작업 목록

- [x] 1. plan 작성
- [x] 2. `e2e/fretlab.spec.ts` (a) 연습 보기 (b) 채우기 (c) 그립 → `npm run e2e` 3/3
- [x] 3. PWA 아이콘 3개(≤10 KB), `dist/manifest.webmanifest` 가 가리키는지 확인
- [x] 4. 스크린샷 8장 `docs/qa/`
- [x] 5. 자동 검사(가로 넘침·aria-label·토큰 밖 색·box-shadow·콘솔 오류·외부 요청·번들 표)
- [x] 6. 1차 미결 재검증(E①② / D①② / B / A / F)
- [x] 7. `docs/QA_fretlab.md` 보고서
- [x] 8. `npm run typecheck && lint && check && build && e2e` 통과, 커밋

## 검증 방법

| 단계 | 확인 |
|---|---|
| 2 | `npm run e2e` 출력 `3 passed` |
| 3 | `ls -l public/pwa-*.png` 각 ≤ 10240 B, `dist/manifest.webmanifest` 의 `icons[].src` 와 파일명 일치, preview 에서 `/pwa-192.png` 200 |
| 4 | `ls -l docs/qa` 각 ≤ 153600 B |
| 5·6 | 임시 스크립트 출력을 보고서 표에 옮김 |
| 8 | 다섯 명령 종료코드 0 |

## 변경 사항 (plan 대비)

- `npm run e2e` 가 이 환경에서 그대로 돌지 않는다(`vite preview` 가 `[::1]` 만 리슨, webServer url 은 127.0.0.1). `playwright.config.ts` 는 수정 금지라 `NODE_OPTIONS=--dns-result-order=ipv4first` 로 우회해 3/3 을 얻고 결함 #1 로 보고했다(수정안: command 에 `--host 127.0.0.1`).
- E2E (a) 의 "도수 → 1·b3 류": 앱의 '도수' 는 순번(1..5), 'b3' 은 '인터벌' 이라 테스트는 둘 다 검사한다(결함 #4 낮음으로 기록, 테스트 약화 아님).
- 채우기 스크린샷의 정답 자리는 하드코딩 대신 보기 모드 DOM(마크 rect 중심 → 셀)에서 수집했다(CAGED 1 이 15프렛에서는 5–8 이 아니라 2–5).

## 결과 (2026-11-14)

- E2E 3/3(우회 env), 스크린샷 8장(11~30 KB), 아이콘 3개(0.6~1.9 KB), 보고서 `docs/QA_fretlab.md`.
- 결함 5건: #1 높음 E2E 인프라(오케스트레이터) · #2 높음 그립 프렛보드 60vh 캡(B) · #3 중간 1440 채점 뒤 바가 화면 밖(D/B) · #4 낮음 도수/인터벌 이름(A·F) · #5 낮음 스와이프 시작 음(E, 알려진 제한).
- 자동 검사 전부 0(넘침·aria-label·토큰 밖 색·그림자·콘솔 오류·외부 요청), 번들 27.14 kB gzip ≤ 60.
- 미결 재검증 전부 ✔(E①② D①② B A F).
- `npm run typecheck`·`lint`·`check`·`build` 통과. 임시 스크립트는 `test-results/`(gitignore)·scratchpad, 커밋 안 함.
