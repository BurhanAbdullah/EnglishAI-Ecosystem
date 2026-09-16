import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import * as z from 'zod/v4';
import { TutorEngine } from '../tutor/tutor-engine.js';
import type { LearningAttempt } from '../tutor/types.js';

const PORT = Number(process.env.PORT ?? 8787);
const DEFAULT_WEB_ORIGINS = [
  'https://burhanabdullah.github.io/EnglishAI-Ecosystem',
  'https://englishai-ecosystem-live.onrender.com'
];
const configuredOrigins = (process.env.WEB_ORIGINS ?? process.env.WEB_ORIGIN ?? '')
  .split(',').map(value => value.trim()).filter(Boolean);
const ALLOWED_ORIGINS = new Set([...DEFAULT_WEB_ORIGINS, ...configuredOrigins]);

const capabilityConfig = {
  'english-content': { script: 'mcp-servers/english-content/src/index.ts', tools: ['search_content', 'fetch_source'] },
  grammar: { script: 'mcp-servers/grammar/src/index.ts', tools: ['explain_grammar', 'analyze_grammar', 'generate_practice'] },
  vocabulary: { script: 'mcp-servers/vocabulary/src/index.ts', tools: ['lookup_word', 'analyze_vocabulary'] },
  reading: { script: 'mcp-servers/reading/src/index.ts', tools: ['explain_reading', 'find_evidence'] },
  writing: { script: 'mcp-servers/writing/src/index.ts', tools: ['analyze_writing', 'suggest_revision'] },
  assessment: { script: 'mcp-servers/assessment/src/index.ts', tools: ['create_assessment', 'validate_answer', 'record_attempt'] },
  citation: { script: 'mcp-servers/citation/src/index.ts', tools: ['validate_citation', 'build_evidence_bundle'] }
} as const;

type Capability = keyof typeof capabilityConfig;
const clients = new Map<Capability, { client: Client; transport: StdioClientTransport }>();
const tutor = new TutorEngine();

async function getClient(capability: Capability) {
  const existing = clients.get(capability);
  if (existing) return existing.client;
  const config = capabilityConfig[capability];
  const client = new Client({ name: 'englishai-mcp-gateway', version: '1.2.0' });
  const transport = new StdioClientTransport({ command: 'npx', args: ['tsx', config.script] });
  await client.connect(transport);
  clients.set(capability, { client, transport });
  return client;
}

async function callCapability(capability: Capability, tool: string, args: Record<string, unknown>) {
  const config = capabilityConfig[capability];
  if (!config.tools.includes(tool as never)) throw new Error(`Tool '${tool}' is not allowed for capability '${capability}'.`);
  const client = await getClient(capability);
  return client.callTool({ name: tool, arguments: args });
}

const tutorSkill = z.enum(['grammar', 'vocabulary', 'reading', 'writing', 'speaking', 'listening']);
const proficiency = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

function learnerFromInput(input: { learnerId: string; proficiency?: string; firstLanguage?: string; targetSkill?: string; learningGoal: string }) {
  return {
    learnerId: input.learnerId,
    ...(input.proficiency ? { proficiency: input.proficiency as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' } : {}),
    ...(input.firstLanguage ? { firstLanguage: input.firstLanguage } : {}),
    ...(input.targetSkill ? { targetSkill: input.targetSkill as 'grammar' | 'vocabulary' | 'reading' | 'writing' | 'speaking' | 'listening' } : {}),
    learningGoal: input.learningGoal
  };
}

function buildTutorMessage(skill: string, action: string, name: string, userMessage: string, specialist: unknown): string {
  const data = specialist && typeof specialist === 'object' ? specialist as { content?: Array<{ text?: string }> } : {};
  const raw = data.content?.map(item => item.text ?? '').join(' ').trim() ?? '';
  let detail = '';
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (Array.isArray(parsed.issues) && parsed.issues.length > 0) {
      const issue = parsed.issues[0] as Record<string, unknown>;
      detail = `${String(issue.message ?? 'I found one area to improve.')} Try this: ${String(issue.correction ?? 'rewrite the sentence and explain your choice')}.`;
    } else if (Array.isArray(parsed.unfamiliarWords) && parsed.unfamiliarWords.length > 0) {
      detail = `Let's work on one word at a time. Start with “${String(parsed.unfamiliarWords[0])}” and use it in a new sentence.`;
    } else if (typeof parsed.answer === 'string') {
      detail = parsed.answer;
    }
  } catch {
    detail = '';
  }

  const prefix = name ? `${name}, ` : '';
  const actionLead: Record<string, string> = {
    teach: 'I’m going to slow this down and teach the idea before asking you to practise it.',
    practice: 'Let’s practise this in a focused way and use your next answer to adjust the difficulty.',
    review: 'Let’s consolidate what you already know and check whether it is becoming reliable.',
    'increase-difficulty': 'You are showing strong control, so I’m raising the challenge and testing transfer.',
    assess: 'I’ll use this as a fresh learning signal rather than just giving you the answer.',
    diagnose: 'I’ll first identify the pattern in your response so we know what to work on next.'
  };
  const message = userMessage.trim();
  return `${prefix}${actionLead[action] ?? 'Let’s work on this together.'}${detail ? ` ${detail}` : ''} ${message ? 'Now, tell me what you think the answer should be and why.' : 'Send me a sentence, question, or answer and I’ll guide you step by step.'}`;
}

function buildServer() {
  const server = new McpServer(
    { name: 'englishai-mcp-gateway', version: '1.2.0' },
    { instructions: 'Use call_capability for specialist MCP work and tutor_turn for stateful one-to-one learner orchestration. Never invent capability names or tool names.' }
  );

  server.registerTool(
    'list_capabilities',
    { description: 'List the approved EnglishAI MCP capability servers and their exposed tools.' },
    async () => ({ content: [{ type: 'text', text: JSON.stringify({ ...capabilityConfig, tutor: { tools: ['tutor_turn'] } }) }] })
  );

  server.registerTool(
    'call_capability',
    {
      description: 'Execute one approved tool through the EnglishAI MCP capability gateway.',
      inputSchema: z.object({
        capability: z.enum(['english-content', 'grammar', 'vocabulary', 'reading', 'writing', 'assessment', 'citation']),
        tool: z.string().min(1),
        arguments: z.record(z.string(), z.unknown()).default({})
      })
    },
    async ({ capability, tool, arguments: args }) => {
      const result = await callCapability(capability, tool, args);
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    }
  );

  server.registerTool(
    'tutor_turn',
    {
      description: 'Run one stateful one-to-one tutoring turn. Updates the learner model, chooses the next pedagogical action, routes to the relevant specialist MCP, and returns learner-facing guidance.',
      inputSchema: z.object({
        learnerId: z.string().min(1),
        name: z.string().min(1).optional(),
        proficiency: proficiency.optional(),
        firstLanguage: z.string().min(2).optional(),
        skill: tutorSkill,
        learningGoal: z.string().min(1),
        message: z.string().max(12000).default(''),
        attempts: z.array(z.object({ correct: z.boolean(), difficulty: z.number().min(0).max(1), confidence: z.number().min(0).max(1).optional(), errorType: z.string().optional(), timestamp: z.string().optional() })).max(50).default([])
      }),
      outputSchema: z.object({ learnerId: z.string(), skill: z.string(), action: z.string(), difficulty: z.number(), rationale: z.array(z.string()), coachMessage: z.string(), agents: z.array(z.string()), specialist: z.unknown().optional() })
    },
    async input => {
      const learner = learnerFromInput({ ...input, targetSkill: input.skill });
      tutor.registerLearner(learner);
      for (const attempt of input.attempts) {
        const event: LearningAttempt = { learnerId: input.learnerId, skill: input.skill, ...attempt };
        tutor.recordAttempt(event);
      }
      const decision = tutor.decide({ learnerId: input.learnerId, skill: input.skill, intent: 'learn' });

      let specialist: unknown;
      if (input.message.trim()) {
        if (input.skill === 'grammar') specialist = await callCapability('grammar', 'analyze_grammar', { text: input.message, level: input.proficiency ?? 'B1' });
        else if (input.skill === 'vocabulary') specialist = await callCapability('vocabulary', 'analyze_vocabulary', { text: input.message });
        else if (input.skill === 'writing') specialist = await callCapability('writing', 'analyze_writing', { text: input.message, level: input.proficiency ?? 'B1', taskType: 'tutoring' });
        else if (input.skill === 'reading') specialist = await callCapability('reading', 'explain_reading', { text: input.message, question: 'What is the learner asking about in this passage?', level: input.proficiency ?? 'B1' });
      }

      const coachMessage = buildTutorMessage(input.skill, decision.action, input.name ?? '', input.message, specialist);
      return {
        structuredContent: { ...decision, coachMessage, ...(specialist ? { specialist } : {}) },
        content: [{ type: 'text', text: JSON.stringify({ ...decision, coachMessage, ...(specialist ? { specialist } : {}) }) }]
      };
    }
  );

  return server;
}

const handler = createMcpHandler(() => buildServer(), { responseMode: 'json' });

function send(res: any, response: Response) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  if (!response.body) { res.end(); return; }
  const reader = response.body.getReader();
  const pump = async () => {
    const { done, value } = await reader.read();
    if (done) { res.end(); return; }
    res.write(Buffer.from(value));
    await pump();
  };
  void pump().catch(() => res.end());
}

createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.has(origin)) { res.writeHead(403); res.end('Forbidden origin'); return; }
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  else res.setHeader('Access-Control-Allow-Origin', DEFAULT_WEB_ORIGINS[0]);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, accept');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  if (url.pathname === '/healthz') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, service: 'englishai-mcp-gateway', version: '1.2.0', capabilities: Object.keys(capabilityConfig), tutor: true }));
    return;
  }
  if (url.pathname !== '/mcp') { res.writeHead(404); res.end('Not found'); return; }

  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const body = Buffer.concat(chunks);
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined) headers[key] = Array.isArray(value) ? value.join(', ') : value;
  }
  const request = new Request(`https://${req.headers.host ?? 'localhost'}${url.pathname}${url.search}`, {
    method: req.method,
    headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body
  });
  const response = await handler.fetch(request);
  send(res, response);
}).listen(PORT, '0.0.0.0', () => {
  console.log(`EnglishAI MCP gateway listening on ${PORT}; allowed origins=${[...ALLOWED_ORIGINS].join(',')}`);
});

process.on('SIGTERM', async () => {
  await handler.close();
  for (const { client } of clients.values()) await client.close();
  process.exit(0);
});

export { handler, capabilityConfig, callCapability, randomUUID };
