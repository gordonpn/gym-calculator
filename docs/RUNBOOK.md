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
Credentials and Cloudflare account IDs must **never** be hardcoded in tracked configuration. Create a local environment file:

```bash
cp .env.example .env
```

Edit `.env` with your own values (the API token requires Pages:Edit permissions):

```dotenv
CLOUDFLARE_API_TOKEN="<your_cloudflare_api_token>"
TF_VAR_cloudflare_account_id="<your_cloudflare_account_id>"
```

`.env` and other local `.env*` files are ignored by Git; only the empty `.env.example` template is tracked. For manual OpenTofu commands and before pushing infrastructure changes, export the variables from your trusted local file in a Bash session:

```bash
set -a
source .env
set +a
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

### Automatic Apply (Git Hook)
A Lefthook pre-push hook is configured to automatically run `tofu apply -auto-approve` whenever `.tf` files (like `main.tf` or `variables.tf`) are modified and pushed, provided that `CLOUDFLARE_API_TOKEN` and `TF_VAR_cloudflare_account_id` are exported in the active terminal session using the commands above. The hook also sources `.env`, but bare assignments are not exported to the OpenTofu child process automatically. Its `source` command requires a compatible shell such as Bash. If credentials are not present, it prints a warning and skips the auto-apply to avoid blocking your push.

---

## 3. GitHub Actions CI Pipeline

An automated GitHub Actions workflow ([.github/workflows/ci-cd.yml](../.github/workflows/ci-cd.yml)) is set up to validate changes:

### Workflow Schema
- **On Pull Request & Push (to `main`):** Runs syntax and validation checks (Biome checks, Vitest tests, `tofu validate` with dummy credentials).

Since Cloudflare Pages natively pulls the repository and builds the website, running `tofu apply` in a CI/CD job would require complex remote state sharing (due to state files being local by default). Therefore, platform infrastructure settings in `main.tf` should be updated locally via `tofu apply` when modified.

---

## 4. Application Verification

- **Lint and Code Checks:** Run `pnpm run check` to perform code styling and checks using Biome.
- **Testing:** Run `pnpm test` to execute Vitest unit tests.
- **Wrangler Preview:** To run the Astro application using wrangler locally, run:
  ```bash
  pnpm exec wrangler pages dev ./dist
  ```

---

## 5. Troubleshooting & Existing Projects

### Importing an Existing Cloudflare Pages Project
If you have already configured the Pages project manually on the Cloudflare dashboard, running `tofu apply` may error with a message indicating the project already exists. 

To bring the existing project under OpenTofu's state management, import it:

```bash
tofu import cloudflare_pages_project.gym_calculator "${TF_VAR_cloudflare_account_id}/gym-calculator"
```

### State Lock / Remote State
By default, this local setup uses local state file (`terraform.tfstate`). For production or multi-developer pipelines, it is highly recommended to configure a remote backend (such as Cloudflare R2, AWS S3, or Terraform Cloud) to store the state file securely.
