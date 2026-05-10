// Sprint 1 sanity tests for shared utilities + locale config.
// Sprint 2+ adds RLS test runner + permission cache invalidation tests + cost privacy tests.

import { describe, it, expect } from 'vitest';
import {
  locales,
  defaultLocale,
  getDirection,
  getLanguage,
  getCountryCode,
  isValidLocale,
} from '@/lib/i18n/config';
import { cn } from '@/lib/cn';

describe('locale config', () => {
  it('exposes 6 locales', () => {
    expect(locales).toHaveLength(6);
  });

  it('Arabic is the default language', () => {
    expect(defaultLocale).toBe('ar-sa');
  });

  it('correctly identifies RTL for Arabic locales', () => {
    expect(getDirection('ar-sa')).toBe('rtl');
    expect(getDirection('ar-eg')).toBe('rtl');
    expect(getDirection('ar-iq')).toBe('rtl');
  });

  it('correctly identifies LTR for English locales', () => {
    expect(getDirection('en-sa')).toBe('ltr');
    expect(getDirection('en-eg')).toBe('ltr');
    expect(getDirection('en-iq')).toBe('ltr');
  });

  it('extracts language and country code', () => {
    expect(getLanguage('ar-sa')).toBe('ar');
    expect(getCountryCode('ar-sa')).toBe('sa');
    expect(getLanguage('en-iq')).toBe('en');
    expect(getCountryCode('en-iq')).toBe('iq');
  });

  it('rejects invalid locales', () => {
    expect(isValidLocale('ar-sa')).toBe(true);
    expect(isValidLocale('fr-fr')).toBe(false);
    expect(isValidLocale('ar')).toBe(false);
    expect(isValidLocale('')).toBe(false);
  });
});

describe('cn utility', () => {
  it('joins class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('skips falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });

  it('handles conditional objects', () => {
    expect(cn('a', { b: true, c: false })).toBe('a b');
  });
});
