import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAllMemories, searchMemories, deleteMemory } from '../db/queries.js';
import { loadConfig } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UI_DIST = path.join(__dirname, 'dist');

export function startUiServer(workspacePath: string) {
  const config = loadConfig();
  const app = express();
  app.use(express.json());
  app.use(express.static(UI_DIST));

  app.get('/api/memories', (_req, res) => {
    const memories = getAllMemories();
    res.json({ memories, workspace: workspacePath });
  });

  app.get('/api/search', (req, res) => {
    const q = req.query.q as string || '';
    const memories = q ? searchMemories(q) : getAllMemories();
    res.json({ memories, workspace: workspacePath });
  });

  app.delete('/api/memories/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const ok = deleteMemory(id);
    res.json({ ok });
  });

  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(UI_DIST, 'index.html'));
  });

  const port = config.ui_port || 3761;
  app.listen(port, () => {
    console.error(`[usememoire] UI → http://localhost:${port}`);
  });
}