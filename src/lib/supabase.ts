import { createClient, type Session, type User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error(
    'Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
      data: { display_name: displayName.trim() || email.split('@')[0] }
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

export const signInWithGoogle = async (): Promise<void> => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
  if (error) throw error;
};

export const signOutUser = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
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
