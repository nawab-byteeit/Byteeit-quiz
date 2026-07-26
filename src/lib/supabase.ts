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
  needsEmailConfirmation: boolean;
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
      // Without this, Supabase falls back to the project's dashboard-configured
      // Site URL, which can silently point at a different host/port than the one
      // the user is actually signing up from (e.g. localhost vs 127.0.0.1, or a
      // stale prod URL during local dev). That mismatch makes a *successful*
      // confirmation look broken, since the session lands in a different
      // origin's storage than the tab the user is watching.
      emailRedirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return {
    user: data.user,
    session: data.session,
    needsEmailConfirmation: !!data.user && !data.session
  };
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

// Lets a user request a fresh confirmation link when their original one has
// expired or was already used (the only recovery path for `otp_expired`).
export const resendConfirmationEmail = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
    options: { emailRedirectTo: window.location.origin }
  });
  if (error) throw error;
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

export const getDisplayName = (user: User | null | undefined): string => {
  if (!user) return 'Quiz Host';
  return (
    (user.user_metadata?.display_name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split('@')[0] ||
    'Quiz Host'
  );
};
