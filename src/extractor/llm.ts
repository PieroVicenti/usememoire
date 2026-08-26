import OpenAI from 'openai';
import { loadConfig } from '../config.js';

export interface LLMFact {
  fact: string;
  category: 'pattern' | 'decision' | 'preference' | 'file-ref' | 'general';
}

export async function extractWithLLM(userMessage: string, assistantResponse: string): Promise<LLMFact[]> {
  const config = loadConfig();

  if (config.mode !== 'auto' || !config.openai_api_key) {
    return [];
  }

  const client = new OpenAI({ apiKey: config.openai_api_key });

  const prompt = `Analyze this conversation exchange and extract ONLY durable facts worth remembering long-term.
  
Rules:
- Max 300 characters per fact
- Only architectural decisions, preferences, file paths, patterns
- Ignore temporary bugs, greetings, one-off questions
- Return empty array if nothing worth saving
- Respond ONLY with valid JSON, no markdown

Exchange:
USER: ${userMessage.slice(0, 500)}
ASSISTANT: ${assistantResponse.slice(0, 500)}

Respond with JSON array: [{"fact": "...", "category": "pattern|decision|preference|file-ref|general"}]`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.1
    });

    const content = response.choices[0]?.message?.content || '[]';
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[usememoire] LLM extraction error:', err);
    return [];
  }
}
