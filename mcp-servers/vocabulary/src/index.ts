import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod/v4';

const server = new McpServer({ name: 'vocabulary', version: '0.1.0' });

const entries = {
  evidence: {
    definition: 'information used to support a claim or conclusion',
    partOfSpeech: 'noun',
    collocations: ['strong evidence', 'empirical evidence', 'supporting evidence'],
    examples: ['The report provides evidence for the proposed approach.'],
    level: 'B2'
  },
  analyze: {
    definition: 'to examine something carefully in order to understand it',
    partOfSpeech: 'verb',
    collocations: ['analyze data', 'analyze a text', 'analyze results'],
    examples: ['Students analyze the passage before writing their response.'],
    level: 'B1'
  }
} as const;

server.registerResource(
  'vocabulary-index',
  'english://vocabulary/index',
  { title: 'Vocabulary index', description: 'Development vocabulary resource.', mimeType: 'application/json' },
  async uri => ({ contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(Object.keys(entries)) }] })
);

server.registerTool(
  'lookup_word',
  {
    description: 'Look up a word with definition, part of speech, collocations, examples, and level.',
    inputSchema: z.object({ word: z.string().min(1) }),
    outputSchema: z.object({ word: z.string(), definition: z.string(), partOfSpeech: z.string(), collocations: z.array(z.string()), examples: z.array(z.string()), level: z.string() })
  },
  async ({ word }) => {
    const key = word.toLowerCase() as keyof typeof entries;
    const item = entries[key];
    if (!item) throw new Error(`Word not present in development lexicon: ${word}`);
    const value = { word: key, ...item, collocations: [...item.collocations], examples: [...item.examples] };
    return { structuredContent: value, content: [{ type: 'text', text: JSON.stringify(value) }] };
  }
);

server.registerTool(
  'analyze_vocabulary',
  {
    description: 'Estimate lexical signals in learner text using a small development lexicon.',
    inputSchema: z.object({ text: z.string().min(1) }),
    outputSchema: z.object({ knownWords: z.array(z.string()), unfamiliarWords: z.array(z.string()), suggestions: z.array(z.string()) })
  },
  async ({ text }) => {
    const words = [...new Set((text.toLowerCase().match(/[a-z]+/g) ?? []))];
    const knownWords = words.filter(word => word in entries);
    const unfamiliarWords = words.filter(word => !(word in entries)).slice(0, 20);
    const suggestions = knownWords.map(word => `${word}: try one new sentence with a relevant collocation.`);
    const value = { knownWords, unfamiliarWords, suggestions };
    return { structuredContent: value, content: [{ type: 'text', text: JSON.stringify(value) }] };
  }
);

server.registerTool(
  'generate_vocab_practice',
  {
    description: 'Create controlled vocabulary practice for a target word.',
    inputSchema: z.object({ word: z.string().min(1), count: z.number().int().min(1).max(10).default(5), level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).default('B1') }),
    outputSchema: z.object({ word: z.string(), level: z.string(), items: z.array(z.object({ prompt: z.string(), answer: z.string() })) })
  },
  async ({ word, count, level }) => {
    const key = word.toLowerCase() as keyof typeof entries;
    const item = entries[key];
    if (!item) throw new Error(`Word not present in development lexicon: ${word}`);
    const items = Array.from({ length: count }, (_, i) => ({ prompt: `Complete a sentence using “${key}” in context ${i + 1}.`, answer: item.examples[0] }));
    const value = { word: key, level, items };
    return { structuredContent: value, content: [{ type: 'text', text: JSON.stringify(value) }] };
  }
);

server.registerPrompt(
  'vocabulary_coach',
  {
    description: 'Create a learner-friendly vocabulary coaching interaction.',
    argsSchema: z.object({ word: z.string().min(1), level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).default('B1') })
  },
  async ({ word, level }) => ({ messages: [{ role: 'user', content: { type: 'text', text: `Teach the word “${word}” to a ${level} English learner. Explain meaning, part of speech, two collocations, one example, and finish with a short retrieval-practice question.` } }] })
);

await serveStdio(server);
