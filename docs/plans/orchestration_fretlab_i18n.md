# 오케스트레이션 6차 — 반응속도 · 기울기 단일 옵션 · i18n(en/ko/ja) · 그립 모바일 전용 · 레이아웃 정리 · GitHub Pages

작성 2026-11-14, 오케스트레이터. 1~5차 plan 의 계약·소유권은 그대로 유효. 사용자 요구:
① 반응속도 테스트 후 일반적으로 얼마나 느린지 확인 ② 기본 22프렛, 평면 기본, 평면/연주자 옵션 삭제·기울기만 유지, PC 에서는 설정에 안 들어가도 기울기 조절 ③ 기본 언어 영어, 설정에서 영어/한국어/일본어 전환, 번역 자체 검토 ④ 그립은 모바일에서만 ⑤ 사용자 입장의 레이아웃 오류 수정(특히 스케일 선택) ⑥ GitHub Pages 배포 가능성 검토.

## 1. 요구사항 → 구체화·완료 기준

| # | 구체화 | 완료 기준 | 담당 |
|---|---|---|---|
| Q1 반응속도 | Playwright + Edge 로 ① 탭 → `AudioBufferSourceNode.start`(소리) 지연 ② 탭 → `.pressed` 페인트(시각) 지연 ③ 모드 전환·시트 열기 → 첫 페인트 ④ 기울기 슬라이더 드래그·채우기 드래그 중 프레임 시간(`requestAnimationFrame` 간격, 롱태스크) ⑤ 톤 샘플 로드 시간(clean/distortion, preview 서버) ⑥ 첫 로드(TTI·번들). 1440 과 390(CPU 4× 스로틀, `Emulation.setCPUThrottlingRate`) 각각 10회 중앙값·p95 | `docs/QA_perf.md` 표 + "일반적으로 ~ms" 결론 + 100 ms 초과 항목 원인 추정 | QA6 |
| S1 설정 | `Settings`: `view` 삭제, `tilt` 0 = 평면(기본 0), `fretCount` 기본 22, `lang: 'en'|'ko'|'ja'` 기본 `'en'`. 옛 저장값: `view:'flat'` → `tilt:0`. Fretboard 는 `tilt > 0` 이면 player 그리기 | **오케스트레이터 완료** | — |
| S2 옵션 시트 | 시점 세그먼트 삭제, 기울기 슬라이더만(0% = 평면), 언어 `<select>`(English/한국어/日本語, `patchSettings({lang})` 즉시 반영) | 옵션에서 언어 전환 즉시 모든 글이 바뀜 | F |
| S3 PC 퀵 기울기 | 연습 화면 헤더(옵션 톱니 왼쪽)에 `@media (hover: hover) and (min-width: 761px)` 에서만 보이는 작은 기울기 슬라이더(`aria-label` = i18n '기울기', 폭 7rem, `--tilt` 즉시 반영, 값은 settings) | PC 에서 설정 안 열고 조절, 390 에서 숨김 | D |
| I1 i18n 코어 | `src/core/i18n.ts`: `Lang`, `LANGS`, `type Str = { en; ko; ja }`, `tr(s, lang?)`, `useT()`(settings.lang 구독), `fmt(s, vars)`(`{n}` 치환), `localName({name, nameKo?, nameJa?}, lang)`. 모듈별 문자열은 **각자 소유 폴더의 `strings.ts`** 에 `Str` 객체로(충돌 없음). `<html lang>`·`document.title`·상단 바는 App(오케스트레이터) | **오케스트레이터 완료** | — |
| I2 음악 데이터 | `Scale.nameJa`(65종), `SCALE_GROUPS[].nameJa`, `Tuning.name` → 영문(`Standard (E A D G B E)` 등) + `nameKo` + `nameJa`. 표기 규칙: 일본어는 일반적 카타카나 음악 용어(メジャー・マイナー・ペンタトニック・ブルース・ドリアン・ハーモニックマイナー 등), 민속 스케일은 원어 음차 | `music.check.ts` 가 nameJa 전부 비어 있지 않음·중복 없음 검사 | A |
| I3 모듈 문자열 | study·grip·picker·fretboard 의 모든 UI 문구(버튼·라벨·aria-label·data-tip·토스트·힌트·요약·빈 상태) → 각 `strings.ts` + `useT()`. 스케일/그룹/튜닝 이름은 `localName`. 검색은 nameJa 도 매칭 | 한국어 하드코딩 0건(`grep -P "[가-힣]" src/features --include=*.tsx` 가 strings.ts 밖에서 0) | D·E·F·B(프렛보드는 오케스트레이터) |
| I4 번역 검토 | 2차 웨이브: 모든 `strings.ts`·nameJa·nameKo 를 한 워커가 읽고 en/ko/ja 자연스러움·일관성(용어 통일: Scale/스케일/スケール, Position/포지션/ポジション, Root/루트/ルート, Fret/프렛/フレット, Tuning/튜닝/チューニング, Clean/클린/クリーン, Distortion/디스토션/ディストーション)·길이(버튼 안 줄바꿈) 검토·수정 | `docs/i18n_review.md` 수정 목록 | L6 |
| G1 그립 모바일 전용 | 터치 기기 판정 `isTouchDevice()`(`src/core/device.ts`, `(pointer: coarse)` 또는 `maxTouchPoints > 0`). 상단 바 '그립' 링크는 터치 기기만(App — 완료). `#/grip` 을 PC 에서 열면 GripPage 가 안내("Grip mode is for phones and tablets" + 연습으로 링크)만 렌더 | PC Playwright 에서 `#/grip` → 안내, 390 터치에서 → 시작 타일 | E |
| L1 스케일 시트 재설계 | 현재: 루트 12칸 → 검색 → 65종 그룹 목록 → 포지션이 한 시트에 세로로 길게(모바일에서 포지션까지 스크롤, 루트 바꾸려면 다시 위로). 변경: (a) 시트 상단 **고정 헤더**(현재 선택 요약 + 닫기) + **탭 3개** `.seg` **루트 / 스케일 / 포지션**(모바일), (b) 루트 탭: 12칸 그리드 크게 + 선택 즉시 스케일 탭으로 이동하지 않음(연속 비교), (c) 스케일 탭: 검색창 고정 + 그룹 **칩 필터**(전체/메이저/…)+ 목록, 현재 선택은 목록 맨 위 "현재" 줄로 고정, (d) 포지션 탭: 시스템 세그 + 순번 버튼 + 각 순번의 프렛 범위 표시, (e) PC(≥ 761px)는 탭 대신 **3열**(루트 | 스케일 | 포지션) 한 화면, 시트 폭 52rem, 높이 ≤ 80vh 내부 스크롤은 스케일 열만, (f) 하단 고정 [완료](primary) | 390 에서 루트·스케일·포지션 각각 스크롤 2회 이내로 변경 가능, PC 에서 스크롤 없이 루트·포지션 변경, E2E 이름(`스케일 선택` → en 기본 `Scale` 등 QA 가 갱신) | F |
| L2 레이아웃 감사 | 각 워커가 자기 모듈을 390/768/1440 × en/ja(긴 문자열) 로 띄워 겹침·잘림·넘침·정렬 오류를 찾아 고친다(각 plan 에 전/후 기록). 특히: 상단 바에 언어 길이, 헤더 세그먼트 줄바꿈(ja), 하단 바 버튼 2~3개 폭, 그립 띠 요소 넘침, 요약 카드 숫자 폭 | 가로 넘침 0, 잘림 0 | D·E·F |
| P1 GitHub Pages | 검토 결과(§7): 해시 라우터·상대 자산·동일 origin 샘플이라 **가능**. 필요한 변경 = `vite.config.ts` `base: process.env.BASE_PATH ?? '/'` + 워크플로 `.github/workflows/pages.yml`(push main → build with `BASE_PATH=/<repo>/` → deploy). 톤 fetch 는 `import.meta.env.BASE_URL` 사용(4차 확인). PWA scope/start_url 은 플러그인이 base 를 따름 | **오케스트레이터 완료**(워크플로는 원격이 없어 미실행) | — |
| Q2 E2E | 기본 언어 en 으로 이름이 바뀌므로 `e2e/fretlab.spec.ts` 를 en 이름으로 갱신(`Scale`·`Options`·`Close`·`Grade`·`Start`…), 시트 재설계 반영, 4/4 유지 + (e) 언어 전환 1개 | `npm run e2e` 5/5 | QA6 |

## 2. 가정
- A1 언어 자동 감지는 하지 않는다(요구: 기본 영어). 사용자가 옵션에서 바꾸면 저장.
- A2 일본어 스케일 이름은 A 가 작성하고 L6 가 검토. 영어 이름은 기존 `name`.
- A3 그립의 "모바일" = 터치 기기(폰·태블릿). PC 터치스크린은 터치 기기로 본다.
- A4 Pages 워크플로는 원격 저장소가 없어 실행 검증 불가 — 로컬 `BASE_PATH=/FretLab/ npm run build` 로 자산 경로만 확인.

## 3. 공유 계약 (추가)
- `Settings`: `view` 삭제, `lang: Lang` 추가, 기본 `{ fretCount: 22, tilt: 0, lang: 'en' }`.
- `Scale.nameJa?: string`, `Tuning.nameKo?: string; nameJa?: string`(A 가 채움, 그전엔 `localName` 이 `name` 으로 폴백).
- `src/core/i18n.ts` export: `Lang LANGS Str tr useT fmt localName`. `src/core/device.ts`: `isTouchDevice`.
- `FretboardProps.view` 삭제(`tilt` 만). 
- 문자열 파일: `src/features/study/strings.ts`(D) · `grip/strings.ts`(E) · `picker/strings.ts`(F) · `fretboard/strings.ts`(오케스트레이터) · `src/strings.ts`(App).

## 4. 분할 (웨이브)
| 웨이브 | 에이전트 | 담당 | 수정 소유 | 읽기만 | 선행 |
|---|---|---|---|---|---|
| 1 | A6 음악 | I2 | `src/core/music/**`, `docs/plans/agent_A_i18n.md` | types.ts | groundwork |
| 1 | D6 연습 | S3 · I3(study) · L2 | `src/features/study/**`, `docs/plans/agent_D_i18n.md` | i18n.ts | groundwork |
| 1 | E6 그립 | G1 · I3(grip) · L2 | `src/features/grip/**`, `docs/plans/agent_E_i18n.md` | device.ts | groundwork |
| 1 | F6 선택 UI | S2 · L1 · I3(picker) · L2 | `src/features/picker/**`, `docs/plans/agent_F_i18n.md` | Sheet.tsx | groundwork |
| 2 | QA6 | Q1 · Q2 · 전체 레이아웃 재감사 | `e2e/**`, `docs/qa/**`, `docs/QA_perf.md`, `docs/QA_fretlab_i18n.md`, `docs/plans/agent_QA_i18n.md` | 전부 | 웨이브 1 머지 |
| 2 | L6 번역 검토 | I4 | `src/**/strings.ts`, `src/core/music/scales.ts`·`tunings.ts` 의 이름 필드만, `docs/i18n_review.md` | 전부 | 웨이브 1 머지 |

## 5. 머지·검증
웨이브 1: A → F → D → E 머지, 각 typecheck/lint/check/build. 한국어 하드코딩 grep. 웨이브 2: L6 → QA6 머지, `npm run e2e` 5/5, `BASE_PATH=/FretLab/ npm run build` 자산 경로 확인.

## 6. 결과 (2026-11-15)
- 전부 완료. 웨이브 1(A6 34ec36f · E6 44fcebb · D6 4f88c48 · F6 a189601/c43c35c) → 통합 54d9192, 웨이브 2(L6 번역 검토 27건 `docs/i18n_review.md` · QA6 `docs/QA_perf.md`·`docs/QA_fretlab_i18n.md`) 머지.
- 검증: typecheck 0 · lint 0 · check 5/5 · build JS 29.42 + CSS 6.72 = 36.1 KB gzip · E2E **5/5**(en 이름, 언어 전환 포함) · 한국어 하드코딩(strings 밖) 0 · `BASE_PATH=/FretLab/` 빌드 자산 경로 정상.
- 반응속도(Q1, QA_perf.md): 앱 반응은 한 프레임 안팎(탭→소리 호출 0.2 ms PC / 0.9 ms 폰 4×, 탭→눌림 2.4 / 14 ms, 시트·모드 전환 ≈ 10 ms). 느린 곳: 첫 탭 24~40 ms(최대 234 ms, AudioContext 생성), 폰 기울기 드래그 끊김(→ 아래 수정), 톤 로드 Fast 4G 0.7 s(그동안 합성음), 첫 로드 폰 247 ms.
- QA6 결함 처리(오케스트레이터): #1 그립 시작 화면 가로 잘림 → `.grip-intro { grid-template-columns: minmax(0,1fr) }`(390 ja CAGED 에서 톱니 368px 안, 넘침 0). #2 기울기 드래그 끊김 → `setTiltLive()`: 드래그 중엔 `.fretboard` CSS 변수만 바꾸고(재렌더 0) 놓을 때 저장. #5 Toast·ThemeToggle 인라인 번역 → `src/strings.ts`. #3 긴 이름 말줄임(낮음)·#4 합성 터치 드래그 직후 탭 누락(참고)은 유지.
- 미결: 실기기(iOS·Android) 확인, Pages Actions 는 push 뒤 확인.

## 7. GitHub Pages 검토 (오케스트레이터)
- 해시 라우터(`#/study/..`)라 404 리라이트 불필요. 자산은 Vite 가 `base` 로 재작성(index.html 의 `/favicon.svg`·`/src/main.tsx` 포함). 톤 샘플은 `import.meta.env.BASE_URL + 'tones/..'`. 외부 요청 0. 서비스워커는 vite-plugin-pwa 가 `base` 아래 scope 로 등록.
- 변경 필요 2가지(적용함): `base` 를 환경변수로, Pages 워크플로. 저장소 이름이 `FretLab` 이면 URL 은 `https://<user>.github.io/FretLab/`. 사용자 정의 도메인이면 `BASE_PATH=/`.
- 미확인: 원격 저장소가 없어 Actions 실행은 못 했다. push 뒤 Settings → Pages → Source = GitHub Actions 로 두면 된다.
