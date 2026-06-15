'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/styles/ThemeProvider';
import { Button } from './button';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative rounded-lg h-9 w-9 flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground active:scale-95 transition-all duration-300"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative h-5 w-5 flex items-center justify-center overflow-hidden">
        {/* Sun Icon (Visible in light mode) */}
        <Sun className="h-5 w-5 transition-all duration-500 ease-spring rotate-0 scale-100 dark:-rotate-90 dark:scale-0 text-amber-500 absolute" />

        {/* Moon Icon (Visible in dark mode) */}
        <Moon className="h-5 w-5 transition-all duration-500 ease-spring rotate-90 scale-0 dark:rotate-0 dark:scale-100 text-indigo-400 absolute" />
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
