import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ViewMode } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { getDisplayName, consumeAuthUrlError, getFriendlyAuthError, type User } from '../lib/supabase';
import { AuthModal } from './AuthModal';
import { Tv, Smartphone, Target, Download, BookOpen, Volume2, VolumeX, Copy, Check, Users, ShieldCheck, Share2, Globe, PlusCircle, QrCode, UserCheck, LogIn, LogOut } from 'lucide-react';
import { soundEffects } from '../lib/audio';
import byteeitLogo from '../assets/images/byteeit_logo_1784809227570.jpg';

interface HeaderProps {
  currentMode: ViewMode;
  setMode: (mode: ViewMode) => void;
  roomCode: string;
  playerCount: number;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  hostName?: string;
  quizTitle?: string;
  currentUser?: User | null;
  onLogout?: () => void | Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  setMode,
  roomCode,
  playerCount,
  soundEnabled,
  setSoundEnabled,
  hostName = 'Quiz Host',
  quizTitle = 'ByteeIT Quiz Studio',
  currentUser = null,
  onLogout
}) => {
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInitialError, setAuthInitialError] = useState('');
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);
  const [copiedDirectUrl, setCopiedDirectUrl] = useState(false);

  // Surface expired/invalid email-confirmation links: Supabase redirects back
  // with the failure in the URL hash but never shows it anywhere on its own.
  useEffect(() => {
    const urlError = consumeAuthUrlError();
    if (urlError) {
      setAuthInitialError(getFriendlyAuthError({ code: urlError.code, message: urlError.description }));
      setShowAuthModal(true);
    }
  }, []);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://byteeit-quiz-app.ai.studio';
  const shareableUrl = baseUrl;
  const directJoinUrl = `${baseUrl}/?pin=${roomCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    soundEffects.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyShareUrl = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedShareUrl(true);
    soundEffects.playClick();
    setTimeout(() => setCopiedShareUrl(false), 2000);
  };

  const handleCopyDirectUrl = () => {
    navigator.clipboard.writeText(directJoinUrl);
    setCopiedDirectUrl(true);
    soundEffects.playClick();
    setTimeout(() => setCopiedDirectUrl(false), 2000);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEffects.enabled = next;
    if (next) soundEffects.playClick();
  };

  const modes: { id: ViewMode; label: string; icon: React.ReactNode; active: string; ring: string }[] = [
    { id: 'host', label: 'Host Presenter', icon: <Tv className="w-4 h-4" />, active: 'bg-sky border-sky-dark', ring: 'text-sky-dark' },
    { id: 'builder', label: 'Create Quiz', icon: <PlusCircle className="w-4 h-4" />, active: 'bg-grass border-grass-dark', ring: 'text-grass-dark' },
    { id: 'player', label: 'Player Join', icon: <Smartphone className="w-4 h-4" />, active: 'bg-coral border-coral-dark', ring: 'text-coral-dark' },
    { id: 'solo', label: 'Solo Practice', icon: <Target className="w-4 h-4" />, active: 'bg-grape border-grape-dark', ring: 'text-grape-dark' },
    { id: 'export', label: 'Export Drafts', icon: <Download className="w-4 h-4" />, active: 'bg-sunny border-sunny-dark', ring: 'text-sunny-dark' },
    { id: 'guide', label: 'Study Guide', icon: <BookOpen className="w-4 h-4" />, active: 'bg-sky border-sky-dark', ring: 'text-sky-dark' }
  ];

  return (
    <header className="bg-paper/95 border-b-4 border-ink/10 text-ink sticky top-0 z-50 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={byteeitLogo}
              alt="ByteeIT"
              referrerPolicy="no-referrer"
              className="h-9 sm:h-11 w-auto max-w-full shrink-0 rounded-2xl object-contain border-2 border-ink/10 shadow-sm bg-white p-0.5"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-base sm:text-lg leading-snug text-ink truncate max-w-[170px] sm:max-w-xs">
                  {quizTitle} <span aria-hidden>🎉</span>
                </h1>
                {currentUser ? (
                  <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-grass/15 border border-grass/40 text-grass-dark rounded-full shrink-0">
                    <UserCheck className="w-3 h-3" />
                    Admin: {getDisplayName(currentUser)}
                  </span>
                ) : (
                  <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-sky/15 border border-sky/40 text-sky-dark rounded-full shrink-0">
                    <ShieldCheck className="w-3 h-3" />
                    {hostName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-ink-soft font-semibold">
                <span>ByteeIT Play Studio</span>
                <span className="text-ink/20">•</span>
                <span className="inline-flex items-center gap-1 text-grass-dark font-bold">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-grass opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-grass"></span>
                  </span>
                  Live
                </span>
              </div>
            </div>
          </div>

          {/* Controls: Creator Login, Share Link, Room Code & Sound */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Creator Admin Sign In or User Badge */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 bg-grass/10 border-2 border-grass/40 text-grass-dark px-2.5 py-1.5 rounded-2xl text-xs font-bold">
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline max-w-[100px] truncate">{getDisplayName(currentUser)}</span>
                {onLogout && (
                  <button
                    onClick={() => {
                      soundEffects.playClick();
                      void onLogout();
                    }}
                    title="Sign Out Creator Account"
                    className="ml-1 hover:text-coral-dark p-0.5 rounded"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setShowAuthModal(true);
                }}
                className="btn-pop flex items-center gap-1.5 bg-white hover:bg-cream-deep text-sky-dark border-2 border-b-4 border-ink/15 px-3 py-1.5 rounded-2xl text-xs font-bold shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Creator Admin Sign In</span>
              </button>
            )}

            {/* Share Link Button */}
            <button
              onClick={() => {
                soundEffects.playClick();
                setShowShareModal(true);
              }}
              className="btn-pop flex items-center gap-1.5 bg-grape hover:brightness-105 border-2 border-b-4 border-grape-dark text-white px-3 py-1.5 rounded-2xl text-xs font-bold shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share App</span>
            </button>

            {/* Room Code Badge (only while actively hosting a room) */}
            {roomCode && (
              <>
                <div className="hidden sm:flex items-center gap-2 bg-sunny/20 border-2 border-sunny/50 rounded-2xl px-3 py-1.5 text-xs">
                  <span className="text-ink-soft uppercase font-bold">PIN:</span>
                  <span className="font-display font-extrabold text-sunny-dark tracking-wider text-sm">{roomCode}</span>
                  <button
                    onClick={handleCopyCode}
                    title="Copy Room PIN"
                    className="p-1 hover:bg-white/60 rounded text-ink-soft hover:text-ink transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-grass-dark" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Connected players indicator */}
                <div className="flex items-center gap-1.5 bg-sky/15 border-2 border-sky/40 text-sky-dark px-2.5 py-1.5 rounded-2xl text-xs font-bold" title="Connected Players">
                  <Users className="w-3.5 h-3.5" />
                  <span>{playerCount}</span>
                </div>
              </>
            )}

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-2xl border-2 transition-all ${
                soundEnabled
                  ? 'bg-white border-ink/15 text-sky-dark hover:bg-cream-deep'
                  : 'bg-cream-deep border-ink/10 text-ink-soft/60 hover:text-ink-soft'
              }`}
              title={soundEnabled ? 'Mute Audio' : 'Enable Audio'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mode Switcher Nav — single scrollable row at every breakpoint */}
        <nav className="flex items-center justify-start lg:justify-center gap-1.5 py-2 border-t-2 border-ink/10 overflow-x-auto scroll-smooth scrollbar-hide">
          {modes.map((mode) => {
            const isActive = currentMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  soundEffects.playClick();
                  setMode(mode.id);
                }}
                className={`btn-pop flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap shrink-0 border-2 transition-colors duration-150 ${
                  isActive
                    ? `${mode.active} text-white shadow-sm border-b-4`
                    : 'bg-white/70 border-transparent text-ink-soft hover:text-ink hover:bg-white'
                }`}
              >
                {mode.icon}
                <span>{mode.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Creator Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setAuthInitialError('');
        }}
        initialError={authInitialError}
      />

      {/* Share Modal Dialog */}
      {showShareModal && createPortal(
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm overflow-y-auto p-4">
          <div className="min-h-full flex items-center justify-center">
          <div className="bg-paper border-4 border-ink/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-pop-in my-8">
            <div className="flex items-center justify-between border-b-2 border-ink/10 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={byteeitLogo}
                  alt="ByteeIT Logo"
                  referrerPolicy="no-referrer"
                  className="h-8 w-auto max-w-full shrink-0 rounded-lg object-contain"
                />
                <div>
                  <h3 className="text-lg font-display font-extrabold text-ink">Share Live Quiz App</h3>
                  <p className="text-xs text-ink-soft font-semibold">ByteeIT Play Studio</p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-ink-soft hover:text-coral-dark text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-ink-soft uppercase tracking-wider block mb-1.5">
                  Public Application Web Link (Shareable with Users)
                </label>
                <div className="flex items-center gap-2 bg-cream border-2 border-ink/10 rounded-2xl p-2">
                  <Globe className="w-4 h-4 text-sky-dark shrink-0 ml-1" />
                  <input
                    type="text"
                    readOnly
                    value={shareableUrl}
                    className="w-full bg-transparent text-xs text-sky-dark font-semibold focus:outline-none select-all"
                  />
                  <button
                    onClick={handleCopyShareUrl}
                    className="btn-pop px-3 py-1.5 bg-sky border-2 border-b-4 border-sky-dark hover:brightness-105 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
                  >
                    {copiedShareUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {roomCode ? (
                <>
                  <div>
                    <label className="text-xs font-bold text-ink-soft uppercase tracking-wider block mb-1.5">
                      Game PIN for Direct Player Join
                    </label>
                    <div className="flex items-center justify-between bg-sunny/15 border-2 border-sunny/40 rounded-2xl p-3">
                      <span className="font-display text-xl font-extrabold text-sunny-dark tracking-widest">{roomCode}</span>
                      <button
                        onClick={handleCopyCode}
                        className="btn-pop px-3 py-1.5 bg-white border-2 border-b-4 border-ink/15 hover:bg-cream-deep text-ink rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-grass-dark" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied PIN' : 'Copy PIN'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Direct Invite & QR Code */}
                  <div className="bg-sky/10 border-2 border-sky/30 rounded-2xl p-4 text-xs text-sky-dark space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-bold flex items-center gap-1.5">
                        <QrCode className="w-4 h-4" /> Team Player Direct Join QR Code & Link:
                      </p>
                      <button
                        onClick={handleCopyDirectUrl}
                        className="btn-pop px-3 py-1.5 bg-sky border-2 border-b-4 border-sky-dark hover:brightness-105 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                      >
                        {copiedDirectUrl ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied Invite Link!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Team Link</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-2xl border-2 border-ink/10">
                      <QRCodeSVG
                        value={directJoinUrl}
                        size={120}
                        bgColor="#ffffff"
                        fgColor="#1189c4"
                        level="H"
                        includeMargin={true}
                        className="rounded-lg border-2 border-sky/30 bg-white p-1 shrink-0"
                      />
                      <div className="space-y-1.5 min-w-0 w-full text-center sm:text-left">
                        <span className="text-[11px] font-bold text-sky-dark uppercase tracking-wider block">
                          Scan with Phone Camera
                        </span>
                        <p className="text-[11px] text-ink-soft leading-relaxed">
                          Participants scan this QR code on mobile to automatically open the app with PIN <strong className="text-sunny-dark font-bold">{roomCode}</strong> pre-filled!
                        </p>
                        <p className="text-[11px] text-ink-soft truncate select-all bg-cream p-1.5 rounded border border-ink/10">
                          {directJoinUrl}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-ink-soft italic">
                  Start hosting a live room to get a shareable game PIN and QR code.
                </p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="btn-pop px-5 py-2 bg-cream-deep border-2 border-b-4 border-ink/15 hover:bg-cream text-ink font-bold rounded-2xl text-xs"
              >
                Done
              </button>
            </div>
          </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
