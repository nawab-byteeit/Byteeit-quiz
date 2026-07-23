import React, { useEffect, useRef, useState } from 'react';
import { ViewMode } from '../types';
import { soundEffects } from '../lib/audio';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import { type User, getDisplayName } from '../lib/supabase';
import {
  LiveRoom,
  subscribeToRoom,
  findRoomIdByCode,
  startQuiz,
  revealAnswer,
  nextQuestion,
  showLeaderboard,
  resetRoom,
  loadActiveHostRoomCode,
  clearActiveHostRoomCode
} from '../lib/rooms';
import { Play, Eye, Trophy, ArrowRight, RotateCcw, Users, CheckCircle2, Sparkles, BarChart3, Copy, Smartphone, PlusCircle, LogIn, ShieldCheck } from 'lucide-react';

interface HostViewProps {
  currentUser: User | null;
  setMode: (mode: ViewMode) => void;
  onActiveRoomChange: (info: { roomCode: string; playerCount: number } | null) => void;
}

export const HostView: React.FC<HostViewProps> = ({ currentUser, setMode, onActiveRoomChange }) => {
  const [room, setRoom] = useState<LiveRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const revealedForQuestion = useRef<number | null>(null);

  // Resolve which room (if any) this authenticated host is currently running.
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      setRoom(null);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    const resume = async () => {
      setLoading(true);
      const storedCode = loadActiveHostRoomCode();
      if (!storedCode) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }
      try {
        const roomId = await findRoomIdByCode(storedCode);
        if (!roomId) {
          clearActiveHostRoomCode();
          if (!cancelled) setLoading(false);
          return;
        }
        unsubscribe = subscribeToRoom(
          roomId,
          (liveRoom) => {
            if (cancelled) return;
            if (liveRoom && liveRoom.hostId !== currentUser.id) {
              // Stale code pointing at someone else's room -- forget it.
              clearActiveHostRoomCode();
              setRoom(null);
              setLoading(false);
              return;
            }
            setRoom(liveRoom);
            setLoading(false);
          },
          (err) => {
            if (!cancelled) {
              setLoadError(err.message);
              setLoading(false);
            }
          }
        );
      } catch (err: any) {
        if (!cancelled) {
          setLoadError(err.message || 'Failed to load room');
          setLoading(false);
        }
      }
    };

    resume();

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser?.id]);

  // Report the active room up to the app shell (for the header PIN badge).
  useEffect(() => {
    if (room) {
      onActiveRoomChange({ roomCode: room.roomCode, playerCount: room.players.length });
    } else {
      onActiveRoomChange(null);
    }
  }, [room, onActiveRoomChange]);

  const currentQ = room?.questions[room.currentQuestionIndex];

  // Countdown timer, derived from question_started_at (no per-second DB writes).
  useEffect(() => {
    if (!room || room.status !== 'question' || !room.questionStartedAt) {
      setTimerRemaining(0);
      return;
    }
    const startedAt = new Date(room.questionStartedAt).getTime();
    const limit = room.timeLimit;

    const tick = () => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const remaining = Math.max(0, Math.ceil(limit - elapsed));
      setTimerRemaining(remaining);

      if (remaining <= 5 && remaining > 0) soundEffects.playTick(true);

      if (remaining === 0 && revealedForQuestion.current !== room.currentQuestionIndex) {
        revealedForQuestion.current = room.currentQuestionIndex;
        soundEffects.playCorrect();
        revealAnswer(room.id).catch(() => {});
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [room?.id, room?.status, room?.questionStartedAt, room?.timeLimit, room?.currentQuestionIndex]);

  useEffect(() => {
    if (room?.status === 'finished' || room?.status === 'leaderboard') {
      soundEffects.playFanfare();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
  }, [room?.status]);

  const runAction = (action: () => Promise<void>) => {
    soundEffects.playClick();
    action().catch((err: any) => alert(err.message || 'Action failed'));
  };

  const shapes = [
    { name: 'A', bg: 'bg-red-500', text: 'text-red-400' },
    { name: 'B', bg: 'bg-blue-500', text: 'text-blue-400' },
    { name: 'C', bg: 'bg-amber-500', text: 'text-amber-400' },
    { name: 'D', bg: 'bg-emerald-500', text: 'text-emerald-400' }
  ];

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="inline-flex p-3 bg-sky-500/10 border border-sky-500/30 rounded-2xl text-sky-400">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-white">Sign In to Host a Live Room</h2>
        <p className="text-slate-400 text-sm">
          Use the "Creator Admin Sign In" button in the top navigation to sign in, then head to "Create Quiz" to build and launch a live session.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-16 text-center text-slate-400 text-sm">Loading your room…</div>;
  }

  if (loadError) {
    return <div className="max-w-2xl mx-auto px-4 py-16 text-center text-red-400 text-sm">{loadError}</div>;
  }

  if (!room || !currentQ) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="inline-flex p-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-blue-400">
          <PlusCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-white">No Live Room Yet</h2>
        <p className="text-slate-400 text-sm">
          Head to "Create Quiz" to build or pick a quiz, then click "Launch & Host Live Room" to start a session here.
        </p>
        <button
          onClick={() => {
            soundEffects.playClick();
            setMode('builder');
          }}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold rounded-2xl shadow-xl shadow-emerald-600/25 inline-flex items-center gap-2 text-sm transition-all"
        >
          <LogIn className="w-4 h-4" />
          <span>Go to Create Quiz</span>
        </button>
      </div>
    );
  }

  // Calculate live answers distribution for current question
  const currentQAnswers = room.questionAnswers[currentQ.id] || {};
  const totalSubmissions = Object.keys(currentQAnswers).length;
  const optionCounts = [0, 0, 0, 0];
  Object.values(currentQAnswers).forEach((ans: LiveRoom['questionAnswers'][number][string]) => {
    if (ans.optionIndex >= 0 && ans.optionIndex <= 3) optionCounts[ans.optionIndex]++;
  });

  // Render Lobby
  if (room.status === 'lobby') {
    const joinUrl = `${window.location.origin}/?pin=${room.roomCode}`;
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-8 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-950/80 border border-slate-800 rounded-full text-xs font-semibold text-slate-300 mb-3 shadow-sm">
              <span className="text-sky-400 font-bold">Presenter / Host Mode</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Host: {room.hostName || getDisplayName(currentUser)}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">{room.quizTitle}</h2>
            <p className="text-slate-400 max-w-xl mx-auto mt-2 text-sm">
              Kahoot &amp; Mentimeter style real-time synchronized quiz platform. Share the link or PIN below with players!
            </p>
          </div>

          {/* Room PIN & QR Code Display */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 max-w-2xl mx-auto shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left flex-1">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center md:justify-start gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Join Game PIN
              </p>
              <div className="text-5xl font-black font-mono text-amber-400 tracking-widest my-1 select-all">
                {room.roomCode}
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Scan the QR code with any mobile camera or enter the PIN at <br className="hidden sm:block" />
                <strong className="text-sky-300 font-mono font-semibold">{window.location.origin}</strong>
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(joinUrl);
                    soundEffects.playClick();
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Copied Join Link!' : 'Copy Player Share Link'}</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex flex-col items-center gap-2 shrink-0 shadow-lg">
              <QRCodeSVG
                value={joinUrl}
                size={140}
                bgColor="#020617"
                fgColor="#38bdf8"
                level="H"
                includeMargin={true}
                className="rounded-xl border border-sky-500/30 bg-slate-950 p-1"
              />
              <span className="text-[11px] font-bold text-sky-300 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-sky-400" /> Scan QR to Join Live
              </span>
            </div>
          </div>

          {/* Connected Players list */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-400" />
                Connected Players ({room.players.length})
              </span>
              <span className="text-slate-500">Ready to play</span>
            </div>
            {room.players.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">
                No players joined yet. Share the PIN or QR code above!
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 justify-center">
                {room.players.map((p) => (
                  <span
                    key={p.id}
                    className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-blue-300 font-medium animate-fade-in"
                  >
                    👤 {p.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => runAction(() => startQuiz(room.id, room.questions))}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl text-lg shadow-xl shadow-blue-600/30 flex items-center gap-3 mx-auto transition-transform hover:scale-105 active:scale-95"
            >
              <Play className="w-6 h-6 fill-current" />
              <span>Start Live Quiz</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Leaderboard / Finished
  if (room.status === 'leaderboard' || room.status === 'finished') {
    const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
    const top3 = sortedPlayers.slice(0, 3);

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold uppercase tracking-widest">
              <Trophy className="w-4 h-4 text-amber-400" />
              {room.status === 'finished' ? 'Final Game Podium' : 'Current Leaderboard'}
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
              {room.status === 'finished' ? 'Quiz Completed! 🎉' : 'Top Performers'}
            </h2>
          </div>

          {sortedPlayers.length > 0 ? (
            <div className="flex justify-center items-end gap-3 sm:gap-6 pt-8 pb-4">
              {top3[1] && (
                <div className="flex flex-col items-center">
                  <span className="text-xs text-slate-400 font-bold mb-1">{top3[1].name}</span>
                  <span className="text-xs text-amber-300 font-mono mb-1">{top3[1].score} pts</span>
                  <div className="w-20 sm:w-28 bg-slate-800 border-t-4 border-slate-400 h-28 rounded-t-xl flex items-center justify-center font-black text-2xl text-slate-300 shadow-lg">
                    🥈 2
                  </div>
                </div>
              )}
              {top3[0] && (
                <div className="flex flex-col items-center">
                  <div className="animate-bounce">
                    <Trophy className="w-8 h-8 text-amber-400 mb-1" />
                  </div>
                  <span className="text-sm font-extrabold text-white mb-1">{top3[0].name}</span>
                  <span className="text-xs text-amber-400 font-mono font-bold mb-1">{top3[0].score} pts</span>
                  <div className="w-24 sm:w-32 bg-gradient-to-b from-amber-500 to-amber-700 h-36 rounded-t-xl flex items-center justify-center font-black text-3xl text-white shadow-xl shadow-amber-500/20">
                    🥇 1
                  </div>
                </div>
              )}
              {top3[2] && (
                <div className="flex flex-col items-center">
                  <span className="text-xs text-slate-400 font-bold mb-1">{top3[2].name}</span>
                  <span className="text-xs text-amber-300 font-mono mb-1">{top3[2].score} pts</span>
                  <div className="w-20 sm:w-28 bg-slate-800 border-t-4 border-amber-700 h-20 rounded-t-xl flex items-center justify-center font-black text-xl text-amber-600 shadow-lg">
                    🥉 3
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">No connected players scored points yet.</p>
          )}

          {sortedPlayers.length > 3 && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 max-w-xl mx-auto text-left">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Rankings</h4>
              <div className="divide-y divide-slate-800/60">
                {sortedPlayers.slice(3).map((p, idx) => (
                  <div key={p.id} className="py-2 flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500">#{idx + 4}</span>
                      <span className="font-medium text-white">{p.name}</span>
                    </div>
                    <span className="font-mono text-amber-400">{p.score} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            {room.status === 'leaderboard' && (
              <button
                onClick={() => runAction(() => nextQuestion(room.id, room.questions, room.currentQuestionIndex))}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => runAction(() => resetRoom(room.id))}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm flex items-center gap-2 border border-slate-700"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Back to Lobby</span>
            </button>

            {room.status === 'finished' && (
              <button
                onClick={() => {
                  soundEffects.playClick();
                  clearActiveHostRoomCode();
                  setRoom(null);
                  setMode('builder');
                }}
                className="px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Host a New Quiz</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Question or Revealed Screen
  const isRevealed = room.status === 'revealed';

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {currentQ.sessionTitle && (
              <span className="px-2.5 py-0.5 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-full text-xs font-bold">
                {currentQ.sessionTitle}
              </span>
            )}
            <span className="text-xs text-slate-400 font-mono">
              Q{room.currentQuestionIndex + 1} of {room.questions.length}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {totalSubmissions} of {Math.max(1, room.players.length)} player responses recorded
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-black text-2xl font-mono shadow-inner transition-colors ${
              timerRemaining <= 5
                ? 'border-red-500 text-red-400 bg-red-950/40 animate-pulse'
                : 'border-blue-500 text-blue-300 bg-slate-950'
            }`}
          >
            {timerRemaining}
          </div>

          <div className="flex items-center gap-2">
            {!isRevealed ? (
              <button
                onClick={() => runAction(() => revealAnswer(room.id))}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
              >
                <Eye className="w-4 h-4" />
                <span>Reveal Answer</span>
              </button>
            ) : (
              <button
                onClick={() => runAction(() => showLeaderboard(room.id))}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
              >
                <Trophy className="w-4 h-4" />
                <span>Leaderboard</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <h2 className="text-xl sm:text-2xl font-bold text-white leading-relaxed mb-6">{currentQ.question}</h2>

        <div className="my-8">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            <span className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Live Response Distribution
            </span>
            <span>{totalSubmissions} Total Answers</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end h-44 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
            {shapes.map((shape, idx) => {
              const count = optionCounts[idx];
              const percentage = totalSubmissions > 0 ? Math.round((count / totalSubmissions) * 100) : 0;
              const isCorrectOption = isRevealed && currentQ.correctAnswer === idx;

              return (
                <div key={shape.name} className="flex flex-col items-center h-full justify-end relative group">
                  <span className="text-xs font-bold font-mono text-slate-300 mb-1">{percentage}%</span>
                  <div className="w-full bg-slate-800/80 rounded-t-xl overflow-hidden flex items-end h-full relative">
                    <div
                      className={`w-full transition-all duration-500 rounded-t-xl ${
                        isRevealed ? (isCorrectOption ? 'bg-emerald-500' : 'bg-slate-700 opacity-40') : shape.bg
                      }`}
                      style={{ height: `${count > 0 ? Math.max(12, percentage) : 0}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 mt-1">{count} votes</span>
                  <div
                    className={`mt-1 px-2 py-0.5 rounded text-xs font-black ${
                      isCorrectOption ? 'bg-emerald-500 text-white' : `${shape.bg} text-white`
                    }`}
                  >
                    {shape.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          {currentQ.options.map((opt, idx) => {
            const isCorrect = isRevealed && idx === currentQ.correctAnswer;
            const shape = shapes[idx];

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all text-sm font-medium flex items-start gap-3 ${
                  isRevealed
                    ? isCorrect
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100 shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-950/50 border-slate-800 text-slate-500 opacity-60'
                    : 'bg-slate-950 border-slate-800 text-slate-200'
                }`}
              >
                <span className={`px-2 py-1 rounded text-xs font-extrabold text-white ${shape.bg} shrink-0`}>
                  {shape.name}
                </span>
                <span className="flex-1">{opt}</span>
                {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
              </div>
            );
          })}
        </div>

        {isRevealed && (
          <div className="mt-6 p-5 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl space-y-2 animate-fade-in">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Correct Answer & Knowledge Brief:</span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">{currentQ.explanation}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <button
          onClick={() => runAction(() => resetRoom(room.id))}
          className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          Reset Room
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => runAction(() => showLeaderboard(room.id))}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg border border-slate-700 flex items-center gap-1.5"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Show Leaderboard</span>
          </button>

          <button
            onClick={() => runAction(() => nextQuestion(room.id, room.questions, room.currentQuestionIndex))}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-md flex items-center gap-1.5"
          >
            <span>Next Question</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
