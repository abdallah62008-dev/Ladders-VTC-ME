#!/usr/bin/env node
// scripts/ci/grep-checks.mjs
//
// Cross-platform Node.js port of grep-checks.sh.
// CI grep tests enforcing locked architectural decisions. Each check has its
// corresponding D-* decision in /docs.
//
// Phase 1 sprint 1 validation fix (2026-05-09):
//   The original .sh version requires bash + find + grep, none of which ship
//   with default Windows PowerShell. This Node version is the canonical local
//   entry point invoked by `pnpm ci:grep`. The shell version is retained for
//   GitHub Actions ubuntu-latest CI; both implement identical logic and MUST
//   stay in sync.
//
// Scope: app/, lib/, components/, middleware.ts. docs/ is intentionally
// excluded — documentation files may legitimately reference forbidden
// patterns (e.g., "do NOT use uuid_generate_v4").

import { readFileSync, statSync, readdirSync, existsSync } from 'node:fs';
import { join, sep } from 'node:path';
import process from 'node:process';

// ─────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────

const SCOPE_ITEMS = ['app', 'lib', 'components', 'middleware.ts'];

// File extensions the scanner reads. Other types (images, lockfiles, etc.) skipped.
const SCAN_EXTENSIONS = /\.(ts|tsx|js|jsx|mjs|cjs|sql|sh|md|json|yaml|yml|css)$/;

// Directories the walker never recurses into. Defense-in-depth — none of
// these should appear under SCOPE_ITEMS anyway, but skip explicitly to
// avoid massive accidental scans.
const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  'out',
  'dist',
  'build',
  'coverage',
  '.git',
  '.pnpm-store',
  'playwright-report',
  'test-results',
]);

// Normalize path separators to forward slashes so allow-pattern regexes
// using `/test`, `/docs`, etc. work identically on Windows and POSIX.
const normalizePath = (p) => p.split(sep).join('/');

let exitCode = 0;

// ─────────────────────────────────────────────────────────────────────────
// File walker
// ─────────────────────────────────────────────────────────────────────────

function* walkFiles(rootPath) {
  let stat;
  try {
    stat = statSync(rootPath);
  } catch {
    return;
  }
  if (stat.isFile()) {
    if (SCAN_EXTENSIONS.test(rootPath)) yield rootPath;
    return;
  }
  if (!stat.isDirectory()) return;
  for (const entry of readdirSync(rootPath, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const path = join(rootPath, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(path);
    } else if (entry.isFile() && SCAN_EXTENSIONS.test(entry.name)) {
      yield path;
    }
  }
}

function* walkScope() {
  for (const item of SCOPE_ITEMS) {
    if (!existsSync(item)) continue;
    yield* walkFiles(item);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Generic check runner — flags lines whose code portion (before `//`)
// matches `pattern`, unless the file path or full line matches `allowPattern`.
// ─────────────────────────────────────────────────────────────────────────

function check({ name, decision, pattern, allowPattern }) {
  console.log(`→ Checking: ${name} (per ${decision})`);
  const hits = [];
  for (const file of walkScope()) {
    const normFile = normalizePath(file);
    if (allowPattern && allowPattern.test(normFile)) continue;
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Strip line comments (`//`) — the architectural rule cares about
      // CODE, not doc-comments referencing the rule. SQL `--` and shell `#`
      // comments are not in scope (migrations/ + scripts/ aren't scanned).
      const commentIdx = line.indexOf('//');
      const codePortion = commentIdx === -1 ? line : line.slice(0, commentIdx);
      if (!pattern.test(codePortion)) continue;
      // Per-line allow-pattern (e.g., `provider_code:`, `MarginSettings`,
      // `numeric(12, 2)`).
      if (allowPattern && allowPattern.test(line)) continue;
      hits.push(`${normFile}:${i + 1}: ${line.trim()}`);
    }
  }
  if (hits.length > 0) {
    console.log(`  ✗ FORBIDDEN pattern found (${decision}):`);
    for (const hit of hits.slice(0, 10)) {
      console.log(`    ${hit}`);
    }
    if (hits.length > 10) {
      console.log(`    … and ${hits.length - 10} more`);
    }
    exitCode = 1;
  } else {
    console.log('  ✓ clean');
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Early exit if no scope items exist (Sprint 1 pre-build fallback).
// ─────────────────────────────────────────────────────────────────────────

const anyScopeExists = SCOPE_ITEMS.some((item) => existsSync(item));
if (!anyScopeExists) {
  console.log(
    'ℹ No app/, lib/, components/ directories or middleware.ts yet (Sprint 1 scaffold pre-build).',
  );
  console.log('  Grep checks will run against future implementation.');
  console.log(
    '  Sprint 1 produces the script + acceptance hooks; Sprint 2+ produces the code surface to scan.',
  );
  process.exit(0);
}

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('  CI grep checks — architectural decision enforcement');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

// ─────────────────────────────────────────────────────────────────────────
// 1. D-PAY-002/003: no literal margin floor values in guardrail-evaluation
//    paths. Floors are configurable data stored in `profit_floor_rule` +
//    cached on `country.business_min_margin numeric(5,4)`. Source code MUST
//    NOT contain literal floor values.
//
//    Locked floor values per /docs/05-payments/02-margin-rules.md:
//      business floor 20% (0.20 / 0.2000)
//      marketer floor 18% (0.18 / 0.1800)
//      high-tier floor 22% (0.22 / 0.2200)
//      override floor  5% (0.05 / 0.0500)
// ─────────────────────────────────────────────────────────────────────────
check({
  name: 'No literal margin values',
  decision: 'D-PAY-002/003',
  pattern:
    /\b0\.2000\b|\b0\.1800\b|\b0\.2200\b|\b0\.0500\b|\b0\.20\b|\b0\.18\b|\b0\.22\b|\b0\.05\b|\b20%|\b18%|\b22%|\b5%/,
  // Stylesheet files (.css/.scss/.sass/.less) legitimately contain bare
  // decimal literals as design tokens (OKLCH chroma, opacity, transform,
  // animation timing). Margin floors are a TypeScript/JS business-logic
  // concern, not a CSS one — skip stylesheets to avoid false positives
  // like `oklch(0.4 0.18 245)` matching the marketer floor literal.
  // The trailing `(:|$)` accepts both the .mjs file-level test (path ends
  // with `.css`) and the .sh line-level test (`path/file.css:LINE:CONTENT`).
  allowPattern:
    /(seed|migration|MarginSettings|\/test|\.test\.|\.spec\.|node_modules|\.(css|scss|sass|less)(:|$))/,
});

// 2. D-COUNTRY-014: no hardcoded country fields (e.g., price_sa, stock_eg).
check({
  name: 'No hardcoded country fields',
  decision: 'D-COUNTRY-014',
  pattern: /(price_(sa|eg|iq)|stock_(sa|eg|iq))\b/,
});

// 3. D-DB-001: no bare order table or quoted "order".
check({
  name: "No bare 'order' table reference",
  decision: 'D-DB-001',
  pattern: /CREATE TABLE\s+order\b|CREATE TABLE\s+"order"|FROM\s+"order"\b|JOIN\s+"order"\b/,
});

// 4. D-DB-002: no uuid_generate_v4 or uuid-ossp.
check({
  name: 'No uuid_generate_v4 / uuid-ossp',
  decision: 'D-DB-002',
  pattern: /uuid_generate_v4|uuid-ossp/,
});

// 5. D-DB-003: no float/double/real/money in money contexts.
//    Permissive heuristic — flags suspicious type annotations; full
//    enforcement happens at migration review against the canonical
//    numeric(12,2) rule.
check({
  name: 'No float/double/real/money in money contexts',
  decision: 'D-DB-003',
  pattern: /(price|cost|amount|fee|total|profit|margin)\s*:\s*(number|float|double|real)\b/,
  allowPattern: /numeric\(12,\s*2\)|\/test|\.test\.|\.spec\./,
});

// 6. D-CSP-002: every admin route file declares country_scope_mode.
//    Different shape from the other checks — this is a "missing required
//    pattern" check rather than a "forbidden pattern" check.
console.log('→ Checking: every admin route declares country_scope_mode (per D-CSP-002)');
const adminRoutes = [];
if (existsSync('app')) {
  for (const file of walkFiles('app')) {
    const norm = normalizePath(file);
    if (norm.includes('/admin/') && norm.endsWith('/page.tsx')) {
      adminRoutes.push(file);
    }
  }
}
const missingScopeMode = [];
for (const route of adminRoutes) {
  let content;
  try {
    content = readFileSync(route, 'utf8');
  } catch {
    continue;
  }
  if (!content.includes('country_scope_mode')) {
    missingScopeMode.push(normalizePath(route));
  }
}
if (missingScopeMode.length > 0) {
  console.log('  ✗ Admin routes missing country_scope_mode declaration:');
  for (const m of missingScopeMode) console.log(`    ${m}`);
  exitCode = 1;
} else {
  console.log(`  ✓ all admin routes declare country_scope_mode (${adminRoutes.length} scanned)`);
}

// 7. D-OPS-010: no hardcoded couriers.
check({
  name: 'No hardcoded courier names',
  decision: 'D-OPS-010',
  pattern: /['"](jt-express|aramex|smsa|bosta|fastbox)['"]/,
  allowPattern: /(seed|migration|\/docs|\/test|\.test\.|\.spec\.|provider_code)/,
});

// 8. D-SAFE-001: no forbidden safety claim phrasings.
check({
  name: 'No forbidden safety claim phrasings',
  decision: 'D-SAFE-001',
  pattern:
    /100% accident-proof|100% safe|completely safe|lifetime guarantee|lifetime warranty|best in market/,
  allowPattern: /(\/docs|\/test|\.test\.|\.spec\.|forbidden|FORBIDDEN)/,
});

// 9. D-COUNTRY-013: no hardcoded ERP provider names.
check({
  name: 'No ERP provider hardcoding',
  decision: 'D-COUNTRY-013',
  pattern: /['"](odoo|netsuite|sap|oracle-erp|dynamics)['"]/,
  allowPattern: /(\/docs|\/test|\.test\.|\.spec\.)/,
});

// ─────────────────────────────────────────────────────────────────────────
// Sprint 2A additions — D-RBAC-001 cost privacy enforcement at source level.
// Reference: /docs/03-rbac/04-cost-privacy.md (9-layer defense-in-depth chain).
//
// Allow-list rationale: the cost-privacy.ts and api-token-scopes.ts modules
// LEGITIMATELY catalogue cost field names + scope names as string constants.
// These files are the canonical source of those names — flagging them would
// be a false positive. Tests legitimately reference the names too.
// ─────────────────────────────────────────────────────────────────────────

// 10. D-RBAC-001: no bare SELECT of cost fields outside finance/test paths.
//     Catches `SELECT actual_cost`, `SELECT marketer_cost`, etc.
check({
  name: 'No bare SELECT of cost fields outside finance/test paths',
  decision: 'D-RBAC-001',
  pattern:
    /(SELECT|select)\s+(actual_cost|marketer_cost|was_actual_cost|cogs|actual_cost_snapshot|business_gross_profit_snapshot)\b/,
  allowPattern:
    /(seed|migration|\/test|\.test\.|\.spec\.|\/docs|node_modules|cost-privacy\.(ts|spec\.ts)|api-token-scopes\.ts|helpers\.ts)/,
});

// 11. D-RBAC-001: no SELECT * on cost-bearing tables (forces explicit columns
//     so RLS-redacted serializers can surface gaps at code review).
check({
  name: 'No SELECT * on cost-bearing tables',
  decision: 'D-RBAC-001',
  pattern:
    /(SELECT|select)\s+\*\s+(FROM|from)\s+(variant_country_cost|variant_marketer_cost|cost_history)\b/,
  allowPattern: /(seed|migration|\/test|\.test\.|\.spec\.|\/docs|node_modules)/,
});

// 12. D-RBAC-001: no console.* logging of cost field values. Logs/observability
//     are Layer 8 of the defense-in-depth chain — Sprint 2B wires actual
//     scrubbers, but Sprint 2A statically blocks the obvious leak vector.
check({
  name: 'No console logging of cost field values',
  decision: 'D-RBAC-001',
  pattern:
    /console\.(log|error|warn|info|debug)\s*\([^)]*\b(actual_cost|marketer_cost|was_actual_cost|cogs|actual_cost_snapshot|business_gross_profit_snapshot)\b/,
  allowPattern:
    /(seed|migration|\/test|\.test\.|\.spec\.|\/docs|node_modules|cost-privacy\.(ts|spec\.ts))/,
});

// ─────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────

console.log('');
if (exitCode === 0) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ✓ All CI grep checks passed');
  console.log('═══════════════════════════════════════════════════════════════');
} else {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ✗ CI grep checks FAILED — fix forbidden patterns above');
  console.log('═══════════════════════════════════════════════════════════════');
}

process.exit(exitCode);
