'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, ShieldCheck } from 'lucide-react';
import { hasUsableAdminSession } from '@/services/admin-api/admin-token';
import { AdminTopNavbar } from './admin-top-navbar';

interface AdminLayoutShellProps {
  children: React.ReactNode;
}

export function AdminLayoutShell({ children }: AdminLayoutShellProps) {
  const t = useTranslations('admin');
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    if (!hasUsableAdminSession()) {
      const redirect = pathname.startsWith(`/${locale}/admin/`)
        ? `?redirect=${encodeURIComponent(pathname)}`
        : '';
      router.replace(`/${locale}/admin/login${redirect}`);
      return;
    }
    setIsVerifying(false);
  }, [locale, pathname, router]);

  if (isVerifying) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-canvas text-foreground">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-accent" aria-hidden="true" />
            <span>{t('layout.verifying')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-canvas text-foreground">
      <AdminTopNavbar />
      <main className="mx-auto min-h-[calc(100dvh-4rem)] w-full max-w-screen-2xl px-4 py-6 pb-10 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
