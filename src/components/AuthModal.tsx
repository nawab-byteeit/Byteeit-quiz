import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, type User } from '../lib/supabase';
import { soundEffects } from '../lib/audio';
import { ShieldCheck, LogIn, Mail, Lock, User as UserIcon, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetMessages = () => {
    setAuthError('');
    setInfoMessage('');
  };

  const handleGoogleAuth = async () => {
    resetMessages();
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      // Supabase redirects the browser for OAuth; nothing else to do here.
    } catch (err: any) {
      setAuthError(err.message || 'Google sign-in failed');
      setIsSubmitting(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (authPass.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (authMode === 'login') {
        const user = await signInWithEmail(authEmail, authPass);
        soundEffects.playClick();
        if (onSuccess) onSuccess(user);
        onClose();
      } else {
        const result = await signUpWithEmail(authEmail, authPass, authName);
        soundEffects.playClick();
        if (result.needsEmailConfirmation) {
          setInfoMessage('Account created! Check your email to confirm before signing in.');
          setAuthMode('login');
        } else if (result.user) {
          if (onSuccess) onSuccess(result.user);
          onClose();
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm overflow-y-auto p-4">
      <div className="min-h-full flex items-center justify-center">
      <div className="bg-paper border-4 border-ink/10 rounded-[2rem] max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 relative animate-pop-in my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-ink-soft hover:text-coral-dark rounded-xl hover:bg-cream transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-sky/10 border-2 border-sky/30 rounded-2xl text-sky-dark mb-1">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-display font-extrabold text-ink">
            {authMode === 'login' ? 'Sign In' : 'Create Your Account'}
          </h3>
          <p className="text-xs text-ink-soft leading-relaxed font-medium">
            Sign in to create quizzes, host live presenter rooms, and share quizzes with your team.
          </p>
        </div>

        {authError && (
          <div className="p-3 bg-coral/10 border-2 border-coral/40 text-coral-dark rounded-2xl text-xs text-center font-bold">
            {authError}
          </div>
        )}

        {infoMessage && (
          <div className="p-3 bg-grass/10 border-2 border-grass/40 text-grass-dark rounded-2xl text-xs text-center font-bold">
            {infoMessage}
          </div>
        )}

        {/* Google Fast Sign-In */}
        <button
          onClick={handleGoogleAuth}
          disabled={isSubmitting}
          className="btn-pop w-full py-3 bg-white hover:bg-cream text-ink border-2 border-b-4 border-ink/15 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3 my-2">
          <div className="h-0.5 bg-ink/10 flex-1 rounded-full" />
          <span className="text-[11px] text-ink-soft/70 font-bold uppercase">or email</span>
          <div className="h-0.5 bg-ink/10 flex-1 rounded-full" />
        </div>

        <form onSubmit={handleEmailAuthSubmit} className="space-y-3">
          {authMode === 'register' && (
            <div>
              <label className="text-xs font-bold text-ink-soft block mb-1">Display Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-ink-soft/60 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="e.g. Nawab Khan"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-cream border-2 border-ink/10 rounded-2xl text-ink text-xs focus:outline-none focus:border-sky font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-ink-soft block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-ink-soft/60 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3.5 py-2.5 bg-cream border-2 border-ink/10 rounded-2xl text-ink text-xs focus:outline-none focus:border-sky font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-ink-soft block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink-soft/60 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={authPass}
                onChange={(e) => setAuthPass(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-3.5 py-2.5 bg-cream border-2 border-ink/10 rounded-2xl text-ink text-xs focus:outline-none focus:border-sky font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-pop w-full py-3 bg-sky border-2 border-b-4 border-sky-dark hover:brightness-105 text-white font-bold rounded-2xl text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
          </button>
        </form>

        <div className="flex items-center justify-between text-xs text-ink-soft pt-2 border-t-2 border-ink/10 font-semibold">
          <button
            type="button"
            onClick={() => {
              resetMessages();
              setAuthMode(authMode === 'login' ? 'register' : 'login');
            }}
            className="hover:text-sky-dark font-bold"
          >
            {authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign In'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="hover:text-ink"
          >
            Cancel
          </button>
        </div>
      </div>
      </div>
    </div>,
    document.body
  );
};
