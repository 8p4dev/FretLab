# 에이전트 B — 연주자 시점 3D 보강 plan (5차)

작성 2026-11-14. 범위: `orchestration_fretlab_player3d.md` §1 P1~P4. 계약 §3.5 `FretboardProps` 불변, E2E 셀렉터(`[data-pos]` `.fb-mark` `.root` `.st-*` `.fb-label` `.fb-string-name` `.pressed`)·2차 U1~U6·3차 `--fb-*`·간격 유지.

## 접근 방식
- **레이어**: SVG 자식은 `preserve-3d` 가 안 되므로 SVG 하나를 **같은 viewBox 의 SVG 4장**으로 나눈다. `.fb-stage`(`transform-style: preserve-3d`) 안에 ① 보드(흐름 안, 크기 결정: 지판·띠·인레이·와이어·줄 그림자·줄 이름·번호, z 0) ② 옆면 `.fb-side` ③ 줄(너트 윗면·줄·권선, `translateZ(3px)`) ④ 탭(마크·라벨·셀 + 포인터 핸들러, `translateZ(6px)`). ②~④ 는 `position: absolute; inset: 0`. DOM 순서 = z 순서라 flat(원근 없음)에서는 지금과 같은 그림.
- **옆면(P2)**: 작은 SVG(viewBox y = 지판 아래 가장자리 −Hs ~ +Hn)를 지판 아래 가장자리 선에 맞춰 놓고 그 선을 축으로 `rotateX(-90deg)`. 선 아래(y > bottom) = 넥 옆면(z 0 ~ −Hn), 선 위 = 보드보다 솟은 것의 앞면(z 0 ~ +Hs: 너트 앞면·프렛 끝). 면 = 세로 그라디언트 rect 1개(바인딩 띠 `--fb-nut` → `--fb-side` → `--fb-side-lo`), 사이드 도트 = `L.cx(f)`(지판 인레이와 같은 함수), 12·24 는 2점. Hn = 줄 간격 × .55. `backface-visibility: hidden`.
- **줄·프렛·너트(P3)**: 줄 그림자는 보드 레이어에 남는다 → 줄이 3px 떠 있으므로 기울이면 시차로 벌어지고, 추가로 `--fb-drop`(= `--tilt` 파생)만큼 아래로 민다. 프렛 그림자 폭은 `scaleX(1 + --tilt × n)`. 너트는 윗면을 줄 레이어(z 3px)로 올리고 앞면을 옆면 SVG 에 그려 블록으로(앞면의 화면 높이 = 높이 × sin(tilt·66°) — flat 에서 0).
- **기울기(P1)**: `perspective(P) rotateX(tilt·66deg)`. 옆면이 화면 아래로 Hn·sinθ 만큼 나오므로 스테이지를 그만큼 올리고(`translateY`), 번호는 평면 안에서 Hn·tanθ 만큼 밀어 옆면 아래에 둔다. 세로 보정 `scaleY(c / cosθ)` 는 측정으로 맞춘다.
- JS → CSS 변수: `--tilt`, `--fb-k`(viewBox 1단위의 화면 px), `--fb-hn`(Hn, viewBox 단위).
- 검토한 대안: (a) 옆면·너트 앞면을 보드 평면에 2D 로 그리고 높이만 `--tilt` 로 — 원근이 안 맞고 도트가 지판 인레이와 어긋남, 기각. (b) 마크를 요소별 div 빌보드로 — 노드·히트테스트 비용, 기각.

## 파일
- `src/features/fretboard/Fretboard.tsx` — 레이어 4장, 옆면
- `src/features/fretboard/fretboard.css` — 3D, `--fb-side*`, tilt 파생 변수
- `docs/plans/agent_B_fretboard_player3d.md` — 이 문서
(`geometry.ts` 는 필요하면 상수만)

## 작업
- [x] 1. 기준선: main 번들 gzip, 노드 수 기록
- [x] 2. Fretboard.tsx: SVG 4장 분리(셀렉터·핸들러 유지), 옆면 SVG(면·도트·너트 앞면·프렛 끝)
- [x] 3. fretboard.css: preserve-3d·translateZ·옆면 회전, 66°·보정·스테이지 올림·번호 밀기, `--fb-side*` 두 벌, tilt 파생 그림자
- [x] 4. typecheck / lint / check / build, gzip 증가 ≤ 1.5 KB, 노드 ≤ 1.5배
- [x] 5. 스크린샷(8043): 1440 라이트/다크 × tilt .6·1, 390 tilt 1, flat·그립 회귀 — 이미지로 읽고 보정
- [x] 6. 측정: player tilt 1 셀 탭 히트테스트(`[data-pos]` 중심 클릭 → `.pressed`), 먼 쪽 라벨 px(1440 15프렛 ≥ 10, 390 9칸 ≥ 9), 마크 종횡비 0.9~1.1, 사이드 도트 x = 인레이 x
- [x] 7. 결과 기록·커밋·보고

## 검증 방법
- 2~4: `npm run typecheck && npm run lint && npm run check && npm run build`, `grep` 으로 `box-shadow` 0·`--fb-*` 정의 밖 hex 0.
- 5~6: `npx vite --port 8043` + Playwright 임시 스크립트(scratchpad, 미커밋). 스크린샷은 이미지로 읽어 확인, 측정은 `getBoundingClientRect`·`elementFromPoint`·실제 클릭.

## 변경 사항 (계획 대비)
- **번호는 스테이지 밖 평면 SVG(5번째 레이어)**: 옆면이 지판 아래로 드러나 번호 자리와 겹친다. 평면 안에서 밀면 눈 쪽으로 다가와 원근 확대로 칸 중심과 어긋나므로(가장자리 ≈ 20px) 번호를 눕지 않는 SVG 로 빼고, 회전축을 지판 아래 가장자리(`transform-origin` = `L.bottom`)로 옮겨 그 선이 원근 배율 1 이 되게 했다 → 번호 x = 칸 중심 그대로. 스테이지는 `translateY(−hn·sinθ)` 로 올려 옆면 아래 끝이 원래 지판 아래 선에 온다. 번호의 세로 보정은 필요 없어 제거.
- **`perspective` 1100 → 2000px**: 66° 에서 1100px 은 좌우 끝 열 마크가 심하게 전단되고 먼 쪽 라벨이 작아진다. 2000px 로 먼 쪽 축소 ≈ .91(1440)·.95(390).
- **마크 축소 `--fb-m = 1 − tilt × .2`(글자·줄 이름은 그대로)**: 66° 에서 화면 줄 간격이 마크 지름의 절반 남짓이라 원형 보정만 하면 이웃 줄 마크가 라벨을 절반 가린다. 마크만 줄여 겹침을 줄였다(글자는 P1 의 px 기준 때문에 유지). 세로 보정은 `(1 + tilt × .07) / cos θ`.
- **너트 앞면·프렛 끝은 실제 3D 면**(옆면 SVG 의 접힘선 위쪽, z 0 ~ +3px): "높이 = `--tilt` 파생 CSS 변수" 대신 화면 높이가 3px × sin(tilt·66°) 로 회전에서 나온다(flat 0). 줄 그림자 오프셋(`--fb-drop`)·프렛 그림자 폭(`--fb-cast`)·각(`--fb-a`)은 `--tilt` 파생 변수 그대로.
- **`--fb-side-dot` 은 만들지 않고 `--fb-inlay` 재사용**(메이플 = 검정, 로즈우드 = 진주 — 같은 값). 새 변수는 `--fb-side`·`--fb-side-lo` 둘.
- **`.fb-board` 클래스·pointer-events 나열 규칙 제거**: 맨 위 레이어 밖은 SVG 루트에서 `pointer-events: none`.
- **`fb-press` 키프레임을 `scale` 속성으로**: `transform` 을 쓰면 눌림 동안 연주자 시점 보정이 풀린다(3차부터 있던 문제).
- Hs·Hm 의 "fill 비례"는 하지 않음: fill 은 flat(원근 없음)이라 translateZ 가 보이지 않는다.

## 결과 (2026-11-14)
- `npm run typecheck`·`lint`·`check`(geometry.check 포함)·`build` 통과. 번들 gzip JS 24.30 → 24.66 KB, CSS 5.86 → 6.10 KB = **+0.60 KB**(≤ 1.5). `box-shadow` 0, hex 는 `--fb-*` 정의 줄에만, 새 의존성 0.
- 노드(6현 0–15, 마크 포함): 268 → **301**(1.12배). 그립 4칸 113 → 129.
- Playwright(Edge, `npx vite --port 8043`, 임시 스크립트 scratchpad·미커밋). 스크린샷 1440 라이트/다크 × tilt .6·1, 390 다크 tilt 1(8칸·9칸), 1440 flat, 844×390 그립을 이미지로 읽어 확인: 기울이면 연주자 쪽 넥 옆면(크림 바인딩 띠 + 아래로 어두워지는 나무)과 사이드 도트(12프렛 2점), 옆면 위로 솟은 크림 너트 블록, 프렛 끝 금속이 보이고 줄이 그림자와 떨어져 떠 보인다. flat·그립은 3차와 같은 그림.
- 측정(player tilt 1)
  - 각도: 스테이지 `matrix3d` 의 cos .4067 / sin .9135 = **66°**(tilt .6 → 39.6°).
  - 먼 쪽(1번줄) 라벨: 1440 15프렛 세로 **13.7px** · 가로 14.4~16.1px(≥ 10), 390 9칸 창 세로 **9.5px** · 가로 9.7~10.1px(≥ 9), 390 8칸 10.4px.
  - 마크 종횡비(가운데 열, 줄별): 1440 **0.96~1.03**, 390 0.95~1.03, tilt .6 0.95~1.02. 좌우 끝 열은 원근 전단 때문에 경계 상자 기준 0.67~0.85(모양은 기운 타원).
  - 히트테스트: 모든 셀 중심 `elementFromPoint` = 자기 `[data-pos]` — 1440 **96/96**(tilt 1·.6), 390 48/48·54/54, 그립 30/30. 실제 클릭(먼 줄 5:3·5:12, 가운데 2:7, 가까운 줄 0:10·0:1) → `.pressed` 생김 → 350ms 뒤 0. 셀 화면 높이 tilt 1: 1440 11.9~13.9px, 390 9.2~10.3px.
  - 사이드 도트 `cx` = 지판 인레이 `cx`(같은 `L.cx(f)`: 259.97 · 390.39 · 514.56 · 633.17 · 961.39, 12프렛은 801.97 ± 4.3).
  - 가로 넘침 0, 콘솔 오류 0.
- 미해결 / 알려진 제한
  - tilt 1(66°)에서는 화면 줄 간격(≈ 13px @1440)이 마크보다 작아 **같은 프렛의 이웃 줄 마크가 서로 겹친다**(가까운 줄이 먼 줄 마크 아래쪽을 덮음). 2글자 라벨(`F#`)은 줄인 마크 폭을 거의 채운다. 각도 자체의 한계 — 더 줄이려면 라벨 px 기준(≥ 10 / ≥ 9)을 낮춰야 한다.
  - tilt 1 의 탭 표적 높이 10~14px(각도 고유). 연주용 탭은 flat/그립 권장.
  - E2E 는 실행하지 않음(QA 단계). 계약 변경 요청 없음.
