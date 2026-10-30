'use client';

import { Toaster } from 'sonner';
import { useTheme } from '@/components/theme/theme-provider';

export function AppToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      theme={theme}
      position="top-right"
      richColors
      closeButton
      toastOptions={{ duration: 4000 }}
    />
  );
}
