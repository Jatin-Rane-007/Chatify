'use client';

import React, { useEffect, useState } from 'react';
import {
  Bell,
  HelpCircle,
  Key,
  Lock,
  LogOut,
  MessageSquare,
  Share2,
  Trash2,
  User as UserIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import {
  enableWebPush,
  disableWebPush,
  getWebPushState,
} from '@/lib/notifications/webPush';

type Section = 'home' | 'privacy';

/**
 * WhatsApp-style Settings dialog.
 * - Top-level: profile header + Account / Privacy / Chats / Notifications / Storage / Help / Invite rows.
 * - Only Privacy is wired (radio list editing `user.privacySetting`).
 * - Logout sits at the very bottom in destructive red.
 * - All other rows are UI-only stubs — see docs/mobile-ui-backend-todo.md (web carry-over).
 */
interface SettingsDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { user, logout, updateProfile } = useAuth();
  const [section, setSection] = useState<Section>('home');
  const [privacySetting, setPrivacySetting] = useState<string>(
    user?.privacySetting ?? 'EVERYONE',
  );
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);
  const [pushState, setPushState] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    if (open) void getWebPushState().then(setPushState);
  }, [open]);

  const handleToggleNotifications = async () => {
    if (pushBusy) return;
    setPushBusy(true);
    try {
      if (pushState === 'granted') {
        await disableWebPush();
        setPushState('default');
      } else {
        const res = await enableWebPush();
        if (res.ok) setPushState('granted');
        else if (res.reason === 'denied') setPushState('denied');
        else if (res.reason === 'no-vapid') {
          alert('Notifications are not configured for this build.');
        } else if (res.reason === 'unsupported') {
          alert('Your browser does not support push notifications.');
        }
      }
    } finally {
      setPushBusy(false);
    }
  };

  useEffect(() => {
    if (user?.privacySetting) setPrivacySetting(user.privacySetting);
  }, [user?.privacySetting]);

  useEffect(() => {
    if (!open) setSection('home');
  }, [open]);

  if (!user) return null;

  const handlePrivacyChange = async (val: string) => {
    setUpdatingPrivacy(true);
    setPrivacySetting(val);
    try {
      await updateProfile({ privacySetting: val });
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingPrivacy(false);
    }
  };

  const initial = (user.displayName?.[0] ?? user.email[0]).toUpperCase();
  const handle = user.username ? `@${user.username}` : user.email;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-w-md p-0 gap-0 overflow-hidden"
      >
        <DialogTitle className="sr-only">Settings</DialogTitle>

        {section === 'privacy' ? (
          <PrivacyPanel
            value={privacySetting}
            disabled={updatingPrivacy}
            onChange={handlePrivacyChange}
            onBack={() => setSection('home')}
          />
        ) : (
          <div className="flex flex-col max-h-[80vh]">
            <header className="px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Settings</h2>
            </header>

            <div className="flex-1 overflow-y-auto">
              {/* Profile header */}
              <button
                type="button"
                onClick={() => alert('Edit profile coming soon.')}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-accent/40 transition-colors text-left"
              >
                <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center font-bold text-white text-lg uppercase shrink-0 shadow-sm">
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">
                    {user.displayName ?? 'You'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user.bio ?? 'Hey there! I am using Chatify.'}
                  </div>
                  <div className="text-[11px] text-muted-foreground/70 truncate mt-0.5">
                    {handle}
                  </div>
                </div>
              </button>

              <div className="border-t border-border" />

              <SettingsGroup>
                <SettingsRow
                  icon={<Key className="h-4 w-4" />}
                  title="Account"
                  subtitle="Security notifications, change email"
                  onClick={() => alert('Account — coming soon.')}
                />
                <SettingsRow
                  icon={<Lock className="h-4 w-4" />}
                  title="Privacy"
                  subtitle={`Who can contact you · ${privacySetting}`}
                  onClick={() => setSection('privacy')}
                />
                <SettingsRow
                  icon={<MessageSquare className="h-4 w-4" />}
                  title="Chats"
                  subtitle="Theme, wallpaper, chat history"
                  onClick={() => alert('Chats — coming soon.')}
                />
                <SettingsRow
                  icon={<Bell className="h-4 w-4" />}
                  title="Notifications"
                  subtitle={
                    pushState === 'granted'
                      ? 'On — tap to turn off'
                      : pushState === 'denied'
                      ? 'Blocked in browser settings'
                      : pushState === 'unsupported'
                      ? 'Not supported in this browser'
                      : 'Off — tap to enable'
                  }
                  onClick={handleToggleNotifications}
                />
              </SettingsGroup>

              <div className="border-t border-border" />

              <SettingsGroup>
                <SettingsRow
                  icon={<HelpCircle className="h-4 w-4" />}
                  title="Help"
                  subtitle="Help center, contact us, terms"
                  onClick={() => alert('Help — coming soon.')}
                />
                <SettingsRow
                  icon={<Share2 className="h-4 w-4" />}
                  title="Invite a friend"
                  onClick={() => alert('Invite — coming soon.')}
                />
                <SettingsRow
                  icon={<Trash2 className="h-4 w-4 text-destructive" />}
                  title="Delete account"
                  destructive
                  onClick={() => alert('Account deletion — coming soon.')}
                />
              </SettingsGroup>

              <div className="px-5 py-5">
                <Button
                  variant="ghost"
                  className="w-full justify-center gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive font-semibold"
                  onClick={() => {
                    onOpenChange(false);
                    logout();
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </Button>
                <p className="text-center text-[11px] text-muted-foreground/70 mt-3">
                  Chatify · made with care
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SettingsGroup({ children }: { readonly children: React.ReactNode }) {
  return <div className="py-1">{children}</div>;
}

interface RowProps {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly subtitle?: string;
  readonly destructive?: boolean;
  readonly onClick?: () => void;
}

function SettingsRow({ icon, title, subtitle, destructive, onClick }: RowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-accent/40 transition-colors text-left"
    >
      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={`text-sm font-medium truncate ${destructive ? 'text-destructive' : 'text-foreground'}`}
        >
          {title}
        </div>
        {subtitle ? (
          <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
        ) : null}
      </div>
      <span className="text-muted-foreground/60 text-lg leading-none">›</span>
    </button>
  );
}

interface PrivacyPanelProps {
  readonly value: string;
  readonly disabled: boolean;
  readonly onChange: (val: string) => void;
  readonly onBack: () => void;
}

const PRIVACY_OPTIONS: ReadonlyArray<{
  value: string;
  title: string;
  body: string;
}> = [
  {
    value: 'EVERYONE',
    title: 'Everyone',
    body: 'Anyone can search and send you a chat request.',
  },
  {
    value: 'VERIFIED',
    title: 'Verified users only',
    body: 'Only verified users can start a chat.',
  },
  {
    value: 'FRIENDS_OF_FRIENDS',
    title: 'Friends of friends',
    body: 'Only friends of your friends can connect.',
  },
  {
    value: 'NOBODY',
    title: 'Nobody',
    body: 'Hide your profile. No new chats can find you.',
  },
];

function PrivacyPanel({ value, disabled, onChange, onBack }: PrivacyPanelProps) {
  return (
    <div className="flex flex-col max-h-[80vh]">
      <header className="px-5 py-4 border-b border-border flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-2xl leading-none text-muted-foreground hover:text-foreground"
          aria-label="Back"
        >
          ‹
        </button>
        <h2 className="text-base font-semibold text-foreground">Privacy</h2>
      </header>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Choose who can find you in search and start a chat with you.
        </p>
        <fieldset className="space-y-2" disabled={disabled}>
          {PRIVACY_OPTIONS.map((opt) => {
            const selected = opt.value === value;
            return (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selected
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border hover:bg-accent/40'
                }`}
              >
                <input
                  type="radio"
                  name="privacy"
                  value={opt.value}
                  checked={selected}
                  onChange={() => onChange(opt.value)}
                  className="mt-1 accent-primary"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">
                    {opt.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {opt.body}
                  </div>
                </div>
              </label>
            );
          })}
        </fieldset>
      </div>
    </div>
  );
}
