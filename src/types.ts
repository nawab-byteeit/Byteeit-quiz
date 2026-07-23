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

export type ViewMode = 'host' | 'player' | 'solo' | 'export' | 'guide' | 'builder';
