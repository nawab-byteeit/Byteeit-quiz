import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ViewMode } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { getDisplayName, type User } from '../lib/supabase';
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
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);
  const [copiedDirectUrl, setCopiedDirectUrl] = useState(false);

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

  const modes: { id: ViewMode; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'host', label: 'Host Presenter', icon: <Tv className="w-4 h-4" />, badge: 'Kahoot/Menti' },
    { id: 'builder', label: 'Create Quiz', icon: <PlusCircle className="w-4 h-4 text-emerald-400" />, badge: 'Studio' },
    { id: 'player', label: 'Player Join', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'solo', label: 'Solo Practice', icon: <Target className="w-4 h-4" /> },
    { id: 'export', label: 'Export Drafts', icon: <Download className="w-4 h-4" /> },
    { id: 'guide', label: 'Study Guide', icon: <BookOpen className="w-4 h-4" /> }
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <img
              src={byteeitLogo}
              alt="ByteeIT"
              referrerPolicy="no-referrer"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-sky-500/30 shadow-md shadow-sky-500/10"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm sm:text-base leading-snug bg-gradient-to-r from-sky-400 via-blue-200 to-white bg-clip-text text-transparent truncate max-w-[170px] sm:max-w-xs">
                  {quizTitle}
                </h1>
                {currentUser ? (
                  <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 rounded-full shrink-0">
                    <UserCheck className="w-3 h-3 text-emerald-400" />
                    Admin: {getDisplayName(currentUser)}
                  </span>
                ) : (
                  <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-sky-500/15 border border-sky-400/30 text-sky-300 rounded-full shrink-0">
                    <ShieldCheck className="w-3 h-3 text-sky-400" />
                    {hostName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">ByteeIT Platform</span>
                <span className="text-slate-600">•</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  Live
                </span>
              </div>
            </div>
          </div>

          {/* Mode Switcher Nav */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {modes.map((mode) => {
              const isActive = currentMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    soundEffects.playClick();
                    setMode(mode.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {mode.icon}
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Controls: Creator Login, Share Link, Room Code & Sound */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Creator Admin Sign In or User Badge */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 px-2.5 py-1.5 rounded-xl text-xs font-semibold">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="hidden sm:inline max-w-[100px] truncate">{getDisplayName(currentUser)}</span>
                {onLogout && (
                  <button
                    onClick={() => {
                      soundEffects.playClick();
                      void onLogout();
                    }}
                    title="Sign Out Creator Account"
                    className="ml-1 text-emerald-400 hover:text-white p-0.5 rounded"
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
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Creator Admin Sign In</span>
              </button>
            )}

            {/* Share Link Button */}
            <button
              onClick={() => {
                soundEffects.playClick();
                setShowShareModal(true);
              }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share App</span>
            </button>

            {/* Room Code Badge (only while actively hosting a room) */}
            {roomCode && (
              <>
                <div className="hidden sm:flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs">
                  <span className="text-slate-400 uppercase font-medium">PIN:</span>
                  <span className="font-mono font-bold text-amber-400 tracking-wider text-sm">{roomCode}</span>
                  <button
                    onClick={handleCopyCode}
                    title="Copy Room PIN"
                    className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Connected players indicator */}
                <div className="flex items-center gap-1.5 bg-blue-950/60 border border-blue-800/50 text-blue-300 px-2.5 py-1.5 rounded-xl text-xs font-semibold" title="Connected Players">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span>{playerCount}</span>
                </div>
              </>
            )}

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition-all ${
                soundEnabled
                  ? 'bg-slate-800 border-slate-700 text-blue-400 hover:bg-slate-700'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={soundEnabled ? 'Mute Audio' : 'Enable Audio'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Nav bar */}
        <div className="lg:hidden flex items-center justify-start sm:justify-center py-2 border-t border-slate-800/80 overflow-x-auto gap-1.5 px-2">
          {modes.map((mode) => {
            const isActive = currentMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  soundEffects.playClick();
                  setMode(mode.id);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
                  isActive ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode.icon}
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Creator Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Share Modal Dialog */}
      {showShareModal && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-4">
          <div className="min-h-full flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-up my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={byteeitLogo}
                  alt="ByteeIT Logo"
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-lg object-cover"
                />
                <div>
                  <h3 className="text-lg font-bold text-white">Share Live Quiz App</h3>
                  <p className="text-xs text-slate-400">ByteeIT Platform</p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Public Application Web Link (Shareable with Users)
                </label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2">
                  <Globe className="w-4 h-4 text-blue-400 shrink-0 ml-1" />
                  <input
                    type="text"
                    readOnly
                    value={shareableUrl}
                    className="w-full bg-transparent text-xs text-blue-300 font-mono focus:outline-none select-all"
                  />
                  <button
                    onClick={handleCopyShareUrl}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    {copiedShareUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
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
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Game PIN for Direct Player Join
                    </label>
                    <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-3">
                      <span className="font-mono text-xl font-black text-amber-400 tracking-widest">{roomCode}</span>
                      <button
                        onClick={handleCopyCode}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied PIN' : 'Copy PIN'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Direct Invite & QR Code */}
                  <div className="bg-sky-950/40 border border-sky-800/40 rounded-2xl p-4 text-xs text-sky-300 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-bold flex items-center gap-1.5 text-sky-200">
                        <QrCode className="w-4 h-4 text-sky-400" /> Team Player Direct Join QR Code & Link:
                      </p>
                      <button
                        onClick={handleCopyDirectUrl}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
                      >
                        {copiedDirectUrl ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
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

                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                      <QRCodeSVG
                        value={directJoinUrl}
                        size={120}
                        bgColor="#020617"
                        fgColor="#38bdf8"
                        level="H"
                        includeMargin={true}
                        className="rounded-lg border border-sky-500/30 bg-slate-950 p-1 shrink-0"
                      />
                      <div className="space-y-1.5 min-w-0 w-full text-center sm:text-left">
                        <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider block">
                          Scan with Phone Camera
                        </span>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Participants scan this QR code on mobile to automatically open the app with PIN <strong className="text-amber-400 font-mono font-bold">{roomCode}</strong> pre-filled!
                        </p>
                        <p className="font-mono text-[11px] text-slate-300 truncate select-all bg-slate-900 p-1.5 rounded border border-slate-800">
                          {directJoinUrl}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Start hosting a live room to get a shareable game PIN and QR code.
                </p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs"
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
