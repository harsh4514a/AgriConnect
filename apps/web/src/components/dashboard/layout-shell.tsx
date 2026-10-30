'use client';

import { BottomNav } from '@/components/dashboard/bottom-nav';
import { Navbar } from '@/components/home/navbar';

export function DashboardLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas text-foreground">
      <Navbar variant="solid" showNotifications />
      <main className="mx-auto min-h-[calc(100dvh-4rem)] w-full max-w-screen-2xl px-4 py-4 pb-28 sm:px-6 sm:py-5 lg:px-8 lg:pb-10">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
