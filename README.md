# FretLab

A lightweight web app for memorizing electric guitar scales. Works on desktop and phones, installs as a PWA, and needs no server.

## Features

- 65 scales (major/minor, pentatonic, blues, modes, harmonic/melodic minor modes, symmetric, bebop, world) × 12 roots × 8 tunings (incl. 7-string)
- Position systems: full neck, CAGED (5), 3NPS (7)
- Realistic fretboard: maple (light) / rosewood (dark), real fret spacing, side dots, player's-eye tilt (3D via CSS only)
- Practice modes: **View** (tap to hear, listen to the scale), **Fill** (mark every scale tone, drag to paint, get graded), **Follow** (play the highlighted notes in order)
- **Grip** mode for phones: landscape fullscreen, hold the phone like a neck, multi-touch
- Two guitar tones (clean / distortion) from sampled soundfonts, loaded on demand; synth fallback plays instantly
- English / 한국어 / 日本語
- Everything stays in the browser (settings and practice stats in `localStorage`); no accounts, no tracking, no external requests

## Run

```sh
npm install
npm run dev        # http://127.0.0.1:5173
```

```sh
npm run build      # production build in dist/
npm run preview
npm run e2e        # Playwright (Edge channel)
npm run check      # typecheck + lint + self-checks
```

## Deploy (GitHub Pages)

Pushing to `main` runs `.github/workflows/pages.yml`, which builds with `BASE_PATH=/<repo>/` and publishes `dist/`. In the repository settings set **Pages → Source → GitHub Actions**. For a custom domain, build with `BASE_PATH=/`.

## Stack

Preact · Vite · TypeScript · Web Audio API · vite-plugin-pwa. First load is about 36 KB gzipped (JS + CSS); tone samples are ~190 KB and ~110 KB, fetched only when selected.

## Credits

- Clean tone: FluidR3 GM soundfont (Frank Wen, CC BY 3.0), via WebAudioFont
- Distortion tone: "Aspirin" GM soundfont, via WebAudioFont (original license unverified — see `docs/licenses/Aspirin.md`)
- Icons: Lucide (ISC)
