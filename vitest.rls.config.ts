import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Vitest config for the RLS (Row Level Security) test suite per D-RBAC-001 +
// /docs/03-rbac/04-cost-privacy.md.
//
// Separate from the unit-test config because:
//   - RLS tests need a real Postgres connection (DATABASE_URL)
//   - RLS tests run in node env (no jsdom — pure DB integration)
//   - Single-fork pool to avoid parallel transactions racing on the same DB
//   - Longer per-test timeout because each test wraps work in BEGIN/ROLLBACK
//
// Phase 1 sprint 2A scope: cost privacy assertions across variant_country_cost,
// variant_marketer_cost, cost_history. Class 2 deletion-block tests for
// variant_country_cost / variant_marketer_cost / cost_history / cost_read_log /
// stock_movement.
//
// Sprint 2B+ adds: cache-vs-RLS independence test (corrupt cache, confirm RLS
// still rejects), 7 invalidation triggers, X-Country-Context middleware tests.

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/rls/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'tests/unit/**', 'tests/e2e/**'],
    pool: 'forks',
    poolOptions: {
      // Single fork → single DB connection at a time → predictable ordering
      // for FORCE RLS interactions. Per-test BEGIN/ROLLBACK keeps isolation.
      forks: { singleFork: true },
    },
    testTimeout: 15_000, // DB integration; allow generous time per test
    hookTimeout: 30_000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/lib': path.resolve(__dirname, './lib'),
    },
  },
});
