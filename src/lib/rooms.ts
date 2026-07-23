import { supabase, type User } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Player, Question, QuizStatus } from '../types';

export interface LiveRoom {
  id: string;
  roomCode: string;
  hostId: string;
  hostName: string;
  quizTitle: string;
  status: QuizStatus;
  currentQuestionIndex: number;
  activeSessionFilter: number | 'all';
  timeLimit: number;
  questionStartedAt: string | null;
  questions: Question[];
  players: Player[];
  questionAnswers: {
    [questionId: number]: {
      [playerId: string]: {
        optionIndex: number;
        timestamp: number;
        pointsEarned: number;
        isCorrect: boolean;
      };
    };
  };
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

interface RoomRow {
  id: string;
  room_code: string;
  host_id: string;
  host_name: string;
  quiz_title: string;
  status: QuizStatus;
  current_question_index: number;
  active_session_filter: string;
  time_limit: number;
  question_started_at: string | null;
  questions: Question[];
}

interface PlayerRow {
  id: string;
  name: string;
  score: number;
  streak: number;
  last_answer: Player['lastAnswer'] | null;
}

interface AnswerRow {
  question_id: number;
  player_id: string;
  option_index: number;
  is_correct: boolean;
  points_earned: number;
  created_at: string;
}

function parseSessionFilter(value: string): number | 'all' {
  if (value === 'all') return 'all';
  const n = Number(value);
  return Number.isFinite(n) ? n : 'all';
}

function buildLiveRoom(room: RoomRow, players: PlayerRow[], answers: AnswerRow[]): LiveRoom {
  const questionAnswers: LiveRoom['questionAnswers'] = {};
  for (const a of answers) {
    if (!questionAnswers[a.question_id]) questionAnswers[a.question_id] = {};
    questionAnswers[a.question_id][a.player_id] = {
      optionIndex: a.option_index,
      timestamp: new Date(a.created_at).getTime(),
      pointsEarned: a.points_earned,
      isCorrect: a.is_correct
    };
  }

  return {
    id: room.id,
    roomCode: room.room_code,
    hostId: room.host_id,
    hostName: room.host_name,
    quizTitle: room.quiz_title,
    status: room.status,
    currentQuestionIndex: room.current_question_index,
    activeSessionFilter: parseSessionFilter(room.active_session_filter),
    timeLimit: room.time_limit,
    questionStartedAt: room.question_started_at,
    questions: room.questions || [],
    players: players.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      streak: p.streak,
      lastAnswer: p.last_answer || undefined
    })),
    questionAnswers
  };
}

async function fetchLiveRoom(roomId: string): Promise<LiveRoom | null> {
  const { data: room, error } = await supabase.from('rooms').select('*').eq('id', roomId).maybeSingle();
  if (error) throw error;
  if (!room) return null;

  const [playersRes, answersRes] = await Promise.all([
    supabase.from('room_players').select('*').eq('room_id', roomId),
    supabase
      .from('room_answers')
      .select('question_id, player_id, option_index, is_correct, points_earned, created_at')
      .eq('room_id', roomId)
  ]);
  if (playersRes.error) throw playersRes.error;
  if (answersRes.error) throw answersRes.error;

  return buildLiveRoom(
    room as RoomRow,
    (playersRes.data || []) as PlayerRow[],
    (answersRes.data || []) as AnswerRow[]
  );
}

export async function findRoomIdByCode(roomCode: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('rooms')
    .select('id')
    .eq('room_code', roomCode.trim().toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

/** Subscribes to a room's live state. Refetches on any change to rooms/room_players/room_answers for this room. */
export function subscribeToRoom(
  roomId: string,
  onUpdate: (room: LiveRoom | null) => void,
  onError?: (err: Error) => void
): () => void {
  let cancelled = false;

  const refresh = () => {
    fetchLiveRoom(roomId)
      .then((room) => {
        if (!cancelled) onUpdate(room);
      })
      .catch((err) => {
        if (!cancelled && onError) onError(err as Error);
      });
  };

  refresh();

  const channel: RealtimeChannel = supabase
    .channel(`room-${roomId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, refresh)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
      refresh
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'room_answers', filter: `room_id=eq.${roomId}` },
      refresh
    )
    .subscribe();

  return () => {
    cancelled = true;
    supabase.removeChannel(channel);
  };
}

export async function createRoom(params: {
  user: User;
  hostName: string;
  quizTitle: string;
  questions: Question[];
  activeSessionFilter?: number | 'all';
  quizId?: string;
  roomCode?: string;
}): Promise<LiveRoom> {
  if (!params.questions || params.questions.length === 0) {
    throw new Error('Add at least one question before hosting a room.');
  }
  const roomCode = (params.roomCode || generateRoomCode()).trim().toUpperCase();
  const { data, error } = await supabase
    .from('rooms')
    .insert({
      room_code: roomCode,
      host_id: params.user.id,
      host_name: params.hostName.trim() || 'Quiz Host',
      quiz_title: params.quizTitle.trim() || 'Custom Quiz',
      questions: params.questions,
      quiz_id: params.quizId || null,
      active_session_filter: String(params.activeSessionFilter ?? 'all'),
      time_limit: params.questions[0]?.timeLimit || 30
    })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('That room PIN is already in use, try another.');
    throw error;
  }
  return buildLiveRoom(data as RoomRow, [], []);
}

export async function startQuiz(roomId: string, questions: Question[]): Promise<void> {
  const first = questions[0];
  const { error } = await supabase
    .from('rooms')
    .update({
      status: 'question',
      current_question_index: 0,
      question_started_at: new Date().toISOString(),
      time_limit: first?.timeLimit || 30
    })
    .eq('id', roomId);
  if (error) throw error;
}

export async function revealAnswer(roomId: string): Promise<void> {
  const { error } = await supabase.from('rooms').update({ status: 'revealed' }).eq('id', roomId);
  if (error) throw error;
}

export async function showLeaderboard(roomId: string): Promise<void> {
  const { error } = await supabase.from('rooms').update({ status: 'leaderboard' }).eq('id', roomId);
  if (error) throw error;
}

export async function nextQuestion(roomId: string, questions: Question[], currentIndex: number): Promise<void> {
  const nextIdx = currentIndex + 1;
  if (nextIdx >= questions.length) {
    const { error } = await supabase.from('rooms').update({ status: 'finished' }).eq('id', roomId);
    if (error) throw error;
    return;
  }
  const nextQ = questions[nextIdx];
  const { error } = await supabase
    .from('rooms')
    .update({
      status: 'question',
      current_question_index: nextIdx,
      question_started_at: new Date().toISOString(),
      time_limit: nextQ.timeLimit || 30
    })
    .eq('id', roomId);
  if (error) throw error;
}

export async function resetRoom(roomId: string): Promise<void> {
  const { error } = await supabase.rpc('reset_room', { p_room_id: roomId });
  if (error) throw error;
}

export interface JoinedPlayer {
  id: string;
  name: string;
  score: number;
  streak: number;
  clientToken: string;
}

export async function joinRoom(roomCode: string, name: string): Promise<JoinedPlayer> {
  const { data, error } = await supabase.rpc('join_room', {
    p_room_code: roomCode.trim().toUpperCase(),
    p_name: name.trim()
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('Unable to join room.');
  return {
    id: row.id,
    name: row.name,
    score: row.score,
    streak: row.streak,
    clientToken: row.client_token
  };
}

export interface AnswerResult {
  isCorrect: boolean;
  pointsEarned: number;
  newScore: number;
  newStreak: number;
}

export async function submitAnswer(params: {
  roomId: string;
  playerId: string;
  clientToken: string;
  questionId: number;
  optionIndex: number;
  timeTakenSeconds: number;
}): Promise<AnswerResult> {
  const { data, error } = await supabase.rpc('submit_answer', {
    p_room_id: params.roomId,
    p_player_id: params.playerId,
    p_client_token: params.clientToken,
    p_question_id: params.questionId,
    p_option_index: params.optionIndex,
    p_time_taken_seconds: params.timeTakenSeconds
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('Unable to submit answer.');
  return {
    isCorrect: row.is_correct,
    pointsEarned: row.points_earned,
    newScore: row.new_score,
    newStreak: row.new_streak
  };
}

// --- Local persistence: player sessions (per room) & the host's last-active room ---
//
// localStorage can throw (not just return null) in real-world mobile contexts --
// in-app browsers (e.g. WhatsApp/Instagram webviews), private browsing, or strict
// privacy settings all commonly deny storage access entirely. Every call is wrapped
// so a blocked browser degrades to "no persistence" instead of breaking the flow.

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore -- session just won't survive a refresh in this browser
  }
}

function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

const PLAYER_SESSION_PREFIX = 'byteeit_player_session_';
const HOST_ROOM_KEY = 'byteeit_active_host_room';

export interface StoredPlayerSession {
  roomCode: string;
  playerId: string;
  clientToken: string;
  name: string;
}

export function savePlayerSession(session: StoredPlayerSession) {
  safeSetItem(PLAYER_SESSION_PREFIX + session.roomCode.toUpperCase(), JSON.stringify(session));
}

export function loadPlayerSession(roomCode: string): StoredPlayerSession | null {
  const raw = safeGetItem(PLAYER_SESSION_PREFIX + roomCode.trim().toUpperCase());
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearPlayerSession(roomCode: string) {
  safeRemoveItem(PLAYER_SESSION_PREFIX + roomCode.trim().toUpperCase());
}

export function saveActiveHostRoomCode(roomCode: string) {
  safeSetItem(HOST_ROOM_KEY, roomCode.toUpperCase());
}

export function loadActiveHostRoomCode(): string | null {
  return safeGetItem(HOST_ROOM_KEY);
}

export function clearActiveHostRoomCode() {
  safeRemoveItem(HOST_ROOM_KEY);
}
