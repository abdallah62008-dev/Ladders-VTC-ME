// Storefront homepage — Phase 1 sprint 1 placeholder.
//
// Per D-READY-002 ("Build Now, Activate When Ready"): final marketing copy
// is delivered by D-SEO-005 Arabic copywriter. Until approved, this page
// renders a clearly-marked placeholder. Backend MUST NOT activate this as
// customer-facing without copy approval.
//
// Sprint 2+ wires the real homepage with PLP/PDP from product_country_readiness.

import { setRequestLocale, getTranslations } from 'next-intl/server';
import { isValidLocale, getCountryCode } from '@/lib/i18n/config';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations('home');
  const country = getCountryCode(locale).toUpperCase();

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Phase 1 sprint 1 scaffold.</strong> Final copy pending copywriter delivery
        (D-SEO-005). Per D-READY-002, this page is not yet active customer-facing.
      </div>

      <h1 className="mt-8 text-4xl font-semibold tracking-tight">{t('title')}</h1>
      <p className="mt-4 text-lg text-zinc-600">{t('subtitle')}</p>

      <div className="mt-8 flex items-center gap-4">
        <button
          type="button"
          className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white"
          disabled
        >
          {t('cta')}
        </button>
        <span className="text-xs text-zinc-500">
          [Disabled until catalog has active products for {country}]
        </span>
      </div>

      <dl className="mt-12 grid grid-cols-2 gap-4 text-sm text-zinc-600">
        <div>
          <dt className="font-medium text-zinc-800">Country (from URL)</dt>
          <dd>{country}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-800">Locale</dt>
          <dd>{locale}</dd>
        </div>
      </dl>
    </main>
  );
}
