'use client';

import { useState } from 'react';
import { Check, Mail, KeyRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { PanelHeader } from './PanelHeader';

interface AccountPanelProps {
  readonly onBack: () => void;
}

function errMsg(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

/** Account section: change email + change password (both re-auth with the current password). */
export function AccountPanel({ onBack }: AccountPanelProps) {
  const { user, changeEmail, changePassword } = useAuth();

  // Change email
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [emailDone, setEmailDone] = useState(false);

  // Change password
  const [curPassword, setCurPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [pwDone, setPwDone] = useState(false);

  if (!user) return null;

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailErr(null);
    setEmailDone(false);
    setEmailBusy(true);
    try {
      await changeEmail(newEmail.trim(), emailPassword);
      setEmailDone(true);
      setNewEmail('');
      setEmailPassword('');
      setTimeout(() => setEmailDone(false), 2000);
    } catch (err) {
      setEmailErr(errMsg(err, 'Could not change email.'));
    } finally {
      setEmailBusy(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErr(null);
    setPwDone(false);
    if (newPassword.length < 8) {
      setPwErr('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwErr('New passwords do not match.');
      return;
    }
    setPwBusy(true);
    try {
      await changePassword(curPassword, newPassword);
      setPwDone(true);
      setCurPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwDone(false), 2000);
    } catch (err) {
      setPwErr(errMsg(err, 'Could not change password.'));
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div className="flex flex-col max-h-[85vh]">
      <PanelHeader title="Account" onBack={onBack} />

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">
        {/* Current email */}
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Signed in as
          </div>
          <div className="text-sm font-medium text-foreground truncate mt-0.5">{user.email}</div>
        </div>

        {/* Change email */}
        <form onSubmit={handleEmail} className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" /> Change email
          </h3>
          <Input
            type="email"
            placeholder="New email address"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Current password"
            value={emailPassword}
            onChange={(e) => setEmailPassword(e.target.value)}
            required
          />
          {emailErr ? <p className="text-xs text-destructive font-medium">{emailErr}</p> : null}
          <Button
            type="submit"
            className="w-full h-9.5 text-xs font-semibold"
            loading={emailBusy}
            disabled={emailBusy || !newEmail.trim() || !emailPassword}
          >
            {emailDone ? (
              <>
                <Check className="h-4 w-4 mr-1.5" /> Email updated
              </>
            ) : (
              'Update email'
            )}
          </Button>
        </form>

        <div className="border-t border-border" />

        {/* Change password */}
        <form onSubmit={handlePassword} className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-muted-foreground" /> Change password
          </h3>
          <Input
            type="password"
            placeholder="Current password"
            value={curPassword}
            onChange={(e) => setCurPassword(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="New password (min 8 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {pwErr ? <p className="text-xs text-destructive font-medium">{pwErr}</p> : null}
          <Button
            type="submit"
            className="w-full h-9.5 text-xs font-semibold"
            loading={pwBusy}
            disabled={pwBusy || !curPassword || !newPassword || !confirmPassword}
          >
            {pwDone ? (
              <>
                <Check className="h-4 w-4 mr-1.5" /> Password updated
              </>
            ) : (
              'Update password'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
