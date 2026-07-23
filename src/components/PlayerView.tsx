import React, { useState, useEffect } from 'react';
import { RoomState, Player } from '../types';
import { QUESTIONS } from '../data/questions';
import { syncEngine } from '../lib/syncEngine';
import { soundEffects } from '../lib/audio';
import { User, Flame, CheckCircle2, XCircle, Clock, Zap, Sparkles, ShieldCheck } from 'lucide-react';
import byteeitLogo from '../assets/images/byteeit_logo_1784809227570.jpg';

interface PlayerViewProps {
  roomState: RoomState;
}

export const PlayerView: React.FC<PlayerViewProps> = ({ roomState }) => {
  const [nickname, setNickname] = useState('');
  const [customPin, setCustomPin] = useState(roomState.roomCode);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());

  const filteredQuestions = syncEngine.getFilteredQuestions();
  const currentQ = filteredQuestions[roomState.currentQuestionIndex] || QUESTIONS[0];

  // Try auto-restoring player or checking URL pin
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlPin = urlParams.get('pin');
      if (urlPin && urlPin.toUpperCase() !== roomState.roomCode) {
        setCustomPin(urlPin.toUpperCase());
        syncEngine.setRoomCode(urlPin.toUpperCase());
      }
    }

    const savedName = localStorage.getItem('gcp_quiz_player_name');
    if (savedName && !currentPlayer) {
      const p = syncEngine.joinRoom(savedName);
      setCurrentPlayer(p);
    }
  }, []);

  // Update current player score when room state changes
  useEffect(() => {
    if (currentPlayer) {
      const updated = roomState.players.find((p) => p.id === currentPlayer.id);
      if (updated) {
        setCurrentPlayer(updated);
      }
    }
  }, [roomState.players]);

  // Reset selected option when question changes
  useEffect(() => {
    if (roomState.status === 'question') {
      setSelectedOption(null);
      setStartTime(Date.now());
    }
  }, [roomState.currentQuestionIndex, roomState.status]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    soundEffects.playClick();
    if (customPin && customPin.toUpperCase() !== roomState.roomCode) {
      syncEngine.setRoomCode(customPin.toUpperCase());
    }

    localStorage.setItem('gcp_quiz_player_name', nickname.trim());
    const p = syncEngine.joinRoom(nickname.trim());
    setCurrentPlayer(p);
  };

  const handleSelectAnswer = (optionIdx: number) => {
    if (selectedOption !== null || !currentPlayer || roomState.status !== 'question') return;

    soundEffects.playClick();
    setSelectedOption(optionIdx);

    const timeTakenSec = Math.min(
      currentQ.timeLimit || 30,
      Math.max(1, Math.round((Date.now() - startTime) / 1000))
    );

    syncEngine.submitPlayerAnswer(currentPlayer.id, optionIdx, timeTakenSec);
  };

  // Kahoot color button themes
  const buttons = [
    {
      idx: 0,
      label: 'A',
      symbol: '▲',
      bg: 'bg-red-600 hover:bg-red-500 active:bg-red-700',
      border: 'border-red-400/40',
      text: 'text-red-100'
    },
    {
      idx: 1,
      label: 'B',
      symbol: '◆',
      bg: 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700',
      border: 'border-blue-400/40',
      text: 'text-blue-100'
    },
    {
      idx: 2,
      label: 'C',
      symbol: '●',
      bg: 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600',
      border: 'border-amber-400/40',
      text: 'text-amber-100'
    },
    {
      idx: 3,
      label: 'D',
      symbol: '■',
      bg: 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700',
      border: 'border-emerald-400/40',
      text: 'text-emerald-100'
    }
  ];

  // 1. Player Not Joined Form
  if (!currentPlayer) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
          <div className="relative inline-block">
            <img
              src={byteeitLogo}
              alt="ByteeIT Logo"
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500/50 shadow-xl shadow-blue-500/20 mx-auto"
            />
            <span className="absolute -bottom-1 -right-1 bg-blue-600 text-[10px] font-black px-1.5 py-0.5 rounded text-white border border-slate-900">
              IT
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-white">Join Quiz Game</h2>
            <p className="text-slate-400 text-xs mt-1">
              Hosted by <strong className="text-blue-300 font-semibold">{roomState.hostName || 'Nawab Khan'}</strong> • ByteeIT Platform
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-left mb-1">
                  Room Game PIN
                </label>
                <input
                  type="text"
                  placeholder="Room PIN"
                  value={customPin}
                  onChange={(e) => setCustomPin(e.target.value.toUpperCase())}
                  maxLength={12}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-amber-400 font-mono font-bold text-center tracking-widest focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-left mb-1">
                  Player Nickname
                </label>
                <input
                  type="text"
                  placeholder="Enter Nickname (e.g. CloudMaster)"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={20}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-center font-bold text-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!nickname.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-lg shadow-blue-600/30 text-sm transition-all"
            >
              Ready to Play
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Waiting in Lobby
  if (roomState.status === 'lobby') {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
            <Sparkles className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-white">You're in, {currentPlayer.name}!</h3>
            <p className="text-slate-400 text-xs mt-2">
              Waiting for host <strong className="text-blue-300 font-semibold">{roomState.hostName || 'Nawab Khan'}</strong> to start...
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
            <p>Room PIN: <span className="font-mono font-bold text-amber-400">{roomState.roomCode}</span></p>
            <p>Scope: <span className="text-blue-400 font-semibold">{syncEngine.getFilteredQuestions().length} Questions</span></p>
          </div>

          <button
            onClick={() => {
              setCurrentPlayer(null);
              localStorage.removeItem('gcp_quiz_player_name');
            }}
            className="text-xs text-slate-500 underline hover:text-slate-300"
          >
            Change Nickname / Leave Room
          </button>
        </div>
      </div>
    );
  }

  // 3. Answer Revealed / Feedback screen
  if (roomState.status === 'revealed' || roomState.status === 'leaderboard' || roomState.status === 'finished') {
    const isCorrect = currentPlayer.lastAnswer?.questionId === currentQ.id && currentPlayer.lastAnswer?.isCorrect;
    const pointsAwarded = currentPlayer.lastAnswer?.questionId === currentQ.id ? currentPlayer.lastAnswer?.pointsEarned || 0 : 0;

    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className={`border rounded-2xl p-8 shadow-2xl text-center space-y-6 ${
          isCorrect ? 'bg-emerald-950/90 border-emerald-500/50' : 'bg-red-950/90 border-red-500/50'
        }`}>
          {isCorrect ? (
            <>
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
              <div>
                <h3 className="text-3xl font-black text-emerald-200">CORRECT!</h3>
                <p className="text-emerald-300 font-mono text-xl font-bold mt-1">+{pointsAwarded} Pts</p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 text-red-400 mx-auto" />
              <div>
                <h3 className="text-2xl font-black text-red-200">INCORRECT</h3>
                <p className="text-slate-300 text-xs mt-1">
                  Correct Answer: <span className="font-bold text-emerald-300">{currentQ.correctAnswerText}</span>
                </p>
              </div>
            </>
          )}

          {/* Player Score Stats */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
            <div>
              <span className="text-slate-400 block">Total Score</span>
              <span className="font-mono font-bold text-amber-400 text-base">{currentPlayer.score} Pts</span>
            </div>
            <div>
              <span className="text-slate-400 block">Streak</span>
              <span className="font-bold text-red-400 text-base flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 fill-current" />
                {currentPlayer.streak}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Answer Keypad during Question State
  const hasAnswered = selectedOption !== null;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Top Player Info Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-white font-bold">
          <User className="w-4 h-4 text-blue-400" />
          <span>{currentPlayer.name}</span>
        </div>
        <div className="flex items-center gap-3 font-mono font-bold">
          <span className="text-amber-400">{currentPlayer.score} Pts</span>
          {currentPlayer.streak > 0 && (
            <span className="text-red-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-current" />
              {currentPlayer.streak}
            </span>
          )}
        </div>
      </div>

      {/* Question Snippet */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
          <span>Q{roomState.currentQuestionIndex + 1} of {filteredQuestions.length}</span>
          <span className="flex items-center gap-1 text-blue-400 font-mono font-bold">
            <Clock className="w-3.5 h-3.5" />
            {roomState.timerRemaining}s
          </span>
        </div>
        <h3 className="text-base font-bold text-white leading-snug">
          {currentQ.question}
        </h3>
      </div>

      {/* Answer Submitted Confirmation overlay */}
      {hasAnswered ? (
        <div className="bg-slate-900 border border-blue-500/40 rounded-2xl p-8 text-center space-y-3 animate-fade-in">
          <Zap className="w-12 h-12 text-blue-400 mx-auto animate-pulse" />
          <h4 className="text-lg font-bold text-white">Answer Submitted!</h4>
          <p className="text-xs text-slate-400">Waiting for time to run out or host to reveal answer...</p>
        </div>
      ) : (
        /* Kahoot Style Big Color Keypad */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {buttons.map((btn) => {
            const optionText = currentQ.options[btn.idx];
            return (
              <button
                key={btn.idx}
                onClick={() => handleSelectAnswer(btn.idx)}
                className={`p-5 rounded-2xl border ${btn.border} ${btn.bg} shadow-lg transition-transform active:scale-95 flex flex-col items-start text-left space-y-2 group`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xl font-black text-white">{btn.symbol}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-black/20 text-white">
                    Option {btn.label}
                  </span>
                </div>
                <p className={`text-sm font-bold leading-tight ${btn.text}`}>
                  {optionText}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
