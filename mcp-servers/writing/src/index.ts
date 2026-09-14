import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod/v4';

const server = new McpServer({ name: 'writing', version: '0.1.0' });

const rubric = {
  organization: 'Ideas are logically ordered and connected.',
  clarity: 'Sentences communicate the intended meaning clearly.',
  grammar: 'Grammar and sentence structures are appropriate for the intended level.',
  vocabulary: 'Word choice is appropriate, varied, and accurate.'
};

server.registerResource(
  'writing-rubric',
  'english://writing/rubric/general',
  { title: 'General writing rubric', description: 'Development writing rubric for formative feedback.', mimeType: 'application/json' },
  async uri => ({ contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(rubric) }] })
);

server.registerTool(
  'analyze_writing',
  {
    description: 'Analyze learner writing for formative signals without silently rewriting it.',
    inputSchema: z.object({ text: z.string().min(1), level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).default('B1'), taskType: z.string().optional() }),
    outputSchema: z.object({ level: z.string(), wordCount: z.number(), sentences: z.number(), signals: z.array(z.object({ category: z.string(), message: z.string(), evidence: z.string() })) })
  },
  async ({ text, level }) => {
    const words = text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? [];
    const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
    const signals: { category: string; message: string; evidence: string }[] = [];
    if (words.length < 50) signals.push({ category: 'development', message: 'The sample is short for a full writing diagnosis; gather more evidence before drawing broad conclusions.', evidence: `${words.length} words` });
    if (/\bI has\b/i.test(text)) signals.push({ category: 'grammar', message: 'Check subject–verb agreement with “I”.', evidence: text.match(/\bI has\b/i)?.[0] ?? '' });
    if ((text.match(/\bvery\b/gi) ?? []).length >= 3) signals.push({ category: 'vocabulary', message: 'Consider whether repeated intensifiers can be replaced by more precise vocabulary.', evidence: 'Repeated use of “very”' });
    const value = { level, wordCount: words.length, sentences: sentences.length, signals };
    return { structuredContent: value, content: [{ type: 'text', text: JSON.stringify(value) }] };
  }
);

server.registerTool(
  'suggest_revision',
  {
    description: 'Return revision prompts that preserve learner authorship.',
    inputSchema: z.object({ text: z.string().min(1), focus: z.enum(['organization', 'clarity', 'grammar', 'vocabulary']).default('clarity'), level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).default('B1') }),
    outputSchema: z.object({ focus: z.string(), prompts: z.array(z.string()) })
  },
  async ({ focus, level }) => {
    const prompts: Record<string, string[]> = {
      organization: ['What is the main point of each paragraph?', 'Can you move each supporting idea closer to the point it supports?'],
      clarity: ['Can you replace any vague reference with a specific noun?', 'Can you make the relationship between these two sentences explicit?'],
      grammar: ['Check subject–verb agreement in each sentence.', 'Check tense consistency and explain why you chose each tense.'],
      vocabulary: ['Replace one repeated word with a precise alternative.', 'Check whether each advanced word is used naturally in context.']
    };
    const value = { focus: `${focus} (${level})`, prompts: prompts[focus] };
    return { structuredContent: value, content: [{ type: 'text', text: JSON.stringify(value) }] };
  }
);

server.registerTool(
  'score_rubric',
  {
    description: 'Produce a transparent formative rubric score from supplied criterion scores.',
    inputSchema: z.object({ scores: z.object({ organization: z.number().min(0).max(4), clarity: z.number().min(0).max(4), grammar: z.number().min(0).max(4), vocabulary: z.number().min(0).max(4) }), comment: z.string().optional() }),
    outputSchema: z.object({ total: z.number(), maximum: z.number(), percentage: z.number(), feedback: z.string() })
  },
  async ({ scores, comment }) => {
    const total = Object.values(scores).reduce((sum, value) => sum + value, 0);
    const maximum = 16;
    const value = { total, maximum, percentage: Math.round((total / maximum) * 100), feedback: comment ?? 'Use the criterion-level scores to guide one revision cycle.' };
    return { structuredContent: value, content: [{ type: 'text', text: JSON.stringify(value) }] };
  }
);

server.registerPrompt(
  'writing_coach',
  {
    description: 'Guide formative writing feedback while preserving learner authorship.',
    argsSchema: z.object({ text: z.string().min(1), level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).default('B1') })
  },
  async ({ text, level }) => ({ messages: [{ role: 'user', content: { type: 'text', text: `Act as a ${level} English writing coach. Analyze this learner text: ${text}. Identify a small number of high-value improvements, explain why they matter, and ask the learner to revise. Do not replace the learner's complete text.` } }] })
);

await serveStdio(server);
