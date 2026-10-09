'use client';

import { Sprout } from 'lucide-react';

interface AuthShellProps {
  children: React.ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/Background_Image.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-green-950/50 via-green-900/25 to-green-800/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-green-950/20 via-transparent to-green-950/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-green-950/10 via-transparent to-green-950/20" />
      </div>
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header matches the home navbar container exactly (h-16, max-w-7xl, px-4 sm:px-6 lg:px-8) */}
        <header className="flex h-16 items-center border-b border-white/10">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
                  boxShadow: '0 4px 12px rgba(46,125,50,0.35)',
                }}
              >
                <Sprout className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">AgriConnect</span>
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center px-8">
          <div className="w-full max-w-[520px] py-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 border border-white/20 bg-white/10 backdrop-blur-md">
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
