'use client';

import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from '@/styles/ThemeProvider';

/**
 * App-wide toast surface. Wraps sonner with the Emerald-minimal token system so
 * toasts read the same CSS variables as the rest of the UI and flip with the
 * theme automatically. Mount once in the root layout, inside `ThemeProvider`.
 */
export function Toaster(): React.JSX.Element {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme}
      position="top-right"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'group rounded-lg border border-border bg-card text-card-foreground shadow-lg',
          title: 'text-sm font-semibold text-foreground',
          description: 'text-sm text-muted-foreground',
          actionButton: 'rounded-md bg-primary text-primary-foreground',
          cancelButton: 'rounded-md bg-muted text-muted-foreground',
          closeButton: 'border-border bg-card text-muted-foreground',
        },
      }}
    />
  );
}
