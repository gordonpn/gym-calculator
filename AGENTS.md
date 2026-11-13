# Project Preferences & Established Workflows

## Infrastructure as Code (IaC)
- **Terraform Variable Usage:** Avoid hardcoding Cloudflare credentials or account IDs as placeholders in `main.tf`. Declare them as input variables (e.g., `cloudflare_account_id`) to keep configuration generic and secure.
- **Local Validation:** Use OpenTofu (`tofu fmt`, `tofu init`, and `tofu validate`) for local Terraform validation when needed.
- **Git Ignore Rules:** Ignore `.terraform/`, `*.tfstate*`, `*.tfvars`, and `crash.log` when initializing Terraform/OpenTofu configurations. Track `.terraform.lock.hcl` in version control for reproducible provider selections.
- **Operations Runbook:** Operational procedures, environment configuration, and pipeline secrets are documented in [docs/RUNBOOK.md](file:///Users/gordonpn/workspace/gym-calculator/docs/RUNBOOK.md).
- **Lefthook Auto-Apply:** A pre-push hook in `lefthook.yml` automates running `tofu apply -auto-approve` whenever `.tf` files are being pushed, running only if Cloudflare API credentials are set in the shell session.
