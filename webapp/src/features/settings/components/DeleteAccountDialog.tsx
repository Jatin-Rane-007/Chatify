'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';

interface DeleteAccountDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

/** Final, password-gated confirmation before permanently deleting the account. */
export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
  const { deleteAccount } = useAuth();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPassword('');
      setError(null);
      setBusy(false);
    }
  }, [open]);

  const handleDelete = async () => {
    setError(null);
    setBusy(true);
    try {
      await deleteAccount(password);
      // deleteAccount clears the session — the app will fall back to the landing page.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete account.');
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-center">
          <div className="mx-auto h-11 w-11 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-1">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle className="text-base font-extrabold text-destructive">
            Delete your account?
          </DialogTitle>
          <DialogDescription className="text-xs leading-normal pt-1">
            This permanently removes your profile, chats, and messages. This cannot be undone. Enter
            your password to confirm.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Input
            type="password"
            placeholder="Current password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error ? <p className="text-xs text-destructive font-medium px-1">{error}</p> : null}
        </div>

        <DialogFooter className="flex sm:flex-col gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-9.5 text-xs font-semibold"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 h-9.5 text-xs font-bold bg-destructive text-white hover:bg-destructive-hover"
            onClick={handleDelete}
            loading={busy}
            disabled={busy || !password}
          >
            Delete account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
