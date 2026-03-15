import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface LeaderboardEntry {
  name: string;
  score: number;
  difficulty: string;
  timestamp: number;
}

// In-memory store for demo (would be a DB in production)
let leaderboard: LeaderboardEntry[] = [
  { name: 'FIZZ_MASTER', score: 2500, difficulty: 'HARD', timestamp: Date.now() },
  { name: 'SODA_KING', score: 1800, difficulty: 'MEDIUM', timestamp: Date.now() },
  { name: 'BUBBLE_POP', score: 1200, difficulty: 'EASY', timestamp: Date.now() },
];

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ noServer: true });
  const PORT = 3000;

  app.use(express.json());

  // Handle WebSocket upgrades manually to avoid conflicts with Vite
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url!, `http://${request.headers.host}`);
    
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  // API: Get Leaderboard
  app.get("/api/leaderboard", (req, res) => {
    const { difficulty } = req.query;
    let filtered = leaderboard;
    if (difficulty) {
      filtered = leaderboard.filter(entry => entry.difficulty === difficulty);
    }
    res.json(filtered.sort((a, b) => b.score - a.score).slice(0, 10));
  });

  // API: Submit Score
  app.post("/api/leaderboard", (req, res) => {
    const { name, score, difficulty } = req.body;
    if (!name || score === undefined || !difficulty) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const newEntry = { name, score, difficulty, timestamp: Date.now() };
    leaderboard.push(newEntry);
    
    // Keep only top 50 per difficulty to prevent memory bloat
    leaderboard = leaderboard.sort((a, b) => b.score - a.score).slice(0, 100);

    // Broadcast update to all connected clients
    const updateMsg = JSON.stringify({ type: 'LEADERBOARD_UPDATE', data: newEntry });
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(updateMsg);
      }
    });

    res.json({ success: true, entry: newEntry });
  });

  // WebSocket connection handling
  wss.on("connection", (ws) => {
    console.log("Client connected to leaderboard socket");
    ws.send(JSON.stringify({ type: 'WELCOME', message: 'Connected to Fizz Bust Leaderboard' }));
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
