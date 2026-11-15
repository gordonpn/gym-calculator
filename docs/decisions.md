# Implementation Decisions Log

This document records non-obvious engineering and implementation decisions made in Gym Calculator, ordered newest first.

## 2026-11-14: Read-only Justfile verification recipes matching standard checks

- Decision: Add standard `Justfile` recipes covering `dev`, `build`, `preview`, `lint`, `format`, `test`, `typecheck`, `check`, and `verify`, keeping `just check` strictly read-only even though the underlying `pnpm` check script mutates files.
- Rationale: Match personal repository task-runner conventions and prevent verification commands from silently rewriting source files during CI or pre-commit checks.
- Rejected alternatives: Wrapping the mutating `pnpm check` script directly as the read-only verification gate.
- Source: [#59 chore(tooling): add standard just recipes](https://github.com/gordonpn/gym-calculator/pull/59), [#46 tooling: adopt Justfile task runner matching repository standards](https://github.com/gordonpn/gym-calculator/issues/46)

## 2026-11-14: Service worker skipWaiting bounded inside install event.waitUntil

- Decision: Register `skipWaiting()` inside `event.waitUntil()` alongside shell precaching during service worker installation instead of calling it outside the install lifetime promise.
- Rationale: Ensure the service worker installation lifecycle waits for both shell precaching and `skipWaiting()` completion reliably.
- Rejected alternatives: Calling `skipWaiting()` unawaited outside `event.waitUntil()`.
- Source: [#56 fix(sw): await skipWaiting during service worker installation](https://github.com/gordonpn/gym-calculator/pull/56), [#34 fix(sw): properly await skipWaiting in service worker install event](https://github.com/gordonpn/gym-calculator/issues/34)

## 2026-11-14: Clear stale rep-max row estimates before filtering valid rows

- Decision: Clear each row's estimated one-rep maximum before filtering and recomputing valid rows when workout inputs change.
- Rationale: Prevent previously computed estimates from lingering when an existing row becomes invalid or when the last valid row is cleared.
- Rejected alternatives: Not recorded in the source.
- Source: [#52 fix(state): clear stale rep-max estimates when rows become invalid](https://github.com/gordonpn/gym-calculator/pull/52), [#32 fix(state): reset stale estimatedMax when set inputs become invalid](https://github.com/gordonpn/gym-calculator/issues/32)

## 2026-11-14: Bodyweight zero-bar handling, single-sided plate optimization, and duplicate plate aggregation

- Decision: Use zero bar weight and single-sided plate optimization for weighted bodyweight exercises (supporting 0 lbs added bodyweight targets), handle `numSets === 1` and unreachable optimizer backtracking safely, reject non-finite numeric inputs, and combine duplicate plate weights while preserving malformed-entry checks.
- Rationale: Model belt/vest loading accurately instead of forcing two-sided 45 lb barbell assumptions and eliminate division-by-zero and duplicate-inventory calculation errors.
- Rejected alternatives: Not recorded in the source.
- Source: [#54 fix(calculator): validate finite inputs and combine duplicate plate inventories](https://github.com/gordonpn/gym-calculator/pull/54), [#53 fix(warmup): handle edge cases and single-sided bodyweight loading](https://github.com/gordonpn/gym-calculator/pull/53), [#20](https://github.com/gordonpn/gym-calculator/issues/20), [#21](https://github.com/gordonpn/gym-calculator/issues/21), [#22](https://github.com/gordonpn/gym-calculator/issues/22), [#23](https://github.com/gordonpn/gym-calculator/issues/23)

## 2026-11-13: Environment-based Cloudflare deployment examples and tracked .env.example

- Decision: Replace hardcoded Cloudflare account identifiers in deployment documentation with generic environment variable examples, track an empty `.env.example`, and document pre-push hook shell and OpenTofu state requirements alongside `.terraform.lock.hcl` tracking.
- Rationale: Keep repository documentation free of account-specific identifiers while making Cloudflare Pages and OpenTofu deployments reproducible.
- Rejected alternatives: Hardcoding account IDs in repository documentation.
- Source: [#60 docs: document safe Cloudflare deployment setup](https://github.com/gordonpn/gym-calculator/pull/60), [#36](https://github.com/gordonpn/gym-calculator/issues/36), [#38](https://github.com/gordonpn/gym-calculator/issues/38), [#37](https://github.com/gordonpn/gym-calculator/issues/37)

## 2026-10-18: SHA-pinned GitHub Actions and automated CodeQL/Reviewdog/AI review gates

- Decision: Pin third-party GitHub Actions (`pnpm/action-setup`, `opentofu/setup-opentofu`) to immutable commit SHAs, restore valid first-party action major tags (`@v4`), and add CodeQL, Reviewdog/Biome, DeepSeek-Review, and PR-Agent workflows.
- Rationale: Prevent supply-chain drift from mutable tags and automate security, lint, and PR review checks consistently with sibling personal repositories.
- Rejected alternatives: Relying on floating version tags for third-party actions.
- Source: [#47 ci: add CodeQL, Reviewdog, DeepSeek-Review, and PR-Agent workflows](https://github.com/gordonpn/gym-calculator/pull/47), [#40 fix(ci): restore valid GitHub Action versions and pin third-party actions](https://github.com/gordonpn/gym-calculator/pull/40), [#16](https://github.com/gordonpn/gym-calculator/issues/16)
