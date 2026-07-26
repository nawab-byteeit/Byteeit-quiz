import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { signInWithEmail, signUpWithEmail, resendConfirmationEmail, type User } from '../lib/supabase';
import { soundEffects } from '../lib/audio';
import { ShieldCheck, LogIn, Mail, Lock, User as UserIcon, X, RefreshCw } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: User) => void;
  /** Pre-fills the error banner, e.g. when an expired email-confirmation link sent the user back here. */
  initialError?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, initialError }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // A URL-driven error (expired/used confirmation link) should surface the
  // moment the modal is opened for it, in login mode where the resend action lives.
  useEffect(() => {
    if (isOpen && initialError) {
      setAuthMode('login');
      setAuthError(initialError);
    }
  }, [isOpen, initialError]);

  if (!isOpen) return null;

  const resetMessages = () => {
    setAuthError('');
    setInfoMessage('');
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
          setInfoMessage('Account created! Check your email for a confirmation link before signing in.');
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

  const handleResendConfirmation = async () => {
    if (!authEmail.trim()) {
      setAuthError('Enter your email address above first, then tap resend.');
      return;
    }
    resetMessages();
    setIsResending(true);
    try {
      await resendConfirmationEmail(authEmail);
      soundEffects.playClick();
      setInfoMessage('Confirmation email resent! Check your inbox (and spam folder) for the new link.');
    } catch (err: any) {
      setAuthError(err.message || 'Failed to resend confirmation email.');
    } finally {
      setIsResending(false);
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
          <div className="p-3 bg-coral/10 border-2 border-coral/40 text-coral-dark rounded-2xl text-xs text-center font-bold space-y-2">
            <p>{authError}</p>
            {authMode === 'login' && (
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={isResending}
                className="btn-pop mx-auto px-3 py-1.5 bg-white border-2 border-b-4 border-coral/30 text-coral-dark rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                <span>{isResending ? 'Resending…' : 'Resend confirmation email'}</span>
              </button>
            )}
          </div>
        )}

        {infoMessage && (
          <div className="p-3 bg-grass/10 border-2 border-grass/40 text-grass-dark rounded-2xl text-xs text-center font-bold">
            {infoMessage}
          </div>
        )}

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
            <span>{isSubmitting ? (authMode === 'login' ? 'Signing In…' : 'Creating Account…') : authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
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
