import { createClient, type Session, type User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error(
    'Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

// In-app browsers (WhatsApp/Instagram webviews), private browsing, and strict
// privacy settings can make `localStorage` throw on plain property access rather
// than just returning null. Supabase persists the auth session to storage on
// every request, so an unguarded adapter can take the whole app down. This falls
// back to an in-memory store (session just won't survive a refresh there).
const memoryStore = new Map<string, string>();
const safeStorage = {
  getItem(key: string) {
    try {
      return localStorage.getItem(key) ?? memoryStore.get(key) ?? null;
    } catch {
      return memoryStore.get(key) ?? null;
    }
  },
  setItem(key: string, value: string) {
    memoryStore.set(key, value);
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore -- in-memory fallback above already covers this tab's session
    }
  },
  removeItem(key: string) {
    memoryStore.delete(key);
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storage: safeStorage }
});

export type { User };

export interface AuthResult {
  user: User | null;
  session: Session | null;
}

export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<AuthResult> => {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { display_name: displayName.trim() || email.split('@')[0] },
      // Only matters if email confirmation is enabled on the Supabase project --
      // otherwise sign-up returns a session immediately and this is unused. Set
      // regardless so a confirmation link (if one is ever sent) always redirects
      // back to wherever the user actually is, not a stale dashboard Site URL.
      emailRedirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return { user: data.user, session: data.session };
};

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password
  });
  if (error) throw error;
  if (!data.user) throw new Error('Sign in failed. Please try again.');
  return data.user;
};

export const signOutUser = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Supabase's email confirmation links redirect back with either a session or
// an error in the URL hash (e.g. `#error=access_denied&error_code=otp_expired
// &error_description=...`). supabase-js auto-consumes a *successful* hash, but
// never surfaces the error case -- the app just silently lands on the
// homepage with no feedback. This reads and clears that hash so the caller can
// show the user what actually happened.
export const consumeAuthUrlError = (): { code: string; description: string } | null => {
  if (typeof window === 'undefined' || !window.location.hash) return null;

  const params = new URLSearchParams(window.location.hash.slice(1));
  const error = params.get('error');
  if (!error) return null;

  const code = params.get('error_code') || error;
  const description = (params.get('error_description') || 'That link is invalid or has expired.').replace(/\+/g, ' ');

  // Strip the hash so a refresh doesn't re-trigger the same message.
  window.history.replaceState(null, '', window.location.pathname + window.location.search);

  return { code, description };
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  supabase.auth.getSession().then(({ data }) => callback(data.session?.user ?? null));
  const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => subscription.subscription.unsubscribe();
};

// Supabase's raw auth error codes/messages are accurate but not written for
// end users (e.g. "email rate limit exceeded" reads like the app is broken).
// This maps the common ones to plain-language copy with an actual next step.
const FRIENDLY_AUTH_ERRORS: Record<string, string> = {
  over_email_send_rate_limit:
    "We've sent too many emails in a short time and hit our provider's limit. Please wait a few minutes and try again.",
  over_request_rate_limit: 'Too many attempts in a short time. Please wait a moment and try again.',
  user_already_exists: 'An account with this email already exists -- try signing in instead.',
  email_exists: 'An account with this email already exists -- try signing in instead.',
  invalid_credentials: 'Incorrect email or password. Please double-check and try again.',
  email_not_confirmed: 'Please confirm your email first -- check your inbox, or tap "Resend confirmation email" below.',
  weak_password: 'That password is too weak. Try a longer one with a mix of letters and numbers.',
  email_address_invalid: "That doesn't look like a valid email address.",
  signup_disabled: 'New sign-ups are currently disabled for this app.',
  email_provider_disabled: 'Email sign-in is currently disabled for this app.',
  otp_expired: 'That link is invalid or has expired.'
};

export const getFriendlyAuthError = (err: unknown, fallback = 'Something went wrong. Please try again.'): string => {
  const code = (err as { code?: string } | null)?.code;
  const message = (err as { message?: string } | null)?.message;
  if (code && FRIENDLY_AUTH_ERRORS[code]) return FRIENDLY_AUTH_ERRORS[code];
  return message || fallback;
};

export const getDisplayName = (user: User | null | undefined): string => {
  if (!user) return 'Quiz Host';
  return (
    (user.user_metadata?.display_name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split('@')[0] ||
    'Quiz Host'
  );
};
