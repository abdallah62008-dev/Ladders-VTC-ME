import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Root layout — minimal. The locale-aware HTML element (with `dir` and `lang`)
// is set in app/[locale]/layout.tsx because direction is locale-dependent.

export const metadata: Metadata = {
  title: 'Smart Ladders',
  description: 'Smart Ladders Commerce Platform',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
