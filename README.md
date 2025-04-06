# Gym Calculator

## Description

A simple web application for calculating gym warm-up sets and plate configurations based on your target weight.

The twist is that this calculator includes an option to optimize for minimal plate changes!

## Development

### Tech stack

* Bun - Runtime
* Vite - Build tool
* pnpm - Package manager
* Bootstrap 5 - CSS framework
* Alpine.js - Lightweight JavaScript framework

### Run local server

```bash
pnpm run bun-dev
```

### Todo

* [x] Improve warm-up table to include reps
* [x] Improve on formulas: allow a custom formula where the user can specify how many warm-up sets they want
* [x] Implement dark mode
* [x] Add footer information
* [x] Add option to optimize for minimal plate changes
* [ ] Add TypeScript tooling
* [ ] Add Biome for linting and formatting
* [ ] Add lefthook for pre-commit hooks
* [ ] Add PostCSS for CSS optimizations
* [x] Add section to display the working set plate configuration
* [x] Add colours to the plate badges to make it easily distinguishable
* [ ] Add option to warm-up to weighted bodyweight exercises
