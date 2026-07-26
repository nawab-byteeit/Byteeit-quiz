import { Question } from '../types';

export interface AiGeneratedQuiz {
  suggestedTitle: string;
  suggestedCategory: string;
  questions: Question[];
}

export async function generateQuizFromText(text: string, numQuestions: number): Promise<AiGeneratedQuiz> {
  const response = await fetch('/api/generate-quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, numQuestions })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate quiz. Please try again.');
  }

  const baseId = Date.now();
  const questions: Question[] = data.questions.map((q: any, idx: number) => {
    const prefixes = ['A) ', 'B) ', 'C) ', 'D) '];
    const options = q.options.map((opt: string, i: number) => `${prefixes[i]}${opt}`);
    return {
      id: baseId + idx,
      question: q.question,
      options,
      correctAnswer: q.correctAnswerIndex,
      correctAnswerText: options[q.correctAnswerIndex],
      explanation: q.explanation,
      timeLimit: 30
    };
  });

  return {
    suggestedTitle: data.suggestedTitle,
    suggestedCategory: data.suggestedCategory,
    questions
  };
}
