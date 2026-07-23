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

  const quizTitle = hostedRoom ? undefined : 'ByteeIT Quiz Studio';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white flex flex-col">
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
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ByteeIT Quiz Studio</span>
          <span className="text-slate-400 font-medium">
            {currentUser ? (
              <>
                Signed in as <strong className="text-sky-400 font-semibold">{getDisplayName(currentUser)}</strong>
              </>
            ) : (
              'Real-Time Synchronized Studio'
            )}
          </span>
        </div>
      </footer>
    </div>
  );
}
