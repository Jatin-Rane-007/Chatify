'use client';

import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/shimmer';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { cn } from '@/lib/utils';

interface SearchUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  relationship: {
    id: string;
    senderId: string;
    receiverId: string;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'BLOCKED';
  } | null;
}

interface NewChatDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** Fired once a room is created or fetched. Parent should open the room. */
  readonly onChatStarted: (chatRoomId: string) => void;
}

/**
 * WhatsApp-style "New chat" modal. Replaces the standalone Discover tab.
 * Searches users by username/display name, and starts a 1:1 chat on click.
 */
export function NewChatDialog({ open, onOpenChange, onChatStarted }: NewChatDialogProps) {
  const { user, token } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setMessage(null);
    }
  }, [open]);

  useEffect(() => {
    if (!token) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const data = await api.get<SearchUser[]>(endpoints.users.search, {
          query: { q: trimmed },
        });
        if (data.success) setResults(data.data);
      } catch (err) {
        console.error(err);
        setMessage('Search failed. Try again.');
      } finally {
        setIsSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query, token]);

  const handleStart = async (target: SearchUser) => {
    if (!token) return;
    setStarting(target.id);
    setMessage(null);
    try {
      const data = await api.post<{ chatRoomId: string }>(
        endpoints.chats.directRoom,
        { recipientUserId: target.id },
      );
      if (data.success && data.data?.chatRoomId) {
        onChatStarted(data.data.chatRoomId);
        onOpenChange(false);
      } else {
        setMessage(data.message ?? 'Failed to start chat.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to start chat.');
    } finally {
      setStarting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-w-md p-0 gap-0 overflow-hidden"
      >
        <DialogTitle className="sr-only">New chat</DialogTitle>
        <div className="flex flex-col max-h-[80vh]">
          <header className="px-5 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">New chat</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Search by name or @username to start a conversation.
            </p>
          </header>

          <div className="px-5 pt-4">
            <Input
              type="text"
              autoFocus
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
            />
            {message ? (
              <p className="text-xs text-destructive mt-2">{message}</p>
            ) : null}
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-3">
            {isSearching ? (
              <div className="px-3 py-2 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="px-5 py-10 text-center text-xs text-muted-foreground">
                {query.trim()
                  ? 'No users found. Try another search.'
                  : 'Start typing to find people on Chatify.'}
              </div>
            ) : (
              <ul className="space-y-0.5">
                {results.map((r) => {
                  const rel = r.relationship;
                  const blockedByMe =
                    rel?.status === 'BLOCKED' && rel.senderId === user?.id;
                  const blockedByThem =
                    rel?.status === 'BLOCKED' && rel.receiverId === user?.id;
                  const initial = (r.displayName?.[0] ?? r.username[0]).toUpperCase();
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        disabled={blockedByMe || blockedByThem || starting === r.id}
                        onClick={() => handleStart(r)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/40 transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center font-bold text-white text-sm shrink-0">
                          {initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">
                            {r.displayName || r.username}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {r.bio || `@${r.username}`}
                          </div>
                        </div>
                        {blockedByMe ? (
                          <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-1 rounded">
                            Blocked
                          </span>
                        ) : blockedByThem ? (
                          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded">
                            Unavailable
                          </span>
                        ) : (
                          <span
                            className={cn(
                              buttonVariants({ size: 'sm' }),
                              'h-8 text-xs',
                              starting === r.id && 'opacity-50',
                            )}
                          >
                            {starting === r.id ? '...' : 'Chat'}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
