/**
 * Token provider seam for the axios apiClient.
 *
 * The store layer (`stores/auth-store.ts`) registers callbacks here at boot so
 * `lib/api/client.ts` can read the current token / clear auth on refresh
 * failure without importing React or the store directly (which would create a
 * cycle: store → apiClient → store).
 */

type TokenGetter = () => string | null;
type RefreshFn = () => Promise<string | null>;
type AuthFailureFn = () => void | Promise<void>;

let getToken: TokenGetter = () => null;
let refreshFn: RefreshFn = async () => null;
let onAuthFailure: AuthFailureFn = () => {};

export const tokenService = {
  registerGetToken: (fn: TokenGetter) => {
    getToken = fn;
  },
  registerRefresh: (fn: RefreshFn) => {
    refreshFn = fn;
  },
  registerOnAuthFailure: (fn: AuthFailureFn) => {
    onAuthFailure = fn;
  },
  getAccessToken: (): string | null => getToken(),
  refreshAccessToken: (): Promise<string | null> => refreshFn(),
  handleAuthFailure: () => onAuthFailure(),
};
