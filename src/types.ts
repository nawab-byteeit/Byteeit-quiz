export interface Question {
  id: number;
  session?: number; // 1, 2, or 3
  sessionTitle?: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0, 1, 2, or 3
  correctAnswerText: string;
  explanation: string;
  timeLimit?: number; // seconds
}

export interface QuizPreset {
  id: string;
  title: string;
  description: string;
  category: string;
  questions: Question[];
}

export interface Player {
  id: string;
  name: string;
  score: number;
  streak: number;
  lastAnswer?: {
    questionId: number;
    optionIndex: number;
    isCorrect: boolean;
    pointsEarned: number;
    timeTakenSeconds: number;
  };
}

export type QuizStatus = 'lobby' | 'question' | 'revealed' | 'leaderboard' | 'finished';

export interface RoomState {
  roomCode: string;
  quizTitle?: string;
  hostName?: string;
  hostEmail?: string;
  isServerConnected?: boolean;
  status: QuizStatus;
  currentQuestionIndex: number;
  activeSessionFilter: number | 'all'; // 1, 2, 3, or 'all'
  timerRemaining: number;
  timeLimit: number;
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
  customQuestions?: Question[];
}

export type ViewMode = 'host' | 'player' | 'solo' | 'export' | 'guide' | 'builder';

export interface AnswerDistribution {
  optionIndex: number;
  count: number;
  percentage: number;
  isCorrect: boolean;
}
