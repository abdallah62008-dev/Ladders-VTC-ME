// node-pg-migrate config per ADR-027 + D-INFRA-004 (locked 2026-05-07).
// Sprint 1 ships migration files only; no DB connection configured by Claude.
//
// To run locally:
//   1. Set DATABASE_URL in .env.local (dev DB only — never production)
//   2. pnpm db:migrate up

require('dotenv').config({ path: '.env.local' });

module.exports = {
  databaseUrl: process.env.DATABASE_URL,
  dir: 'migrations/sql',
  migrationsTable: 'pgmigrations',
  direction: 'up',
  count: Infinity,
  // Forward-only after Phase 1 launch per ADR-027 (Phase 1+ rules).
  // Down section discipline enforced at PR review per /docs/01-database/05-migration-plan.md
};
