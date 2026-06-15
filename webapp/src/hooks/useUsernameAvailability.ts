'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';

export interface UsernameAvailability {
  /** `null` = unknown / not enough input, `true` = available, `false` = invalid or taken. */
  readonly available: boolean | null;
  /** A debounced remote availability check is in flight. */
  readonly checking: boolean;
}

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
const DEBOUNCE_MS = 450;

/**
 * Resolves whether a username can be claimed.
 *
 * Synchronous rules (length + format + "this is already my username") are
 * derived during render — never stored in state — so only the genuinely async
 * remote lookup lives in an effect.
 *
 * @param username The raw username input.
 * @param currentUsername The signed-in user's existing username, if any.
 * @returns The derived {@link UsernameAvailability}.
 */
export function useUsernameAvailability(
  username: string,
  currentUsername?: string | null,
): UsernameAvailability {
  const trimmed = username.trim().toLowerCase();
  const isValidFormat = USERNAME_PATTERN.test(trimmed);
  const isOwnUsername = !!currentUsername && trimmed === currentUsername;
  const needsRemoteCheck = isValidFormat && !isOwnUsername;

  // The remote result is keyed by the exact value it was fetched for, so a stale
  // result is simply ignored during derivation — no effect-driven resets needed.
  const [result, setResult] = useState<{ value: string; available: boolean } | null>(null);

  useEffect(() => {
    if (!needsRemoteCheck) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await api.get<{ available: boolean }>(
          endpoints.auth.checkUsername,
          { query: { username: trimmed }, signal: controller.signal },
        );
        setResult({ value: trimmed, available: res.success ? res.data.available : false });
      } catch {
        if (!controller.signal.aborted) setResult({ value: trimmed, available: false });
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [trimmed, needsRemoteCheck]);

  const hasFreshResult = !!result && result.value === trimmed;

  let available: boolean | null;
  if (trimmed.length < 3) {
    available = null;
  } else if (!isValidFormat) {
    available = false;
  } else if (isOwnUsername) {
    available = true;
  } else if (hasFreshResult) {
    available = result.available;
  } else {
    available = null;
  }

  // A remote lookup is pending whenever a check is warranted but its result
  // hasn't arrived for the current value yet (covers the debounce window too).
  const checking = needsRemoteCheck && !hasFreshResult;

  return { available, checking };
}
