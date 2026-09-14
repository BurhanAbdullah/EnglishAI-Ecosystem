import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod/v4';

const server = new McpServer({ name: 'reading', version: '0.1.0' });

const passage = {
  id: 'reading-demo-001',
  title: 'Why Deliberate Practice Helps Language Learning',
  text: 'Deliberate practice asks learners to work on a specific skill, receive feedback, and try again. Repeated cycles can help learners notice patterns and improve their performance.',
  level: 'B1'
};

server.registerResource(
  'demo-reading-passage',
  'english://reading/passage/reading-demo-001',
  { title: passage.title, description: 'Development reading passage.', mimeType: 'text/plain' },
  async uri => ({ contents: [{ uri: uri.href, mimeType: 'text/plain', text: passage.text }] })
);

server.registerTool(
  'explain_reading',
  {
    description: 'Explain a reading passage using plain learner-facing language.',
    inputSchema: z.object({ text: z.string().min(1), question: z.string().min(1), level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).default('B1') }),
    outputSchema: z.object({ level: z.string(), answer: z.string(), keyIdeas: z.array(z.string()) })
  },
  async ({ text, question, level }) => {
    const words = text.split(/\s+/).filter(Boolean);
    const answer = `For a ${level} learner, focus on the main idea before interpreting details. The question is: ${question}. The supplied passage contains ${words.length} whitespace-separated tokens.`;
    const value = { level, answer, keyIdeas: ['identify the topic', 'identify the main claim', 'locate evidence in the text'] };
    return { structuredContent: value, content: [{ type: 'text', text: JSON.stringify(value) }] };
  }
);

server.registerTool(
  'find_evidence',
  {
    description: 'Find sentences containing a requested keyword or phrase in a passage.',
    inputSchema: z.object({ text: z.string().min(1), query: z.string().min(1), maxMatches: z.number().int().min(1).max(10).default(5) }),
    outputSchema: z.object({ matches: z.array(z.object({ sentence: z.string(), index: z.number() })) })
  },
  async ({ text, query, maxMatches }) => {
    const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
    const q = query.toLowerCase();
    const matches = sentences.map((sentence, index) => ({ sentence, index })).filter(item => item.sentence.toLowerCase().includes(q)).slice(0, maxMatches);
    return { structuredContent: { matches }, content: [{ type: 'text', text: JSON.stringify({ matches }) }] };
  }
);

server.registerTool(
  'create_questions',
  {
    description: 'Create a small set of comprehension-question templates from a supplied passage.',
    inputSchema: z.object({ text: z.string().min(1), count: z.number().int().min(1).max(10).default(5), level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).default('B1') }),
    outputSchema: z.object({ level: z.string(), questions: z.array(z.string()) })
  },
  async ({ count, level }) => {
    const seed = ['What is the main idea?', 'Which detail best supports the main idea?', 'What does the author want the reader to understand?', 'Which word in the passage is closest in meaning to an important concept?', 'How would you summarize the passage in one sentence?'];
    const questions = Array.from({ length: count }, (_, i) => seed[i % seed.length]);
    const value = { level, questions };
    return { structuredContent: value, content: [{ type: 'text', text: JSON.stringify(value) }] };
  }
);

server.registerPrompt(
  'reading_tutor',
  {
    description: 'Guide a learner through comprehension without immediately giving the final answer.',
    argsSchema: z.object({ text: z.string().min(1), question: z.string().min(1), level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).default('B1') })
  },
  async ({ text, question, level }) => ({ messages: [{ role: 'user', content: { type: 'text', text: `Act as a reading tutor for a ${level} learner. Passage: ${text}\nQuestion: ${question}\nFirst ask the learner where they found evidence. Then guide them toward the answer and explain the reasoning.` } }] })
);

await serveStdio(server);
