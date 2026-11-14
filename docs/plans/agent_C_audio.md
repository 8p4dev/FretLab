# 워커 C — 사운드 엔진 plan (`src/core/audio/**`)

작성 2026-11-14. 오케스트레이션 plan §1 R5, 계약 §3.4 §3.6.

## 접근 방식

- **현 모델: Karplus-Strong을 JS 로 미리 계산해 `AudioBuffer` 로 재생**(`AudioBufferSourceNode`).
  - 지연선 길이 `N = round(sr/hz − 0.5)`(2점 평균 필터가 0.5 샘플 지연을 더함), 노이즈 버스트는 1극 로우패스로 살짝 둥글게, 루프 손실 `rho = 0.001^(1/(hz·T60))` 로 음높이에 무관하게 T60≈2.2초. 끝 50 ms 선형 페이드로 버퍼 끝 클릭 방지.
  - 정수 N 에 의한 피치 오차는 `playbackRate = hz·(N+0.5)/sr` 로 정확히 보정(고음에서 오차 1% 이상 나는 문제 해결).
  - 음(midi)별 버퍼 캐시 `Map<Midi, AudioBuffer>`; 2.5초 × 48 kHz × 4 B ≈ 480 KB/음. 톤에 무관한 하나의 버퍼를 쓰고 톤별 감쇠는 노트 gain 엔벌로프로 준다(캐시 1/3).
  - **대안·트레이드오프**: `OscillatorNode`+필터는 노드 수가 적고 메모리 0 이지만 "줄을 튕긴" 과도 응답(노이즈 어택 → 고역 빠른 감쇠)이 안 나와 기타보다 전자 오르간에 가깝다. `AudioWorklet` KS 는 가장 정확하지만 별도 모듈 파일·iOS 호환 비용. 버퍼 방식은 생성 비용(음당 ~120k 샘플 루프, <2 ms)을 첫 재생 때 한 번만 내고 이후 0 이므로 가장 가볍고 기타 같다.
- **톤 3종 = 공유 버스**(노트 → 톤 버스 → 마스터). 디스토션은 폴리포니 합을 한 `WaveShaperNode` 에 넣는 게 실제 앰프와 같고 노드도 적다.
  - `acoustic`: 피킹 EQ 170 Hz Q1.2 +6 dB(바디) → 로우패스 5 kHz. 노트 엔벌로프 짧은 자연 감쇠(τ≈0.45 s).
  - `rock`: 입력 게인 ×8 → tanh 소프트 클리핑 → 로우패스 4.5 kHz(캐비닛) → 메이크업. 엔벌로프 τ≈0.8 s.
  - `metal`: 하이패스 120 Hz → 게인 ×40 → 하드 클리핑 → 피킹 800 Hz −12 dB(미드 스쿱) → 로우패스 6 kHz → 메이크업. 엔벌로프 τ≈1.2 s.
  - 마스터: `DynamicsCompressorNode`(threshold −6 dB, ratio 12 ≈ 리미터) → `GainNode`(볼륨·음소거) → destination.
- **설정**: `playNote` 때마다 `getSettings()` 읽어 마스터 gain = muted ? 0 : volume²(≈ dB 곡선, 0.5 → −12 dB). 음소거는 마스터 gain 이라 울리고 있는 음도 즉시 끊긴다.
- **unlock**: `unlockAudio()` 가 처음 불릴 때만 `new AudioContext()` + 톤 버스 생성, 이후엔 `resume()`. `playNote` 는 컨텍스트가 없거나 suspended 면 조용히 unlock 시도.
- **폴리포니/리트리거**: 활성 노트 `Map<Midi, {src, g}>`. 같은 음 재타격 시 이전 노트 gain 을 15 ms 선형 램프로 0 → stop(클릭 없음). 동시 발음 제한 없음(버퍼 소스는 가볍다).
- `playSequence`: `setTimeout` 체인, 반환 함수가 타이머를 지운다.

## 수정/생성 파일

- `src/core/audio/synth.ts` — 순수 계산(DOM 없음): `midiToHz`, `pluckPeriod`, `pluckBuffer`, `softClipCurve`, `hardClipCurve`, `volumeToGain`.
- `src/core/audio/index.ts` — 컨텍스트·톤 버스·`unlockAudio playNote playSequence`(계약 유지) + re-export.
- `src/core/audio/audio.check.ts` — 자가 검사(`npx tsx src/core/audio/audio.check.ts`).
- `docs/plans/agent_C_audio.md` — 이 문서.

## 단계

- [x] 1. plan 작성
- [x] 2. `synth.ts` 순수 함수(KS 버퍼, 클리핑 커브, 주파수·볼륨 변환)
- [x] 3. `audio.check.ts`: 주파수(69→440, 57→220, 81→880), 버퍼 길이·범위 [−1,1]·끝 샘플 0·초반 에너지>후반 에너지, 커브 범위·단조·대칭, 볼륨 0→0·1→1 단조
- [x] 4. `index.ts`: 컨텍스트/unlock, 마스터 체인, 톤 버스 3종, playNote(설정·리트리거·엔벌로프), playSequence
- [x] 5. `npm run typecheck && npm run lint && npm run check && npm run build`, 번들 증가 기록
- [x] 6. `npx vite --port 8033` + Playwright 헤드리스로 재생 오류 0, 톤 3종 스펙트럼(중심 주파수·RMS) 차이 측정 기록
- [x] 7. 커밋

## 검증 방법

- 2·3: `npx tsx src/core/audio/audio.check.ts` 가 `audio.check ok`.
- 4·5: typecheck/lint/build 통과, `vite build` gzip 합계 vs groundwork(JS 9.82 KB).
- 6: 브라우저에서 `const a = await import('/src/core/audio/index.ts'); a.unlockAudio(); a.playNote(57)` 오류 0; Playwright 임시 스크립트(커밋 안 함)로 AnalyserNode 를 destination 앞에 끼워 톤별 스펙트럼 중심·RMS 비교.

## 결과 (2026-11-14)

- 검증: `npm run typecheck` 0 오류 · `npm run lint` 0 경고 · `npm run check` ok · `npx tsx src/core/audio/audio.check.ts` → `audio.check ok` · `npm run build` OK.
- 번들: JS gzip 9.82 KB(groundwork) → **10.30 KB (+0.48 KB)**, CSS 변화 없음. 기준(≤ 6 KB 증가) 충족.
- 헤드리스 Edge(Playwright, 임시 스크립트, 커밋 안 함)에서 `destination` 앞에 AnalyserNode 를 끼워 측정(48 kHz, 음 57+64 동시, 볼륨 0.8). 페이지 오류·콘솔 오류 0.

| 톤 | 스펙트럼 중심(Hz) | RMS  ms | RMS  ms | 잔존 비율 | 피크 |
|---|---|---|---|---|---|
| acoustic | 1428~1617 | 0.146 | 0.0011 | 0.7 % | 0.60 |
| rock | 1432 | 0.286 | 0.020 | 7 % | 0.45 |
| metal | 2025 | 0.177 | 0.070 | 40 % | 0.45 |
| muted (`patchSettings({muted:true})` 뒤 `playNote`) | — | 0 | 0 | — | 0 |
| playSequence 6음 + 같은 음 10연타 | 1940 | 0.281 | 0.219 | — | 0.45 |

  acoustic 은 빠른 자연 감쇠, rock 은 압축된 어택 + 중간 서스테인(캐비닛 로우패스로 중심 낮음), metal 은 가장 밝고(미드 스쿱·하이패스) 가장 긴 서스테인 — 세 톤이 측정상·청감상 분명히 구분된다. 리미터 덕에 피크 ≤ 0.61.
- 트레이드오프(버퍼 KS vs 오실레이터): 위 접근 방식 절 참고. 버퍼 생성은 음당 1회(≈1~2 ms), 캐시 480 KB/음(48 kHz).
- 수동 청감: `npx vite --port 8033` → 콘솔 `const a = await import('/src/core/audio/index.ts'); a.unlockAudio(); a.playNote(57)`; 톤은 `localStorage` `fretlab:settings` 의 `tone` 을 바꾸고 새로고침.
- 미해결 이슈: 없음. 계약 변경 요청: 없음(추가 export: `midiToHz pluckPeriod pluckBuffer softClipCurve hardClipCurve volumeToGain`).

## 변경 사항

- plan 대비 변경 없음. 재타격 페이드는 15 ms 선형 램프 + 20 ms 후 stop.
