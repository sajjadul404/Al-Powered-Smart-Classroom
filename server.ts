import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  askAssistantServer,
  getWeatherResponse,
  hashPasswordServer,
  verifyPasswordServer,
} from './server/handlers';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'fastrobox-smart-classroom', timestamp: new Date().toISOString() });
  });

  app.post('/api/auth/hash', (req, res) => {
    const { password } = req.body ?? {};
    if (typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({ error: 'Invalid password' });
    }
    return res.json({ passwordHash: hashPasswordServer(password) });
  });

  app.post('/api/auth/verify', (req, res) => {
    const { password, passwordHash } = req.body ?? {};
    return res.json({ valid: verifyPasswordServer(password, passwordHash) });
  });

  app.get('/api/weather', async (req, res) => {
    const simulateFailure = req.query.simulateFailure === 'true';
    const forceRefresh = req.query.refresh === 'true';
    const result = await getWeatherResponse(simulateFailure, forceRefresh);
    return res.json(result);
  });

  app.post('/api/assistant', async (req, res) => {
    const { question, databaseSnapshot } = req.body ?? {};
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ answer: 'No data' });
    }
    const result = await askAssistantServer(question, databaseSnapshot);
    return res.json(result);
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FastRobox 1.0 server listening on http://localhost:${PORT}`);
  });
}

startServer();
