import { RoomState, QuizStatus, Player } from '../types';
import { QUESTIONS } from '../data/questions';

const CHANNEL_NAME = 'gcp_quiz_sync_channel';
const LOCAL_STORAGE_KEY = 'gcp_quiz_room_state_v1';

export const DEFAULT_ROOM_CODE = 'GOOGLE2026';

export function createInitialRoomState(roomCode = DEFAULT_ROOM_CODE): RoomState {
  return {
    roomCode,
    hostName: 'Nawab Khan (Hosted on AI Studio)',
    hostEmail: 'nawab.khan@byteeit.com',
    isServerConnected: false,
    status: 'lobby',
    currentQuestionIndex: 0,
    activeSessionFilter: 'all',
    timerRemaining: QUESTIONS[0].timeLimit || 30,
    timeLimit: QUESTIONS[0].timeLimit || 30,
    players: [],
    questionAnswers: {}
  };
}

type SyncCallback = (state: RoomState) => void;

class RoomSyncEngine {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<SyncCallback> = new Set();
  private eventSource: EventSource | null = null;
  private pollInterval: any = null;
  public currentState: RoomState;

  constructor() {
    this.currentState = this.loadFromStorage() || createInitialRoomState();

    if (typeof window !== 'undefined') {
      if ('BroadcastChannel' in window) {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data && event.data.type === 'STATE_UPDATE') {
            this.currentState = event.data.state;
            this.saveToStorage(this.currentState);
            this.notifyListeners();
          }
        };
      }

      window.addEventListener('storage', (e) => {
        if (e.key === LOCAL_STORAGE_KEY && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            this.currentState = parsed;
            this.notifyListeners();
          } catch {
            // ignore
          }
        }
      });

      // Start server SSE stream & poll fallback
      this.initServerSync(this.currentState.roomCode);
    }
  }

  public initServerSync(roomCode: string) {
    if (typeof window === 'undefined') return;

    // Close previous SSE if any
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    try {
      const code = roomCode.toUpperCase();
      this.eventSource = new EventSource(`/api/room/${code}/stream`);

      this.eventSource.onmessage = (event) => {
        try {
          const serverState: RoomState = JSON.parse(event.data);
          this.currentState = {
            ...serverState,
            isServerConnected: true
          };
          this.saveToStorage(this.currentState);
          this.notifyListeners();
        } catch {
          // ignore parse error
        }
      };

      this.eventSource.onerror = () => {
        // SSE disconnected, fallback to polling
        if (this.currentState.isServerConnected) {
          this.currentState = { ...this.currentState, isServerConnected: false };
          this.notifyListeners();
        }
      };
    } catch {
      // ignore event source setup errors
    }

    // Backup polling loop
    if (!this.pollInterval) {
      this.pollInterval = setInterval(() => {
        this.fetchStateFromServer();
      }, 3000);
    }
  }

  private async fetchStateFromServer() {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch(`/api/room/${this.currentState.roomCode}`);
      if (res.ok) {
        const serverState: RoomState = await res.json();
        // Only update if changes occurred
        if (JSON.stringify(serverState.questionAnswers) !== JSON.stringify(this.currentState.questionAnswers) ||
            serverState.status !== this.currentState.status ||
            serverState.currentQuestionIndex !== this.currentState.currentQuestionIndex ||
            serverState.players.length !== this.currentState.players.length ||
            serverState.timerRemaining !== this.currentState.timerRemaining) {
          this.currentState = {
            ...serverState,
            isServerConnected: true
          };
          this.saveToStorage(this.currentState);
          this.notifyListeners();
        }
      }
    } catch {
      // silent fetch fail
    }
  }

  public setRoomCode(newCode: string) {
    const code = newCode.trim().toUpperCase() || DEFAULT_ROOM_CODE;
    const newState = {
      ...this.currentState,
      roomCode: code
    };
    this.updateAndBroadcast(newState);
    this.initServerSync(code);
  }

  public subscribe(cb: SyncCallback) {
    this.listeners.add(cb);
    cb(this.currentState);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb(this.currentState));
  }

  private saveToStorage(state: RoomState) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
      } catch {
        // ignore storage errors
      }
    }
  }

  public updateAndBroadcast(newState: RoomState) {
    this.currentState = newState;
    this.saveToStorage(newState);
    this.notifyListeners();

    // Broadcast via BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage({
          type: 'STATE_UPDATE',
          state: newState
        });
      } catch {
        // ignore
      }
    }

    // Post to Server API
    if (typeof window !== 'undefined') {
      fetch(`/api/room/${newState.roomCode}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newState)
      }).catch(() => {});
    }
  }

  // --- Host Actions ---

  public setHostInfo(hostName: string, quizTitle?: string) {
    const newState: RoomState = {
      ...this.currentState,
      hostName: hostName.trim() || 'Quiz Host',
      quizTitle: quizTitle?.trim() || this.currentState.quizTitle || 'Custom Quiz'
    };
    this.updateAndBroadcast(newState);
  }

  public setHostName(hostName: string) {
    const newState: RoomState = {
      ...this.currentState,
      hostName: hostName.trim() || 'Quiz Host'
    };
    this.updateAndBroadcast(newState);
  }

  public setCustomQuiz(quizTitle: string, questions: typeof QUESTIONS, hostName?: string) {
    const newState: RoomState = {
      ...this.currentState,
      quizTitle: quizTitle.trim() || 'Custom Quiz',
      hostName: hostName?.trim() || this.currentState.hostName || 'Quiz Host',
      customQuestions: questions,
      currentQuestionIndex: 0,
      status: 'lobby',
      players: [],
      questionAnswers: {}
    };
    this.updateAndBroadcast(newState);
  }

  public createCustomRoom(roomCode: string, hostName: string, quizTitle: string, questions?: typeof QUESTIONS) {
    const code = roomCode.trim().toUpperCase() || DEFAULT_ROOM_CODE;
    const newState: RoomState = {
      roomCode: code,
      quizTitle: quizTitle.trim() || 'Custom Quiz Room',
      hostName: hostName.trim() || 'Quiz Host',
      customQuestions: questions && questions.length > 0 ? questions : undefined,
      status: 'lobby',
      currentQuestionIndex: 0,
      activeSessionFilter: 'all',
      timerRemaining: questions?.[0]?.timeLimit || 30,
      timeLimit: questions?.[0]?.timeLimit || 30,
      players: [],
      questionAnswers: {},
      isServerConnected: this.currentState.isServerConnected
    };
    this.updateAndBroadcast(newState);
    this.initServerSync(code);
  }

  public setSessionFilter(filter: number | 'all') {
    const newState = {
      ...this.currentState,
      activeSessionFilter: filter,
      currentQuestionIndex: 0,
      status: 'lobby' as QuizStatus
    };
    this.updateAndBroadcast(newState);
  }

  public startQuiz() {
    const questions = this.getFilteredQuestions();
    const currentQ = questions[0] || QUESTIONS[0];
    const newState: RoomState = {
      ...this.currentState,
      status: 'question',
      currentQuestionIndex: 0,
      timerRemaining: currentQ.timeLimit || 30,
      timeLimit: currentQ.timeLimit || 30
    };
    this.updateAndBroadcast(newState);
  }

  public setTimer(seconds: number) {
    const newState = {
      ...this.currentState,
      timerRemaining: seconds
    };
    this.updateAndBroadcast(newState);
  }

  public revealAnswer() {
    const newState: RoomState = {
      ...this.currentState,
      status: 'revealed'
    };
    this.updateAndBroadcast(newState);
  }

  public showLeaderboard() {
    const newState: RoomState = {
      ...this.currentState,
      status: 'leaderboard'
    };
    this.updateAndBroadcast(newState);
  }

  public nextQuestion() {
    const filteredQs = this.getFilteredQuestions();
    const nextIdx = this.currentState.currentQuestionIndex + 1;

    if (nextIdx >= filteredQs.length) {
      // Quiz Finished!
      const newState: RoomState = {
        ...this.currentState,
        status: 'finished'
      };
      this.updateAndBroadcast(newState);
    } else {
      const nextQ = filteredQs[nextIdx];
      const newState: RoomState = {
        ...this.currentState,
        status: 'question',
        currentQuestionIndex: nextIdx,
        timerRemaining: nextQ.timeLimit || 30,
        timeLimit: nextQ.timeLimit || 30
      };
      this.updateAndBroadcast(newState);
    }
  }

  public resetRoom() {
    const newState = createInitialRoomState(this.currentState.roomCode);
    this.updateAndBroadcast(newState);
  }

  // --- Player Actions ---

  public joinRoom(playerName: string): Player {
    const existing = this.currentState.players.find(
      (p) => p.name.toLowerCase() === playerName.toLowerCase()
    );

    if (existing) {
      return existing;
    }

    const newPlayer: Player = {
      id: 'player_' + Math.random().toString(36).substring(2, 9),
      name: playerName.trim(),
      score: 0,
      streak: 0
    };

    const newState: RoomState = {
      ...this.currentState,
      players: [...this.currentState.players, newPlayer]
    };

    this.updateAndBroadcast(newState);
    return newPlayer;
  }

  public submitPlayerAnswer(playerId: string, optionIndex: number, timeTakenSec: number) {
    const filteredQs = this.getFilteredQuestions();
    const currentQ = filteredQs[this.currentState.currentQuestionIndex] || QUESTIONS[0];
    if (!currentQ) return;

    const isCorrect = optionIndex === currentQ.correctAnswer;

    // Points logic: Kahoot style speed bonus
    let pointsEarned = 0;
    if (isCorrect) {
      const timeRatio = Math.max(0, (currentQ.timeLimit! - timeTakenSec) / currentQ.timeLimit!);
      const speedBonus = Math.round(500 * timeRatio);
      pointsEarned = 500 + speedBonus; // Range: 500 - 1000 pts
    }

    // Update player score & streak
    const updatedPlayers = this.currentState.players.map((p) => {
      if (p.id === playerId) {
        const newStreak = isCorrect ? p.streak + 1 : 0;
        const streakBonus = isCorrect && newStreak > 1 ? (newStreak - 1) * 100 : 0;
        const totalAwarded = isCorrect ? pointsEarned + streakBonus : 0;

        return {
          ...p,
          score: p.score + totalAwarded,
          streak: newStreak,
          lastAnswer: {
            questionId: currentQ.id,
            optionIndex,
            isCorrect,
            pointsEarned: totalAwarded,
            timeTakenSeconds: timeTakenSec
          }
        };
      }
      return p;
    });

    // Record answer in questionAnswers map
    const existingQAnswers = this.currentState.questionAnswers[currentQ.id] || {};
    const updatedQAnswers = {
      ...existingQAnswers,
      [playerId]: {
        optionIndex,
        timestamp: Date.now(),
        pointsEarned,
        isCorrect
      }
    };

    const newState: RoomState = {
      ...this.currentState,
      players: updatedPlayers,
      questionAnswers: {
        ...this.currentState.questionAnswers,
        [currentQ.id]: updatedQAnswers
      }
    };

    this.updateAndBroadcast(newState);
  }

  // --- Helpers ---

  public getFilteredQuestions(): typeof QUESTIONS {
    if (this.currentState.customQuestions && this.currentState.customQuestions.length > 0) {
      return this.currentState.customQuestions;
    }
    if (this.currentState.activeSessionFilter === 'all') {
      return QUESTIONS;
    }
    return QUESTIONS.filter((q) => q.session === this.currentState.activeSessionFilter);
  }

  private loadFromStorage(): RoomState | null {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(LOCAL_STORAGE_KEY);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }
}

export const syncEngine = new RoomSyncEngine();
