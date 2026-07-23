import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory room storage for multi-client synchronized quiz state
interface Player {
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

interface RoomState {
  roomCode: string;
  quizTitle?: string;
  hostName: string;
  status: 'lobby' | 'question' | 'revealed' | 'leaderboard' | 'finished';
  currentQuestionIndex: number;
  activeSessionFilter: number | 'all';
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
  customQuestions?: any[];
  lastUpdated: number;
}

const DEFAULT_ROOM_CODE = 'GOOGLE2026';

const rooms: Record<string, RoomState> = {
  [DEFAULT_ROOM_CODE]: {
    roomCode: DEFAULT_ROOM_CODE,
    quizTitle: 'Google AI & Cloud Master Quiz',
    hostName: 'Nawab Khan (ByteeIT)',
    status: 'lobby',
    currentQuestionIndex: 0,
    activeSessionFilter: 'all',
    timerRemaining: 30,
    timeLimit: 30,
    players: [],
    questionAnswers: {},
    lastUpdated: Date.now()
  }
};

// SSE Subscribers by room code
const sseClients: Record<string, Set<express.Response>> = {};

function notifyRoomClients(roomCode: string) {
  const code = roomCode.toUpperCase();
  const room = rooms[code];
  if (!room || !sseClients[code]) return;

  const data = JSON.stringify(room);
  sseClients[code].forEach((res) => {
    try {
      res.write(`data: ${data}\n\n`);
    } catch {
      // ignore write errors
    }
  });
}

function getOrCreateRoom(roomCode: string): RoomState {
  const code = roomCode.toUpperCase();
  if (!rooms[code]) {
    rooms[code] = {
      roomCode: code,
      hostName: 'Host (AI Studio Cloud)',
      status: 'lobby',
      currentQuestionIndex: 0,
      activeSessionFilter: 'all',
      timerRemaining: 30,
      timeLimit: 30,
      players: [],
      questionAnswers: {},
      lastUpdated: Date.now()
    };
  }
  return rooms[code];
}

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Get room state
app.get('/api/room/:code', (req, res) => {
  const code = (req.params.code || DEFAULT_ROOM_CODE).toUpperCase();
  const room = getOrCreateRoom(code);
  res.json(room);
});

// Update entire room state
app.post('/api/room/:code/update', (req, res) => {
  const code = (req.params.code || DEFAULT_ROOM_CODE).toUpperCase();
  const newState = req.body;
  if (!newState || typeof newState !== 'object') {
    res.status(400).json({ error: 'Invalid state body' });
    return;
  }

  rooms[code] = {
    ...newState,
    roomCode: code,
    lastUpdated: Date.now()
  };

  notifyRoomClients(code);
  res.json(rooms[code]);
});

// SSE stream endpoint for real-time room synchronization
app.get('/api/room/:code/stream', (req, res) => {
  const code = (req.params.code || DEFAULT_ROOM_CODE).toUpperCase();
  getOrCreateRoom(code);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  if (!sseClients[code]) {
    sseClients[code] = new Set();
  }
  sseClients[code].add(res);

  // Send initial state immediately
  res.write(`data: ${JSON.stringify(rooms[code])}\n\n`);

  req.on('close', () => {
    sseClients[code]?.delete(res);
  });
});

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
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
    console.log(`Quiz server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
});
