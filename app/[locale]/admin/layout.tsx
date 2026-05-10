import type { ReactNode } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { isValidLocale } from '@/lib/i18n/config';
import { notFound } from 'next/navigation';
import { AdminShell } from '@/components/admin/admin-shell';

interface Props {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);

  return <AdminShell locale={locale}>{children}</AdminShell>;
}
