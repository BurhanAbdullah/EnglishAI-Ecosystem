import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod/v4';

const server = new McpServer({ name: 'assessment', version: '0.1.0' });

const questionSchema = z.object({
  id: z.string().min(1),
  skill: z.enum(['grammar', 'vocabulary', 'reading', 'writing']),
  prompt: z.string().min(1),
  expectedAnswer: z.string().min(1),
  rubricTag: z.string().min(1)
});

server.registerResource(
  'assessment-policy',
  'english://assessment/policy/default',
  { title: 'Assessment policy', description: 'Default formative-assessment policy.', mimeType: 'text/plain' },
  async uri => ({ contents: [{ uri: uri.href, mimeType: 'text/plain', text: 'Use transparent feedback. Separate practice from controlled assessment. Preserve learner authorship in writing tasks.' }] })
);

server.registerTool(
  'create_assessment',
  {
    description: 'Create a small, skill-tagged formative assessment.',
    inputSchema: z.object({ skill: z.enum(['grammar', 'vocabulary', 'reading', 'writing']), topic: z.string().min(1), count: z.number().int().min(1).max(10).default(5), level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).default('B1') }),
    outputSchema: z.object({ id: z.string(), skill: z.string(), topic: z.string(), level: z.string(), questions: z.array(questionSchema) })
  },
  async ({ skill, topic, count, level }) => {
    const questions = Array.from({ length: count }, (_, i) => ({
      id: `q-${i + 1}`,
      skill,
      prompt: `Practice item ${i + 1}: apply ${topic} in a ${level} English-learning context.`,
      expectedAnswer: `learner-response-${i + 1}`,
      rubricTag: `${skill}.${topic}`
    }));
    const value = { id: `assessment-${Date.now()}`, skill, topic, level, questions };
    return { structuredContent: value, content: [{ type: 'text', text: JSON.stringify(value) }] };
  }
);

server.registerTool(
  'validate_answer',
  {
    description: 'Validate a practice answer against an expected answer using normalized text comparison.',
    inputSchema: z.object({ answer: z.string(), expectedAnswer: z.string(), explain: z.boolean().default(true) }),
    outputSchema: z.object({ correct: z.boolean(), normalizedAnswer: z.string(), normalizedExpected: z.string(), feedback: z.string() })
  },
  async ({ answer, expectedAnswer, explain }) => {
    const normalize = (value: string) => value.trim().toLowerCase().replace(/[.!?,;:]+$/g, '');
    const normalizedAnswer = normalize(answer);
    const normalizedExpected = normalize(expectedAnswer);
    const correct = normalizedAnswer === normalizedExpected;
    const feedback = correct ? 'Correct. Explain the rule in your own words and try another example.' : explain ? `Not yet. Re-check the expected form: “${expectedAnswer}”. Try again before viewing a full explanation.` : 'Incorrect. Try again.';
    const value = { correct, normalizedAnswer, normalizedExpected, feedback };
    return { structuredContent: value, content: [{ type: 'text', text: JSON.stringify(value) }] };
  }
);

server.registerTool(
  'record_attempt',
  {
    description: 'Normalize a learner attempt record for downstream mastery analytics.',
    inputSchema: z.object({ learnerId: z.string().min(1), assessmentId: z.string().min(1), questionId: z.string().min(1), correct: z.boolean(), skill: z.enum(['grammar', 'vocabulary', 'reading', 'writing']), latencyMs: z.number().int().min(0).optional() }),
    outputSchema: z.object({ recorded: z.boolean(), event: z.object({ learnerId: z.string(), assessmentId: z.string(), questionId: z.string(), correct: z.boolean(), skill: z.string(), latencyMs: z.number().optional() }) })
  },
  async payload => {
    const event = { ...payload };
    const value = { recorded: true, event };
    return { structuredContent: value, content: [{ type: 'text', text: JSON.stringify(value) }] };
  }
);

server.registerPrompt(
  'assessment_feedback',
  {
    description: 'Turn an assessment result into constructive learner feedback.',
    argsSchema: z.object({ correct: z.enum(['true', 'false']), skill: z.string().min(1), level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).default('B1') })
  },
  async ({ correct, skill, level }) => ({ messages: [{ role: 'user', content: { type: 'text', text: `Give a ${level} learner concise formative feedback for a ${skill} item. Correct=${correct}. Explain the reasoning, identify one next step, and encourage another attempt.` } }] })
);

await serveStdio(() => server);
