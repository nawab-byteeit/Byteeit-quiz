import React, { useState, useEffect } from 'react';
import { ViewMode } from './types';
import { onAuthChange, signOutUser, getDisplayName, type User } from './lib/supabase';
import { Header } from './components/Header';
import { HostView } from './components/HostView';
import { PlayerView } from './components/PlayerView';
import { SoloView } from './components/SoloView';
import { ExportView } from './components/ExportView';
import { StudyGuideView } from './components/StudyGuideView';
import { QuizBuilderView } from './components/QuizBuilderView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [currentMode, setMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('pin')) {
        return 'player';
      }
    }
    return 'host';
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [hostedRoom, setHostedRoom] = useState<{ roomCode: string; playerCount: number } | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthChange((user) => {
      setCurrentUser(user);
      setAuthLoaded(true);
    });
    return () => unsubAuth();
  }, []);

  // Export Drafts is a creator-only tool, hidden from guests in the nav. If a
  // user signs out while on it, send them somewhere the nav can still reach.
  useEffect(() => {
    if (authLoaded && !currentUser && currentMode === 'export') {
      setMode('host');
    }
  }, [authLoaded, currentUser, currentMode]);

  const quizTitle = hostedRoom ? undefined : 'ByteeIT Quiz Studio';

  return (
    <div className="min-h-screen bg-cream text-ink font-body antialiased selection:bg-sky selection:text-white flex flex-col relative overflow-x-hidden">
      {/* Decorative background: soft color blobs + confetti dots, fixed behind everything */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-32 -left-24 w-96 h-96 bg-sky/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] bg-grape/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 w-96 h-96 bg-sunny/25 rounded-full blur-3xl" />
        <div className="absolute inset-0 confetti-bg" />
      </div>

      {/* Top Header Navigation */}
      <Header
        currentMode={currentMode}
        setMode={setMode}
        roomCode={hostedRoom?.roomCode || ''}
        playerCount={hostedRoom?.playerCount || 0}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        hostName={getDisplayName(currentUser)}
        quizTitle={quizTitle}
        currentUser={currentUser}
        onLogout={signOutUser}
      />

      {/* Main View Container */}
      <main className="flex-1 pb-16">
        {currentMode === 'host' && authLoaded && (
          <HostView currentUser={currentUser} setMode={setMode} onActiveRoomChange={setHostedRoom} />
        )}
        {currentMode === 'builder' && authLoaded && (
          <QuizBuilderView setMode={setMode} currentUser={currentUser} />
        )}
        {currentMode === 'player' && <PlayerView />}
        {currentMode === 'solo' && <SoloView />}
        {currentMode === 'export' && <ExportView />}
        {currentMode === 'guide' && <StudyGuideView />}
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-ink/10 py-4 text-center text-xs text-ink-soft">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-display font-bold">ByteeIT Quiz Studio 🎉</span>
          <span className="font-semibold">
            {currentUser ? (
              <>
                Signed in as <strong className="text-sky-dark font-extrabold">{getDisplayName(currentUser)}</strong>
              </>
            ) : (
              'Real-Time Synchronized Play Studio'
            )}
          </span>
        </div>
      </footer>
    </div>
  );
}
