# Aspirin — 디스토션 톤 샘플

- 쓰는 곳: `public/tones/distortion.json`, `public/tones/distortion/*.mp3` (옵션의 "디스토션" 톤)
- 원본: **Aspirin** 사운드폰트(GM 30 Distortion Guitar)
- 받은 곳: WebAudioFont 가 프리셋별로 변환해 둔 파일
  `https://surikov.github.io/webaudiofontdata/sound/0300_Aspirin_sf2_file.js` (원본 존 19개, 22050/44100 Hz mono mp3)
- 변경 사항: `scripts/extract-tones.mjs` 로 WebAudioFontPlayer 가 음 36..92 에서 실제로 고르는 존만 남겨(11존) base64 mp3 를 바이너리 파일로 풀고 존 정보를 JSON 으로 옮겼다. 오디오 데이터 자체는 고치지 않았다.

## 라이선스 — **미확인**

원 사운드폰트(Aspirin)의 제작자·라이선스는 조사(`docs/research/tone_sources.md`)에서 **확인되지 않았다**. WebAudioFont 저장소가 이 파일을 배포하고 있다는 사실만 확인했고, 그것이 재배포 허락을 뜻하지는 않는다.

- 공개 배포 전에 원 라이선스를 확인해야 한다(4차 plan `orchestration_fretlab_tones.md` §2 A1, §6 미결).
- 확인이 안 되면 라이선스가 분명한 디스토션 프리셋으로 바꾼다 — `scripts/extract-tones.mjs` 의 `TONES.distortion` 한 줄을 바꾸고 다시 실행하면 된다.
