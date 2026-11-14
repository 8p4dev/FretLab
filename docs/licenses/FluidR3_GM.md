# FluidR3 GM — 클린 톤 샘플

- 쓰는 곳: `public/tones/clean.json`, `public/tones/clean/*.mp3` (옵션의 "클린" 톤)
- 원본: **Fluid (R3) General MIDI SoundFont** — Frank Wen 제작
- 라이선스: **Creative Commons Attribution 3.0 (CC BY 3.0)** — https://creativecommons.org/licenses/by/3.0/
- 받은 곳: WebAudioFont(Srgy Surkv) 가 프리셋별로 변환해 둔 파일
  `https://surikov.github.io/webaudiofontdata/sound/0270_FluidR3_GM_sf2_file.js` (GM 27 Electric Guitar (clean), 22050 Hz mono mp3 10존)
- 변경 사항: `scripts/extract-tones.mjs` 로 base64 mp3 를 바이너리 파일로 풀고 존 정보(키 범위·root·튜닝·루프 지점)를 JSON 으로 옮겼다. 오디오 데이터 자체는 고치지 않았다. 재생 때 음높이에 맞춰 재생 속도를 바꾸고 감쇠 엔벌로프를 건다.

저작자 표시: "FluidR3 GM SoundFont by Frank Wen, CC BY 3.0".
