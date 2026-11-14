# FretLab QA 보고서 (2차 · 통합 검증)

2026-11-14, 워커 QA. 기준 커밋 3726d87(1차 6명 전원 머지). 환경: Windows 11 · Node 24.19 · Edge 채널 Playwright 1.65 · `vite preview`(빌드 결과). 임시 스크립트는 커밋하지 않았고 결과 숫자만 옮겼다.

## 1. 결함 목록

| # | 심각도 | 화면 | 내용 · 재현 | 소유 | 근거 |
|---|---|---|---|---|---|
| 1 | 높음 | E2E 인프라 | `npm run e2e` 가 그대로는 돌지 않는다. `vite preview` 가 이 환경(Node 24, Windows)에서 `localhost` → `[::1]` 에만 리슨하고 `playwright.config.ts` 의 webServer `url` 은 `127.0.0.1` 이라 180 s 뒤 `Timed out waiting 180000ms from config.webServer`. 재현: `npm run e2e`. 우회: `NODE_OPTIONS=--dns-result-order=ipv4first npm run e2e`(이 보고서의 3/3 은 이 우회로 얻음). 수정안: webServer command 에 `--host 127.0.0.1` 추가 | 오케스트레이터(`playwright.config.ts`) | `netstat`: `TCP [::1]:4183 LISTENING`, `curl 127.0.0.1:4183` → 000 |
| 2 | 높음 | 그립 | `fretboard.css` 의 `.fretboard svg { max-height: 60vh }` 가 `fill` 모드에도 걸려 그립 프렛보드가 화면 높이의 60 % 에 갇힌다. 844×390: 셀 **103.9×37.5 px**(R8 요구 프렛 1칸 ≥ 120, 줄 간격 ≥ 56), 띠가 접히면 래퍼는 390 px 로 커지는데 svg 는 234 px 그대로라 viewBox 가 `meet` 로 축소돼 셀 폭이 **89.8 px** 로 더 준다. 812×375·667×375·932×430 전부 같은 양상. 재현: `#/grip` → 시작 → 화면 아래 1/3 이 빈다. 수정안: `.fretboard.fill svg { max-height: none }` | B | `docs/qa/grip-844x390-light.png`, §4 표 |
| 3 | 중간 | 채우기 1440×900 | 포지션(4~6칸)을 그리면 svg 가 60vh(540 px)까지 커져 채점 뒤 요약 카드가 y≈730 에, [다시]·[다음 포지션] 바가 **900 px 아래**로 밀려 스크롤 없이는 안 보인다. 재현: CAGED 1 → 채우기 → 채점. 수정안: 채점 뒤 요약으로 `scrollIntoView`, 또는 좁은 범위의 `max-height` 를 더 낮게(예: 45vh) | D(배치) / B(높이) | `docs/qa/fill-graded-1440-dark.png` |
| 4 | 낮음 | 옵션 → 표기 | '도수' 는 스케일 **순번**(펜타토닉 `1 2 3 4 5`), '인터벌' 이 `1 b3 4 5 b7`. 계약(`types.ts` `degree` = 스케일 안 순번)대로라 결함은 아니지만 오케스트레이션 plan §5 의 "도수 → 1·b3 류" 와 어긋나므로 이름(도수/인터벌)을 바꿀지 판단 필요. E2E (a) 는 둘 다 검사한다 | A·F(이름) / 오케스트레이터(결정) | E2E (a) |
| 5 | 낮음 | 그립 | 마크 위에서 스와이프를 시작하면 음이 1회 난다(E plan 의 알려진 제한 그대로). 빈 자리에서 시작하면 0회. 체감: 창 이동은 정확히 1칸, 음은 짧은 한 번이라 거슬리지 않는 수준 — 그대로 둬도 된다고 본다 | E(기록) | §5 E② |

## 2. E2E (`e2e/fretlab.spec.ts`) — 3/3 통과

`NODE_OPTIONS=--dns-result-order=ipv4first npx playwright test --reporter=list`(결함 #1 우회). 정답 자리는 `src/core/music` 의 `positions()`/`marksFor()` 를 테스트에서 직접 계산한다. 매 테스트 `localStorage.clear()`(기본 설정) + `AudioBufferSourceNode.prototype.start` 스파이(`playNote` 1회 = 1회).

| 흐름 | 검사 | 결과 |
|---|---|---|
| (a) 연습 보기 1440 | 시트에서 A + 마이너 펜타토닉 → 셀 96 개, 마크 42, **루트 8**(`marksFor` 기준) · 루트 라벨 `A` → 도수 `1`(집합 `1..5`) → 인터벌 `1 b3 4 5 b7` · 콘솔 오류 0 | ok 766 ms |
| (b) 채우기 1440 | CAGED 1(2–5 프렛) 정답 12 자리 탭 → picked 12 → 채점 → `12맞음 0틀림 0놓침`, hit 12·miss 0 | ok 655 ms |
| (c) 그립 844×390 터치 | 시작 → `.topnav` 0 → 창 0–4 의 마크 두 셀 `touchscreen.tap` → 소리 2회 · 따라치기 → 첫 target 탭 → hit 1, target 이 다음 음 셀 중심(±2 px) · 소리 +1 · 콘솔 오류 0 | ok 282 ms |

## 3. 스크린샷 (`docs/qa/`, 전부 ≤ 30 KB)

| 화면 | 라이트 | 다크 |
|---|---|---|
| 연습 보기 | [view-1440-light](qa/view-1440-light.png) | [view-390-dark](qa/view-390-dark.png) (9칸 창 0–7 · 1/2) |
| 채우기(채점 후, 정답 11 + 오답 1) | [fill-graded-390-light](qa/fill-graded-390-light.png) | [fill-graded-1440-dark](qa/fill-graded-1440-dark.png) (결함 #3) |
| 따라치기(2/12 진행) | [follow-390-light](qa/follow-390-light.png) | [follow-1440-dark](qa/follow-1440-dark.png) |
| 그립 844×390 | [grip-844x390-light](qa/grip-844x390-light.png) (결함 #2) | [grip-844x390-dark](qa/grip-844x390-dark.png) |

룩: 무채색 토큰 + 초록/빨강만, 반경 2 px, 그림자 없음 — DrillDown 과 일치.

## 4. 자동 검사

| 항목 | 결과 |
|---|---|
| 가로 넘침 `scrollWidth − innerWidth` | 4화면(보기·채우기·따라치기·그립) × 390/768/1440 + 그립 844×390 = **13/13 모두 0 px** |
| 아이콘 전용 버튼/링크 `aria-label` 누락 | 4화면 × 3폭 + 스케일/옵션 시트 열림 + 그립 띠 접힘(`.grip-edge`) = **0** |
| `src/features/**/*.{css,tsx}` 토큰 밖 색(`#hex` `rgb(` `hsl(`)·`box-shadow` | **0** (9 파일; tsx 는 `fill=/stroke=/color=` 속성만) |
| 콘솔/페이지 오류 | 스크린샷·검사·재검증 전 세션 합계 **0** |
| 외부 요청(`page.on('request')`, 127.0.0.1 외 호스트) | **0** |
| 그립 844×390 셀 크기 | 103.9×37.5 px(띠 보임) / 89.8×37.8(띠 접힘) — **R8 미달**, 결함 #2 |
| 터치 표적 | 세그먼트·버튼 `min-height: var(--tap)`=44 px(coarse) — 스크린샷 육안 |

### 번들 (`npm run build`, 아이콘 추가 후)

| 파일 | 원본 | gzip |
|---|---|---|
| `assets/index-*.js` | 57.61 kB | **21.99 kB** |
| `assets/index-*.css` | 21.89 kB | **5.15 kB** |
| `index.html` | 1.29 kB | 0.68 kB |
| `manifest.webmanifest` | 0.40 kB | — |
| precache | 4 entries, 78.89 KiB (html·css·js; PNG 아이콘은 precache 밖) | |
| **JS+CSS gzip 합계** | | **27.14 kB ≤ 예산 60 kB** |

## 5. 1차 워커 미결 재검증

| 워커 | 항목 | 결과 |
|---|---|---|
| E ① | 실물 Fretboard 두 손가락 동시 탭(CDP `touchStart` 2점, 0:0 E + 1:0 A) | **`playNote` 2회** ✔ |
| E ② | 마크 위에서 왼쪽 120 px 스와이프 | 음 1회 + 창 0–4 → 1–5(1칸) — 알려진 제한 그대로, 체감 경미(결함 #5 낮음). 빈 자리 스와이프는 0회, 창 복귀 |
| D ① | CAGED(A 마이너 펜타) ▸ 5회 + ◂ | 1/5 2–5 → 2/5 5–8 → 3/5 7–10 → 4/5 9–13 → 5/5 12–15 → 1/5(순환) → 5/5 ✔. 채우기 셀도 2–5 만 그려지고 보기 마크 12 개 전부 범위 안, 전부 탭 → `12 맞음 0 틀림 0 놓침` ✔, [다음 포지션] → 2/5 5–8 ✔ |
| D ① | 3NPS(A 메이저) ▸ 7회 + ◂ | 1/7 0–5 → 2–7 → 4–9 → 5–10 → 7–12 → 9–14 → 7/7 10–15 → 1/7 → 7/7 ✔. 채점 `18 맞음 0 틀림 0 놓침` ✔, [다음 포지션] → 2/7 2–7 ✔ |
| D ② | 390 폭 따라치기(full 0–15 → 창 0–7·8–15) | 시작 창 `0–7 · 1/2`, string 0 의 0·3·5·7 탭 뒤 다음 target(0:8)이 창 밖 → **창 `8–15 · 2/2` 로 자동 이동**, target 보임 ✔ |
| B | 390 폭 라벨 가독 | 9칸 창(셀 44.8 px) 라벨 **15.7 px**, CAGED 4칸 창(셀 88.2 px) 15.7 px — ≥ 10 px ✔ |
| A | 스케일 시트 | 그룹 11: 메이저 2 · 마이너 3 · 펜타토닉 3 · 블루스 3 · 모드 7 · 하모닉 마이너 모드 6 · 멜로딕 마이너 모드 6 · 대칭 6 · 비밥 4 · 민속 20 · 기타 5 = **65** ✔. 검색 '펜타' → 메이저/마이너/도미넌트 펜타토닉 3 ✔, 'dorian'·'DORIAN' → 도리안·도리안 #4·도리안 b2·비밥 도리안 4 ✔, 'zzz' → 안내 문구 ✔ |
| F | 7현 튜닝 | 선택 즉시 줄 **7**·마크 49·루트 9, 새로고침 뒤에도 7 ✔(`tuningId=standard-7` 저장), 390 폭 가로 넘침 0 |

## 6. PWA 아이콘

`public/pwa-192.png`(578 B) · `pwa-512.png`(1,911 B) · `pwa-maskable-512.png`(1,912 B): `#f4f4f4` 바탕 + `#111` 사각(일반은 favicon 과 같은 2/16 여백, maskable 은 20 % 여백 = 308 px 사각). `dist/manifest.webmanifest` 의 `icons[].src` 와 파일명 일치, preview 에서 `/pwa-192.png` 200.

## 7. 검증 명령

`npm run typecheck` 0 · `npm run lint` 0 · `npm run check` ok(music 74,880 조합·audio·search·logic) · `npm run build` OK · `NODE_OPTIONS=--dns-result-order=ipv4first npm run e2e` **3 passed**.
