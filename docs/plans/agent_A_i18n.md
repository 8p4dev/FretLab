# 에이전트 A — 음악 데이터 i18n (6차 I2)

작성 2026-11-14. 근거: `docs/plans/orchestration_fretlab_i18n.md` §1 I2, §3.

## 접근 방식
- 데이터만 바꾼다. `Scale.nameJa`·`Tuning.nameKo/nameJa` 는 `types.ts` 에 이미 있으므로 타입 변경 없음.
- `scales.ts` 의 `s()` 헬퍼에 `nameJa` 인자를 `nameKo` 바로 뒤에 추가(이름 세 개가 한 줄에 나란히 — 번역 검토(L6)가 읽기 쉽다). 대안: id → nameJa 별도 맵. 줄이 갈라져 검토가 불편하고 누락을 타입이 못 잡아 기각.
- `SCALE_GROUPS` 는 지금 `{ id, nameKo }` 뿐이라 `localName()`(`name` 필수)에 넣을 수 없다 → 영문 `name` 과 `nameJa` 를 함께 추가(추가만, 기존 필드 유지).
- 괄호는 세 언어 모두 ASCII `(` `)` — `ScaleBar` 가 튜닝 이름에서 `\s*\(.*\)\s*$` 로 괄호부를 떼어 내므로 전각 괄호를 쓰면 요약이 깨진다.
- 일본어 표기: 일반 음악 용어 카타카나, 일본 전통 음계는 한자(平調子·陰旋法·岩戸·雲井·陽旋法), 변화표(#·b·♮)는 영문과 동일.
- 튜닝 `nameKo` 는 기존 `name` 값 그대로(한글이 없던 Drop D 등은 영문 그대로), `name` 은 영문.

## 수정 파일
- `src/core/music/scales.ts` — `s()` 인자 추가, 65종 nameJa, 그룹 `name`·`nameJa`
- `src/core/music/tunings.ts` — `name` 영문화, `nameKo`·`nameJa`
- `src/core/music/music.check.ts` — 이름 검사 추가
- `docs/plans/agent_A_i18n.md`
- 소유 범위 밖 파일 수정 없음. `index.ts` export 변경 없음.

## 작업 목록
- [x] plan 작성
- [x] `scales.ts`: 그룹 11개 `name`·`nameJa`, 스케일 65종 `nameJa`
- [x] `tunings.ts`: 8종 `name` 영문 + `nameKo` + `nameJa`
- [x] `music.check.ts`: 스케일 name/nameKo/nameJa 비어 있지 않음·각각 중복 없음, 그룹·튜닝 동일, 튜닝 `name` 에 한글 없음, 출력에 개수 표시
- [x] typecheck / lint / check / build
- [x] 커밋

## 검증 방법
- `npx tsx src/core/music/music.check.ts` → `nameJa 65/65 · groups 11/11 · tunings 8/8`
- `npm run typecheck && npm run lint && npm run check && npm run build`

## 결과
- `npx tsx src/core/music/music.check.ts` → `music.check ok — scales 65, tunings 8, nameJa 65/65 · groups 11/11 · tunings 8/8, positions 74880 combos`
- `npm run typecheck && npm run lint && npm run check && npm run build` 전부 통과(2026-11-14).
- 화면 없음 → 레이아웃 감사(L2) 해당 없음.

## 다른 워커·검토자에게 알림
- `SCALE_GROUPS` 항목에 영문 `name` 과 `nameJa` 가 생겼다 → `localName(group, lang)` 사용 가능(이전엔 `nameKo` 뿐).
- `picker/search.ts` 는 아직 `nameJa` 를 매칭하지 않는다(F 소유, plan I3). 한자 음계(平調子·陰旋法·岩戸·雲井·陽旋法)는 가나 읽기로는 검색되지 않는다 — 필요하면 `aliases` 에 읽기를 넣는 방법이 있다(미적용).
- L6 검토 후보: `ディミニッシュ (半・全)`(일본에선 コンディミ 통칭), `リディアンドミナント`(リディアン♭7 도 흔함), 그룹 `民族音階`, 인도 라가 음차(トーディ·マールワー·プールヴィー), `ペロッグ`.
- 튜닝 `nameKo` 는 기존 `name` 값을 그대로 옮겼다(Drop D·Open G 등은 영문 그대로).
