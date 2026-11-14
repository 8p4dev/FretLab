# 워커 A — 음악 이론 엔진 (`src/core/music/**`)

작성 2026-11-14. 범위: 오케스트레이션 plan §1 R1·R3·R3b·R3c(데이터), 계약 §3.2·§3.3.

## 접근 방식

- 순수 TS, 의존성 없음. `index.ts` 는 계약 export 를 전부 유지하고 `scales.ts`·`tunings.ts`·`positions.ts` 를 re-export 한다(음이름·마크·라벨 함수는 index.ts 에 그대로).
- 스케일은 데이터 테이블 하나(`SCALES`). 65종. 간격 유효성은 `music.check.ts` 가 전부 검사한다.
- 포지션은 **데이터 하드코딩 없이** 두 알고리즘으로 계산한다(아래 "포지션 알고리즘").
- 검토한 대안: (a) 포지션 박스를 스케일별 표로 두기 → 60종 × 튜닝 8 × 루트 12 라 불가능, 기각. (b) CAGED 7음도 "줄마다 3음 피치 연속" 으로 계산 → 그건 3NPS 와 같아 7개가 나와 기각. (c) 펜타토닉도 고정 폭 창으로 계산 → 교과서 박스(2·3·5번 박스의 1프렛 스트레치)와 달라져 기각, 펜타토닉은 피치 연속 2음/줄 로 계산.

## 수정/생성 파일

- `src/core/music/index.ts` — 계약 export 전부 re-export (덮어씀)
- `src/core/music/fretboard.ts` — `NOTE_NAMES noteName midiToPc midiAt intervalName scalePcs marksFor labelOf`
- `src/core/music/scales.ts` — `SCALE_GROUPS`, `SCALES`, `scaleById`
- `src/core/music/tunings.ts` — `TUNINGS`, `tuningById`
- `src/core/music/positions.ts` — `positions()`
- `src/core/music/music.check.ts` — 자가 검사(덮어씀)
- `docs/plans/agent_A_music.md` — 이 문서

## 작업 목록

- [x] 1. plan 작성
- [x] 2. `scales.ts` 65종 + 그룹
- [x] 3. `tunings.ts` 8종
- [x] 4. `positions.ts` full / caged(펜타 박스·7음 창·fallback 창) / 3nps
- [x] 5. `index.ts` 재구성(re-export, 계약 시그니처 유지)
- [x] 6. `music.check.ts` 자가 검사
- [x] 7. `npm run typecheck && npm run lint && npm run check && npm run build` 통과
- [x] 8. plan 에 스케일 표·알고리즘 설명·검증 결과 기록, 커밋

## 검증 방법

- 2·3: `npm run check` 의 간격 유효성(0 시작, 오름차순, <12, 중복 없음, 5~12음), id 중복, 수(≥55 / ≥8).
- 4: `npm run check` 가 12 루트 × 전 스케일 × 전 튜닝 × fretCount {12,15,22,24} 에 대해 포지션 수, 마크 ⊂ 전체, 범위 안, 인접 겹침, 커버리지(12프렛 주기), 펜타 2음/줄·7음 3음/줄, 폭 4~5(스탠다드)를 검사.
- 7: 네 명령 전부 종료코드 0.

## 변경 사항 (plan 대비)

- **fallback CAGED 창 위치**: 과제의 "루트가 있는 string 0 프렛 각각을 시작으로 하는 5프렛 창"을 그대로 쓰면 12프렛 주기 안에 창이 1개뿐이라 5개를 채워도 넥을 덮지 못한다. 대신 루트 프렛 r 에서 시작해 `r + round(12k/5)` (k = 0..4 → 0, 2, 5, 7, 10) 에 5프렛 창을 두어 한 주기를 덮는다(겹침 2~3프렛). 7음 다이어토닉 CAGED 도 같은 창을 쓴다(줄마다 ≤3음, 폭 5프렛, 포지션 0 은 루트에서 시작 = E 셰이프).
- **커버리지 정의**: 5개 창(폭 ≤5)으로 0..24 프렛을 전부 덮는 것은 불가능하므로(최대 21프렛) "모든 스케일 음(줄, 프렛)이 **같은 줄의 12프렛 주기** 안에서 어느 한 포지션에 속한다"로 검사한다. fretCount 12 에서 박스가 안 들어가면(예: `[9,13]`) 범위 밖 음은 버리되, 버린 음의 주기 동치가 다른 포지션에 있도록 옥타브를 고른다(아래).
- **3nps fallback 의 `system`**: 비7음 스케일은 caged 와 같은 박스를 돌려주되 `Position.system` 은 요청한 `'3nps'` 그대로 둔다(설정의 `system` 과 비교하는 소비자가 깨지지 않도록). 자가 검사가 박스 동일성을 확인한다.
- 스케일 수 65(목표 60). `ionian`·`aeolian` 은 `major`·`natural-minor` 와 간격이 같지만 "모드 7종" 그룹을 완성하기 위해 별도 항목으로 둔다.

## 포지션 알고리즘 (`positions.ts`)

박스 데이터 없음. 모두 `(root, scale, tuning)` 에서 계산한다. `r` = string 0 에서 루트가 처음 나오는 프렛(0..11).

1. **full**: `[0, fretCount]`, `marksFor` 전체.
2. **5음 스케일 CAGED(5개)** — 피치 연속 박스(`contiguousBox`, n = 2): string 0 의 `[r, r+12)` 안 스케일 음 5개를 각각 시작점으로, 줄마다 2음씩 고르되 줄이 바뀌면 **직전 음 바로 위 피치**부터 잇는다. 스탠다드 튜닝에서 교과서 펜타토닉 박스와 정확히 일치한다(검사: A 마이너 펜타토닉 24프렛 = 5-8, 7-10, 9-13, 12-15, 14-17). 줄 간격이 커서(Open G 의 G→D 7반음) 프렛이 음수가 되면 그대로 두고 4 단계에서 옥타브를 맞춘다.
3. **3NPS(7개, 7음 스케일만)** — 같은 피치 연속 박스, n = 3, 시작점은 string 0 의 스케일 음 7개(인접 포지션은 한 음씩 위에서 시작). 비7음은 caged 박스를 `system='3nps'` 로 돌려준다.
4. **7음 CAGED·fallback(5개)** — 창 박스(`windowBox`): `lo_k = r + round(12k/5)`, `[lo_k, lo_k+4]` 안 모든 스케일 음. 7음 스케일은 줄마다 ≤3음(반음 4개가 4반음 안에 몰린 에니그매틱 류는 그 수까지), 포지션 0 은 루트에서 시작한다.
5. **옥타브 배치(`octaves`/`place`)**: 박스를 0 이상이 되는 가장 낮은 옥타브에 놓고, `fretCount` 를 넘으면 12 씩 내린다. 그래도 안 들어가면(12프렛 넥의 꼭대기 박스) 두 옥타브를 후보로 두고, 안 들어가는 박스들의 조합을 전부 평가해 **(주기 커버리지 결손 → 인접 포지션 비겹침 수 → −음 수)** 가 가장 작은 조합을 고른다. 후보는 보통 1~2개라 조합은 최대 4~8개다. 범위 밖 음은 버린다.
6. 결과를 `lo` 오름차순으로 정렬해 `index` 0..n−1 을 매긴다. `Position.marks` 는 `marksFor` 의 같은 객체를 `posKey` 로 찾아 넣는다(부분집합 보장).

## 자가 검사 (`npm run check`)

스케일(간격·id·수), 튜닝(수·오름차순·7현), `marksFor` 샘플(A 마이너 펜타토닉 루트 7개, 정렬), `labelOf` 4모드·#/b. 포지션은 **65 스케일 × 8 튜닝 × 3 시스템 × fretCount {12,15,22,24} × 12 루트 = 74,880 조합**에 대해: 개수(full 1 / caged 5 / 3nps 7, 비7음 5), index·system, 범위 `[lo,hi] ⊂ [0,fretCount]`, 비어 있지 않음, 마크 ⊂ 전체·범위 안·중복 없음, 인접 포지션 겹침(≥1프렛), 줄당 음 수 상한(펜타 2 / 3NPS 3 / 7음 창 3 또는 5반음 창 최대치), 폭 4~5(스탠다드·Eb·7현, 잘리지 않은 박스, 최대 간격 ≤3반음인 스케일), 12프렛 주기 커버리지. 추가로 교과서 펜타 박스, 3NPS 줄당 정확히 3음, 비7음 3nps = caged, 7현 7줄 전부 마크.

## 검증 결과 (2026-11-14)

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | 오류 0 |
| `npm run lint` | 경고/오류 0 |
| `npm run check` | `music.check ok — scales 65, tunings 8, positions 74880 combos` |
| `npm run build` | OK — JS 31.55 kB (gzip 12.60 kB), CSS 3.54 kB gzip |

미해결 이슈: 없음. 계약 변경 요청: 없음(export 이름·시그니처 그대로). 참고: `Position.frets` 의 `hi` 는 창 폭이 아니라 박스 안 마지막 음 프렛이라 창 마지막 프렛에 음이 없으면 폭 4로 나온다(검사 허용 범위).

## 스케일 목록 (65)

| # | id | 이름 | 한글 | 간격 | 그룹 | 별칭 |
|---|---|---|---|---|---|---|
| 1 | `major` | Major (Ionian) | 메이저 (이오니안) | 0 2 4 5 7 9 11 | 메이저 | Ionian |
| 2 | `harmonic-major` | Harmonic Major | 하모닉 메이저 | 0 2 4 5 7 8 11 | 메이저 |  |
| 3 | `natural-minor` | Natural Minor (Aeolian) | 내추럴 마이너 (에올리안) | 0 2 3 5 7 8 10 | 마이너 | Aeolian |
| 4 | `harmonic-minor` | Harmonic Minor | 하모닉 마이너 | 0 2 3 5 7 8 11 | 마이너 |  |
| 5 | `melodic-minor` | Melodic Minor | 멜로딕 마이너 | 0 2 3 5 7 9 11 | 마이너 | Jazz Minor |
| 6 | `major-pentatonic` | Major Pentatonic | 메이저 펜타토닉 | 0 2 4 7 9 | 펜타토닉 |  |
| 7 | `minor-pentatonic` | Minor Pentatonic | 마이너 펜타토닉 | 0 3 5 7 10 | 펜타토닉 |  |
| 8 | `dominant-pentatonic` | Dominant Pentatonic | 도미넌트 펜타토닉 | 0 2 4 7 10 | 펜타토닉 |  |
| 9 | `major-blues` | Major Blues | 메이저 블루스 | 0 2 3 4 7 9 | 블루스 |  |
| 10 | `minor-blues` | Minor Blues | 마이너 블루스 | 0 3 5 6 7 10 | 블루스 | Blues |
| 11 | `mixo-blues` | Mixo-Blues | 믹소 블루스 | 0 2 3 4 5 6 7 9 10 | 블루스 |  |
| 12 | `ionian` | Ionian | 이오니안 | 0 2 4 5 7 9 11 | 모드 | Major |
| 13 | `dorian` | Dorian | 도리안 | 0 2 3 5 7 9 10 | 모드 |  |
| 14 | `phrygian` | Phrygian | 프리지안 | 0 1 3 5 7 8 10 | 모드 |  |
| 15 | `lydian` | Lydian | 리디안 | 0 2 4 6 7 9 11 | 모드 |  |
| 16 | `mixolydian` | Mixolydian | 믹솔리디안 | 0 2 4 5 7 9 10 | 모드 | Dominant |
| 17 | `aeolian` | Aeolian | 에올리안 | 0 2 3 5 7 8 10 | 모드 | Natural Minor |
| 18 | `locrian` | Locrian | 로크리안 | 0 1 3 5 6 8 10 | 모드 |  |
| 19 | `locrian-nat6` | Locrian ♮6 | 로크리안 ♮6 | 0 1 3 5 6 9 10 | 하모닉 마이너 모드 |  |
| 20 | `ionian-sharp5` | Ionian #5 | 이오니안 #5 | 0 2 4 5 8 9 11 | 하모닉 마이너 모드 | Augmented Major |
| 21 | `dorian-sharp4` | Dorian #4 | 도리안 #4 | 0 2 3 6 7 9 10 | 하모닉 마이너 모드 | Romanian Minor, Ukrainian Dorian |
| 22 | `phrygian-dominant` | Phrygian Dominant | 프리지안 도미넌트 | 0 1 4 5 7 8 10 | 하모닉 마이너 모드 | Spanish Gypsy, Freygish |
| 23 | `lydian-sharp2` | Lydian #2 | 리디안 #2 | 0 3 4 6 7 9 11 | 하모닉 마이너 모드 |  |
| 24 | `ultralocrian` | Ultralocrian | 울트라로크리안 | 0 1 3 4 6 8 9 | 하모닉 마이너 모드 | Super Locrian bb7 |
| 25 | `dorian-b2` | Dorian b2 | 도리안 b2 | 0 1 3 5 7 9 10 | 멜로딕 마이너 모드 | Phrygian ♮6 |
| 26 | `lydian-augmented` | Lydian Augmented | 리디안 어그먼트 | 0 2 4 6 8 9 11 | 멜로딕 마이너 모드 |  |
| 27 | `lydian-dominant` | Lydian Dominant | 리디안 도미넌트 | 0 2 4 6 7 9 10 | 멜로딕 마이너 모드 | Overtone, Acoustic |
| 28 | `mixolydian-b6` | Mixolydian b6 | 믹솔리디안 b6 | 0 2 4 5 7 8 10 | 멜로딕 마이너 모드 | Hindu |
| 29 | `locrian-nat2` | Locrian ♮2 | 로크리안 ♮2 | 0 2 3 5 6 8 10 | 멜로딕 마이너 모드 | Half-Diminished |
| 30 | `altered` | Altered | 얼터드 | 0 1 3 4 6 8 10 | 멜로딕 마이너 모드 | Super Locrian, Diminished Whole Tone |
| 31 | `diminished-wh` | Diminished (Whole-Half) | 디미니시 (온-반) | 0 2 3 5 6 8 9 11 | 대칭 |  |
| 32 | `diminished-hw` | Diminished (Half-Whole) | 디미니시 (반-온) | 0 1 3 4 6 7 9 10 | 대칭 | Dominant Diminished |
| 33 | `whole-tone` | Whole Tone | 홀톤 | 0 2 4 6 8 10 | 대칭 |  |
| 34 | `augmented` | Augmented | 어그먼트 | 0 3 4 7 8 11 | 대칭 |  |
| 35 | `tritone` | Tritone | 트라이톤 | 0 1 4 6 7 10 | 대칭 | Petrushka |
| 36 | `chromatic` | Chromatic | 크로매틱 | 0 1 2 3 4 5 6 7 8 9 10 11 | 대칭 |  |
| 37 | `bebop-dominant` | Bebop Dominant | 비밥 도미넌트 | 0 2 4 5 7 9 10 11 | 비밥 |  |
| 38 | `bebop-major` | Bebop Major | 비밥 메이저 | 0 2 4 5 7 8 9 11 | 비밥 |  |
| 39 | `bebop-minor` | Bebop Minor | 비밥 마이너 | 0 2 3 5 7 8 9 11 | 비밥 | Bebop Melodic Minor |
| 40 | `bebop-dorian` | Bebop Dorian | 비밥 도리안 | 0 2 3 4 5 7 9 10 | 비밥 |  |
| 41 | `hungarian-minor` | Hungarian Minor | 헝가리안 마이너 | 0 2 3 6 7 8 11 | 민속 | Gypsy Minor, Algerian |
| 42 | `hungarian-major` | Hungarian Major | 헝가리안 메이저 | 0 3 4 6 7 9 10 | 민속 |  |
| 43 | `gypsy` | Gypsy | 집시 | 0 2 3 6 7 8 10 | 민속 | Hungarian Gypsy |
| 44 | `double-harmonic` | Double Harmonic | 더블 하모닉 | 0 1 4 5 7 8 11 | 민속 | Byzantine, Arabic, Bhairav |
| 45 | `neapolitan-major` | Neapolitan Major | 네아폴리탄 메이저 | 0 1 3 5 7 9 11 | 민속 |  |
| 46 | `neapolitan-minor` | Neapolitan Minor | 네아폴리탄 마이너 | 0 1 3 5 7 8 11 | 민속 |  |
| 47 | `persian` | Persian | 페르시안 | 0 1 4 5 6 8 11 | 민속 |  |
| 48 | `oriental` | Oriental | 오리엔탈 | 0 1 4 5 6 9 10 | 민속 |  |
| 49 | `hirajoshi` | Hirajoshi | 히라조시 | 0 2 3 7 8 | 민속 |  |
| 50 | `in-sen` | In Sen | 인센 | 0 1 5 7 10 | 민속 |  |
| 51 | `iwato` | Iwato | 이와토 | 0 1 5 6 10 | 민속 |  |
| 52 | `kumoi` | Kumoi | 구모이 | 0 2 3 7 9 | 민속 |  |
| 53 | `yo` | Yo | 요 | 0 2 5 7 9 | 민속 | Ritusen |
| 54 | `pelog` | Pelog | 펠로그 | 0 1 3 7 8 | 민속 | Balinese |
| 55 | `egyptian` | Egyptian | 이집션 | 0 2 5 7 10 | 민속 | Suspended Pentatonic |
| 56 | `chinese` | Chinese | 중국 | 0 4 6 7 11 | 민속 |  |
| 57 | `spanish-8-tone` | Spanish 8-Tone | 스패니시 8음 | 0 1 3 4 5 6 8 10 | 민속 | Jewish |
| 58 | `todi` | Todi | 토디 | 0 1 3 6 7 8 11 | 민속 |  |
| 59 | `marva` | Marva | 마르바 | 0 1 4 6 7 9 11 | 민속 |  |
| 60 | `purvi` | Purvi | 푸르비 | 0 1 4 6 7 8 11 | 민속 |  |
| 61 | `enigmatic` | Enigmatic | 에니그매틱 | 0 1 4 6 8 10 11 | 기타 |  |
| 62 | `prometheus` | Prometheus | 프로메테우스 | 0 2 4 6 9 10 | 기타 |  |
| 63 | `major-locrian` | Major Locrian | 메이저 로크리안 | 0 2 4 5 6 8 10 | 기타 | Arabian |
| 64 | `leading-whole-tone` | Leading Whole Tone | 리딩 홀톤 | 0 2 4 6 8 10 11 | 기타 |  |
| 65 | `lydian-minor` | Lydian Minor | 리디안 마이너 | 0 2 4 6 7 8 10 | 기타 |  |

## 튜닝 (8)

| id | 이름 | MIDI |
|---|---|---|
| `standard` | 스탠다드 (E A D G B E) | 40 45 50 55 59 64 |
| `drop-d` | Drop D (D A D G B E) | 38 45 50 55 59 64 |
| `eb` | 반음 다운 (Eb Ab Db Gb Bb Eb) | 39 44 49 54 58 63 |
| `drop-c` | Drop C (C G C F A D) | 36 43 48 53 57 62 |
| `open-g` | Open G (D G D G B D) | 38 43 50 55 59 62 |
| `open-d` | Open D (D A D F# A D) | 38 45 50 54 57 62 |
| `dadgad` | DADGAD (D A D G A D) | 38 45 50 55 57 62 |
| `standard-7` | 7현 스탠다드 (B E A D G B E) | 35 40 45 50 55 59 64 |
