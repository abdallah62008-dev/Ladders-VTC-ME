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
  // Tell node-pg-migrate to load .sql files as raw SQL. Default is 'js',
  // which makes the runner require() each migration file as a JavaScript
  // module — and `CREATE EXTENSION ...` is not valid JS, so the runner
  // would die with `SyntaxError: Invalid or unexpected token`. With
  // `migrationFileLanguage: 'sql'`, the runner reads each file as text,
  // splits on the `---- Down ----` separator, and executes the up section
  // against the database.
  migrationFileLanguage: 'sql',
  direction: 'up',
  count: Infinity,
  // Forward-only after Phase 1 launch per ADR-027 (Phase 1+ rules).
  // Down section discipline enforced at PR review per /docs/01-database/05-migration-plan.md
};
