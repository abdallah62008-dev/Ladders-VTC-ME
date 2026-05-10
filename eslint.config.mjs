// ESLint v9 flat config per D-INFRA-007 (locked 2026-05-09).
// Stack: TypeScript + Next.js + React + accessibility (via next/core-web-vitals).
//
// Phase 1 sprint 1 review fix (2026-05-09):
//   `eslint-config-next` is a legacy `extends`-style config that doesn't compose
//   directly into ESLint v9's flat config array. We use `@eslint/eslintrc`'s
//   `FlatCompat` shim — the official path Next.js documents — to extend
//   `next/core-web-vitals`. This activates eslint-plugin-next + react-hooks +
//   jsx-a11y rules required by D-INFRA-007.
//
// Phase 1 sprint 1 validation fix (2026-05-09):
//   1. Named the default-export array (`const config`) so eslint-plugin-import's
//      `no-anonymous-default-export` rule is satisfied — the rule began firing
//      after the FlatCompat shim above wired in the Next.js plugin set.
//   2. Added a `*.cjs` override block: node-pg-migrate's CLI loader requires a
//      CommonJS config file (`migrations/.config.cjs`), and CJS files MUST use
//      `require()`. The override scopes `@typescript-eslint/no-require-imports`
//      OFF for `.cjs` files only. ESM and TS files keep the ban.
//
// Locked: ESLint + Prettier are the standard tooling. Biome is NOT used.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { FlatCompat } from '@eslint/eslintrc';
import prettierConfig from 'eslint-config-prettier';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

const config = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // next/core-web-vitals provides eslint-plugin-next + react-hooks + jsx-a11y.
  // FlatCompat translates the legacy extends syntax into flat config entries.
  ...compat.extends('next/core-web-vitals'),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  // Prettier last (among rule-bearing entries) — disables formatting rules
  // conflicting with Prettier (D-INFRA-007).
  prettierConfig,
  // CommonJS override for files that must remain CJS (node-pg-migrate config).
  // ESM/TS still bans `require()`; only `.cjs` files opt out.
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'script',
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    ignores: [
      '.next/**',
      'out/**',
      'node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
    ],
  },
];

export default config;
