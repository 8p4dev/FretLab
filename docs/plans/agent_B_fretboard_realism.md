# 에이전트 B — 실물 프렛보드 + 앞으로 기울기 plan (3차)

작성 2026-11-14. 범위: `orchestration_fretlab_realism.md` §1 R1(지판·프렛·인레이·줄·간격·마크·디테일) + R2(앞으로 기울기). 계약 §3.5 `FretboardProps` 불변, E2E 셀렉터(`[data-pos]` `.fb-mark` `.root` `.st-*` `.fb-label` `.fb-string-name` `.pressed`) 유지, 2차 U1~U6(줄 이름·눌림·전환·drag·호버·fill 번호) 그대로.

## 접근 방식
- **간격(geometry.ts)**: 와이어 위치 `wirePos(f, a, b) = (1−K)·(f−a)/(b−a) + K·(r(f)−r(a))/(r(b)−r(a))`, `r(f) = 1 − 2^(−f/12)`. 창 [lo,hi] 의 지판은 와이어 `a = max(lo,1)−1` ~ `hi`. `x(f)`·`cwAt(f)`·`cx(f)`·`markAt(f)` 를 `layout()` 에 추가(필드명 `w h cw sg mark font …` 유지, `cw` = 평균 칸 폭). 개방 칸(0프렛)은 지판 밖 왼쪽, 폭 = 평균 칸 폭.
- **K**: 15/1 칸 비율은 창이 넓을수록 나빠진다(0–24 가 최악). 0–24 에서 비율 ≥ 0.7 인 최대 K ≈ 0.396 → 상수 `K = 0.39`(0–15: ≈0.73, 0–22: ≈0.71, 0–24: ≈0.70). `geometry.check.ts` 가 K+0.01 이면 실패함도 검사(최대값 근거).
- **px 고정 굵기**: 줄(1.2~4px, fill 1.5~5.5px)·프렛(칸 폭 6.5%, 2~5px)·너트(프렛 ×2.5)는 화면 px 기준. 래퍼 `ResizeObserver` 를 fill 이 아닐 때도 달아 `scale = min(box.w/L.w, box.h/L.h)` 를 구하고 굵기를 `px / scale` 단위로 그린다(fill 은 scale 1). 첫 렌더는 scale 1 가정 → 관측 후 1회 리렌더. 대안: `non-scaling-stroke` 선(현행) — 하이라이트·그림자 offset 을 px 로 줄 수 없고 그라디언트(bbox 높이 0)가 안 먹어 기각. 대안: container query 단위(`cqw`) — max-height 로 줄어든 경우를 못 잡아 기각.
- **그리기(Fretboard.tsx)**: 아래에서 위로 `지판(.fb-board, 세로 그라디언트) → 가장자리 띠(.fb-edge) → 인레이 → 프렛 와이어(rect + 가로 그라디언트: 어두운 가장자리–하이라이트–본체–어두운 가장자리) → 너트(rect rx) → 줄 그림자 → 줄(플레인 = 단색 rect + 가는 하이라이트, 와운드 = 세로 그라디언트 + 권선 무늬 dash) → 줄 이름·번호 → 마크(circle) → 탭 셀`. 그라디언트 `<stop>` 은 class 만 달고 `stop-color: var(--fb-*)` 는 CSS.
- **색(fretboard.css)**: `:root` 에 `--fb-*` 라이트(메이플) 정의, 다크(로즈우드)는 `@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) }` + `:root[data-theme='dark']` 두 벌. plan 표의 9개 + 보조(`--fb-wood-hi` 지판 중앙 밝은 띠, `--fb-fret-lo` 와이어 그늘, `--fb-str-lo` 줄 그늘/권선, `--fb-shadow` 줄·프렛이 지판에 떨구는 그림자). hex 는 이 정의 줄에서만.
- **마크**: `<circle class="fb-mark">`, 지름 `min(sg·.74, cwAt(f)·.86)`, 글자 = 지름 × .58(원 안에 2글자, 390 9칸 ≥ 10px).
- **R2**: `perspective(1100px) rotateX(tilt·55deg)` 만. 세로 보정 `scaleY((1 + tilt·.12) / cos(tilt·55deg))` — 화면 종횡비 = cosθ·s(s = 원근 축소, 지판 중앙 줄 기준 ≈ 1/(1+tilt·.12)). 줄마다 정확히 맞추지는 않는다(맨 위/아래 ±7% 이내 타원).
- 그리지 않는 것: 나무결, 넥 테이퍼(줄이 부채꼴로 벌어짐 — 셀 hit-test 가 사각이라 유지), 프렛 끝 베벨.

## 파일
- `src/features/fretboard/geometry.ts` — wirePos·K, layout 비선형, gauge 줄 굵기, 와이어 굵기
- `src/features/fretboard/geometry.check.ts` (신규) — `npx tsx` 자가 검사
- `src/features/fretboard/Fretboard.tsx` — 그리기
- `src/features/fretboard/fretboard.css` — `--fb-*` 두 벌, 새 클래스, player transform
- `docs/plans/agent_B_fretboard_realism.md` — 이 문서

## 작업
- [x] 1. geometry.ts: `K`·`wirePos`, `layout()` 에 `x/cwAt/cx/markAt/boardX/boardW/top/bottom`, `stringPx`·`isWound`·`wirePx`
- [x] 2. geometry.check.ts: 단조 증가, 15/1 ≥ 0.7(0–15·0–22·0–24), K 최대, 창 폭 합 = 지판 폭, 6/7현 y 간격, fill 844×390 셀 ≥ 120×56, 줄 굵기 범위
- [x] 3. Fretboard.tsx: 지판·띠·인레이·와이어·너트·줄(그림자·하이라이트·권선)·원형 마크, scale 관측
- [x] 4. fretboard.css: `--fb-*` 라이트/다크 두 벌, 클래스, `rotateY/rotateZ` 제거 + 보정값
- [x] 5. typecheck / lint / check / build + geometry.check
- [x] 6. 스크린샷(8043, Playwright 임시 스크립트): 라이트/다크 × 1440 flat · 1440 player(.6) · 390 보기 · 844×390 그립 = 8장, 직접 보고 고친다
- [x] 7. 측정: 15/1 칸 비율, 390 라벨 px, 그립 셀 px·줄 굵기 px, player 마크 종횡비, 2차 동작(pressed·drag·호버·히트테스트) 회귀
- [x] 8. 결과 기록·커밋

## 검증 방법
- 1~2: `npx tsx src/features/fretboard/geometry.check.ts`.
- 3~5: `npm run typecheck && npm run lint && npm run check && npm run build`, `grep` 으로 `--fb-*` 정의 밖 hex·`box-shadow` 0.
- 6~7: `npx vite --port 8043` + Playwright(Edge) 임시 스크립트(scratchpad, 미커밋). 스크린샷은 이미지로 읽어 확인. 측정은 `getBoundingClientRect`.

## 변경 사항 (계획 대비)
- **지판 위아래 여백 .5sg → .45sg(`EDGE`)**: 처음엔 셀 높이와 지판을 맞추려 .5 로 했으나 실제 그립 화면(보드 영역 756×337)에서 줄 간격이 53.3 → 52.4px 로 줄어 2차 값으로 되돌렸다(바깥 줄 셀은 2차와 같이 viewBox 밖으로 .05sg 넘친다, `overflow: visible`).
- **라벨 글자 = 마크 지름 × .6**(계획 .58): 마크가 .78 → .74 로 줄어 앱의 390 화면(svg 365px)에서 9칸 창 라벨이 9.9px 가 되므로 올렸다(→ 10.2px). 원 안 2글자(`C#`·`b3`) 여유 있음.
- **`--fb-*` 보조 변수 5개 추가**(plan 표의 9개 외): `--fb-wood-hi`(지판 중앙 밝은 띠) `--fb-fret-lo`(와이어 그늘) `--fb-nut-edge`(너트 테두리 — 라이트에서 크림 너트가 흰 배경에 묻힘) `--fb-str-lo`(줄 그늘·권선) `--fb-shadow`(줄·프렛 그림자, 알파 hex). 모두 같은 정의 블록 안.
- **권선 무늬**는 줄 굵기 ≥ 3px 일 때만(가는 줄에서는 모아레) — `stroke-dasharray` 선 1개.
- **그립 셀 높이**: `layout(6, lo, hi, {844, 390})` 기준 62.3px ≥ 56(check 통과). 실제 그립 페이지는 상단 바 때문에 보드 영역이 337px 라 53.3px — 2차와 같은 값(변화 없음), 페이지 레이아웃은 E 소유.

## 결과 (2026-11-14)
- `npm run typecheck`·`lint`·`check`·`build` 통과, `npx tsx src/features/fretboard/geometry.check.ts` → `geometry.check ok — K=0.39, 15/1 칸 비율 0–15 0.733 · 0–22 0.710 · 0–24 0.704`. 번들 JS 24.33 KB + CSS 5.86 KB gzip(예산 60 KB 안). `fretboard.css` 의 hex 는 `--fb-*` 정의 9줄에만, `box-shadow`·`rotateY`·`rotateZ` 0, tsx/ts 에 색 0.
- Playwright(Edge, 8043, 임시 스크립트 scratchpad·미커밋). 스크린샷 라이트/다크 × 1440 flat · 1440 player(.6) · 390 보기 · 844×390 그립 8장 + 7현 24프렛 다크 · CAGED 창(5–9) 라이트 · 22프렛 · 390 player 창 다크 · 채우기 picked 를 이미지로 읽어 확인: 메이플(크림 호박색 + 검정 도트)/로즈우드(적갈색 + 진주 도트), 니켈 와이어(왼쪽 하이라이트·오른쪽 그늘), 크림 너트, 줄 굵기 차이와 와운드 권선, 원형 흰 마크·루트 반전. player 는 줄 수평·좌우 대칭 사다리꼴(위가 좁음).
- 측정
  - 15/1 칸 비율: 1440 flat(0–15) **0.733**(화면 px 68.4 → 50.1). 0–22 0.710, 0–24 0.704.
  - 390 보기(0–7, svg 365px): 라벨 **11.4px**, 셀 40.0~45.8px, 가로 넘침 0. 9칸 창 환산 10.2px. 7현 0–24 @1440 라벨 10.4px.
  - 그립 844×390(보드 756×337): 셀 **138.8~148.5 × 53.3px**(높이는 2차와 동일, 위 변경 사항), 줄 굵기 **1.5 / 1.83 / 2.28 / 3.28 / 4.39 / 5.5px**, 프렛 5px, 라벨 23.7px, 113 노드.
  - 비 fill 줄 굵기 1.2 / 1.43 / 1.74 / 2.44 / 3.22 / 4.0px, 프렛 3.8px(1440)·2.8px(390). 노드: 6현 0–15 268, 7현 0–24 7음 501(≤ 600).
  - player 마크 종횡비(화면 중앙 열): tilt .6 → 0.92~1.03, tilt 1 → 0.86~1.04. 좌우 끝 열은 원근 때문에 가로로 전단돼 보인다(`perspective(1100px)` 고유).
- 회귀(2차 동작): flat·player(.6, 1) 에서 `elementFromPoint(셀 중심)` = 같은 `data-pos` 7/7, 탭 → `.fb-mark.pressed` 1 → 300ms 뒤 0, 호버 틴트 6%·`cursor: pointer`, 채우기 drag 세 셀 쓸기(+되돌아옴) → `st-picked` 3·`touch-action: none`, 마크 태그 `circle`, 줄 이름 열 유지, 콘솔 오류 0.
- 미해결: 없음. 계약 변경 요청: 없음. 오케스트레이터 할 일: `package.json` check 스크립트에 `tsx src/features/fretboard/geometry.check.ts` 추가. E2E 는 실행하지 않음(QA 단계).
