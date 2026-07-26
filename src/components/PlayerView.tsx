import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
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
  const revealSoundedForRef = useRef<number | null>(null);

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

  // Play a correct/incorrect chime (and a confetti pop for correct answers) the
  // moment the host reveals results for the question this player just answered.
  useEffect(() => {
    if (room?.status !== 'revealed' || !currentQ) return;
    if (revealSoundedForRef.current === room.currentQuestionIndex) return;
    revealSoundedForRef.current = room.currentQuestionIndex;

    if (lastAnswerResult) {
      if (lastAnswerResult.isCorrect) {
        soundEffects.playCorrect();
        confetti({ particleCount: 60, spread: 65, origin: { y: 0.7 }, colors: ['#2fb8f0', '#ffc93c', '#2fbe72'] });
      } else {
        soundEffects.playIncorrect();
      }
    }
  }, [room?.status, room?.currentQuestionIndex, currentQ, lastAnswerResult]);

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
    { idx: 0, label: 'A', symbol: '▲', bg: 'bg-coral', border: 'border-coral-dark' },
    { idx: 1, label: 'B', symbol: '◆', bg: 'bg-sky', border: 'border-sky-dark' },
    { idx: 2, label: 'C', symbol: '●', bg: 'bg-sunny', border: 'border-sunny-dark' },
    { idx: 3, label: 'D', symbol: '■', bg: 'bg-grass', border: 'border-grass-dark' }
  ];

  // 1. Player Not Joined Form
  if (!player || !room) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white border-4 border-ink/10 rounded-[2rem] p-8 shadow-xl text-center space-y-6">
          <div className="inline-block">
            <img
              src={byteeitLogo}
              alt="ByteeIT Logo"
              referrerPolicy="no-referrer"
              className="h-12 sm:h-16 w-auto max-w-full rounded-2xl object-contain border-4 border-sky/30 shadow-md mx-auto"
            />
          </div>

          <div>
            <h2 className="text-2xl font-display font-extrabold text-ink">Join Quiz Game 🎮</h2>
            <p className="text-ink-soft text-xs mt-1 font-semibold">Enter the game PIN shared by your host to join.</p>
          </div>

          {joinError && (
            <div className="p-3 bg-coral/10 border-2 border-coral/40 text-coral-dark rounded-2xl text-xs text-center font-bold">
              {joinError}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wider block text-left mb-1">
                  Room Game PIN
                </label>
                <input
                  type="text"
                  placeholder="Room PIN"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.toUpperCase())}
                  maxLength={12}
                  className="w-full px-4 py-2.5 bg-cream border-2 border-ink/15 rounded-2xl text-sunny-dark font-display font-extrabold text-center tracking-widest focus:outline-none focus:border-sunny"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wider block text-left mb-1">
                  Player Nickname
                </label>
                <input
                  type="text"
                  placeholder="Enter Nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={20}
                  className="w-full px-4 py-3 bg-cream border-2 border-ink/15 rounded-2xl text-ink placeholder-ink-soft/50 focus:outline-none focus:border-sky font-bold text-center text-base sm:text-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!nickname.trim() || !pinInput.trim() || joining}
              className="btn-pop w-full py-3.5 bg-grass border-2 border-b-4 border-grass-dark hover:brightness-105 disabled:opacity-50 text-white font-display font-extrabold rounded-2xl shadow-md text-sm"
            >
              {joining ? 'Joining…' : 'Ready to Play! 🚀'}
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
        <div className="bg-white border-4 border-ink/10 rounded-[2rem] p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-grass/15 border-2 border-grass/40 rounded-2xl flex items-center justify-center mx-auto text-grass-dark animate-pulse">
            <Sparkles className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-display font-extrabold text-ink">You're in, {player.name}! 🙌</h3>
            <p className="text-ink-soft text-xs mt-2 font-semibold">
              Waiting for host <strong className="text-sky-dark font-bold">{room.hostName}</strong> to start...
            </p>
          </div>

          <div className="bg-cream p-4 rounded-2xl border-2 border-ink/10 text-xs text-ink-soft space-y-1 font-semibold">
            <p>Room PIN: <span className="font-display font-extrabold text-sunny-dark">{room.roomCode}</span></p>
            <p>Quiz: <span className="text-sky-dark font-bold">{room.quizTitle}</span> ({room.questions.length} Questions)</p>
          </div>

          <button onClick={handleLeave} className="text-xs text-ink-soft underline hover:text-coral-dark font-semibold">
            Change Nickname / Leave Room
          </button>
        </div>
      </div>
    );
  }

  if (!currentQ) {
    return <div className="max-w-md mx-auto px-4 py-12 text-center text-ink-soft text-sm font-semibold">Loading question…</div>;
  }

  // 3. Answer Revealed / Feedback screen
  if (room.status === 'revealed' || room.status === 'leaderboard' || room.status === 'finished') {
    const isCorrect = !!lastAnswerResult?.isCorrect;
    const pointsAwarded = lastAnswerResult?.pointsEarned || 0;
    const didAnswer = lastAnswerResult !== null;

    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div
          className={`border-4 rounded-[2rem] p-8 shadow-xl text-center space-y-6 ${
            !didAnswer
              ? 'bg-white border-ink/10'
              : isCorrect
                ? 'bg-grass/10 border-grass'
                : 'bg-coral/10 border-coral'
          }`}
        >
          {!didAnswer ? (
            <>
              <XCircle className="w-16 h-16 text-ink-soft/50 mx-auto" />
              <div>
                <h3 className="text-2xl font-display font-extrabold text-ink-soft">NO ANSWER</h3>
                <p className="text-ink-soft text-xs mt-1 font-semibold">
                  Correct Answer: <span className="font-bold text-grass-dark">{currentQ.correctAnswerText}</span>
                </p>
              </div>
            </>
          ) : isCorrect ? (
            <>
              <CheckCircle2 className="w-16 h-16 text-grass-dark mx-auto animate-bounce" />
              <div>
                <h3 className="text-3xl font-display font-extrabold text-grass-dark">CORRECT! 🎉</h3>
                <p className="text-grass-dark font-display text-xl font-extrabold mt-1">+{pointsAwarded} Pts</p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 text-coral-dark mx-auto" />
              <div>
                <h3 className="text-2xl font-display font-extrabold text-coral-dark">INCORRECT</h3>
                <p className="text-ink-soft text-xs mt-1 font-semibold">
                  Correct Answer: <span className="font-bold text-grass-dark">{currentQ.correctAnswerText}</span>
                </p>
              </div>
            </>
          )}

          <div className="bg-cream p-4 rounded-2xl border-2 border-ink/10 grid grid-cols-2 gap-2 text-center text-xs">
            <div>
              <span className="text-ink-soft block font-semibold">Total Score</span>
              <span className="font-display font-extrabold text-sunny-dark text-base">{player.score} Pts</span>
            </div>
            <div>
              <span className="text-ink-soft block font-semibold">Streak</span>
              <span className="font-bold text-coral-dark text-base flex items-center justify-center gap-1">
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
      <div className="bg-white border-2 border-ink/10 rounded-2xl p-3 flex items-center justify-between text-xs shadow-sm">
        <div className="flex items-center gap-2 text-ink font-bold">
          <User className="w-4 h-4 text-sky-dark" />
          <span>{player.name}</span>
        </div>
        <div className="flex items-center gap-3 font-bold">
          <span className="text-sunny-dark">{player.score} Pts</span>
          {player.streak > 0 && (
            <span className="text-coral-dark flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-current" />
              {player.streak}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white border-4 border-ink/10 rounded-[1.75rem] p-5 text-center shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold text-ink-soft mb-2">
          <span>Q{room.currentQuestionIndex + 1} of {room.questions.length}</span>
          <span className="flex items-center gap-1 text-sky-dark font-bold">
            <Clock className="w-3.5 h-3.5" />
            {timerRemaining}s
          </span>
        </div>
        <h3 className="text-base font-display font-bold text-ink leading-snug">{currentQ.question}</h3>
      </div>

      {hasAnswered ? (
        <div className="bg-white border-4 border-sky/30 rounded-[1.75rem] p-8 text-center space-y-3 animate-pop-in shadow-sm">
          <Zap className="w-12 h-12 text-sky-dark mx-auto animate-pulse" />
          <h4 className="text-lg font-display font-extrabold text-ink">Answer Submitted!</h4>
          <p className="text-xs text-ink-soft font-semibold">Waiting for time to run out or host to reveal answer...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {buttons.map((btn) => {
            const optionText = currentQ.options[btn.idx];
            return (
              <button
                key={btn.idx}
                onClick={() => handleSelectAnswer(btn.idx)}
                className={`btn-pop p-5 rounded-2xl border-2 border-b-4 ${btn.border} ${btn.bg} shadow-md flex flex-col items-start text-left space-y-2`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xl font-black text-white">{btn.symbol}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-black/15 text-white">
                    Option {btn.label}
                  </span>
                </div>
                <p className="text-sm font-bold leading-tight text-white">{optionText}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
