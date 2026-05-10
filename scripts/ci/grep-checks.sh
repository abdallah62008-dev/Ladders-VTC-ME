#!/usr/bin/env bash
# CI grep tests enforcing locked architectural decisions.
# Each check has its corresponding D-* decision in /docs.
#
# Phase 1 sprint 1 review fix (2026-05-09):
#   - Comment-skip uses ERE consistently (grep -vE) and wraps $pattern in parens
#     so multi-alternation patterns are skip-tested as a whole.
#   - D-PAY-002/003 margin literal pattern broadened to catch common alternative
#     spellings: 0.20, 0.2, 0.18, 0.22, 0.05, 4-decimal forms, and percent forms.
#   - Early-exit scope check aligned with the SCOPE variable.
#
# Phase 1 sprint 1 validation fix (2026-05-09):
#   This bash script is retained for GitHub Actions CI (ubuntu-latest, where
#   bash + find + grep are native). The canonical local entry point invoked by
#   `pnpm ci:grep` is the cross-platform Node.js sibling `grep-checks.mjs` —
#   Windows PowerShell does not ship `bash`. Both files implement identical
#   logic and MUST stay in sync.
#
# Allow-list: docs/, migrations/, scripts/ci/, comments — checks scope to app/
# and lib/ source paths primarily. docs/ is excluded by NOT being in SCOPE.

set -uo pipefail

EXIT_CODE=0
SCOPE="app lib components middleware.ts"

check() {
  local name="$1"
  local pattern="$2"
  local decision="$3"
  local allow_pattern="${4:-}"

  echo "→ Checking: $name (per $decision)"

  # Skip files / directories that don't exist (silenced via 2>/dev/null).
  # Both filter greps use ERE (-E) so `$pattern` with `|` alternation is
  # treated consistently. Wrap `$pattern` in parens for the comment-skip
  # so the alternation is bounded relative to the `//.*` prefix.
  local matches
  matches=$(grep -rEn "$pattern" $SCOPE 2>/dev/null \
    | grep -vE "^Binary file" \
    | grep -vE "^[^:]*:[^:]*:.*//.*($pattern)" \
    || true)

  if [ -n "$allow_pattern" ]; then
    matches=$(echo "$matches" | grep -vE "$allow_pattern" || true)
  fi

  if [ -n "$matches" ]; then
    echo "  ✗ FORBIDDEN pattern found ($decision):"
    echo "$matches" | head -10 | sed 's/^/    /'
    EXIT_CODE=1
  else
    echo "  ✓ clean"
  fi
}

# Early exit if NONE of the scoped paths exist yet (sprint 1 pre-build).
# Aligned with SCOPE: app/, lib/, components/, middleware.ts.
if [ ! -d "app" ] && [ ! -d "lib" ] && [ ! -d "components" ] && [ ! -f "middleware.ts" ]; then
  echo "ℹ No app/, lib/, components/ directories or middleware.ts yet (Sprint 1 scaffold pre-build)."
  echo "  Grep checks will run against future implementation."
  echo "  Sprint 1 produces the script + acceptance hooks; Sprint 2+ produces the code surface to scan."
  exit 0
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  CI grep checks — architectural decision enforcement"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 1. D-PAY-002/003: no literal margin floor values in guardrail-evaluation paths.
# Margin floors are configurable data stored in `profit_floor_rule` + cached
# on `country.business_min_margin numeric(5,4)`. Source code MUST NOT contain
# literal floor values.
#
# Locked floor values per /docs/05-payments/02-margin-rules.md:
#   business floor 20% (0.20 / 0.2000)
#   marketer floor 18% (0.18 / 0.1800)
#   high-tier floor 22% (0.22 / 0.2200)
#   override floor  5% (0.05 / 0.0500)
#
# Pattern catches common spellings: bare decimals, 4-decimal forms, percent forms.
# Allow-list excludes seed/migration/test/MarginSettings + .ts/.tsx test files.
# Stylesheet files (.css/.scss/.sass/.less) legitimately contain bare
# decimal literals as design tokens (OKLCH chroma, opacity, transform,
# animation timing). Margin floors are a TypeScript/JS business-logic
# concern — skip stylesheets to avoid false positives like
# `oklch(0.4 0.18 245)` matching the marketer floor literal.
check "No literal margin values" \
  "(\b0\.2000\b|\b0\.1800\b|\b0\.2200\b|\b0\.0500\b|\b0\.20\b|\b0\.18\b|\b0\.22\b|\b0\.05\b|\b20%|\b18%|\b22%|\b5%)" \
  "D-PAY-002/003" \
  "(seed|migration|MarginSettings|/test|\.test\.|\.spec\.|node_modules|\.(css|scss|sass|less)(:|$))"

# 2. D-COUNTRY-014: no hardcoded country fields (e.g., price_sa, stock_eg).
check "No hardcoded country fields" \
  "(price_(sa|eg|iq)|stock_(sa|eg|iq))\b" \
  "D-COUNTRY-014"

# 3. D-DB-001: no bare order table or quoted "order".
check "No bare 'order' table reference" \
  "(CREATE TABLE\s+order\b|CREATE TABLE\s+\"order\"|FROM\s+\"order\"\b|JOIN\s+\"order\"\b)" \
  "D-DB-001"

# 4. D-DB-002: no uuid_generate_v4 or uuid-ossp.
check "No uuid_generate_v4 / uuid-ossp" \
  "(uuid_generate_v4|uuid-ossp)" \
  "D-DB-002"

# 5. D-DB-003: no float/double/real/money for monetary columns.
# (Permissive heuristic — flags suspicious type annotations; full enforcement
# happens at migration review against the canonical numeric(12,2) rule.)
check "No float/double/real/money in money contexts" \
  "(price|cost|amount|fee|total|profit|margin)\s*:\s*(number|float|double|real)\b" \
  "D-DB-003" \
  "(numeric\(12,\s*2\)|/test|\.test\.|\.spec\.)"

# 6. D-CSP-002: every admin route file declares country_scope_mode.
echo "→ Checking: every admin route declares country_scope_mode (per D-CSP-002)"
ADMIN_ROUTES=$(find app -path "*admin*" -name "page.tsx" 2>/dev/null || true)
MISSING_ROUTES=""
for route in $ADMIN_ROUTES; do
  if ! grep -q "country_scope_mode" "$route" 2>/dev/null; then
    MISSING_ROUTES="$MISSING_ROUTES\n  $route"
  fi
done
if [ -n "$MISSING_ROUTES" ]; then
  echo "  ✗ Admin routes missing country_scope_mode declaration:"
  echo -e "$MISSING_ROUTES"
  EXIT_CODE=1
else
  echo "  ✓ all admin routes declare country_scope_mode"
fi

# 7. D-OPS-010: no hardcoded couriers.
check "No hardcoded courier names" \
  "['\"](jt-express|aramex|smsa|bosta|fastbox)['\"]" \
  "D-OPS-010" \
  "(seed|migration|/docs|/test|\.test\.|\.spec\.|provider_code)"

# 8. D-SAFE-001: no forbidden safety claim phrasings.
check "No forbidden safety claim phrasings" \
  "(100% accident-proof|100% safe|completely safe|lifetime guarantee|lifetime warranty|best in market)" \
  "D-SAFE-001" \
  "(/docs|/test|\.test\.|\.spec\.|forbidden|FORBIDDEN)"

# 9. D-COUNTRY-013: no hardcoded ERP provider names.
check "No ERP provider hardcoding" \
  "['\"](odoo|netsuite|sap|oracle-erp|dynamics)['\"]" \
  "D-COUNTRY-013" \
  "(/docs|/test|\.test\.|\.spec\.)"

# ─────────────────────────────────────────────────────────────────────────
# Sprint 2A additions — D-RBAC-001 cost privacy enforcement at source level.
# Reference: /docs/03-rbac/04-cost-privacy.md (9-layer defense-in-depth chain).
#
# Allow-list rationale: cost-privacy.ts + api-token-scopes.ts modules
# LEGITIMATELY catalogue cost field names as string constants — they are the
# canonical source. Flagging them would be a false positive.
# ─────────────────────────────────────────────────────────────────────────

# 10. D-RBAC-001: no bare SELECT of cost fields outside finance/test paths.
check "No bare SELECT of cost fields outside finance/test paths" \
  "(SELECT|select)\s+(actual_cost|marketer_cost|was_actual_cost|cogs|actual_cost_snapshot|business_gross_profit_snapshot)\b" \
  "D-RBAC-001" \
  "(seed|migration|/test|\.test\.|\.spec\.|/docs|node_modules|cost-privacy\.(ts|spec\.ts)|api-token-scopes\.ts|helpers\.ts)"

# 11. D-RBAC-001: no SELECT * on cost-bearing tables.
check "No SELECT * on cost-bearing tables" \
  "(SELECT|select)\s+\*\s+(FROM|from)\s+(variant_country_cost|variant_marketer_cost|cost_history)\b" \
  "D-RBAC-001" \
  "(seed|migration|/test|\.test\.|\.spec\.|/docs|node_modules)"

# 12. D-RBAC-001: no console logging of cost field values.
check "No console logging of cost field values" \
  "console\.(log|error|warn|info|debug)\s*\([^)]*\b(actual_cost|marketer_cost|was_actual_cost|cogs|actual_cost_snapshot|business_gross_profit_snapshot)\b" \
  "D-RBAC-001" \
  "(seed|migration|/test|\.test\.|\.spec\.|/docs|node_modules|cost-privacy\.(ts|spec\.ts))"

echo ""
if [ "$EXIT_CODE" -eq 0 ]; then
  echo "═══════════════════════════════════════════════════════════════"
  echo "  ✓ All CI grep checks passed"
  echo "═══════════════════════════════════════════════════════════════"
else
  echo "═══════════════════════════════════════════════════════════════"
  echo "  ✗ CI grep checks FAILED — fix forbidden patterns above"
  echo "═══════════════════════════════════════════════════════════════"
fi

exit $EXIT_CODE
