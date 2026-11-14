# FretLab QA 보고서 (6차 i18n · 통합 검증)

2026-11-14, 워커 QA6. 기준 커밋 41ffdb0(main 80517df = 웨이브 1 A6·D6·E6·F6 + L6 번역 검토 머지). 환경: Windows 11 · Node 24 · Edge 157 채널 Playwright 1.65 · `vite preview`(빌드 결과, 127.0.0.1:4183). 임시 스크립트는 커밋하지 않았고 결과 숫자만 옮겼다. 반응속도는 `docs/QA_perf.md`.

## 1. 결함 목록

| # | 심각도 | 화면 | 내용 · 재현 | 소유 | 근거 |
|---|---|---|---|---|---|
| 1 | 중간 | 그립 시작 화면, 폰 세로 | 스케일 요약이 길면 시작 화면 전체가 화면 오른쪽 밖으로 나가 잘린다(`.grip` 이 `overflow: hidden` 이라 스크롤도 안 됨). **옵션 톱니가 화면 밖**, 시작 타일·설명글 오른쪽이 잘림. 재현: 터치 390×844, 일본어, CAGED 2/5 → `#/grip`. 360 폭에서는 **일본어 기본 설정만으로** 재현(톱니 31 px 잘림), 영어도 CAGED 면 재현. 원인: `.grip-intro` 그리드 열이 내용 최대 폭(줄바꿈 없는 스케일 바)으로 잡혀 `width: 100%` 가 뷰포트가 아니라 그 폭을 따른다. 수정안: `.grip-intro { grid-template-columns: minmax(0, 1fr) }` | E(`grip.css`) | §3 표. 측정한 좌우 좌표(px) — 390 ja CAGED: 줄 23..432, 톱니 388..432 / 360 ja 기본: 23..391 / 360 en CAGED: 23..387 / 390 ja 기본: 23..391(1 px) |
| 2 | 낮음 | 옵션 시트(폰) | CPU 4배 감속 폰 가정에서 기울기 슬라이더를 끌면 끊긴다: 프레임 간격 중앙값 22 ms · p95 58 ms, 롱태스크 238건(최대 133 ms). PC 는 정상(7.5 ms, 0건). 입력마다 설정 저장 + 구독 화면 전체 재렌더로 추정 | F(슬라이더) · D · 오케스트레이터(`settings`) | `QA_perf.md` ④ |
| 3 | 낮음 | 스케일 바 · 스케일 시트 | 긴 이름이 말줄임으로 잘린다(넘침은 없음). (a) 390 스케일 바(그립 시작 화면의 스케일 바도 같음): `Bb Natural Minor (Aeolian) · Half-step down · 3NPS 2/7` 338 > 314 px, ja 343 > 314 — 끝의 포지션이 안 보임. (b) 390 ja 시트 제목: 334 > 303 px — 제목 옆 `3NPS 2/7` 이 사라짐. (c) 768 ja 스케일 목록: `ナチュラルマイナー (エオリアン)` 191 > 187, 옆의 영문 119 > 117 px | F(`picker.css`) | §3 |
| 4 | 참고 | 채우기(터치) | 보드를 쓸어 찍은 직후 약 0.3 초 안에 누른 `Reset` 탭이 가끔 먹지 않는다(버튼에 `pointerdown`·`pointerup` 은 오는데 `click` 이 없음). 드래그 뒤 300 ms 에 탭: 15회 중 1회씩 누락(4가지 탭 방식 모두), 1.2 초 뒤: 0/15, 탭으로 찍은 뒤: 0/15. Chromium 이 드래그 직후의 탭을 삼키는 동작으로 보이며 합성 터치(CDP)에서만 확인했다 — 실기기 미확인 | B·D(기록) | 임시 스크립트 |
| 5 | 참고 | 코드 | `.tsx` 의 한글 4줄은 모두 번역 표(`Str`)의 ko 값이다: `src/features/Toast.tsx:6`, `src/ui/ThemeToggle.tsx:9,10,12`. 번역 안 된 하드코딩은 0건. "strings.ts 밖 0" 을 글자 그대로 지키려면 `src/strings.ts` 로 옮기면 된다 | 오케스트레이터 | §5 |

높음 결함 없음. 확인하지 못한 것: 그립 완료 토스트와 접힌 띠의 `Show menu`(E plan 의 미확인 항목)는 이번에도 따로 띄워 보지 않았다. 실기기(iOS·Android) 확인 없음.

## 2. E2E (`e2e/fretlab.spec.ts`) — 5/5 통과

`npm run e2e`, 머지된 main(80517df) 기준. 접근 이름은 en 리터럴로 고정했다. 정답 자리는 `src/core/music` 의 `positions()` 로 직접 계산, `FRETS = 22`.

| 흐름 | 검사 | 결과 |
|---|---|---|
| (a) 연습 보기 1440 | 버튼 `Scale` → dialog `Scale`(PC 3열, `role=tab` 0개) → group `Root` 의 `A` → `Minor Pentatonic` → `Close`. 셀 6×23 = 138, 마크·루트 수 = `marksFor`. `Options` → group `Labels` 의 `Degree` → 라벨 `1..5`, `Interval` → `1 b3 4 5 b7`. 콘솔 오류 0 | ok 831 ms |
| (b) 채우기 1440 | group `Position system` 의 `CAGED` → group `Position` 의 `1` → `Done`. 정답 전부 탭 → `Grade` → region `Results` 에 `nCorrect` `0Wrong` `0Missed`. `.study-bar` 안의 `Next position` → `Position 2 / 5`, 요약 사라짐 | ok 769 ms |
| (d) 채우기 쓸어 찍기 1440 | `Picked 0 of n` → 같은 줄 연속 칸을 끌고 되돌아옴 → picked = 지나간 칸 수(재토글 없음) → `Picked k of n` | ok 639 ms |
| (e) **언어 전환 1440**(신규) | `Options` → `Language` select 에서 日本語 → 열려 있는 시트 제목 `オプション`, 상단 바 `練習`, 스케일 바 `マイナーペンタトニック`, `<html lang="ja">` → 새로고침 뒤 그대로 → `言語` 에서 한국어 → `연습`·`마이너 펜타토닉`·`lang="ko"` | ok 566 ms |
| (c) 그립 844×390 터치 | `Start…` → `.topnav` 0 → 두 셀 탭 소리 2회 → group `Mode` 의 `Follow` → 첫 target 탭 → hit 1 · target 이 다음 음 셀 중심(±2 px) · 소리 +1 | ok 354 ms |

바꾼 점: `beforeEach` 의 `localStorage.clear()` 가 새로고침 때도 돌아 (e) 의 유지 검사를 지우므로 탭당 한 번만 지우게 했다(`sessionStorage` 표시). L6 가 바꾼 en 문구(`Picked {b} of {n}`)를 반영했다.

## 3. 레이아웃 재감사 (L2)

터치 390×844 · 768×1024 · 1440×900 × en/ja/ko × 설정 2종(기본 CAGED 2/5, 긴 이름 = `Bb Natural Minor (Aeolian)` · 반음 내림 튜닝 · 3NPS 2/7 · 인터벌 표기). 그립은 터치 전용이라 태블릿 세로 768×1024(터치)와 폰 가로 844×390(터치)을 더했다. 화면 상태 **246개**를 자동 검사: 문서 가로 넘침, 보이는 요소가 뷰포트 좌우 밖, 글자 요소의 `scrollWidth > clientWidth`, 버튼·탭·링크 안 줄바꿈, 형제 겹침, 자식이 부모 좌우 밖, 콘솔·페이지 오류.

| 화면 | 390 | 768 | 1440 |
|---|---|---|---|
| 보기 | en/ja/ko 이상 없음 (긴 이름: 결함 3a) | 이상 없음 | 이상 없음 |
| 채우기(3칸 찍음 · 채점 뒤) | 이상 없음 | 이상 없음 | 이상 없음 |
| 따라치기(진행 · 완주) | 이상 없음 | 이상 없음 | 이상 없음 |
| 스케일 시트(390 은 탭 3개 각각) | 이상 없음 (ja 긴 이름: 결함 3b) | ja 결함 3c, en/ko 이상 없음 | 이상 없음 |
| 옵션 시트(위 · 맨 아래) | 이상 없음 | 이상 없음 | 이상 없음 |
| 그립 | 시작 화면 **결함 1**(ja 기본 CAGED, en·ko 는 긴 이름일 때). 세로 회전 안내는 이상 없음 | 터치: 시작·회전 안내 이상 없음. PC: 안내 화면 이상 없음 | PC 안내 화면 이상 없음 |
| 그립 844×390 터치 | 시작 화면 · 보드(보기·따라치기) · 그 위의 스케일 시트·옵션 시트 전부 이상 없음 | | |

- 문서 가로 넘침 0, 버튼·탭·세그 안 줄바꿈 0, 형제 겹침 0, **콘솔·페이지 오류 0**(246개 전부).
- 자동 검사가 낸 `.picker-col` 이 `.picker-cols` 밖 3 px 은 오탐이다 — 포커스 링 자리용 `padding: 3px; margin: -3px`.
- 스케일 시트 구조 확인: 390 은 `role=tab` 3개(Root/Scale/Position), 768·1440 은 탭 없이 3열.

스크린샷(`docs/qa/`, 8장 53~139 KB):
[view-1440-en](qa/i18n-view-1440-en.png) ·
[scale-sheet-1440-ja](qa/i18n-scale-sheet-1440-ja.png)(3열) ·
[scale-sheet-390-en](qa/i18n-scale-sheet-390-en.png)(Scale 탭) ·
[scale-position-390-ja](qa/i18n-scale-position-390-ja.png)(Position 탭) ·
[options-390-ja](qa/i18n-options-390-ja.png)(긴 이름 · 스케일 바 말줄임이 보임) ·
[fill-graded-390-ko](qa/i18n-fill-graded-390-ko.png) ·
[follow-768-ja](qa/i18n-follow-768-ja.png)(긴 이름) ·
[grip-844x390-ja](qa/i18n-grip-844x390-ja.png)

## 4. 번들

`npm run build`(base `/`).

| 파일 | raw | gzip |
|---|---|---|
| `assets/index-*.js` | 77.21 kB | 29.30 kB |
| `assets/index-*.css` | 29.59 kB | 6.71 kB |
| **JS + CSS** | 106.80 kB | **36.01 kB ≤ 60** |
| `index.html` | 1.29 kB | 0.68 kB |

첫 로드 전송량 38.1 KB(favicon 포함), 요청 4건. 톤 샘플은 첫 탭 뒤 지연 로드(clean 194 KB · distortion 118 KB, precache 밖).

## 5. 그 밖의 확인

- **GitHub Pages 경로**: `MSYS_NO_PATHCONV=1 BASE_PATH=/FretLab/ npm run build` → `dist/index.html` 의 자산이 전부 `/FretLab/…`(`favicon.svg`, `assets/index-*.js`, `assets/index-*.css`, `manifest.webmanifest`), 서비스워커 `register('/FretLab/sw.js', { scope: '/FretLab/' })`, 매니페스트 `start_url`·`scope` = `/FretLab/`, JS 안의 톤 경로도 `/FretLab/tones/`. 기본 빌드는 `/…`. Actions 실행은 원격이 없어 미확인.
- **한국어 하드코딩**: `src/**/*.tsx` 11개에서 주석을 지우고 `[가-힣]` 검색 → 4줄, 전부 `Str` 번역 표(결함 5). 번역 안 된 문구 0건. `strings.ts`·음악 데이터·`*.check.ts` 밖의 `.ts` 는 `i18n.ts` 의 언어 이름 `한국어` 1건뿐.
- `npm run typecheck` · `lint` · `check`(5종) · `build` 통과.
