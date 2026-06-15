import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

export function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-muted/60',
        !shimmer ? 'animate-pulse' : '',
        className
      )}
      {...props}
    >
      {shimmer ? (
        <div className="absolute inset-0 -translate-x-full animate-[shimmer-move_2s_infinite] shimmer-gradient" />
      ) : null}
    </div>
  );
}

export function CardShimmer() {
  return (
    <div className="rounded-xl border border-border p-6 space-y-4 bg-card">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function TextShimmer({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2.5 w-full">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

export function ProfileShimmer() {
  return (
    <div className="flex items-center gap-4 p-4 border border-border/40 rounded-xl bg-card/40">
      <Skeleton className="h-12 w-12 rounded-full shrink-0" />
      <div className="space-y-2 flex-1 min-w-0">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}

export function ChatShimmer() {
  return (
    <div className="space-y-4 w-full p-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex items-start gap-3 max-w-[80%]',
            i % 2 === 1 ? 'ml-auto flex-row-reverse' : ''
          )}
        >
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton
              className={cn(
                'h-10 rounded-xl',
                i % 2 === 1 ? 'bg-primary/20 rounded-tr-none' : 'rounded-tl-none'
              )}
            />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}
