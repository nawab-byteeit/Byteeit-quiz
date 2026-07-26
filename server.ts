import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { generateQuizFromSource } from './server/generateQuiz';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '8mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.post('/api/generate-quiz', async (req, res) => {
  const { text, numQuestions } = req.body || {};

  if (typeof text !== 'string' || text.trim().length < 40) {
    res.status(400).json({ error: 'Please provide at least a few sentences of source material to generate questions from.' });
    return;
  }

  const apiKey = process.env.GOOGLE_GEMINI_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server is missing GOOGLE_GEMINI_KEY -- ask an admin to configure it in .env.' });
    return;
  }

  const count = Math.min(25, Math.max(1, Number(numQuestions) || 10));

  try {
    const result = await generateQuizFromSource({ apiKey, text, numQuestions: count });
    res.json(result);
  } catch (err: any) {
    console.error('Quiz generation failed:', err);
    res.status(502).json({ error: err.message || 'Quiz generation failed. Please try again.' });
  }
});

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Quiz app server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
});
