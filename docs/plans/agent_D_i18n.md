# 워커 D — 연습 화면 i18n · PC 퀵 기울기 · 레이아웃 (6차, `src/features/study/**`)

작성 2026-11-14. 6차 plan `orchestration_fretlab_i18n.md` §1 S3 · I3(study) · L2. 2차 `agent_D_study_ux.md` 구조 그대로 위에 얹는다.

## 접근 방식
- **I3**: `strings.ts` 에 `S = { key: { en, ko, ja } } satisfies Record<string, Str>`. StudyPage 는 `const { t, lang } = useT()`, 치환은 `fmt`. 굵게 표시할 숫자가 문장 중간에 오는 줄(포지션·프렛 창·진행)은 문구에 `{b}` 자리를 두고 작은 로컬 헬퍼 `em(tpl, bold, vars)` 가 `{b}` 에서 잘라 `<strong>` 을 끼운다(언어마다 어순이 달라 접두 라벨 + 숫자로 쪼갤 수 없음. 대안 = 굵기 포기 → 시각 위계 손실이라 기각).
- `statsLine(s, lang?)`: export 이름 유지, 둘째 인자 생략 시 `tr` 기본(settings.lang). `kbdHint` 는 `t` 를 받는다. `MODES` 는 `Str` 을 들고 렌더 때 `t`.
- **S3**: 헤더 `OptionsButton` 앞에 `<label class="study-tilt">`(작은 글자 "Tilt" + `input[type=range]` 0~1 step .05, `aria-label` = t(tilt)). `onInput` → `patchSettings({ tilt })`. CSS 기본 `display: none`, `@media (hover: hover) and (min-width: 761px)` 에서 `inline-flex`. 새 상태·디바운스 없음(Fretboard 가 `--tilt` 로 바로 반영).
- **L2**: 390/768/1440 × en/ja 스크린샷으로 확인 후 CSS 만 고친다(nowrap·폭). 전/후는 아래 "레이아웃 감사" 절.
- 주석의 한국어는 그대로 둔다(오케스트레이터 소유 `Fretboard.tsx` 도 동일). "하드코딩 0" 은 문자열·JSX 텍스트 기준으로 확인.

## 수정/생성 파일
- 생성 `src/features/study/strings.ts`
- 수정 `src/features/study/StudyPage.tsx` · `stats.ts` · `study.css` · `logic.check.ts`(statsLine 기대값)
- 생성 `docs/plans/agent_D_i18n.md`
- 소유 범위 밖 수정 없음.

## 단계
- [x] 1. plan 작성
- [x] 2. `strings.ts` + `stats.ts` `statsLine(s, lang?)` + check 갱신 → `npm run check`
- [x] 3. StudyPage 문구 전부 `t()` 로 → typecheck, 한글 grep(주석 제외 0)
- [x] 4. S3 슬라이더 + CSS → Playwright 1440 조작 시 `.fretboard` `--tilt` 변화, 390 숨김
- [x] 5. L2 감사(390/768/1440 × en/ja 스크린샷) → 수정 → 전/후 기록
- [x] 6. typecheck/lint/check/build, 커밋, 보고

## 검증 방법
`npm run typecheck && npm run lint && npm run check && npm run build`, `npx vite --port 8044` + Playwright 임시 스크립트(scratchpad, 커밋 안 함). E2E 는 실행하지 않음(QA).

## 변경 사항
- 헤더에 래퍼 `<div class="study-tools">`(모드 탭 + spacer + 기울기 + 톱니) 추가 — plan 에 없던 DOM 변경. 이유: 헤더가 접힐 때 톱니/슬라이더만 둘째 줄로 떨어지지 않고 "ScaleBar 줄 / 도구 줄" 로 통째로 접히게. 밖에서 참조하는 클래스(`.study-bar` — index.css 토스트)는 그대로.
- 들어보기 버튼의 `aria-label` 과 모드 탭 `<a>` 의 `aria-label` 삭제(보이는 글자와 같아 중복). 접근 이름은 글자 그대로(Listen / View·Fill·Follow).
- 요약 제목 "완주" → 용어 통일표의 Done/완료/完了.
- `statsLine` 한국어 출력이 `정답률 80%(2회)` → `정답률 80% (2회)`(en 과 같은 띄어쓰기).

## 레이아웃 감사 (L2)
390×844(터치) · 768×1024 · 1440×900 × en/ja/ko, 화면 5종(보기 · 채우기 3개 찍음 · 채점 결과 · 따라치기 진행(오답 1) · 따라치기 완주), CAGED 2/5. 임시 스크립트가 가로 넘침 · 잘림(scrollWidth > clientWidth) · 화면 밖 · 버튼/세그 안 줄바꿈을 자동 검사 + 스크린샷 육안 확인.

| 항목 | 전 | 후 |
|---|---|---|
| 390 하단 바 버튼(채우기) | ja `リセット` · ko `초기화` 가 버튼 안에서 2줄(높이 50) | 1줄. 진행 글이 있으면 버튼은 글자 폭(`flex: 0 0 auto`), 채점은 `flex: 0 1 8rem`, 진행 글이 남는 폭을 쓰고 넘치면 글 쪽이 줄바꿈 |
| 390 하단 바 버튼(완료) | en `Next position` · ja `次のポジション` 2줄 | 1줄(`white-space: nowrap`, 다시 = flex 2 유지) |
| 390 따라치기 진행 글 | `3 / 12 · wrong 1 · Next G · string 5` 가 폭에 딱 맞아 값이 길어지면 버튼을 민다 | 글자 `--fs-sm` + `min-width: 0` 로 글이 줄바꿈, 버튼 폭 고정 |
| 헤더 접힘 | 요소가 낱개로 줄바꿈 → 긴 스케일 이름이면 spacer·슬라이더·톱니만 둘째 줄 | `.study-tools` 묶음: 768 + 긴 이름(`A# 내추럴 마이너 (에올리안) · 스탠다드 · 3NPS 2/7`, ja)에서 1줄째 ScaleBar, 2줄째 탭(왼쪽)·기울기·톱니(오른쪽). 짧은 이름은 768 도 한 줄. 900 · 1440 은 긴 이름도 한 줄(headH 34) |
| 모드 탭 · 포지션 줄 | 문제 없음(ja 탭 191px) | 예방용 `white-space: nowrap` |
| 요약 카드 숫자 셀 | 문제 없음: 390 에서 3칸 균등(Correct/Wrong/Missed, 正解/ミス/見逃し, 12 · 1.3 초), 1440 에서 9rem 셀 | 변경 없음 |
| 가로 넘침 | 0 | 0 |

검사 스크립트가 남긴 `wrapped scale-bar` 는 오탐(아이콘 + 글자 rect, 스크린샷상 한 줄) — F 소유라 손대지 않음. 이 브랜치의 ScaleBar 는 아직 한국어(F 가 머지 전).

## 검증 결과
- `npm run typecheck && npm run lint && npm run check && npm run build` 전부 통과(logic.check ok, 44 modules built).
- 한국어 하드코딩: `grep -P "[가-힣]"` 가 `StudyPage.tsx` · `stats.ts` · `logic.ts` 에서 **주석만** 매칭(문자열·JSX 텍스트 0). 주석은 저장소 관례대로 한국어 유지.
- S3(Playwright, Edge, `npx vite --port 8044`): 1440 · 768 에서 슬라이더 표시(폭 105px = 7rem), 마우스 드래그 중 `.fretboard` 의 `--tilt` 가 0 → 0.25 → 0.5 → 0.75 → 1 로 매 이동마다 변화, `data-view` flat → player, localStorage `tilt = 1` 저장, Home 키 → `--tilt 0` · `data-view=flat`. 390(터치)에서는 숨김.
- 스크린샷 en/ja/ko × 390/768/1440 확인(임시 스크립트·이미지는 scratchpad, 커밋 안 함). E2E 는 실행하지 않음.

## 미해결 · QA 참고
- 접근 이름 변경(en 기본): 모드 nav `Practice mode`, 탭 `View/Fill/Follow`, 포지션 화살표 `Previous position` / `Next position`, 프렛 창 `Previous frets` / `Next frets`, 버튼 `Listen/Reset/Grade/Retry/Next position`, 요약 `Results` / `Done`, 슬라이더 `Tilt`.
- 완료 상태 + CAGED/3NPS 에서는 `Next position` 이름의 버튼이 둘(포지션 줄 화살표, 하단 바) — E2E 는 `.study-bar` / `.study-pos` 로 범위를 좁혀야 한다.
- PC 에서도 옵션 시트의 기울기 슬라이더(F)와 값이 같은 settings 라 서로 동기화된다.
