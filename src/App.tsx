import React, { useState, useEffect } from 'react';
import { ViewMode, RoomState } from './types';
import { syncEngine } from './lib/syncEngine';
import { onAuthChange, logoutUser } from './lib/firebase';
import { User } from 'firebase/auth';
import { Header } from './components/Header';
import { HostView } from './components/HostView';
import { PlayerView } from './components/PlayerView';
import { SoloView } from './components/SoloView';
import { ExportView } from './components/ExportView';
import { StudyGuideView } from './components/StudyGuideView';
import { QuizBuilderView } from './components/QuizBuilderView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentMode, setMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('pin')) {
        return 'player';
      }
    }
    return 'host';
  });
  const [roomState, setRoomState] = useState<RoomState>(syncEngine.currentState);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Subscribe to Firebase Auth
  useEffect(() => {
    const unsubAuth = onAuthChange((user) => {
      setCurrentUser(user);
      if (user) {
        const creatorName = user.displayName || user.email?.split('@')[0] || 'Nawab Khan';
        syncEngine.setHostName(creatorName);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((newState) => {
      setRoomState(newState);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white flex flex-col">
      {/* Top Header Navigation */}
      <Header
        currentMode={currentMode}
        setMode={setMode}
        roomCode={roomState.roomCode}
        playerCount={roomState.players.length}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        hostName={currentUser?.displayName || currentUser?.email?.split('@')[0] || roomState.hostName || 'Nawab Khan'}
        quizTitle={roomState.quizTitle || 'Google AI & Cloud Quiz'}
        isServerConnected={roomState.isServerConnected !== false}
        currentUser={currentUser}
        onLogout={logoutUser}
      />

      {/* Main View Container */}
      <main className="flex-1 pb-16">
        {currentMode === 'host' && <HostView roomState={roomState} currentUser={currentUser} />}
        {currentMode === 'builder' && <QuizBuilderView setMode={setMode} currentRoomCode={roomState.roomCode} currentUser={currentUser} />}
        {currentMode === 'player' && <PlayerView roomState={roomState} />}
        {currentMode === 'solo' && <SoloView />}
        {currentMode === 'export' && <ExportView />}
        {currentMode === 'guide' && <StudyGuideView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{roomState.quizTitle || 'Google AI & Cloud Master Quiz'} • ByteeIT Platform</span>
          <span className="text-slate-400 font-medium">
            Hosted by <strong className="text-sky-400 font-semibold">{currentUser?.displayName || currentUser?.email?.split('@')[0] || roomState.hostName || 'Nawab Khan'}</strong> • Real-Time Synchronized Studio
          </span>
        </div>
      </footer>
    </div>
  );
}
