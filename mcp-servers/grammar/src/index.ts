import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod/v4';

const server = new McpServer({ name: 'grammar', version: '0.2.0' });

const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
const levelSchema = z.enum(levels);

type GrammarIssue = {
  category: string;
  subtype: string;
  message: string;
  evidence: string;
  correction: string;
  explanation: string;
  confidence: number;
  level: string;
};

const grammarTopics = {
  present_perfect: {
    title: 'Present Perfect',
    explanation: 'Use the present perfect for experiences or past actions that have a connection with the present. Form: have/has + past participle.',
    examples: ['I have visited Delhi.', 'She has finished her assignment.']
  },
  past_simple: {
    title: 'Past Simple',
    explanation: 'Use the past simple for completed actions in a finished past time.',
    examples: ['I visited Delhi last year.', 'She finished her assignment yesterday.']
  }
} as const;

function analyzeText(text: string, level: string): GrammarIssue[] {
  const issues: GrammarIssue[] = [];
  const add = (issue: Omit<GrammarIssue, 'level'>) => issues.push({ ...issue, level });

  const agreement = text.match(/\bI has\b/i);
  if (agreement) {
    add({
      category: 'subject-verb agreement',
      subtype: 'auxiliary agreement',
      message: 'Use “I have”, not “I has”.',
      evidence: agreement[0],
      correction: 'I have',
      explanation: 'The subject “I” takes “have” in the present perfect.',
      confidence: 0.99
    });
  }

  // Keep tense evidence local to a sentence so an unrelated “yesterday” does not trigger a false positive.
  for (const sentence of text.split(/[.!?]+/).map(value => value.trim()).filter(Boolean)) {
    const finishedTime = sentence.match(/\b(yesterday|last\s+(?:week|month|year)|\d+\s+(?:day|week|month|year)s?\s+ago)\b/i);
    const perfectAuxiliary = sentence.match(/\b(have|has)\b/i);
    if (finishedTime && perfectAuxiliary) {
      add({
        category: 'tense choice',
        subtype: 'finished-time reference',
        message: 'A completed time expression normally calls for the past simple rather than the present perfect.',
        evidence: `${perfectAuxiliary[0]} … ${finishedTime[0]}`,
        correction: 'Use the past simple with a finished past time.',
        explanation: 'Present perfect normally connects a past event to the present without specifying a finished past time.',
        confidence: 0.91
      });
    }
  }

  return issues;
}

server.registerResource(
  'grammar-topics',
  'english://grammar/topics',
  { title: 'Grammar topic index', description: 'Built-in grammar topic index.', mimeType: 'application/json' },
  async uri => ({ contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(Object.keys(grammarTopics)) }] })
);

server.registerTool(
  'explain_grammar',
  {
    description: 'Explain a supported English grammar topic at an optional CEFR proficiency level.',
    inputSchema: z.object({ topic: z.string().min(1), level: levelSchema.default('B1'), learnerQuestion: z.string().optional() }),
    outputSchema: z.object({ topic: z.string(), level: z.string(), explanation: z.string(), examples: z.array(z.string()) })
  },
  async ({ topic, level }) => {
    const key = topic.toLowerCase().replaceAll(' ', '_');
    const item = grammarTopics[key as keyof typeof grammarTopics];
    if (!item) throw new Error(`Unknown grammar topic: ${topic}`);
    const value = { topic: item.title, level, explanation: item.explanation, examples: [...item.examples] };
    return { structuredContent: value, content: [{ type: 'text', text: JSON.stringify(value) }] };
  }
);

server.registerTool(
  'analyze_grammar',
  {
    description: 'Analyze learner text for deterministic grammar signals and return structured, learner-oriented feedback candidates.',
    inputSchema: z.object({ text: z.string().min(1).max(10000), level: levelSchema.default('B1') }),
    outputSchema: z.object({
      issues: z.array(z.object({
        category: z.string(), subtype: z.string(), message: z.string(), evidence: z.string(),
        correction: z.string(), explanation: z.string(), confidence: z.number(), level: z.string()
      }))
    })
  },
  async ({ text, level }) => {
    const value = { issues: analyzeText(text, level) };
    return { structuredContent: value, content: [{ type: 'text', text: JSON.stringify(value) }] };
  }
);

server.registerTool(
  'generate_practice',
  {
    description: 'Generate deterministic grammar practice for a supported topic.',
    inputSchema: z.object({ topic: z.string().min(1), count: z.number().int().min(1).max(10).default(5), level: levelSchema.default('B1') }),
    outputSchema: z.object({ topic: z.string(), level: z.string(), items: z.array(z.object({ prompt: z.string(), answer: z.string() })) })
  },
  async ({ topic, count, level }) => {
    if (topic.toLowerCase().replaceAll(' ', '_') !== 'present_perfect') throw new Error('Practice generator currently supports present_perfect only.');
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
    argsSchema: z.object({ question: z.string().min(1), level: levelSchema.default('B1') })
  },
  async ({ question, level }) => ({ messages: [{ role: 'user', content: { type: 'text', text: `You are an English grammar tutor. Explain ${question} for a ${level} learner. Explain the reason, give two examples, then ask one practice question. Do not simply provide the answer to an assessed task.` } }] })
);

await serveStdio(server);
