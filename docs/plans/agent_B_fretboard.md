# 에이전트 B — 프렛보드 렌더러 plan

작성 2026-11-14. 범위: `src/features/fretboard/**`(R2 프렛보드·R6 연주자 시점·R3c 7현 렌더). 계약 `orchestration_fretlab.md` §3.5 — `FretboardProps` 이름·의미 불변.

## 접근 방식

- **SVG 하나**(`<svg viewBox>`)에 줄·프렛·너트·인레이·번호·마크·라벨·탭 셀을 전부 그린다. 라벨은 `labelOf()` 만 사용.
- **기하는 순수 함수** `geometry.ts: layout(n, lo, hi, fill?, w?, h?)` → 셀 폭 CW·줄 간격 SG·패딩·`x(f)`·`y(s)`. 비 fill 은 상수(CW 60·SG 36 단위), fill 은 부모 px 크기를 `ResizeObserver` 로 읽어 1단위 = 1px 로 계산(라벨·마크가 셀에 비례, `preserveAspectRatio="none"` 은 글자가 찌그러져 기각).
- **색은 전부 CSS**(`fill: var(--…)`)·클래스(`root`, `st-hit` …). 선 두께는 `vector-effect="non-scaling-stroke"` 로 화면 px 고정(390 폭에서 0.6px 선이 사라지는 문제 방지).
- **DOM 절약**: 마크 = `<rect>` + `<text>` 2노드(그룹 없음), `labelMode='none'` 이면 text 생략, 탭 셀 1노드. 7현×26칸 7음 스케일 ≈ 106 마크 → 212 + 셀 182 + 선·점·번호 ≈ 70 → **≈ 470 노드**.
- **탭**: svg 하나에 `onPointerDown` 위임, `e.target.dataset.pos` 파싱. 마크는 `pointer-events:none`, 셀은 맨 위 레이어 `pointer-events:all`. 포인터마다 호출(멀티터치 자연 지원). `touch-action: pan-y`(일반)/`none`(fill).
- **player 시점**: 래퍼 `.fb-stage` 에 `perspective() rotateX(tilt·55°) rotateY(tilt·-8°) rotateZ(tilt·-3°)`, 원점 하단(낮은 줄이 눈에 가깝게). 글자·마크 눌림 보정은 CSS `transform-box: fill-box; transform: scaleY(1 + tilt·.6)` + `font-weight: 600`. flat↔player 전환 `transition: transform var(--t-slow) var(--ease-out)`.
- **target pulse**: `fretboard.css` 에 `fb-pulse` 키프레임(stroke-opacity 만, 토큰 duration). 전역 reduced-motion 규칙(index.css)이 `iteration-count: 1` 로 바꾸므로 자동 정적. DrillDown 도 feature css 에 자체 키프레임(`flash-in` 등)을 두므로 허용 범위로 본다.
- 검토한 대안: (a) 프렛 폭을 실제 기타처럼 줄이는 것 — 가독 우선으로 **균등** 채택(가정). (b) 셀마다 핸들러 — 위임 1개로 대체. (c) 좁은 폭 가로 스크롤 — 계약대로 viewBox 유지, 범위 축소는 호출자 책임.

## 가정
- 프렛 번호는 칸이 13개 이하면 전부, 그보다 많으면 인레이 프렛(3·5·7·9·12·15·17·19·21·24)과 첫 칸(`lo>0`)만 — 390 폭에서 글자가 겹치지 않게.
- 줄 색 `--text-2`(계약에 없음), 굵기 1→3.25px(높은 줄→낮은 줄). 너트 `--text` 4px, 프렛 `--border-strong` 1.5px.
- 키보드 포커스/aria 셀 탐색은 범위 밖(svg 에 `aria-label` 만). 필요 시 D/E 가 요청.

## 파일
- `src/features/fretboard/geometry.ts` (신규) — 순수 레이아웃
- `src/features/fretboard/Fretboard.tsx` (스텁 덮어씀, `Fretboard`·`FretboardProps` export 유지)
- `src/features/fretboard/fretboard.css`
- `docs/plans/agent_B_fretboard.md` (이 문서)

## 작업
- [x] 1. geometry.ts: 레이아웃·인레이·번호 규칙
- [x] 2. Fretboard.tsx: 줄·프렛·너트·인레이·번호·마크·라벨·states·탭 셀
- [x] 3. fretboard.css: 토큰 색·상태·pulse·touch-action·player 3D·보정
- [x] 4. fill 모드 ResizeObserver
- [x] 5. typecheck / lint / check / build
- [x] 6. dev 8032 + Playwright 임시 스크립트: 390·768·1440 × 라이트/다크, player 시점, 7현(튜닝 스텁은 6현만 → props 로 직접 7현 렌더해 확인), DOM 노드 수, 기울인 상태 히트테스트
- [x] 7. 커밋

## 검증 방법
- 1~4: `npm run typecheck && npm run lint && npm run build`.
- 6: 스크린샷(scratchpad, 커밋 안 함) 육안 확인 + `document.querySelectorAll('.fretboard *').length` + `elementFromPoint(셀 중심)` 이 해당 `data-pos` 인지.

## 변경 사항 (계획 대비)
- 7현처럼 줄 수가 홀수면 12·24 의 2점 인레이를 ±½칸으로 둔다(±1칸이면 줄 위에 겹침). 짝수는 ±1칸.
- 비 fill 모드 svg 에 `max-height: 60vh` 추가 — 좁은 범위(5칸)를 넓은 화면에 그리면 셀이 280px 로 커지는 것을 막는다(meet 로 가운데 정렬).

## 결과 (2026-11-14)
- `npm run typecheck`·`lint`·`check`·`build` 전부 통과. 번들 JS 11.18 KB + CSS 4.04 KB gzip. `src/features/fretboard` 에 hex·box-shadow 0건.
- Playwright(Edge, 임시 스크립트, 미커밋) 연습 화면(기본 설정 = 15프렛 A 마이너 펜타토닉): 390·768·1440 × 라이트/다크 6장, `scrollWidth == innerWidth`(가로 넘침 0), 루트 마크 8개, 프렛보드 DOM 217 노드. player(`fretlab:settings.view='player'`, tilt .6) 1440·390 — 하단 축으로 눕고 라벨 세로 보정으로 글자 읽힘.
- 임시 하네스(7현 B 스탠다드): A 마이너 펜타토닉 0–24 + states 샘플(hit 초록·miss 빨강·target 2px 외곽·dim .35·picked text-2, 마크 없는 자리 picked/miss 도 그려짐) 384 노드; **크로매틱 7현×25칸 전부(마크 175개) 582 노드 ≤ 600**. fill 844×390 5–9프렛 7현: 셀 167×54px(6현이면 줄 간격 63px). flat·player(tilt .8) 둘 다 `elementFromPoint(셀 중심)` 이 같은 `data-pos`(0:0, 3:12, 6:24, 2:7) → 3D 아래 히트테스트 정확. 실제 `mouse.click` → `onTap 4:10` 호출됨. `labelMode='none'` 은 text 노드 없음.
- 가독 한계: 390 폭에 16칸(0–15)이면 셀 ≈ 24px·라벨 ≈ 5px 로 글자는 사실상 안 읽힌다(마크 위치·루트 반전은 식별됨). 계약대로 가로 스크롤은 두지 않았으니 **모바일은 호출자(D·F)가 포지션/범위로 ≤ 8~9칸으로 줄여야** 라벨이 읽힌다(R2 의도와 일치).
- 미해결: 없음. 계약 변경 요청: 없음. 키보드 셀 탐색(aria)은 범위 밖 — 필요하면 D/E 가 요청.
