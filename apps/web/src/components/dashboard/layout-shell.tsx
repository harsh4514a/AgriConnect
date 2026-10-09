'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TopNavbar } from '@/components/dashboard/top-navbar';
import { BottomNav } from '@/components/dashboard/bottom-nav';

export function DashboardLayoutShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-green-950">
      {/* Background texture */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-green-950 via-green-900 to-green-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(46,125,50,0.25),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(22,101,52,0.3),transparent_55%)]" />
      </div>

      <div className="relative z-10 flex h-full w-full">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <TopNavbar title={title} onOpenMobile={() => setMobileOpen(true)} />

          <main className="flex-1 overflow-y-auto px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-6">
            <div className="mx-auto max-w-7xl">
              <motion.div
                key={pathname}
                initial={{ opacity: 0.82, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
              >
                {children}
              </motion.div>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation (primary Sell action) */}
      <BottomNav />
    </div>
  );
}
