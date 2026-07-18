variable "cloudflare_account_id" {
  type        = string
  description = "The target Cloudflare Account ID injected at runtime."
  sensitive   = true
}
