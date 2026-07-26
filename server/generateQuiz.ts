const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const MAX_SOURCE_CHARS = 40000;

interface GeneratedQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface GeneratedQuiz {
  suggestedTitle: string;
  suggestedCategory: string;
  questions: GeneratedQuestion[];
}

interface GenerateArgs {
  apiKey: string;
  text: string;
  numQuestions: number;
}

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    suggestedTitle: { type: 'STRING', description: 'A short, catchy title for a quiz based on this material' },
    suggestedCategory: { type: 'STRING', description: 'A short category label, e.g. "Cloud Computing" or "History"' },
    questions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          question: { type: 'STRING' },
          options: {
            type: 'ARRAY',
            items: { type: 'STRING' },
            description: 'Exactly 4 answer options, in random order'
          },
          correctAnswerIndex: { type: 'INTEGER', description: 'Index (0-3) of the correct option' },
          explanation: { type: 'STRING', description: 'One or two sentences explaining why the correct answer is right' }
        },
        required: ['question', 'options', 'correctAnswerIndex', 'explanation']
      }
    }
  },
  required: ['suggestedTitle', 'suggestedCategory', 'questions']
};

export async function generateQuizFromSource({ apiKey, text, numQuestions }: GenerateArgs): Promise<GeneratedQuiz> {
  const trimmedSource = text.trim().slice(0, MAX_SOURCE_CHARS);

  const prompt = [
    'You are building a multiple-choice trivia quiz for a live classroom/corporate game (like Kahoot).',
    `Read the SOURCE MATERIAL below and write exactly ${numQuestions} clear, unambiguous multiple-choice questions strictly based on it.`,
    'Rules:',
    '- Each question must have exactly 4 answer options with exactly one correct answer.',
    '- Wrong options must be plausible, not silly or obviously wrong.',
    '- Do not invent facts that are not supported by the source material.',
    '- Keep each question and option concise enough to read on a timer-based game screen.',
    '- Vary which option index (0-3) holds the correct answer across questions -- do not always put it first.',
    '',
    'SOURCE MATERIAL:',
    trimmedSource
  ].join('\n');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          thinkingConfig: { thinkingBudget: 0 }
        }
      })
    }
  );

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    let detail = '';
    try {
      detail = JSON.parse(errBody)?.error?.message || '';
    } catch {
      detail = errBody.slice(0, 200);
    }
    throw new Error(`Gemini API error (${response.status})${detail ? `: ${detail}` : ''}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini returned an empty response. Try shortening or clarifying your source text.');
  }

  let parsed: GeneratedQuiz;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('Gemini returned an unexpected format. Please try again.');
  }

  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error('No questions could be generated from that source material -- try adding more detail.');
  }

  const cleanQuestions = parsed.questions
    .filter((q) => q && typeof q.question === 'string' && Array.isArray(q.options) && q.options.length === 4)
    .map((q) => ({
      question: q.question.trim(),
      options: q.options.map((opt) => String(opt).trim()),
      correctAnswerIndex: Math.min(3, Math.max(0, Math.round(q.correctAnswerIndex))),
      explanation: (q.explanation || '').trim() || 'No explanation provided.'
    }));

  if (cleanQuestions.length === 0) {
    throw new Error('Gemini did not return any valid questions. Please try again.');
  }

  return {
    suggestedTitle: (parsed.suggestedTitle || 'AI Generated Quiz').trim(),
    suggestedCategory: (parsed.suggestedCategory || 'AI Generated').trim(),
    questions: cleanQuestions
  };
}
