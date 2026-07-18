# Project Preferences & Established Workflows

## Infrastructure as Code (IaC)
- **Terraform Variable Usage:** Avoid hardcoding Cloudflare credentials or account IDs as placeholders in `main.tf`. Declare them as input variables (e.g., `cloudflare_account_id`) to keep configuration generic and secure.
- **Local Validation:** Use OpenTofu (`tofu fmt`, `tofu init`, and `tofu validate`) for local Terraform validation when needed.
- **Git Ignore Rules:** Always ensure `.terraform/`, `*.tfstate`, and `.terraform.lock.hcl` are added to `.gitignore` when initializing Terraform/OpenTofu configurations.
