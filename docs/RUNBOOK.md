# Operations Runbook: Gym Calculator Infrastructure

This runbook outlines how to operate, validate, and deploy both the application configuration and cloud infrastructure for the Gym Calculator.

---

## 1. Architecture Overview

Gym Calculator uses a two-pillar Infrastructure as Code (IaC) model:

- **Pillar 1 (Application Runtime):** Managed via `wrangler.toml` in the project root. Defines local development, production build directories, and the compatibility date.
- **Pillar 2 (Cloud Resources):** Managed via OpenTofu in `main.tf` and `variables.tf`. This provisions the Cloudflare Pages workspace, establishes the GitHub repository link, and handles builds.

---

## 2. Local Administration & CLI Operations

All local platform-level commands should be run using OpenTofu (`tofu`).

### Prerequisites
- **OpenTofu** (Installed via `brew install opentofu` on macOS)
- **pnpm & Node.js** (Active workspace setup)

### Environment Variable Setup
Plaintext credentials or Cloudflare account IDs must **never** be hardcoded. Inject them into your terminal session before operating:

```bash
# Set your target Cloudflare Account ID
export TF_VAR_cloudflare_account_id="75520e73ba21df12b124d81e80ad29c1"

# Set your Cloudflare API Token (requires Pages:Edit permissions)
export CLOUDFLARE_API_TOKEN="your_cloudflare_api_token"
```

### Running IaC Commands

1. **Initialization:** Prepare the local backend and download required provider packages.
   ```bash
   tofu init
   ```

2. **Validation:** Check the configuration for syntax and schema correctness.
   ```bash
   tofu validate
   ```

3. **Format Check:** Keep structural configurations clean and correctly indented.
   ```bash
   tofu fmt
   ```

4. **Planning Changes:** Preview execution changes before altering live platform state.
   ```bash
   tofu plan
   ```

5. **Applying Infrastructure:** Deploys and updates the Cloudflare Page configuration.
   ```bash
   tofu apply
   ```

---

## 3. GitHub Actions CI/CD Pipeline

A unified GitHub Actions workflow ([.github/workflows/ci-cd.yml](file:///Users/gordonpn/workspace/gym-calculator/.github/workflows/ci-cd.yml)) is set up to automate checks and deployments on changes:

### Workflow Schema
- **On Pull Request (to `main`):** Runs syntax and validation checks (Biome checks, Vitest tests, `tofu validate`).
- **On Push (to `main`):** Performs all verification checks first, then runs `tofu apply -auto-approve` to synchronize changes with Cloudflare.

### Required Secrets
To make the pipeline work, the following secrets must be added to the GitHub repository (**Settings > Secrets and variables > Actions**):

| Secret Name | Description | Example / Format |
| :--- | :--- | :--- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare target account ID | Hexadecimal string (e.g., `75520e73...`) |
| `CLOUDFLARE_API_TOKEN` | API token with Cloudflare Pages editing permissions | Secret token string |

---

## 4. Application Verification

- **Lint and Code Checks:** Run `pnpm run check` to perform code styling and checks using Biome.
- **Testing:** Run `pnpm test` to execute Vitest unit tests.
- **Wrangler Preview:** To run the Astro application using wrangler locally, run:
  ```bash
  pnpm exec wrangler pages dev ./dist
  ```
