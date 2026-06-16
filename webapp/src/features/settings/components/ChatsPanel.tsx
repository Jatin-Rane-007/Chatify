'use client';

import { useState } from 'react';
import { Monitor, Moon, Sun, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useTheme } from '@/styles/ThemeProvider';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { WALLPAPERS, useWallpaperId, setWallpaperId } from '@/lib/chat/wallpaper';
import { cn } from '@/lib/utils';
import { PanelHeader } from './PanelHeader';

interface ChatsPanelProps {
  readonly onBack: () => void;
}

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

/** Chats section: theme, chat wallpaper, and clear-all-chats. */
export function ChatsPanel({ onBack }: ChatsPanelProps) {
  const { preference, setPreference } = useTheme();
  const wallpaperId = useWallpaperId();

  const [confirming, setConfirming] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearErr, setClearErr] = useState<string | null>(null);

  const handleClear = async () => {
    setClearErr(null);
    setClearing(true);
    try {
      const res = await api.del(endpoints.chats.rooms);
      if (res.success) {
        // Hard refresh so the sidebar + any open room reset cleanly.
        window.location.reload();
        return;
      }
      setClearErr(res.message ?? 'Could not clear chats.');
    } catch (err) {
      setClearErr(err instanceof Error ? err.message : 'Could not clear chats.');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="flex flex-col max-h-[85vh]">
      <PanelHeader title="Chats" onBack={onBack} />

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">
        {/* Theme */}
        <section className="space-y-2.5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Theme
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = preference === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPreference(opt.value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 py-3 rounded-lg border text-xs font-semibold transition-colors',
                    active
                      ? 'border-primary/40 bg-primary/5 text-primary'
                      : 'border-border hover:bg-accent/40 text-muted-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Wallpaper */}
        <section className="space-y-2.5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Chat wallpaper
          </h3>
          <div className="grid grid-cols-3 gap-2.5">
            {WALLPAPERS.map((wp) => {
              const active = wallpaperId === wp.id;
              return (
                <button
                  key={wp.id}
                  type="button"
                  onClick={() => setWallpaperId(wp.id)}
                  className={cn(
                    'relative h-16 rounded-lg border overflow-hidden transition-all',
                    active ? 'ring-2 ring-primary border-primary/40' : 'border-border hover:opacity-90',
                  )}
                  style={{ background: wp.background ?? 'hsl(var(--card))' }}
                  title={wp.label}
                >
                  <span className="absolute bottom-1 left-1.5 text-[10px] font-semibold text-foreground/80 drop-shadow">
                    {wp.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="border-t border-border" />

        {/* Clear all chats */}
        <section className="space-y-2.5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Chat history
          </h3>
          {confirming ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2.5">
              <p className="text-xs text-foreground font-medium">
                Delete every conversation? This removes all your chats and their messages for both
                sides and can&apos;t be undone.
              </p>
              {clearErr ? <p className="text-xs text-destructive">{clearErr}</p> : null}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-9 text-xs"
                  onClick={() => setConfirming(false)}
                  disabled={clearing}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-9 text-xs font-bold bg-destructive text-white hover:bg-destructive-hover"
                  onClick={handleClear}
                  loading={clearing}
                >
                  Clear all
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive font-semibold h-10"
              onClick={() => setConfirming(true)}
            >
              <Trash2 className="h-4 w-4" /> Clear all chats
            </Button>
          )}
        </section>
      </div>
    </div>
  );
}
