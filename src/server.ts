import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import path from 'path';
import { initDb } from './db/schema.js';
import { saveMemory, searchMemories, getAllMemories } from './db/queries.js';
import { extractFromText, hasSaveTag } from './extractor/regex.js';
import { extractWithLLM } from './extractor/llm.js';
import { loadConfig } from './config.js';
import { startUiServer } from './ui/server.js';

// Workspace = cartella da cui viene lanciato il server
const WORKSPACE = process.cwd();

async function main() {
  initDb();

  const config = loadConfig();
  startUiServer(WORKSPACE);

  const server = new McpServer({
    name: 'usememoire',
    version: '1.0.0'
  });

  // ─── TOOL: save_memory ───────────────────────────────────────────
  server.tool(
    'save_memory',
    'Save an important fact, decision, pattern or file reference to persistent local memory. Call this when the user explicitly asks to save something, or when an architectural decision, preference or important pattern emerges in the conversation.',
    {
      fact: z.string().max(300).describe('The fact to save, max 300 characters'),
      category: z.enum(['pattern', 'decision', 'preference', 'file-ref', 'general'])
        .default('general')
        .describe('Category of the fact')
    },
    async ({ fact, category }) => {
      const memory = saveMemory(fact, category, WORKSPACE, 'manual');
      return {
        content: [{
          type: 'text',
          text: `✅ Saved [${category}]: "${fact}" (id: ${memory.id})`
        }]
      };
    }
  );

  // ─── TOOL: search_memory ─────────────────────────────────────────
  server.tool(
    'search_memory',
    'Search persistent local memory for relevant context about this project. Call this at the start of conversations or when the user references something from a previous session, mentions a function, file, or past decision.',
    {
      query: z.string().describe('What to search for in memory'),
      limit: z.number().default(5).describe('Max results to return')
    },
    async ({ query, limit }) => {
      const results = searchMemories(query, WORKSPACE, limit);

      if (!results.length) {
        return {
          content: [{
            type: 'text',
            text: 'No relevant memories found for this workspace.'
          }]
        };
      }

      const formatted = results.map(m =>
        `[${m.category}] ${m.fact} (saved: ${m.created_at})`
      ).join('\n');

      return {
        content: [{
          type: 'text',
          text: `Found ${results.length} memories:\n\n${formatted}`
        }]
      };
    }
  );

  // ─── TOOL: process_message ───────────────────────────────────────
  server.tool(
    'process_message',
    'Process a conversation exchange to automatically extract and save relevant facts. Call this after each assistant response in AUTO mode, passing both the user message and assistant response.',
    {
      user_message: z.string().describe('The user message'),
      assistant_response: z.string().describe('The assistant response')
    },
    async ({ user_message, assistant_response }) => {
      const saved: string[] = [];
      const fullText = `${user_message} ${assistant_response}`;

      // Trigger 1: [SAVE_MEMORY] tag
      const tagFact = hasSaveTag(user_message);
      if (tagFact) {
        saveMemory(tagFact, 'general', WORKSPACE, 'tag');
        saved.push(`[tag] ${tagFact}`);
      }

      // Trigger 2: regex patterns
      const regexFacts = extractFromText(fullText);
      for (const { fact, category } of regexFacts) {
        saveMemory(fact, category, WORKSPACE, 'regex');
        saved.push(`[regex:${category}] ${fact}`);
      }

      // Trigger 3: LLM extraction (solo AUTO mode, asincrono)
      if (config.mode === 'auto') {
        extractWithLLM(user_message, assistant_response).then(facts => {
          for (const { fact, category } of facts) {
            saveMemory(fact, category, WORKSPACE, 'llm');
          }
        }).catch(console.error);
      }

      return {
        content: [{
          type: 'text',
          text: saved.length
            ? `Saved ${saved.length} facts:\n${saved.join('\n')}`
            : 'No facts worth saving detected.'
        }]
      };
    }
  );

  // ─── TOOL: list_memories ─────────────────────────────────────────
  server.tool(
    'list_memories',
    'List all memories saved for the current workspace.',
    {},
    async () => {
      const memories = getAllMemories(WORKSPACE);
      if (!memories.length) {
        return { content: [{ type: 'text', text: 'No memories saved yet.' }] };
      }
      const formatted = memories.map(m =>
        `[${m.id}] [${m.category}] ${m.fact}`
      ).join('\n');
      return { content: [{ type: 'text', text: formatted }] };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[usememoire] MCP server running | workspace: ${path.basename(WORKSPACE)} | mode: ${config.mode}`);
}

main().catch(console.error);
