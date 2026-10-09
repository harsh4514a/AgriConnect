'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, ShieldCheck } from 'lucide-react';
import { hasUsableAdminSession } from '@/services/admin-api/admin-token';
import { AdminSidebar } from './admin-sidebar';
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
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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
      <div className="flex min-h-screen w-full items-center justify-center bg-[#e9ede8] text-slate-600">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f5b3b] text-white shadow-lg shadow-emerald-950/10">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-700" aria-hidden="true" />
            <span>{t('layout.verifying')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#e9ede8] text-slate-900">
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <AdminTopNavbar onOpenMobile={() => setMobileOpen(true)} />

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1480px] p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
