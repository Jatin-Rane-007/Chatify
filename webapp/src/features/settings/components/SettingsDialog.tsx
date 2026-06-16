'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Camera,
  Check,
  HelpCircle,
  Key,
  Loader2,
  Lock,
  LogOut,
  MessageSquare,
  Share2,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { useUsernameAvailability } from '@/hooks/useUsernameAvailability';
import { uploadImage, validateImage } from '@/lib/media/uploadImage';
import {
  enableWebPush,
  disableWebPush,
  getWebPushState,
} from '@/lib/notifications/webPush';
import { AccountPanel } from './AccountPanel';
import { ChatsPanel } from './ChatsPanel';
import { HelpPanel } from './HelpPanel';
import { DeleteAccountDialog } from './DeleteAccountDialog';

type Section = 'home' | 'privacy' | 'profile' | 'account' | 'chats' | 'help';

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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [invited, setInvited] = useState(false);

  const handleInvite = async () => {
    const url = typeof window !== 'undefined' ? window.location.origin : 'https://chatify.app';
    const shareData = {
      title: 'Chatify',
      text: 'Chat with me on Chatify — real-time messaging with photo sharing.',
      url,
    };
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(shareData);
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setInvited(true);
        setTimeout(() => setInvited(false), 2000);
      }
    } catch {
      // user cancelled the share sheet — no-op
    }
  };

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

  const handle = user.username ? `@${user.username}` : user.email;

  return (
    <>
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
        ) : section === 'profile' ? (
          <EditProfilePanel onBack={() => setSection('home')} />
        ) : section === 'account' ? (
          <AccountPanel onBack={() => setSection('home')} />
        ) : section === 'chats' ? (
          <ChatsPanel onBack={() => setSection('home')} />
        ) : section === 'help' ? (
          <HelpPanel onBack={() => setSection('home')} />
        ) : (
          <div className="flex flex-col max-h-[80vh]">
            <header className="px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Settings</h2>
            </header>

            <div className="flex-1 overflow-y-auto">
              {/* Profile header */}
              <button
                type="button"
                onClick={() => setSection('profile')}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-accent/40 transition-colors text-left"
              >
                <Avatar
                  src={user.avatarUrl}
                  name={user.displayName ?? user.email}
                  seed={user.id}
                  className="h-14 w-14 text-lg"
                />
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
                  subtitle="Change email and password"
                  onClick={() => setSection('account')}
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
                  onClick={() => setSection('chats')}
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
                  subtitle="FAQ, contact us, terms"
                  onClick={() => setSection('help')}
                />
                <SettingsRow
                  icon={<Share2 className="h-4 w-4" />}
                  title="Invite a friend"
                  subtitle={invited ? 'Link copied to clipboard' : undefined}
                  onClick={handleInvite}
                />
                <SettingsRow
                  icon={<Trash2 className="h-4 w-4 text-destructive" />}
                  title="Delete account"
                  destructive
                  onClick={() => setDeleteOpen(true)}
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

    <DeleteAccountDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
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

interface EditProfilePanelProps {
  readonly onBack: () => void;
}

const BIO_MAX = 140;

function EditProfilePanel({ onBack }: EditProfilePanelProps) {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { available, checking } = useUsernameAvailability(username, user?.username);

  if (!user) return null;

  const trimmedUsername = username.trim().toLowerCase();
  const usernameChanged = trimmedUsername !== (user.username ?? '');
  const usernameBlocksSave = usernameChanged && (checking || available === false);

  const dirty =
    displayName.trim() !== (user.displayName ?? '') ||
    usernameChanged ||
    bio.trim() !== (user.bio ?? '');

  const handleAvatarSelect = async (file: File) => {
    const validationError = validateImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setUploading(true);
    setUploadProgress(0);
    try {
      const url = await uploadImage(file, 'avatar', setUploadProgress);
      await updateProfile({ avatarUrl: url });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSave = async () => {
    if (!dirty || usernameBlocksSave || saving) return;
    setError(null);
    setSaving(true);
    const payload: { displayName?: string; username?: string; bio?: string } = {};
    if (displayName.trim() !== (user.displayName ?? '')) payload.displayName = displayName.trim();
    if (usernameChanged) payload.username = trimmedUsername;
    if (bio.trim() !== (user.bio ?? '')) payload.bio = bio.trim();
    try {
      await updateProfile(payload);
      setSavedAt(true);
      setTimeout(() => setSavedAt(false), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col max-h-[85vh]">
      <header className="px-5 py-4 border-b border-border flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-2xl leading-none text-muted-foreground hover:text-foreground"
          aria-label="Back"
        >
          ‹
        </button>
        <h2 className="text-base font-semibold text-foreground">Edit profile</h2>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Avatar with upload overlay */}
        <div className="flex flex-col items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleAvatarSelect(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="relative group rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            title="Change photo"
          >
            <Avatar
              src={user.avatarUrl}
              name={user.displayName ?? user.email}
              seed={user.id}
              className="h-24 w-24 text-3xl"
            />
            <span className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </span>
          </button>
          {uploading ? (
            <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
              Uploading {uploadProgress}%
            </span>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-primary hover:text-primary-hover"
            >
              Change photo
            </button>
          )}
        </div>

        {/* Display name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Display name
          </label>
          <Input
            type="text"
            value={displayName}
            maxLength={50}
            placeholder="Your name"
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        {/* Username */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Username
          </label>
          <Input
            type="text"
            value={username}
            maxLength={20}
            placeholder="username"
            onChange={(e) => setUsername(e.target.value)}
            error={usernameChanged && available === false}
            leftIcon={<span className="text-sm text-muted-foreground">@</span>}
          />
          {usernameChanged ? (
            <p className="text-[11px] font-medium px-1">
              {checking ? (
                <span className="text-muted-foreground">Checking availability…</span>
              ) : available === true ? (
                <span className="text-emerald-500">Available</span>
              ) : available === false ? (
                <span className="text-destructive">
                  Taken or invalid (3–20 letters, numbers, underscores).
                </span>
              ) : null}
            </p>
          ) : null}
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              About
            </label>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {bio.length}/{BIO_MAX}
            </span>
          </div>
          <textarea
            value={bio}
            maxLength={BIO_MAX}
            placeholder="Hey there! I am using Chatify."
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none resize-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
        </div>

        {error ? <p className="text-xs text-destructive font-medium">{error}</p> : null}
      </div>

      <div className="px-5 py-4 border-t border-border">
        <Button
          className="w-full h-10 text-sm font-semibold"
          disabled={!dirty || usernameBlocksSave || saving}
          loading={saving}
          onClick={handleSave}
        >
          {savedAt ? (
            <>
              <Check className="h-4 w-4 mr-1.5" /> Saved
            </>
          ) : (
            'Save changes'
          )}
        </Button>
      </div>
    </div>
  );
}
