#!/usr/bin/env node
// D-INFRA-006 enforcement: pnpm is the only allowed package manager.
// Cross-platform Node.js port of no-mixed-lockfiles.sh — invoked by `pnpm ci:lockfiles`.
//
// Phase 1 sprint 1 validation fix (2026-05-09):
//   The original shell version (no-mixed-lockfiles.sh) requires `bash`,
//   which is not available on default Windows PowerShell. This Node version
//   is the canonical local entry point. The shell version is retained for
//   GitHub Actions CI (ubuntu-latest, where bash is native) — both implement
//   identical logic and must stay in sync.
//
// CI rejects PRs that introduce npm or yarn lockfiles.

import { existsSync } from 'node:fs';
import process from 'node:process';

let invalid = 0;

if (existsSync('package-lock.json')) {
  console.error('✗ FORBIDDEN: package-lock.json detected (D-INFRA-006: pnpm only)');
  invalid = 1;
}

if (existsSync('yarn.lock')) {
  console.error('✗ FORBIDDEN: yarn.lock detected (D-INFRA-006: pnpm only)');
  invalid = 1;
}

if (!existsSync('pnpm-lock.yaml')) {
  console.error('✗ MISSING: pnpm-lock.yaml not found (D-INFRA-006: lockfile required)');
  invalid = 1;
}

if (invalid) {
  console.error('');
  console.error('Per D-INFRA-006 locked 2026-05-09: pnpm is the standard package manager.');
  console.error('  - pnpm-lock.yaml MUST be committed.');
  console.error('  - package-lock.json (npm) and yarn.lock (yarn) MUST NOT exist.');
  console.error('');
  process.exit(1);
}

console.log('✓ pnpm-only lockfile rule satisfied');
process.exit(0);
