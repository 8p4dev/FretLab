# 오케스트레이션 4차 — 샘플 톤(클린 FluidR3 · 디스토션 Aspirin)

작성 2026-11-14, 오케스트레이터. 3차 R3 조사(`docs/research/tone_sources.md`, 청취 페이지 `tone-demo.html`) 뒤 사용자 결정: **클린 = "Clean · FluidR3"(GM 27, WebAudioFont `0270_FluidR3_GM_sf2_file`), 디스토션 = "Distortion · Aspirin"(GM 30, `0300_Aspirin_sf2_file`)**. 기존 어쿠스틱/록/메탈 옵션을 **클린/디스토션** 2종으로 바꾸고 그 소리로 교체.

## 1. 요구사항 → 구체화·완료 기준

| # | 요구 | 구체화 | 완료 기준 | 담당 |
|---|---|---|---|---|
| T1 | 톤 2종 | `Tone = 'clean' | 'distortion'`(types), 기본 `clean`, 옛 저장값 acoustic→clean, rock/metal→distortion 마이그레이션(settings), 옵션 시트 세그먼트 클린/디스토션(picker) | **오케스트레이터 완료(groundwork 커밋)** | — |
| T2 | 샘플 추출 | `scripts/extract-tones.mjs`(Node 내장만, 1회 실행, 커밋): WebAudioFont 프리셋 js 2개를 받아 `zones[]` 파싱 → **같은 `file` 내용 중복 제거** → 키 범위가 36..92 와 겹치는 존만 → `public/tones/<tone>/<n>.mp3`(base64 → 바이너리; 내용은 이미 mp3, 헤더 `ID3`) + `public/tones/<tone>.json` `{ zones: [{ lo, hi, root, coarse, fine, sampleRate, loopStart, loopEnd, file }] }` | 톤당 mp3 합계 **≤ 200 KB**(클린 10존 ≈ 186 KB, 디스토션 중복 제거 뒤 ≈ 150 KB), 출력 커밋, 스크립트 재실행 시 같은 결과 | C |
| T3 | 재생 | `src/core/audio/index.ts`: 톤별 샘플 **지연 로드**(`unlockAudio()`=첫 제스처에서 현재 톤 prefetch, `patchSettings({tone})` 뒤 첫 `playNote` 또는 옵션 미리듣기에서 로드; 메모리 캐시, 동시 요청 1회). `playNote(midi)`: 키 범위에 맞는 존(없으면 root 가장 가까운 존) → `AudioBufferSourceNode`, `playbackRate = 2^((100·midi − (root·100 − 100·coarse − fine)) / 1200)`(WebAudioFont 와 동일), `loop = true`, `loopStart/End = 샘플/sampleRate` 초, 게인 엔벌로프 `setTargetAtTime(0, t+0.03, DECAY[tone])`, 2.5 s 뒤 stop. 같은 음 재타격 페이드·리미터·볼륨·음소거·`playSequence` 그대로 | 탭 → 샘플 소리. 로드 전엔 **KS 합성 폴백**(synth.ts 유지)으로 즉시 소리, 로드 뒤 자동 전환. 음 하나 = `AudioBufferSourceNode.start` **정확히 1회**(E2E (c) 가 start 를 센다) | C |
| T4 | 버스 | clean: 가벼운 EQ 만(또는 없음). distortion: 샘플이 이미 디스토션이므로 **WaveShaper 제거**, 프레즌스 피킹/로우패스 정도만. 리미터 → 볼륨 → destination 유지 | 디스토션이 이중으로 찌그러지지 않음(청취 페이지 "Distortion · Aspirin" 과 같은 캐릭터) | C |
| T5 | 가벼움 | 첫 로드 번들 변화 ≤ +1 KB gzip, 샘플은 precache 밖(`dist/sw.js` 의 precache 목록에 `tones/` 없음 확인), 외부 요청 0(샘플은 같은 origin `/tones/…`) | `npm run build` 출력·`dist/sw.js` grep | C |
| T6 | 검사 | `audio.check.ts` 에 존 선택·playbackRate 순수 함수 검사 추가(예: midi 45 → root 45 존, rate 1; midi 47 → 2^(2/12)) | `npm run check` 통과 | C |
| T7 | 표기 | `docs/licenses/FluidR3_GM.md`(CC BY 3.0, Frank Wen) 작성. Aspirin 은 원 사운드폰트 라이선스 **미확인** — `docs/licenses/Aspirin.md` 에 출처(WebAudioFont `0300_Aspirin_sf2_file`)와 미확인 사실 기록 | 파일 2개 | C |

## 2. 가정·미결
- A1 Aspirin 사운드폰트 라이선스는 조사에서 확인되지 않았다(사용자가 듣고 선택). 배포 전 확인 필요 — §6 미결로 남긴다.
- A2 샘플은 22.05 kHz mono mp3(FluidR3 전부 22050, Aspirin 일부 44100). `decodeAudioData` 가 ctx 샘플레이트로 리샘플하므로 loop 초 단위 변환만 맞추면 된다.
- A3 iOS Safari 는 mp3 디코드 가능 — ogg 였다면 문제였을 텐데 WebAudioFont 파일은 mp3 다(확인: base64 머리 `SUQz` = `ID3`).
- A4 그립 멀티터치 동시 발음 ≥ 6 은 샘플 재생에서도 성립(소스 노드 독립).

## 3. 공유 계약
- `src/core/types.ts` `Tone = 'clean' | 'distortion'`, `src/core/settings.ts` DEFAULTS.tone = 'clean' + 마이그레이션 — **완료**.
- `src/core/audio` export `unlockAudio playNote playSequence` 시그니처 유지. `synth.ts` export 유지(폴백·check).
- `ScaleBar.tsx` TONES 라벨 클린/디스토션 — **완료**(F 소유 파일이지만 2줄이라 오케스트레이터가 처리).

## 4. 분할
| 에이전트 | 담당 | 수정 소유 | 읽기만 | 선행 |
|---|---|---|---|---|
| C4 톤 | T2~T7 | `src/core/audio/**`, `scripts/**`(신규), `public/tones/**`(신규), `docs/licenses/**`(신규), `docs/plans/agent_C_tones.md` | `src/core/settings.ts`, `src/core/types.ts`, `src/features/picker/ScaleBar.tsx`, `e2e/fretlab.spec.ts`(start 스파이 확인), `docs/research/tone-demo.html`(WebAudioFont 로드 방식 참고) | groundwork 커밋 |

에이전트 1명(T2~T7 이 전부 audio 모듈과 그 산출물).

## 5. 머지·검증
C4 머지 → typecheck/lint/check/build → `npm run e2e` 4/4 → `vite preview` 에서 `/tones/clean.json` 200, Playwright 로 탭 뒤 `AudioBufferSourceNode.buffer.duration` 이 샘플 길이(≈1~4 s, KS 는 정확히 2.5 s)인지 확인 → 오케스트레이터가 청취 페이지와 앱을 같이 열어 캐릭터 일치 확인은 사용자 몫.

## 6. 결과
(머지 뒤)

## 진행 기록
- 2026-11-14 groundwork(T1) 커밋, C4 디스패치.
