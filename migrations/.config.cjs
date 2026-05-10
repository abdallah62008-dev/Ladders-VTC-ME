// node-pg-migrate config per ADR-027 + D-INFRA-004 (locked 2026-05-07).
//
// node-pg-migrate v7.x's `-f, --config-file` flag loads ONLY the `db` key
// (per `--config-value` default = "db") from this file. Other options
// (`dir`, `migrationsTable`, `migrationFileLanguage`, etc.) are NOT loaded
// from a config file — they MUST be passed via CLI flags in package.json
// scripts (`-m migrations/sql` for the dir, etc.). See `node-pg-migrate --help`.
//
// `dotenv` loads `.env.local` for local-dev DATABASE_URL. In CI, the env
// var is set at the workflow job level, so `dotenv.config` is a silent
// no-op when `.env.local` doesn't exist.
//
// To run locally:
//   1. Set DATABASE_URL in .env.local (dev DB only — never production)
//   2. pnpm db:migrate up

require('dotenv').config({ path: '.env.local' });

module.exports = {
  db: process.env.DATABASE_URL,
};
