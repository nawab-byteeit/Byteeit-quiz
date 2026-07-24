import React, { useEffect, useRef, useState } from 'react';
import { soundEffects } from '../lib/audio';
import {
  LiveRoom,
  JoinedPlayer,
  subscribeToRoom,
  findRoomIdByCode,
  joinRoom,
  submitAnswer,
  AnswerResult,
  savePlayerSession,
  loadPlayerSession,
  clearPlayerSession
} from '../lib/rooms';
import { User, Flame, CheckCircle2, XCircle, Clock, Zap, Sparkles } from 'lucide-react';
import byteeitLogo from '../assets/images/byteeit_logo_1784809227570.jpg';

export const PlayerView: React.FC = () => {
  const [nickname, setNickname] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [room, setRoom] = useState<LiveRoom | null>(null);
  const [player, setPlayer] = useState<JoinedPlayer | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [lastAnswerResult, setLastAnswerResult] = useState<AnswerResult | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timerRemaining, setTimerRemaining] = useState(0);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const answeredQuestionRef = useRef<number | null>(null);

  const startSubscription = (roomId: string) => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = subscribeToRoom(
      roomId,
      (liveRoom) => setRoom(liveRoom),
      (err) => setJoinError(err.message)
    );
  };

  // Auto-rejoin from a saved session (or a ?pin= URL) on first load.
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlPin = urlParams.get('pin')?.toUpperCase() || '';
    if (urlPin) setPinInput(urlPin);

    const targetPin = urlPin;
    const session = targetPin ? loadPlayerSession(targetPin) : null;
    if (!session) return;

    setNickname(session.name);
    setJoining(true);
    joinRoom(session.roomCode, session.name)
      .then(async (joined) => {
        savePlayerSession({ ...session, playerId: joined.id, clientToken: joined.clientToken });
        setPlayer(joined);
        const roomId = await findRoomIdByCode(session.roomCode);
        if (roomId) startSubscription(roomId);
      })
      .catch((err: any) => setJoinError(err.message || 'Could not rejoin room'))
      .finally(() => setJoining(false));

    return () => unsubscribeRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep local player score/streak in sync with the authoritative server state.
  useEffect(() => {
    if (!player || !room) return;
    const updated = room.players.find((p) => p.id === player.id);
    if (updated && (updated.score !== player.score || updated.streak !== player.streak)) {
      setPlayer({ ...player, score: updated.score, streak: updated.streak });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.players]);

  // Reset answer state when a new question starts.
  useEffect(() => {
    if (room?.status === 'question' && answeredQuestionRef.current !== room.currentQuestionIndex) {
      setSelectedOption(null);
      setLastAnswerResult(null);
      setStartTime(Date.now());
    }
  }, [room?.status, room?.currentQuestionIndex]);

  const currentQ = room?.questions[room.currentQuestionIndex];

  // Local countdown, derived from question_started_at (same approach as HostView).
  useEffect(() => {
    if (!room || room.status !== 'question' || !room.questionStartedAt) {
      setTimerRemaining(0);
      return;
    }
    const startedAt = new Date(room.questionStartedAt).getTime();
    const limit = room.timeLimit;
    const tick = () => {
      const elapsed = (Date.now() - startedAt) / 1000;
      setTimerRemaining(Math.max(0, Math.ceil(limit - elapsed)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [room?.id, room?.status, room?.questionStartedAt, room?.timeLimit]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !pinInput.trim()) return;

    soundEffects.playClick();
    setJoinError('');
    setJoining(true);
    try {
      const joined = await joinRoom(pinInput, nickname.trim());
      savePlayerSession({
        roomCode: pinInput.toUpperCase(),
        playerId: joined.id,
        clientToken: joined.clientToken,
        name: joined.name
      });
      const roomId = await findRoomIdByCode(pinInput);
      if (!roomId) throw new Error('Room not found');
      setPlayer(joined);
      startSubscription(roomId);
    } catch (err: any) {
      setJoinError(err.message || 'Failed to join room');
    } finally {
      setJoining(false);
    }
  };

  const handleSelectAnswer = async (optionIdx: number) => {
    if (selectedOption !== null || !player || !room || !currentQ || room.status !== 'question') return;

    soundEffects.playClick();
    setSelectedOption(optionIdx);
    answeredQuestionRef.current = room.currentQuestionIndex;

    const timeTakenSec = Math.min(
      currentQ.timeLimit || 30,
      Math.max(1, Math.round((Date.now() - startTime) / 1000))
    );

    try {
      const result = await submitAnswer({
        roomId: room.id,
        playerId: player.id,
        clientToken: player.clientToken,
        questionId: currentQ.id,
        optionIndex: optionIdx,
        timeTakenSeconds: timeTakenSec
      });
      setLastAnswerResult(result);
      setPlayer({ ...player, score: result.newScore, streak: result.newStreak });
    } catch (err: any) {
      setJoinError(err.message || 'Failed to submit answer');
    }
  };

  const handleLeave = () => {
    if (room) clearPlayerSession(room.roomCode);
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    setPlayer(null);
    setRoom(null);
    setNickname('');
  };

  const buttons = [
    { idx: 0, label: 'A', symbol: '▲', bg: 'bg-red-600 hover:bg-red-500 active:bg-red-700', text: 'text-red-100' },
    { idx: 1, label: 'B', symbol: '◆', bg: 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700', text: 'text-blue-100' },
    { idx: 2, label: 'C', symbol: '●', bg: 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600', text: 'text-amber-100' },
    { idx: 3, label: 'D', symbol: '■', bg: 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700', text: 'text-emerald-100' }
  ];

  // 1. Player Not Joined Form
  if (!player || !room) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
          <div className="inline-block">
            <img
              src={byteeitLogo}
              alt="ByteeIT Logo"
              referrerPolicy="no-referrer"
              className="h-12 sm:h-16 w-auto max-w-full rounded-2xl object-contain border-2 border-blue-500/50 shadow-xl shadow-blue-500/20 mx-auto"
            />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-white">Join Quiz Game</h2>
            <p className="text-slate-400 text-xs mt-1">Enter the game PIN shared by your host to join.</p>
          </div>

          {joinError && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-xl text-xs text-center font-medium">
              {joinError}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-left mb-1">
                  Room Game PIN
                </label>
                <input
                  type="text"
                  placeholder="Room PIN"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.toUpperCase())}
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
                  placeholder="Enter Nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={20}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-center font-bold text-base sm:text-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!nickname.trim() || !pinInput.trim() || joining}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-lg shadow-blue-600/30 text-sm transition-all"
            >
              {joining ? 'Joining…' : 'Ready to Play'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Waiting in Lobby
  if (room.status === 'lobby') {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
            <Sparkles className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-white">You're in, {player.name}!</h3>
            <p className="text-slate-400 text-xs mt-2">
              Waiting for host <strong className="text-blue-300 font-semibold">{room.hostName}</strong> to start...
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
            <p>Room PIN: <span className="font-mono font-bold text-amber-400">{room.roomCode}</span></p>
            <p>Quiz: <span className="text-blue-400 font-semibold">{room.quizTitle}</span> ({room.questions.length} Questions)</p>
          </div>

          <button onClick={handleLeave} className="text-xs text-slate-500 underline hover:text-slate-300">
            Change Nickname / Leave Room
          </button>
        </div>
      </div>
    );
  }

  if (!currentQ) {
    return <div className="max-w-md mx-auto px-4 py-12 text-center text-slate-400 text-sm">Loading question…</div>;
  }

  // 3. Answer Revealed / Feedback screen
  if (room.status === 'revealed' || room.status === 'leaderboard' || room.status === 'finished') {
    const isCorrect = !!lastAnswerResult?.isCorrect;
    const pointsAwarded = lastAnswerResult?.pointsEarned || 0;
    const didAnswer = lastAnswerResult !== null;

    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div
          className={`border rounded-2xl p-8 shadow-2xl text-center space-y-6 ${
            !didAnswer
              ? 'bg-slate-900 border-slate-800'
              : isCorrect
                ? 'bg-emerald-950/90 border-emerald-500/50'
                : 'bg-red-950/90 border-red-500/50'
          }`}
        >
          {!didAnswer ? (
            <>
              <XCircle className="w-16 h-16 text-slate-500 mx-auto" />
              <div>
                <h3 className="text-2xl font-black text-slate-300">NO ANSWER</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Correct Answer: <span className="font-bold text-emerald-300">{currentQ.correctAnswerText}</span>
                </p>
              </div>
            </>
          ) : isCorrect ? (
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

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
            <div>
              <span className="text-slate-400 block">Total Score</span>
              <span className="font-mono font-bold text-amber-400 text-base">{player.score} Pts</span>
            </div>
            <div>
              <span className="text-slate-400 block">Streak</span>
              <span className="font-bold text-red-400 text-base flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 fill-current" />
                {player.streak}
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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-white font-bold">
          <User className="w-4 h-4 text-blue-400" />
          <span>{player.name}</span>
        </div>
        <div className="flex items-center gap-3 font-mono font-bold">
          <span className="text-amber-400">{player.score} Pts</span>
          {player.streak > 0 && (
            <span className="text-red-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-current" />
              {player.streak}
            </span>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
          <span>Q{room.currentQuestionIndex + 1} of {room.questions.length}</span>
          <span className="flex items-center gap-1 text-blue-400 font-mono font-bold">
            <Clock className="w-3.5 h-3.5" />
            {timerRemaining}s
          </span>
        </div>
        <h3 className="text-base font-bold text-white leading-snug">{currentQ.question}</h3>
      </div>

      {hasAnswered ? (
        <div className="bg-slate-900 border border-blue-500/40 rounded-2xl p-8 text-center space-y-3 animate-fade-in">
          <Zap className="w-12 h-12 text-blue-400 mx-auto animate-pulse" />
          <h4 className="text-lg font-bold text-white">Answer Submitted!</h4>
          <p className="text-xs text-slate-400">Waiting for time to run out or host to reveal answer...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {buttons.map((btn) => {
            const optionText = currentQ.options[btn.idx];
            return (
              <button
                key={btn.idx}
                onClick={() => handleSelectAnswer(btn.idx)}
                className={`p-5 rounded-2xl border border-white/10 ${btn.bg} shadow-lg transition-transform active:scale-95 flex flex-col items-start text-left space-y-2 group`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xl font-black text-white">{btn.symbol}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-black/20 text-white">
                    Option {btn.label}
                  </span>
                </div>
                <p className={`text-sm font-bold leading-tight ${btn.text}`}>{optionText}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
