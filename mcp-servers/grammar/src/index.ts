import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod/v4';

const server = new McpServer({ name: 'grammar', version: '0.1.0' });

const grammarTopics = {
  present_perfect: {
    title: 'Present Perfect',
    explanation: 'Use the present perfect for experiences or past actions that have a connection with the present. Form: have/has + past participle.',
    examples: ['I have visited Delhi.', 'She has finished her assignment.']
  },
  past_simple: {
    title: 'Past Simple',
    explanation: 'Use the past simple for completed actions in a finished past time. Regular verbs commonly use -ed; irregular verbs have special forms.',
    examples: ['I visited Delhi last year.', 'She finished her assignment yesterday.']
  }
} as const;

server.registerResource(
  'grammar-topics',
  'english://grammar/topics',
  { title: 'Grammar topic index', description: 'Small built-in development grammar index.', mimeType: 'application/json' },
  async uri => ({ contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(Object.keys(grammarTopics)) }] })
);

server.registerTool(
  'explain_grammar',
  {
    description: 'Explain an English grammar topic at an optional proficiency level.',
    inputSchema: z.object({
      topic: z.string().min(1),
      level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).default('B1'),
      learnerQuestion: z.string().optional()
    }),
    outputSchema: z.object({ topic: z.string(), level: z.string(), explanation: z.string(), examples: z.array(z.string()) })
  },
  async ({ topic, level }) => {
    const key = topic.toLowerCase().replaceAll(' ', '_');
    const item = grammarTopics[key as keyof typeof grammarTopics];
    if (!item) throw new Error(`Unknown demo grammar topic: ${topic}`);
    const value = { topic: item.title, level, explanation: item.explanation, examples: [...item.examples] };
    return { structuredContent: value, content: [{ type: 'text', text: JSON.stringify(value) }] };
  }
);

server.registerTool(
  'analyze_grammar',
  {
    description: 'Detect simple grammar signals in learner text and return learner-oriented feedback candidates.',
    inputSchema: z.object({ text: z.string().min(1) }),
    outputSchema: z.object({ issues: z.array(z.object({ category: z.string(), message: z.string(), evidence: z.string() })) })
  },
  async ({ text }) => {
    const issues: { category: string; message: string; evidence: string }[] = [];
    if (/\bI has\b/i.test(text)) issues.push({ category: 'subject-verb agreement', message: 'Use “I have”, not “I has”.', evidence: text.match(/\bI has\b/i)?.[0] ?? '' });
    if (/\byesterday\b/i.test(text) && /\b(have|has)\b/i.test(text)) issues.push({ category: 'tense consistency', message: 'A finished time such as “yesterday” normally takes the past simple.', evidence: text });
    return { structuredContent: { issues }, content: [{ type: 'text', text: JSON.stringify({ issues }) }] };
  }
);

server.registerTool(
  'generate_practice',
  {
    description: 'Generate constrained grammar practice from a requested topic and number of items.',
    inputSchema: z.object({ topic: z.string().min(1), count: z.number().int().min(1).max(10).default(5), level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).default('B1') }),
    outputSchema: z.object({ topic: z.string(), level: z.string(), items: z.array(z.object({ prompt: z.string(), answer: z.string() })) })
  },
  async ({ topic, count, level }) => {
    if (topic.toLowerCase().replaceAll(' ', '_') !== 'present_perfect') throw new Error('Demo generator currently supports present_perfect only.');
    const seed = [
      ['I ___ (finish) my homework.', 'have finished'],
      ['She ___ (visit) Bengaluru twice.', 'has visited'],
      ['We ___ (not/see) this film yet.', 'have not seen'],
      ['He ___ (already/leave).', 'has already left'],
      ['They ___ (live) here for five years.', 'have lived']
    ];
    const items = Array.from({ length: count }, (_, i) => ({ prompt: seed[i % seed.length][0], answer: seed[i % seed.length][1] }));
    const value = { topic, level, items };
    return { structuredContent: value, content: [{ type: 'text', text: JSON.stringify(value) }] };
  }
);

server.registerPrompt(
  'grammar_tutor',
  {
    description: 'Create a learner-friendly grammar tutoring interaction.',
    argsSchema: z.object({ question: z.string().min(1), level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).default('B1') })
  },
  async ({ question, level }) => ({ messages: [{ role: 'user', content: { type: 'text', text: `You are an English grammar tutor. Explain ${question} for a ${level} learner. Explain the reason, give two examples, then ask one practice question. Do not simply provide the answer to an assessed task.` } }] })
);

await serveStdio(server);
