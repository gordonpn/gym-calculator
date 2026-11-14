# Gym Calculator

A PWA for planning warm-up sets, estimating rep maxes, and checking strength level standards.

## Features

### Warm-up calculator

Journey-based warm-up routines selected from six formulas across three equipment types (barbell, dumbbell, weighted bodyweight) and two session timings (fresh / warmed up). Includes configurable plate presets, automatic plate-change minimization, optional backoff sets, and increment/decrement controls.

### Rep max calculator

Enter one or more weight/reps sets. Combines estimates via average, highest, lowest, or weighted aggregation. Projects weights for rep ranges 1–15 and can apply any RM value directly to the warm-up target.

### Strength level checker

Compares estimated 1RM against bodyweight-relative standards for eight lifts (Back Squat, Bench Press, Bent Over Row, Deadlift, Overhead Press, Barbell Lunge, Dip, Romanian Deadlift). Shows current level and the next milestone target.

## Tech stack

- **Astro 7** — static site generation
- **Alpine.js 3** — client-side reactivity
- **Bootstrap 5** — tree-shaken SCSS (only components used)
- **Inline SVGs** — 9 icons, no icon font
- **TypeScript** — strict mode
- **Biome 2** — linting and formatting
- **Vitest 4** — unit testing
- **Lefthook 2** — git hooks

## Development

### Prerequisites

- Node.js `>= 22.0.0`
- pnpm `>= 9.0.0`

### Commands

```bash
pnpm install
pnpm run dev      # start dev server
pnpm run build    # production build
pnpm run preview  # preview built output
pnpm run check    # biome lint + format
pnpm test         # run unit tests
```

### Task runner

Install [just](https://just.systems/man/en/packages.html) to use the optional recipe shortcuts. Run `pnpm install` first, then `just --list` to see all recipes.

| Recipe | Purpose |
| --- | --- |
| `just dev` | Start the development server |
| `just build` / `just preview` | Build / preview the production site |
| `just lint` | Check lint rules |
| `just format` / `just check-format` | Write formatting / check formatting |
| `just test` | Run unit tests |
| `just typecheck` | Check TypeScript and Astro component types |
| `just check` | Check lint, formatting, and imports without changing files |
| `just verify` | Run checks, typecheck, tests, and build |

`just check` is read-only. The existing `pnpm run check` script applies Biome fixes, including unsafe fixes.

## Project structure

```text
src/
├── alpine.ts                      # Alpine.js plugin init + theme toggle
├── components/
│   ├── calculator.ts              # Warm-up calculator Alpine component
│   ├── oneRepMax.ts               # Epley/Brzycki 1RM formulas
│   ├── presetStorage.ts           # Plate preset localStorage persistence
│   ├── repMaxCalculator.ts        # Rep max calculator Alpine component
│   ├── strengthLevelCalculator.ts # Strength level checker Alpine component
│   ├── util.ts                    # Shared utilities (debounce, rounding)
│   ├── warmup-formulas.ts         # All 10 formula functions + plate optimizer
│   ├── Icon.astro                 # Inline SVG icon component
│   ├── PlateBadges.astro          # Shared plate badge rendering
│   ├── PlateSettingsModal.astro   # Warm-up settings modal
│   ├── RepMaxCalculatorModal.astro
│   └── StrengthLevelModal.astro
├── layouts/
│   └── Layout.astro
├── pages/
│   └── index.astro
└── styles/
    ├── bootstrap.scss             # Tree-shaken Bootstrap SCSS
    └── style.css                  # Custom styles
tests/
├── calculator.test.ts
├── oneRepMax.test.ts
├── presetStorage.test.ts
├── repMaxCalculator.test.ts
├── util.test.ts
└── warmup-formulas.test.ts
```

## Data persistence

All user preferences are stored in `localStorage`. No backend or network calls.

## PWA

Includes a service worker with cache-first strategy for static assets and network-first fallback for navigation requests, making the app available offline after first visit.

## Infrastructure & Deployment

Cloudflare Pages builds and hosts the static site from the linked GitHub repository (`main` is production), running `pnpm run build` and publishing `dist/`. OpenTofu manages the Pages project and repository linkage through `main.tf` and `variables.tf`.

For infrastructure administration, install OpenTofu and copy [`.env.example`](.env.example) to `.env`, then fill in your Cloudflare API token and account ID. Local `.env` files contain secrets and must remain untracked.

Before pushing infrastructure changes, export the credentials in a Bash session using the runbook’s `set -a`, `source .env`, and `set +a` commands. The Lefthook pre-push hook also sources `.env`, but plain assignments in that file are not exported to its OpenTofu child process automatically. The hook uses shell-specific `source` syntax, so it requires a compatible shell. It automatically runs `tofu apply -auto-approve` when pushing `.tf` changes if both credentials are available; otherwise it warns and skips the apply. Review infrastructure plans before pushing these changes.

The current local state is for a single canonical checkout and operator. A shared
backend with locking and serialized applies is required before multiple operators
or pipelines manage the same infrastructure.

See the [operations runbook](docs/RUNBOOK.md) for setup, validation, planning, applying, imports, and local state management.

## License

MIT — see [LICENSE.md](LICENSE.md)
