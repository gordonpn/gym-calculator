# Gym Calculator

A web app for planning warm-up sets, estimating rep maxes, and checking strength level standards.

## Features

### Warm-up calculator

Journey-based warm-up routines are selected from:

- **Barbell (pre-climbing / cold):** empty bar × 15, 50% × 5, 75% × 3, top set
- **Barbell (post-climbing / warm):** empty bar × 10, 60% × 4, top set
- **Dumbbell (pre-climbing / Rule of 3):** 50% × 12, 75% × 6, top set
- **Dumbbell (post-climbing / Energy Saver):** 50% × 8, top set
- **Weighted bodyweight (pre-climbing):** bodyweight × 8, ~50% added load × 3, top set
- **Weighted bodyweight (post-climbing):** bodyweight × 5, top set

Warm-up settings include:

- Bar weight selection (`0` to `45` lbs in 5-lb steps)
- Available plate toggles (`55`, `45`, `35`, `25`, `15`, `10`, `5`, `2.5`, `1`, `0.75`, `0.5`, `0.25`)
- Optional plate-change minimization (barbell mode)
- Optional backoff set with configurable percentage
- Increment/decrement controls for target weight

### Rep max calculator

- Enter one or more weight/reps sets
- Automatic formula selection per set:
  - **Epley** for reps `<= 10`
  - **Brzycki** for reps `11-30`
- 1RM combination modes: `average`, `highest`, `lowest`, `weighted` (weighted by `weight × reps`)
- Rep-range projection for reps `1-15`
- Apply a projected RM value directly to warm-up target weight

### Strength level checker

- Estimates 1RM from one or more sets using the same Epley/Brzycki logic and combination modes
- Compares against bodyweight-relative standards for:
  - Back Squat
  - Bench Press
  - Bent Over Barbell Row
  - Deadlift
  - Overhead Press
  - Barbell Lunge
  - Dip
  - Romanian Deadlift
- Shows current level (`Untrained` → `Elite`) and next target milestone

## Data persistence (localStorage)

The app stores user preferences locally in the browser:

- `plateSettings`: warm-up settings (session timing, equipment type, bar weight, plate availability, plate-change optimization, bodyweight, backoff options)
- `repMaxCalculationMethod`: selected 1RM aggregation method in Rep Max Calculator
- `strengthLevelSettings`: bodyweight, selected lift, and calculation method in Strength Level Checker
- `theme`: light/dark selection

No backend storage is used.

## Tech stack

- **Astro**
- **Alpine.js**
- **Bootstrap 5** + **Bootstrap Icons**
- **TypeScript**
- **Biome**
- **Lefthook**
- **pnpm**

## PWA / offline

- Includes `manifest.webmanifest`
- Registers a service worker (`public/sw.js`)
- Caches core app shell assets and serves cached fallback when offline

## Development

### Prerequisites

- Node.js `>= 23.11.0`
- pnpm `>= 8.7.1`

### Commands

```bash
pnpm install
pnpm run dev
pnpm run build
pnpm run preview
pnpm run check
```

## Project structure

```text
src/
├── alpine.ts
├── components/
│   ├── calculator.ts
│   ├── repMaxCalculator.ts
│   ├── strengthLevelCalculator.ts
│   ├── util.ts
│   └── warmup-formulas.ts
├── layouts/
│   └── Layout.astro
├── pages/
│   └── index.astro
└── styles/
    └── style.css
```

## License

MIT — see [LICENSE.md](LICENSE.md)
