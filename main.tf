terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "cloudflare" {
  # Configuration options are supplied via environment variables like CLOUDFLARE_API_TOKEN
}

resource "cloudflare_pages_project" "gym_calculator" {
  account_id        = var.cloudflare_account_id
  name              = "gym-calculator"
  production_branch = "main"

  build_config {
    build_command   = "pnpm run build"
    destination_dir = "dist"
    root_dir        = ""
  }

  source {
    type = "github"
    config {
      owner               = "gordonpn"
      repo_name           = "gym-calculator"
      production_branch   = "main"
      pr_comments_enabled = true
      deployments_enabled = true
    }
  }

  deployment_configs {
    production {
      compatibility_date = "2025-03-31"
      fail_open          = true
    }
    preview {
      compatibility_date = "2025-03-31"
      fail_open          = true
    }
  }
}
