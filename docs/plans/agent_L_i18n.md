# 에이전트 L — 번역 검토 (6차 I4)

작성 2026-11-14. 근거: `docs/plans/orchestration_fretlab_i18n.md` §1 I4, A6 plan 의 'L6 검토 후보'.

## 접근 방식
- 문자열 값만 고친다(키·자리표시자·코드 불변). 키 이름·`Str` 구조·export 는 그대로라 타입·호출부 영향 없음.
- 기준: en 이 기본(짧은 명령형, Sentence case) → ko/ja 를 같은 뜻으로. 용어집(6차 공통)은 고정값으로 보고 바꾸지 않는다.
- 고칠 이유가 분명한 것만 고친다(문법 오류·의미 불일치·오해 소지·현지 통용어·표기 불일치). 취향 차이는 `docs/i18n_review.md` 에 "유지" 로 남긴다.
- 검토한 대안: 스케일 별칭(`aliases`)에 가나 읽기·통칭(コンディミ) 추가 — `aliases` 는 수정 금지라 하지 않고 오케스트레이터에 요청으로 보고.
- en 값은 E2E 접근 이름의 기준이므로 en 변경은 최소로 하고 목록을 보고에 넣는다(QA6 가 반영).

## 수정 파일
- `src/features/study/strings.ts`, `src/features/grip/strings.ts`, `src/features/picker/strings.ts` — 문구 값
- `src/core/music/scales.ts` — `nameKo`·`nameJa`·그룹 이름 값만
- `src/core/music/tunings.ts` — `nameKo`·`nameJa` 값만
- `docs/i18n_review.md`(신규), `docs/plans/agent_L_i18n.md`
- 검토만 하고 수정 없음: `src/strings.ts`, `src/features/fretboard/strings.ts`, `src/ui/ThemeToggle.tsx`, `src/features/Toast.tsx`
- 소유 범위 밖 수정 없음.

## 작업 목록
- [x] 대상 파일·사용처(`em`/`fmt` 치환 위치, 세그먼트·띠 위치) 읽기
- [x] plan 작성
- [x] 스케일·그룹·튜닝 이름 수정 + `npm run check`
- [x] study·grip·picker 문구 수정 + typecheck
- [x] ja/en 390·844×390 스크린샷으로 줄바꿈·넘침 확인(임시 스크립트, 커밋 안 함)
- [x] `docs/i18n_review.md` 작성
- [x] typecheck / lint / check / build
- [x] 커밋(이름 데이터 · UI 문구 · 문서)

## 검증 방법
- `npm run typecheck && npm run lint && npm run check && npm run build`(music.check 의 이름 비어 있음·중복·영문 검사 포함)
- 자리표시자: 키마다 en/ko/ja 의 `{x}` 집합이 같은지 임시 스크립트로 비교
- `npx vite --port 8047` + Playwright(Edge) — ja 로 390×844 연습 3모드·스케일 시트·옵션 시트, 844×390 그립 띠 스크린샷, `scrollWidth ≤ innerWidth`, 세그먼트·버튼 줄바꿈(높이) 확인

## 변경 사항
- en `stats` 를 `Accuracy {p}% (tries: {n})` 로 바꾸려 했으나 `src/features/study/logic.check.ts`(D 소유, 수정 금지)가 `'Accuracy 80% (2 tries)'` 를 단언해 `npm run check` 가 실패 → en 값은 되돌리고 대안을 `docs/i18n_review.md` §1·§5 에 제안으로 남겼다.
- `ディミニッシュ (半・全)` 의 통칭 コンディミ, 전통 음계 가나 읽기는 `aliases`(수정 금지) 몫이라 적용하지 않고 §5 에 요청으로 적었다.

## 결과 (2026-11-14)
- 수정 27건(en 3 · ko 14 · ja 10) — 목록·이유는 `docs/i18n_review.md`.
- 자리표시자 비교 스크립트 `placeholders ok`(5개 strings.ts 전 키).
- 스크린샷 35장(ja·en·ko × 390×844 7화면, × 844×390 그립 3화면, ja 1440×900 5화면): 가로 넘침 0, 한 줄 문구 줄바꿈 0, pageerror 0. 임시 스크립트·스크린샷은 커밋하지 않음.
- `npm run typecheck && npm run lint && npm run check && npm run build` 통과.
