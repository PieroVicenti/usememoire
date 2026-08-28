import { db } from './schema.js';

export interface Memory {
  id: number;
  fact: string;
  category: string;
  workspace_path: string;
  source: string;
  created_at: string;
}

export function saveMemory(fact: string, category: string, workspacePath: string, source: string = 'manual'): Memory {
  const stmt = db.prepare(`INSERT INTO memories (fact, category, workspace_path, source) VALUES (?, ?, ?, ?)`);
  const result = stmt.run(fact, category, workspacePath, source);
  return getMemoryById(Number(result.lastInsertRowid))!;
}

export function searchMemories(query: string, limit: number = 5): Memory[] {
  try {
    const stmt = db.prepare(`
      SELECT m.* FROM memories m
      JOIN memories_fts fts ON m.id = fts.rowid
      WHERE memories_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `);
    return stmt.all(query, limit) as unknown as Memory[];
  } catch {
    const stmt = db.prepare(`SELECT * FROM memories WHERE fact LIKE ? LIMIT ?`);
    return stmt.all(`%${query}%`, limit) as unknown as Memory[];
  }
}

export function getAllMemories(): Memory[] {
  const stmt = db.prepare(`SELECT * FROM memories ORDER BY created_at DESC`);
  return stmt.all() as unknown as Memory[];
}

export function deleteMemory(id: number): boolean {
  const stmt = db.prepare(`DELETE FROM memories WHERE id = ?`);
  const result = stmt.run(id);
  return result.changes > 0;
}

export function getMemoryById(id: number): Memory | undefined {
  const stmt = db.prepare(`SELECT * FROM memories WHERE id = ?`);
  return stmt.get(id) as unknown as Memory | undefined;
}