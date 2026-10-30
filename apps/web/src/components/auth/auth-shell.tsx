'use client';

import { Sprout } from 'lucide-react';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme/theme-toggle';

interface AuthShellProps {
  children: React.ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/Background_Image.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={60}
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-green-950/50 via-green-900/25 to-green-800/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-green-950/20 via-transparent to-green-950/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-green-950/10 via-transparent to-green-950/20" />
      </div>
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header matches the home navbar container exactly (h-16, max-w-7xl, px-4 sm:px-6 lg:px-8) */}
        <header className="flex h-16 items-center border-b border-border">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-sm">
                <Sprout className="h-5 w-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">AgriConnect</span>
            </div>
            <ThemeToggle className="!border-white/20 !bg-white/10 !text-white hover:!bg-white/20" />
          </div>
        </header>
        <div className="flex-1 flex items-center px-8">
          <div className="w-full max-w-[520px] py-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 border border-border bg-white/10 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-green-300" />
              <span className="text-xs font-semibold text-white/90">Empowering Indian Agriculture</span>
            </div>
            {children}
          </div>
        </div>
        <div className="px-8 pb-8">
          <p className="text-lg text-white/50 text-center font-semibold">&copy; 2026 AgriConnect. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
