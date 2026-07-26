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

const CONFETTI_COLORS = ['#2fb8f0', '#ff5d6c', '#ffc93c', '#2fbe72', '#9b6bff'];

export const HostView: React.FC<HostViewProps> = ({ currentUser, setMode, onActiveRoomChange }) => {
  const [room, setRoom] = useState<LiveRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const revealedForQuestion = useRef<number | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Resolve which room (if any) this authenticated host is currently running.
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      setRoom(null);
      return;
    }

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
        if (cancelled) return;
        if (!roomId) {
          clearActiveHostRoomCode();
          setLoading(false);
          return;
        }
        // Guard against React StrictMode's mount/cleanup/remount cycle: if an
        // earlier invocation's subscription is still live, tear it down first
        // so we never register two Realtime channels on the same room topic.
        unsubscribeRef.current?.();
        unsubscribeRef.current = subscribeToRoom(
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
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
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
      confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 }, colors: CONFETTI_COLORS });
    }
  }, [room?.status]);

  const runAction = (action: () => Promise<void>) => {
    soundEffects.playClick();
    action().catch((err: any) => alert(err.message || 'Action failed'));
  };

  const shapes = [
    { name: 'A', symbol: '▲', bg: 'bg-coral', border: 'border-coral-dark', text: 'text-coral-dark' },
    { name: 'B', symbol: '◆', bg: 'bg-sky', border: 'border-sky-dark', text: 'text-sky-dark' },
    { name: 'C', symbol: '●', bg: 'bg-sunny', border: 'border-sunny-dark', text: 'text-sunny-dark' },
    { name: 'D', symbol: '■', bg: 'bg-grass', border: 'border-grass-dark', text: 'text-grass-dark' }
  ];

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="inline-flex p-4 bg-sky/10 border-2 border-sky/30 rounded-3xl text-sky-dark">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-display font-extrabold text-ink">Sign In to Host a Live Room</h2>
        <p className="text-ink-soft text-sm font-medium">
          Use the "Creator Admin Sign In" button in the top navigation to sign in, then head to "Create Quiz" to build and launch a live session.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-16 text-center text-ink-soft text-sm font-semibold">Loading your room…</div>;
  }

  if (loadError) {
    return <div className="max-w-2xl mx-auto px-4 py-16 text-center text-coral-dark text-sm font-semibold">{loadError}</div>;
  }

  if (!room || !currentQ) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="inline-flex p-4 bg-grape/10 border-2 border-grape/30 rounded-3xl text-grape-dark">
          <PlusCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-display font-extrabold text-ink">No Live Room Yet</h2>
        <p className="text-ink-soft text-sm font-medium">
          Head to "Create Quiz" to build or pick a quiz, then click "Launch & Host Live Room" to start a session here.
        </p>
        <button
          onClick={() => {
            soundEffects.playClick();
            setMode('builder');
          }}
          className="btn-pop px-6 py-3 bg-grass border-2 border-b-4 border-grass-dark hover:brightness-105 text-white font-display font-extrabold rounded-2xl shadow-md inline-flex items-center gap-2 text-sm"
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
        <div className="bg-white border-4 border-ink/10 rounded-[2rem] p-5 sm:p-8 shadow-xl text-center space-y-8 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-grape/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-3.5 py-1.5 max-w-full bg-cream border-2 border-ink/10 rounded-2xl sm:rounded-full text-xs font-bold text-ink-soft mb-3 shadow-sm">
              <span className="text-sky-dark font-bold">🎤 Presenter / Host Mode</span>
              <span className="text-ink/20 hidden sm:inline">•</span>
              <span className="text-grass-dark font-bold flex items-center gap-1.5 max-w-full">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-grass opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-grass"></span>
                </span>
                <span className="truncate max-w-[180px] sm:max-w-none">Host: {room.hostName || getDisplayName(currentUser)}</span>
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-ink mt-1">{room.quizTitle}</h2>
            <p className="text-ink-soft max-w-xl mx-auto mt-2 text-sm font-medium">
              Jump in, answer fast, and climb the leaderboard! Share the link or PIN below with players. 🚀
            </p>
          </div>

          {/* Room PIN & QR Code Display */}
          <div className="bg-cream border-2 border-ink/10 rounded-[1.75rem] p-4 sm:p-6 max-w-2xl mx-auto shadow-inner flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left flex-1 min-w-0">
              <p className="text-ink-soft text-xs font-bold uppercase tracking-widest flex items-center justify-center md:justify-start gap-1.5">
                <Sparkles className="w-4 h-4 text-sunny-dark" />
                Join Game PIN
              </p>
              <div className="font-display text-4xl sm:text-5xl font-extrabold text-sunny-dark tracking-wider sm:tracking-widest my-1 select-all">
                {room.roomCode}
              </div>
              <p className="text-ink-soft text-xs leading-relaxed font-medium">
                Scan the QR code with any mobile camera or enter the PIN at <br className="hidden sm:block" />
                <strong className="text-sky-dark font-bold">{window.location.origin}</strong>
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(joinUrl);
                    soundEffects.playClick();
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="btn-pop px-4 py-2 bg-white hover:bg-white text-sky-dark border-2 border-b-4 border-ink/15 rounded-2xl text-xs font-bold inline-flex items-center gap-2 shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Copied Join Link!' : 'Copy Player Share Link'}</span>
                </button>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border-2 border-ink/10 flex flex-col items-center gap-2 shrink-0 shadow-md">
              <QRCodeSVG
                value={joinUrl}
                size={140}
                bgColor="#ffffff"
                fgColor="#1189c4"
                level="H"
                includeMargin={true}
                className="rounded-xl border-2 border-sky/30 bg-white p-1"
              />
              <span className="text-[11px] font-bold text-sky-dark flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" /> Scan QR to Join Live
              </span>
            </div>
          </div>

          {/* Connected Players list */}
          <div className="bg-cream border-2 border-ink/10 rounded-2xl p-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3 text-xs font-bold text-ink-soft">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-sky-dark" />
                Connected Players ({room.players.length})
              </span>
              <span className="text-ink-soft/70">Ready to play</span>
            </div>
            {room.players.length === 0 ? (
              <p className="text-xs text-ink-soft/70 italic py-4">
                No players joined yet. Share the PIN or QR code above!
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 justify-center">
                {room.players.map((p) => (
                  <span
                    key={p.id}
                    className="px-3 py-1 bg-white border-2 border-sky/30 rounded-full text-xs text-sky-dark font-bold animate-pop-in"
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
              className="btn-pop px-8 py-4 bg-grass border-4 border-b-8 border-grass-dark hover:brightness-105 text-white font-display font-extrabold rounded-2xl text-lg shadow-lg flex items-center gap-3 mx-auto"
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
        <div className="bg-white border-4 border-ink/10 rounded-[2rem] p-8 shadow-xl text-center space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-sunny/15 text-sunny-dark border-2 border-sunny/40 rounded-full text-xs font-bold uppercase tracking-widest">
              <Trophy className="w-4 h-4" />
              {room.status === 'finished' ? 'Final Game Podium' : 'Current Leaderboard'}
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-ink mt-3">
              {room.status === 'finished' ? 'Quiz Completed! 🎉' : 'Top Performers'}
            </h2>
          </div>

          {sortedPlayers.length > 0 ? (
            <div className="flex justify-center items-end gap-3 sm:gap-6 pt-8 pb-4">
              {top3[1] && (
                <div className="flex flex-col items-center">
                  <span className="text-xs text-ink-soft font-bold mb-1">{top3[1].name}</span>
                  <span className="text-xs text-sky-dark font-bold mb-1">{top3[1].score} pts</span>
                  <div className="w-20 sm:w-28 bg-sky/20 border-t-4 border-sky rounded-t-2xl h-28 flex items-center justify-center font-display font-extrabold text-2xl text-sky-dark shadow-inner">
                    🥈 2
                  </div>
                </div>
              )}
              {top3[0] && (
                <div className="flex flex-col items-center">
                  <div className="animate-bounce">
                    <Trophy className="w-8 h-8 text-sunny-dark mb-1" />
                  </div>
                  <span className="text-sm font-display font-extrabold text-ink mb-1">{top3[0].name}</span>
                  <span className="text-xs text-sunny-dark font-bold mb-1">{top3[0].score} pts</span>
                  <div className="w-24 sm:w-32 bg-gradient-to-b from-sunny to-sunny-dark h-36 rounded-t-2xl flex items-center justify-center font-display font-extrabold text-3xl text-white shadow-lg">
                    🥇 1
                  </div>
                </div>
              )}
              {top3[2] && (
                <div className="flex flex-col items-center">
                  <span className="text-xs text-ink-soft font-bold mb-1">{top3[2].name}</span>
                  <span className="text-xs text-coral-dark font-bold mb-1">{top3[2].score} pts</span>
                  <div className="w-20 sm:w-28 bg-coral/20 border-t-4 border-coral rounded-t-2xl h-20 flex items-center justify-center font-display font-extrabold text-xl text-coral-dark shadow-inner">
                    🥉 3
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-ink-soft text-sm font-medium">No connected players scored points yet.</p>
          )}

          {sortedPlayers.length > 3 && (
            <div className="bg-cream border-2 border-ink/10 rounded-2xl p-4 max-w-xl mx-auto text-left">
              <h4 className="text-xs font-bold text-ink-soft uppercase tracking-wider mb-3">Rankings</h4>
              <div className="divide-y divide-ink/10">
                {sortedPlayers.slice(3).map((p, idx) => (
                  <div key={p.id} className="py-2 flex items-center justify-between text-xs text-ink-soft font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="text-ink-soft/60">#{idx + 4}</span>
                      <span className="font-bold text-ink">{p.name}</span>
                    </div>
                    <span className="text-sunny-dark font-bold">{p.score} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            {room.status === 'leaderboard' && (
              <button
                onClick={() => runAction(() => nextQuestion(room.id, room.questions, room.currentQuestionIndex))}
                className="btn-pop px-6 py-3 bg-sky border-2 border-b-4 border-sky-dark hover:brightness-105 text-white font-bold rounded-2xl text-sm flex items-center gap-2 shadow-md"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => runAction(() => resetRoom(room.id))}
              className="btn-pop px-6 py-3 bg-white hover:bg-cream text-ink-soft font-bold rounded-2xl text-sm flex items-center gap-2 border-2 border-b-4 border-ink/15"
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
                className="btn-pop px-6 py-3 bg-grass border-2 border-b-4 border-grass-dark hover:brightness-105 text-white font-bold rounded-2xl text-sm flex items-center gap-2 shadow-md"
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
      <div className="bg-white border-4 border-ink/10 rounded-[1.75rem] p-4 sm:p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {currentQ.sessionTitle && (
              <span className="px-2.5 py-0.5 bg-sky/15 border-2 border-sky/30 text-sky-dark rounded-full text-xs font-bold">
                {currentQ.sessionTitle}
              </span>
            )}
            <span className="text-xs text-ink-soft font-bold">
              Q{room.currentQuestionIndex + 1} of {room.questions.length}
            </span>
          </div>
          <p className="text-xs text-ink-soft font-medium">
            {totalSubmissions} of {Math.max(1, room.players.length)} player responses recorded
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-display font-extrabold text-2xl shadow-inner transition-colors ${
              timerRemaining <= 5
                ? 'border-coral text-coral-dark bg-coral/10 animate-pulse'
                : 'border-sky text-sky-dark bg-sky/10'
            }`}
          >
            {timerRemaining}
          </div>

          <div className="flex items-center gap-2">
            {!isRevealed ? (
              <button
                onClick={() => runAction(() => revealAnswer(room.id))}
                className="btn-pop px-4 py-2 bg-sunny border-2 border-b-4 border-sunny-dark hover:brightness-105 text-ink font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Eye className="w-4 h-4" />
                <span>Reveal Answer</span>
              </button>
            ) : (
              <button
                onClick={() => runAction(() => showLeaderboard(room.id))}
                className="btn-pop px-4 py-2 bg-sky border-2 border-b-4 border-sky-dark hover:brightness-105 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Trophy className="w-4 h-4" />
                <span>Leaderboard</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border-4 border-ink/10 rounded-[2rem] p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <h2 className="text-xl sm:text-2xl font-display font-bold text-ink leading-relaxed mb-6">{currentQ.question}</h2>

        <div className="my-8">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink-soft mb-3">
            <span className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-sky-dark" />
              Live Response Distribution
            </span>
            <span>{totalSubmissions} Total Answers</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end h-44 bg-cream p-4 rounded-2xl border-2 border-ink/10">
            {shapes.map((shape, idx) => {
              const count = optionCounts[idx];
              const percentage = totalSubmissions > 0 ? Math.round((count / totalSubmissions) * 100) : 0;
              const isCorrectOption = isRevealed && currentQ.correctAnswer === idx;

              return (
                <div key={shape.name} className="flex flex-col items-center h-full justify-end relative group">
                  <span className="text-xs font-bold text-ink-soft mb-1">{percentage}%</span>
                  <div className="w-full bg-white rounded-t-xl overflow-hidden flex items-end h-full relative border-2 border-b-0 border-ink/10">
                    <div
                      className={`w-full transition-all duration-500 rounded-t-lg ${
                        isRevealed ? (isCorrectOption ? 'bg-grass' : 'bg-ink/10') : shape.bg
                      }`}
                      style={{ height: `${count > 0 ? Math.max(12, percentage) : 0}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-ink-soft mt-1">{count} votes</span>
                  <div
                    className={`mt-1 px-2 py-0.5 rounded-lg text-xs font-extrabold text-white ${
                      isCorrectOption ? 'bg-grass' : shape.bg
                    }`}
                  >
                    {shape.symbol} {shape.name}
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
                className={`p-4 rounded-2xl border-2 transition-all text-sm font-bold flex items-start gap-3 ${
                  isRevealed
                    ? isCorrect
                      ? 'bg-grass/10 border-grass text-grass-dark shadow-md'
                      : 'bg-cream border-ink/10 text-ink-soft/60 opacity-70'
                    : 'bg-cream border-ink/10 text-ink'
                }`}
              >
                <span className={`px-2 py-1 rounded-lg text-xs font-extrabold text-white ${shape.bg} shrink-0`}>
                  {shape.symbol} {shape.name}
                </span>
                <span className="flex-1">{opt}</span>
                {isCorrect && <CheckCircle2 className="w-5 h-5 text-grass-dark shrink-0 mt-0.5" />}
              </div>
            );
          })}
        </div>

        {isRevealed && (
          <div className="mt-6 p-5 bg-grass/10 border-2 border-grass/30 rounded-2xl space-y-2 animate-pop-in">
            <div className="flex items-center gap-2 text-grass-dark font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Correct Answer & Knowledge Brief:</span>
            </div>
            <p className="text-xs sm:text-sm text-ink leading-relaxed font-medium">{currentQ.explanation}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between bg-white border-4 border-ink/10 p-4 rounded-2xl shadow-sm">
        <button
          onClick={() => runAction(() => resetRoom(room.id))}
          className="px-4 py-2 text-xs font-bold text-ink-soft hover:text-coral-dark transition-colors"
        >
          Reset Room
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => runAction(() => showLeaderboard(room.id))}
            className="btn-pop px-4 py-2 bg-white hover:bg-cream text-ink-soft font-bold text-xs rounded-xl border-2 border-b-4 border-ink/15 flex items-center gap-1.5"
          >
            <Trophy className="w-3.5 h-3.5 text-sunny-dark" />
            <span>Show Leaderboard</span>
          </button>

          <button
            onClick={() => runAction(() => nextQuestion(room.id, room.questions, room.currentQuestionIndex))}
            className="btn-pop px-5 py-2 bg-sky border-2 border-b-4 border-sky-dark hover:brightness-105 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
          >
            <span>Next Question</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
