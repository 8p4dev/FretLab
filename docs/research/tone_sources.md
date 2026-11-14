# 기타 톤 오픈소스 조사 (3차 R3)

2026-11-14, 오케스트레이터. 사용자가 듣고 채택한다 — 듣는 페이지: **`docs/research/tone-demo.html`** (파일을 브라우저로 열면 됨. 외부 요청으로 음원을 내려받으므로 앱 번들과 무관). 같은 프레이즈를 모든 후보로 재생하고, "FretLab 앰프 통과" 를 켜면 클린 샘플에 현재 앱의 록/메탈 디스토션을 거는 하이브리드도 들을 수 있다.

## 1. 후보 요약

| # | 후보 | 종류 | 라이선스 | 앱 추가 용량(존 6~8개로 자를 때) | 들어보기 | 판단 |
|---|---|---|---|---|---|---|
| A | **WebAudioFont × GeneralUser GS** (Clean 0270 · Overdriven 0290 · Distortion 0300 · Acoustic 0250) | 사운드폰트에서 뽑은 base64 ogg 존 | GeneralUser GS 라이선스(무료·상업 포함 사용/재배포 가능, 라이선스 문서 동봉) | ≈40–80 KB / 톤 | demo 페이지 §1, 또는 [프리셋 페이지](https://surikov.github.io/webaudiofontdata/sound/0300_GeneralUserGS_sf2_file.html) | **1순위**. 작고 라이선스 깨끗. GM 톤이라 "진짜 앰프" 느낌은 보통 |
| B | **WebAudioFont × FluidR3_GM** (같은 GM 번호) | 〃 | CC BY 3.0 (표기 필요) | ≈60–140 KB / 톤 | demo §1 | A 보다 샘플이 길고 크다. 소리는 취향 |
| C | WebAudioFont 개별 사운드폰트 (Stratocaster 0270, Gibson Les Paul 0270, LesPaul 0290/0300, Chaos·Aspirin·JCLive 0300) | 〃 | **원 사운드폰트 라이선스 미확인** — 채택 시 확인 필요 | ≈60–200 KB | demo §1 | 소리가 더 "기타답다"(특히 Les Paul). 라이선스 확인이 선행 |
| D | WebAudioFont × SBLive / SoundBlasterOld | 〃 | Creative 번들 — 재배포 불가 가능성 높음 | ≈30 KB | demo §1 | **비추천**(라이선스) |
| E | **tonejs-instruments guitar-electric / guitar-acoustic** | mp3 멀티샘플(Karoryfer 녹음·Iowa) | 샘플 CC BY 3.0, 코드 MIT | mp3 그대로 150–300 KB, ogg 재인코딩 6음 ≈60 KB | demo §2 | 클린 톤 품질 좋음. 디스토션은 없음 → FretLab 앰프(하이브리드)로 |
| F | **Black and Green Guitars** (Karoryfer, Gretsch·Hofner) | 24-bit WAV SFZ, 수백 MB | **CC0** | 우리가 6~8음 골라 ogg 로 렌더 ≈60–100 KB | 웹 시연 없음 — 내려받아 Sforzando/sfizz 로 들어야 함 ([repo](https://github.com/sfzinstruments/karoryfer.black-and-green-guitars)) | 라이선스 가장 자유. 클린 전용 |
| G | Flamestudios SF2 (Telecaster·Les Paul·Jaguar) | SF2 | GPL v3 | ≈100 KB | [repo](https://github.com/gdm-2112/electric-guitar-soundfonts) PDF 만 | **비추천** — GPL 샘플을 비 GPL 앱에 동봉하는 문제 |
| H | 현재 Karplus-Strong 합성 + 앰프 체인 | 합성 | 없음 | 0 KB | demo §0 | 가장 가볍지만 플럭 질감 단순 |
| I | Neural Amp Modeler WASM ([tone-3000/neural-amp-modeler-wasm](https://github.com/tone-3000/neural-amp-modeler-wasm), MIT) + 클린 샘플 | 실시간 앰프 모델 | MIT(엔진), 모델별 | WASM + 모델 수백 KB~MB, CPU 부담 | [TONE3000 웹 플레이어](https://www.tone3000.com/blog/introducing-the-nam-web-player) | 소리는 최고지만 "아주 가벼움" 요구와 충돌 — 참고만 |

## 2. 권장 조합 (사용자 결정 전 제안)
- **어쿠스틱** = A 0250 GeneralUser GS(또는 E guitar-acoustic), **록** = A 0290 Overdriven, **메탈** = A 0300 Distortion. 셋 합쳐 ≈150 KB, 라이선스 하나. 샘플은 톤 선택 시 지연 로드(첫 로드 번들 27 KB 유지).
- 대안: **E guitar-electric 클린 6음(≈60 KB) 하나만 넣고** 록/메탈은 현재 앰프 체인으로 — 용량 최소(+60 KB), 디스토션 캐릭터는 지금과 같음.
- 라이선스 표기: A 는 GeneralUser GS 라이선스 문서를 `docs/licenses/` 에 동봉, B/E 는 앱 옵션 시트 하단에 "샘플: FluidR3 (CC BY 3.0)" 식 한 줄.

## 3. 적용 방식 (채택 뒤 별도 라운드, C 워커)
1. 빌드 스크립트(`scripts/extract-tone.mjs`, 1회 실행)로 WebAudioFont 프리셋 js 에서 필요한 존(E2·A2·D3·G3·B3·E4 근처 6개)만 골라 `public/tones/<tone>.json`(base64 ogg + 존 메타)으로 저장.
2. `src/core/audio/index.ts`: 톤 선택 시 json fetch → decodeAudioData → `AudioBufferSourceNode` playbackRate 로 피치 이동, 기존 버스(리미터·볼륨·음소거) 유지. 샘플 로드 전엔 현재 KS 합성으로 폴백(설정 `tone` 에 `'ks-*'` 보존).
3. 번들 예산: 첫 로드 변화 없음, 톤당 ≤ 150 KB, precache 제외(온디맨드).

## 4. 출처
- WebAudioFont: https://surikov.github.io/webaudiofont/ · 프리셋 목록 https://surikov.github.io/webaudiofontdata/sound/
- gleitz midi-js-soundfonts(FluidR3_GM mp3, CC BY 3.0): https://gleitz.github.io/midi-js-soundfonts/ — WebAudioFont FluidR3 와 같은 원본이라 demo 에서는 생략
- tonejs-instruments: https://github.com/nbrosowsky/tonejs-instruments (샘플 출처 `sample-source-info.txt`)
- Black and Green Guitars(CC0): https://github.com/sfzinstruments/karoryfer.black-and-green-guitars
- Flamestudios SF2(GPL): https://github.com/gdm-2112/electric-guitar-soundfonts
- GeneralUser GS: https://schristiancollins.com/generaluser.php (라이선스 본문은 다운로드 안 `LICENSE.txt`)
- NAM WASM: https://github.com/tone-3000/neural-amp-modeler-wasm
- Ardour 포럼 SFZ/SF2 소스 정리(2023): https://discourse.ardour.org/t/best-sfz-sf2-instrument-sources-open-source-free-and-commercial-and-related-misc-as-of-june-2023/108831
