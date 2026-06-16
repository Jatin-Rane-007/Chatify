'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Deterministic gradient palette. A user without an uploaded photo always gets
 * the same colour from their id/name seed, so avatars stay stable across renders
 * and screens instead of flickering or all looking alike.
 */
const GRADIENTS = [
  'from-primary to-violet-500',
  'from-rose-500 to-orange-500',
  'from-emerald-400 to-cyan-500',
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-pink-500',
  'from-amber-400 to-yellow-500',
] as const;

function isImageUrl(value: string | null | undefined): value is string {
  return !!value && (value.startsWith('http://') || value.startsWith('https://'));
}

function gradientFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function initialFrom(name: string | null | undefined): string {
  const trimmed = name?.trim();
  return trimmed ? trimmed[0].toUpperCase() : '?';
}

export interface AvatarProps {
  /** Cloudinary (or any http) image URL. Falls back to a gradient when absent. */
  readonly src?: string | null;
  /** Display name / username — drives the fallback initial. */
  readonly name?: string | null;
  /** Stable seed for the fallback colour (defaults to `name`). */
  readonly seed?: string | null;
  /** Size + extra utilities. Pass `h-* w-*` and a `text-*` for the initial. */
  readonly className?: string;
  /** Ring/extra wrapper classes (e.g. status borders). */
  readonly ring?: boolean;
}

/**
 * Circular avatar. Shows the uploaded image when `src` is a URL, otherwise a
 * gradient monogram. Size is controlled entirely by `className` so call sites
 * keep their existing `h-/w-/text-` utilities.
 */
export function Avatar({ src, name, seed, className, ring = false }: AvatarProps) {
  // `inline-flex` is load-bearing: an inline <span> ignores width/height, so
  // without it the <img> renders at its intrinsic size instead of the sized
  // circle. Keep it in the shared base so both branches honour `h-*`/`w-*`.
  const base = cn(
    'relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 select-none',
    ring && 'ring-2 ring-background',
    className,
  );

  if (isImageUrl(src)) {
    return (
      <span className={base}>
        {/* User-generated remote images have unknown intrinsic sizes — a plain
            img with object-cover is the pragmatic, layout-stable choice here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name ?? 'Avatar'}
          className="h-full w-full object-cover"
          loading="lazy"
          draggable={false}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        base,
        'bg-gradient-to-tr font-bold text-white uppercase shadow-sm',
        gradientFor(seed || name || 'chatify'),
      )}
      aria-hidden="true"
    >
      {initialFrom(name)}
    </span>
  );
}

export { isImageUrl };
