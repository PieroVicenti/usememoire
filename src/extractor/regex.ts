export interface ExtractedFact {
  fact: string;
  category: string;
}

const PATTERNS = [
  // File references: "auth → ./src/auth.ts"
  {
    regex: /(\w[\w\s]*?)\s*[→\->]+\s*(\.\/[\w/.\-]+)/g,
    category: 'file-ref',
    extract: (m: RegExpMatchArray) => `${m[1].trim()} → ${m[2]}`
  },
  // Decisioni architetturali
  {
    regex: /(?:usiamo|utilizziamo|we use|we're using|using)\s+([A-Z][\w\s\-\.]+?)(?:\s+for|\s+per|\s+in|\.|,|$)/gi,
    category: 'decision',
    extract: (m: RegExpMatchArray) => `Using: ${m[1].trim()}`
  },
  // Preferenze
  {
    regex: /(?:preferisco|preferisci|i prefer|always use|usa sempre|use always)\s+(.+?)(?:\.|,|$)/gi,
    category: 'preference',
    extract: (m: RegExpMatchArray) => `Preference: ${m[1].trim()}`
  },
  // Pattern tecnici: JWT, cookie, auth ecc
  {
    regex: /(?:JWT|OAuth|cookie|session|token|auth)\s+(?:in|via|con|with)\s+([\w\-\s]+?)(?:\.|,|$)/gi,
    category: 'pattern',
    extract: (m: RegExpMatchArray) => m[0].trim()
  }
];

export function extractFromText(text: string): ExtractedFact[] {
  const facts: ExtractedFact[] = [];

  for (const pattern of PATTERNS) {
    const matches = [...text.matchAll(pattern.regex)];
    for (const match of matches) {
      const fact = pattern.extract(match);
      if (fact && fact.length > 5 && fact.length < 300) {
        facts.push({ fact, category: pattern.category });
      }
    }
  }

  return facts;
}

export function hasSaveTag(text: string): string | null {
  // Cerca [SAVE_MEMORY: fatto] o [SAVE_MEMORY] preceduto dal testo
  const tagMatch = text.match(/\[SAVE_MEMORY(?::\s*(.+?))?\]/i);
  if (!tagMatch) return null;

  if (tagMatch[1]) return tagMatch[1].trim();

  // Prende il testo prima del tag come fatto
  const before = text.slice(0, text.indexOf(tagMatch[0])).trim();
  return before.length > 0 ? before.slice(-200) : null;
}
