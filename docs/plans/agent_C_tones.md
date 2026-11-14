# 워커 C4 — 샘플 톤 교체 plan (클린 FluidR3 · 디스토션 Aspirin)

작성 2026-11-14. 4차 plan `orchestration_fretlab_tones.md` §1 T2~T7, 계약 `orchestration_fretlab.md` §3.4 §3.6.

## 접근 방식

- **추출(T2)**: `scripts/extract-tones.mjs`(Node 내장 https·fs). 프리셋 js 를 받아 `{…}` 블록을 정규식으로 파싱 → 음 36..92 마다 **WebAudioFontPlayer.findZone 과 같은 규칙(키 범위가 맞는 존 중 마지막 것)** 으로 존을 고르고, 같은 샘플·튜닝이 이어지면 한 존으로 묶는다 → 겹치지 않는 `lo..hi` 존 목록. 같은 base64 내용은 mp3 한 번만 쓴다.
  - 대안: 원본 존을 겹친 채로 내보내고 런타임에서 "마지막 일치"를 고르기 — 런타임 코드·JSON 이 커지고 안 쓰는 레이어(Aspirin 의 `382` 등)까지 받게 된다. 추출 때 풀어 두는 쪽이 가볍다.
- **재생(T3)**: `index.ts` 에 톤별 캐시 `Partial<Record<Tone, Promise<void>>>`(동시 요청 1회) + 로드 끝난 `{zone, buf}[]`. `unlockAudio()` 가 매번 `loadTone(getSettings().tone)` 을 부른다(멱등) — `playNote` 가 `unlockAudio` 를 부르므로 톤 변경도 다음 `playNote`(옵션 미리듣기)에서 잡힌다.
  - `playNote`: 현재 톤이 로드됐으면 샘플 소스, 아니면 KS 소스 — **둘 중 하나만** 만들어 `start` 1회.
  - 샘플: `playbackRate = zoneRate(zone, midi)`, `loop`(loopStart ≥ 1 && loopStart < loopEnd 일 때, WebAudioFont 와 동일), `loopStart/End = 샘플/zone.sampleRate` 초. 엔벌로프 `setTargetAtTime(0, t+0.03, DECAY[tone])` + 끝 0.2 s 빠른 감쇠(τ 40 ms) 뒤 2.5 s 에 stop(루프 샘플을 그냥 끊으면 클릭).
  - 로드 실패는 조용히 무시(KS 유지). ponytail: 실패한 톤은 그 세션 동안 재시도하지 않는다 — 필요해지면 실패 시 캐시 항목 삭제.
- **순수 함수(T6)**: `synth.ts` 에 `Zone` 타입, `pickZone(zones, midi)`(범위 일치, 없으면 root 가장 가까운 존), `zoneRate(zone, midi)` — `audio.check.ts` 가 검사.
- **버스(T4)**: clean = 통과(게인 1), distortion = 로우패스 6 kHz + 게인 트림. WaveShaper·×40 게인 제거. 리미터 → 볼륨 → destination 그대로.
- **가벼움(T5)**: 샘플은 `public/tones/`(같은 origin), workbox 기본 precache 글롭(`js,css,html`)에 안 걸린다 — `dist/sw.js` grep 으로 확인.

## 수정/생성 파일

- `scripts/extract-tones.mjs`(신규)
- `public/tones/clean.json`, `public/tones/clean/0..9.mp3`, `public/tones/distortion.json`, `public/tones/distortion/0..10.mp3`(신규, 스크립트 산출물)
- `src/core/audio/synth.ts`, `src/core/audio/index.ts`, `src/core/audio/audio.check.ts`
- `docs/licenses/FluidR3_GM.md`, `docs/licenses/Aspirin.md`(신규)
- `docs/plans/agent_C_tones.md`(이 문서)

## 단계

- [x] 1. plan 작성
- [x] 2. T2 `extract-tones.mjs` 작성·실행, 톤당 ≤ 200 KB, 재실행 동일 결과
- [x] 3. T6 `synth.ts` `pickZone`·`zoneRate` + `audio.check.ts` 검사
- [x] 4. T3·T4 `index.ts` 지연 로드·샘플 재생·버스 정리
- [x] 5. T7 라이선스 문서 2개
- [x] 6. `npm run typecheck && npm run lint && npm run check && npm run build`, T5(번들 gzip 증가, `dist/sw.js` 에 `tones/` 없음)
- [x] 7. `vite preview --port 8033` + Playwright 임시 스크립트 ①~⑤, 결과 기록
- [x] 8. 커밋

## 검증 방법

- 2: 스크립트 출력(존 표·KB), 두 번 실행해 sha1 비교.
- 3: `npm run check` → `audio.check ok`.
- 4·6: typecheck/lint/build, `vite build` JS gzip 을 작업 전과 비교, `grep tones dist/sw.js`.
- 7: 임시 Playwright 스크립트(커밋 안 함) — 요청 로그·`start` 스파이·`buffer.duration`·콘솔 오류.

## 결과

### 결과 (2026-11-14)

- 명령: `npm run typecheck` 0 오류 · `npm run lint` 0 경고 · `npm run check` 5개 전부 ok(`audio.check ok`) · `npm run build` OK.
- T2 산출물: clean 원본 10존 → 10존, mp3 10개 **186.2 KB**(폴더 190.7 KB) / distortion 원본 19존 → 11존, mp3 11개 **111.7 KB**(폴더 114.3 KB). 스크립트 두 번 실행 sha1 동일.
- T5: JS gzip 24.30 KB → **24.50 KB (+0.20 KB)**, CSS 변화 없음. `dist/sw.js` 에 `tones/` 0건(precache 4 entries 그대로).
- 브라우저(`npm run build && npx vite preview --host 127.0.0.1 --port 8033`, Playwright 임시 스크립트·헤드리스 Edge, 커밋 안 함):

| # | 확인 | 결과 |
|---|---|---|
| ① | `/tones/clean.json` | 200 (tones 응답 23개 전부 200) |
| ② | 보기 모드 마크(0:0) 탭 | 첫 탭 start 1회 `duration 2.5 loop false`(KS 폴백) → 로드 뒤 두 번째 탭 start 1회 `duration 1.628 loop true rate 0.9862`(클린 36-44 존) |
| ③ | 옵션 → 디스토션 | `/tones/distortion.json` 200, 미리듣기 start 1회(로드 전이라 KS 2.5 s). 로드 뒤 클린→디스토션 재선택: 각 start 1회, `3.96 s rate 1.1186`(클린 55-58 존) · `0.988 s rate 1.0058`(디스토션 57-61 존, fine +10) |
| ④ | 콘솔·페이지 오류 | 0 |
| ⑤ | 외부 호스트 요청 | 0 |

- 레벨: 샘플 앞 0.5 s RMS 가 클린 ≈ 0.18~0.28, 디스토션 ≈ 0.53~0.68(36-42 뮤트 존만 0.28) → 디스토션 버스 게인 0.4 로 맞춤.
- 미해결: ① Aspirin 라이선스 미확인(`docs/licenses/Aspirin.md`). ② 청감(청취 페이지와 캐릭터 일치)은 헤드리스로 확인 못 함 — 사용자 몫. ③ 오프라인(PWA)에서는 샘플이 precache 밖이라 HTTP 캐시에 없으면 KS 폴백으로 울린다(의도된 동작). ④ 로드 실패한 톤은 새로고침 전까지 재시도하지 않는다.
- 계약 변경 요청: 없음. 추가 export: `Zone pickZone zoneRate`(synth.ts).

## 변경 사항

- `DECAY` 를 clean 0.6 → 1.0, distortion 1.2 → 1.5 로 늘렸다 — 샘플에는 자체 감쇠가 들어 있어 KS 용 값이면 너무 빨리 죽는다.
- 음 끝: 루프 샘플은 끝이 없으므로 2.3 s 부터 τ 40 ms 감쇠 뒤 2.5 s 에 `stop`(KS 폴백에도 같이 적용, 무해).
- 톤 JSON 의 유효성(36..92 덮기)은 `audio.check.ts` 가 아니라 추출 스크립트가 보장한다(음마다 존이 없으면 throw) — tsconfig 에 node 타입이 없어 check 에서 fs 를 못 쓴다.

- plan(4차 §1 T2) 은 "키 범위가 36..92 와 겹치는 존만"이라고 했지만, Aspirin 은 존이 **겹쳐**(레이어) 있어 그대로 두면 어느 존을 쓸지 모호하다. 청취 페이지(WebAudioFontPlayer)와 같은 소리가 나도록 `findZone` 규칙(마지막 일치)을 추출 때 적용해 겹치지 않는 존으로 풀었다. FluidR3 는 겹침이 없어 결과가 같다(10존).
