'use client';

import { useSyncExternalStore } from 'react';

/**
 * Chat wallpaper preference. localStorage-backed external store (same pattern as
 * the auth store) so it survives reloads, syncs across tabs, and reads cleanly
 * with `useSyncExternalStore` — no set-state-in-effect.
 */

export interface Wallpaper {
  readonly id: string;
  readonly label: string;
  /** CSS `background` value applied to the messages panel. `undefined` = theme default. */
  readonly background?: string;
}

// Backgrounds are token-only (`hsl(var(--token) / alpha)`) per the theme
// contract — no raw hex/hsl literals — so each preset adapts to light + dark.
export const WALLPAPERS: ReadonlyArray<Wallpaper> = [
  { id: 'default', label: 'Default' },
  {
    id: 'glow',
    label: 'Glow',
    background:
      'radial-gradient(120% 120% at 50% 0%, hsl(var(--primary) / 0.10) 0%, transparent 55%), hsl(var(--background))',
  },
  {
    id: 'aurora',
    label: 'Aurora',
    background:
      'radial-gradient(100% 100% at 100% 0%, hsl(var(--primary) / 0.12) 0%, transparent 50%), radial-gradient(100% 100% at 0% 100%, hsl(var(--foreground) / 0.06) 0%, transparent 50%), hsl(var(--background))',
  },
  {
    id: 'dots',
    label: 'Dots',
    background:
      'radial-gradient(hsl(var(--muted-foreground) / 0.16) 1px, transparent 1px) 0 0 / 18px 18px, hsl(var(--background))',
  },
  {
    id: 'tint',
    label: 'Tint',
    background:
      'linear-gradient(180deg, hsl(var(--primary) / 0.06) 0%, transparent 45%), hsl(var(--card))',
  },
];

const KEY = 'chatify_wallpaper';

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? 'default';
  } catch {
    return 'default';
  }
}

let current = typeof window === 'undefined' ? 'default' : read();
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      current = read();
      listeners.forEach((l) => l());
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function getSnapshot(): string {
  return current;
}

function getServerSnapshot(): string {
  return 'default';
}

export function setWallpaperId(id: string): void {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    // ignore unavailable storage
  }
  current = id;
  listeners.forEach((l) => l());
}

/** Returns the active wallpaper id. */
export function useWallpaperId(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function wallpaperById(id: string): Wallpaper {
  return WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0];
}
