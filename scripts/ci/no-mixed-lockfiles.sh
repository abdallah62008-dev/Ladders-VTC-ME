#!/usr/bin/env bash
# D-INFRA-006 enforcement: pnpm is the only allowed package manager.
# CI rejects PRs that introduce npm or yarn lockfiles.
#
# Phase 1 sprint 1 validation fix (2026-05-09):
#   This bash script is retained for GitHub Actions CI (ubuntu-latest,
#   bash is native). The canonical local entry point invoked by
#   `pnpm ci:lockfiles` is the cross-platform Node.js sibling
#   `no-mixed-lockfiles.mjs` — Windows PowerShell does not ship `bash`.
#   Both files implement identical logic and MUST stay in sync.

set -euo pipefail

FOUND=0

if [ -f package-lock.json ]; then
  echo "✗ FORBIDDEN: package-lock.json detected (D-INFRA-006: pnpm only)"
  FOUND=1
fi

if [ -f yarn.lock ]; then
  echo "✗ FORBIDDEN: yarn.lock detected (D-INFRA-006: pnpm only)"
  FOUND=1
fi

if [ ! -f pnpm-lock.yaml ]; then
  echo "✗ MISSING: pnpm-lock.yaml not found (D-INFRA-006: lockfile required)"
  FOUND=1
fi

if [ "$FOUND" -ne 0 ]; then
  echo ""
  echo "Per D-INFRA-006 locked 2026-05-09: pnpm is the standard package manager."
  echo "  - pnpm-lock.yaml MUST be committed."
  echo "  - package-lock.json (npm) and yarn.lock (yarn) MUST NOT exist."
  echo ""
  exit 1
fi

echo "✓ pnpm-only lockfile rule satisfied"
