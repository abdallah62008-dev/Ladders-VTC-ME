import type { Config } from 'tailwindcss';

// Tailwind v4 — most config now lives in CSS via @theme. This file exists
// for IDE intellisense + content paths. Brand tokens are in app/[locale]/globals.css.

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  // No explicit `theme` — Tailwind v4 reads @theme from globals.css.
};

export default config;
