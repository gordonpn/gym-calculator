#!/usr/bin/env bash
set -euo pipefail

pnpm biome check --reporter=rdjson |
  reviewdog -f=rdjson -name="Biome" -reporter=github-pr-review -fail-level=error
