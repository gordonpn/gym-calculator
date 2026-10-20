# Project Execution Queue

- **Last Refined:** 2026-10-20T10:30:00-04:00
- **Repository:** gordonpn/gym-calculator
- **GitHub Backlog:** [Open Issues](https://github.com/gordonpn/gym-calculator/issues)

---

## NOW: Recommended Next Task

### [#18: chore(tooling): add stage_fixed to Lefthook and track .terraform.lock.hcl in git and AGENTS.md](https://github.com/gordonpn/gym-calculator/issues/18)

- **Priority:** P1
- **Effort:** XS
- **Estimate Confidence:** High
- **Readiness:** READY
- **Dependencies:** None
- **Why this task is next:**
  Fixes developer and agent commit integrity immediately. Currently, when Lefthook executes `biome check --write` on pre-commit, auto-formatted files are left unstaged and uncommitted. In addition, `.terraform.lock.hcl` is ignored by both `.gitignore` and `AGENTS.md`, conflicting with OpenTofu deterministic provider locking standards. Consolidates and resolves #37.
- **First implementation action:**
  Edit `lefthook.yml` to add `stage_fixed: true` under the `lint` job, then update `.gitignore` to track `.terraform.lock.hcl` and ignore sensitive/temporary files (`*.tfvars`, `crash.log`, `*.tfstate.lock.info`).
- **Definition of Done:**
  - `lefthook.yml` contains `stage_fixed: true` on the pre-commit lint hook.
  - `.gitignore` allows `.terraform.lock.hcl` to be tracked while excluding `.terraform/`, `*.tfstate*`, `*.tfvars`, and crash logs.
  - `AGENTS.md` instructs agents to track `.terraform.lock.hcl` for provider reproducibility.
  - Staged auto-fixes are automatically committed by Lefthook without manual re-staging.
- **Tasks it unblocks:**
  Prevents unstaged lint drift for all subsequent task commits and unblocks completing Epic #15 alongside #17.

---

## NEXT: Upcoming Work

1. **[#17: chore(ci): configure workflow permissions, concurrency, timeouts, and Node 24 actions](https://github.com/gordonpn/gym-calculator/issues/17)**
   - **Priority:** P1 | **Effort:** S | **Confidence:** High | **Readiness:** READY
   - **Dependencies:** None (can run in parallel with #18)
   - **Reason for execution order:** Completes Epic #15. Eliminates broad default token permissions, cancels redundant branch CI runs, enforces a 15-minute runner timeout, and upgrades `checkout` and `setup-node` to Node 24-supported SHAs.

2. **[#46: tooling: adopt Justfile task runner matching repository standards](https://github.com/gordonpn/gym-calculator/issues/46)**
   - **Priority:** P1 | **Effort:** S | **Confidence:** High | **Readiness:** READY
   - **Dependencies:** None
   - **Reason for execution order:** Standardizes local build and verification entry points (`just check`, `just test`, `just dev`, `just build`) matching engineering rules across repositories.

3. **[#30: fix(alpine): avoid persisting default system theme to localStorage on initial load](https://github.com/gordonpn/gym-calculator/issues/30)**
   - **Priority:** P1 | **Effort:** XS | **Confidence:** High | **Readiness:** READY
   - **Dependencies:** None
   - **Reason for execution order:** High-impact client runtime bug fix. Currently, initial page load auto-persists the resolved theme to `localStorage`, permanently breaking OS dark/light mode responsiveness for all visitors.

4. **[#20: fix(warmup): resolve numSets=1 division-by-zero and DP backtracking predecessor bug](https://github.com/gordonpn/gym-calculator/issues/20)**
   - **Priority:** P1 | **Effort:** S | **Confidence:** High | **Readiness:** READY
   - **Dependencies:** None
   - **Reason for execution order:** Critical calculation bug fix. Resolves `NaN` calculation results when `numSets=1` and prevents `TypeError` when dynamic programming backtracking encounters unreachable predecessors.

5. **[#23: fix(calculator): allow 0 lbs target weight for weighted bodyweight exercises](https://github.com/gordonpn/gym-calculator/issues/23)**
   - **Priority:** P1 | **Effort:** XS | **Confidence:** High | **Readiness:** READY
   - **Dependencies:** None
   - **Reason for execution order:** High-impact calculation defect. Fixes bodyweight exercises with 0 lbs added load incorrectly claiming a 45 lbs barbell weight.

---

## BLOCKERS

- **None:** All tasks in NOW and NEXT are unblocked and ready for immediate implementation.
- **Repository Secret Verification:** `DEEPSEEK_API_KEY` is referenced by workflows `.github/workflows/deepseek-review.yml` and `.github/workflows/pr-agent.yml`. While the workflows gracefully skip when the secret is absent, setting the secret in repository settings is required for automated AI reviews to run.

---

## LATER

All remaining tasks are prioritized and tracked in GitHub Issues:
- **Core Calculation Engine (Epic #19):** [#21](https://github.com/gordonpn/gym-calculator/issues/21), [#22](https://github.com/gordonpn/gym-calculator/issues/22)
- **Client State & Storage Resilience (Epic #29):** [#31](https://github.com/gordonpn/gym-calculator/issues/31), [#32](https://github.com/gordonpn/gym-calculator/issues/32)
- **Type Safety & Code Quality:** [#48](https://github.com/gordonpn/gym-calculator/issues/48) (Replace 7 explicit `any` occurrences)
- **UI & Web Accessibility (Epic #24 & #33):** [#25](https://github.com/gordonpn/gym-calculator/issues/25), [#26](https://github.com/gordonpn/gym-calculator/issues/26), [#27](https://github.com/gordonpn/gym-calculator/issues/27), [#28](https://github.com/gordonpn/gym-calculator/issues/28), [#34](https://github.com/gordonpn/gym-calculator/issues/34), [#35](https://github.com/gordonpn/gym-calculator/issues/35)
- **Documentation & Operations:** [#36](https://github.com/gordonpn/gym-calculator/issues/36), [#38](https://github.com/gordonpn/gym-calculator/issues/38)
- **Dependencies & Supply Chain:** [#49](https://github.com/gordonpn/gym-calculator/issues/49) (Remove dead `bootstrap-icons`), [#50](https://github.com/gordonpn/gym-calculator/issues/50) (Remediate 29 `pnpm audit` vulnerabilities)
- **Testing & Deferred Infrastructure:** [#45](https://github.com/gordonpn/gym-calculator/issues/45) (Coverage reporting), [#39](https://github.com/gordonpn/gym-calculator/issues/39) (Cloudflare R2 remote state backend, Deferred)
