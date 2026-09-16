import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { TutorEngine } from '../../tutor/tutor-engine.js';
import { buildAdaptiveLesson } from '../../tutor/lesson-planner.js';
import type { LearningAttempt } from '../../tutor/types.js';
import * as z from 'zod/v4';

const PORT = Number(process.env.PORT ?? 8787);
const DEFAULT_WEB_ORIGINS = [
  'https://burhanabdullah.github.io',
  'https://englishai-ecosystem-live.onrender.com'
];
const configuredOrigins = (process.env.WEB_ORIGINS ?? process.env.WEB_ORIGIN ?? '')
  .split(',').map(v => v.trim()).filter(Boolean);
const ALLOWED_ORIGINS = new Set([...DEFAULT_WEB_ORIGINS, ...configuredOrigins]);
const SPECIALIST_CONNECT_TIMEOUT_MS = Number(process.env.SPECIALIST_CONNECT_TIMEOUT_MS ?? 10000);

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
  const client = new Client({ name: 'englishai-mcp-gateway', version: '1.4.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['node_modules/tsx/dist/cli.mjs', config.script]
  });
  await Promise.race([
    client.connect(transport),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Timed out connecting to ${capability} specialist`)), SPECIALIST_CONNECT_TIMEOUT_MS))
  ]);
  clients.set(capability, { client, transport });
  return client;
}

async function callCapability(capability: Capability, tool: string, args: Record<string, unknown>) {
  const config = capabilityConfig[capability];
  if (!config.tools.includes(tool as never)) throw new Error(`Tool '${tool}' is not allowed for capability '${capability}'.`);
  return (await getClient(capability)).callTool({ name: tool, arguments: args });
}

const tutorSkill = z.enum(['grammar', 'vocabulary', 'reading', 'writing', 'speaking', 'listening']);
const proficiency = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
const tutorTurnSchema = z.object({
  learnerId: z.string().min(1), name: z.string().min(1).optional(), proficiency: proficiency.optional(),
  firstLanguage: z.string().min(2).optional(), skill: tutorSkill, learningGoal: z.string().min(1),
  message: z.string().max(12000).default(''),
  attempts: z.array(z.object({ correct: z.boolean(), difficulty: z.number().min(0).max(1), confidence: z.number().min(0).max(1).optional(), errorType: z.string().optional(), timestamp: z.string().optional() })).max(50).default([])
});
type TutorTurnInput = z.infer<typeof tutorTurnSchema>;
function learnerFromInput(input: TutorTurnInput) {
  return { learnerId: input.learnerId, ...(input.proficiency ? { proficiency: input.proficiency } : {}), ...(input.firstLanguage ? { firstLanguage: input.firstLanguage } : {}), targetSkill: input.skill, learningGoal: input.learningGoal };
}
function parseSpecialist(result: unknown): Record<string, unknown> | null {
  const data = result && typeof result === 'object' ? result as { content?: Array<{ text?: string }> } : {};
  const raw = data.content?.map(item => item.text ?? '').join(' ').trim() ?? '';
  if (!raw) return null;
  try { return JSON.parse(raw) as Record<string, unknown>; } catch { return null; }
}
function buildTutorMessage(input: TutorTurnInput, action: string, specialist: Record<string, unknown> | null) {
  const prefix = input.name ? `${input.name}, ` : '';
  const lead: Record<string, string> = {
    teach: 'I’m going to slow this down and teach the idea before asking you to practise it.',
    practice: 'Let’s practise this in a focused way and use your next answer to adjust the difficulty.',
    review: 'Let’s consolidate what you already know and check whether it is becoming reliable.',
    'increase-difficulty': 'You are showing strong control, so I’m raising the challenge and testing transfer.',
    assess: 'I’ll use this as a fresh learning signal rather than simply giving you the answer.',
    diagnose: 'I’ll first identify the pattern in your response so we know what to work on next.'
  };
  let detail = '';
  if (specialist?.issues && Array.isArray(specialist.issues) && specialist.issues.length) {
    const issue = specialist.issues[0] as Record<string, unknown>;
    detail = `${String(issue.message ?? 'I found one area to improve.')} Try this: ${String(issue.correction ?? 'rewrite the sentence and explain your choice')}.`;
  } else if (specialist?.unfamiliarWords && Array.isArray(specialist.unfamiliarWords) && specialist.unfamiliarWords.length) {
    detail = `Let’s work on one word at a time. Start with “${String(specialist.unfamiliarWords[0])}” and use it in a new sentence.`;
  } else if (typeof specialist?.answer === 'string') detail = specialist.answer;
  return `${prefix}${lead[action] ?? 'Let’s work on this together.'}${detail ? ` ${detail}` : ''} ${input.message.trim() ? 'Now, tell me what you think the answer should be and why.' : 'Send me a sentence, question, or answer and I’ll guide you step by step.'}`;
}

async function runTutorTurn(input: TutorTurnInput) {
  tutor.registerLearner(learnerFromInput(input));
  for (const attempt of input.attempts) tutor.recordAttempt({ learnerId: input.learnerId, skill: input.skill, ...attempt } as LearningAttempt);
  const decision = tutor.decide({ learnerId: input.learnerId, skill: input.skill, intent: 'learn' });
  let specialistResult: unknown;
  let specialistCapability: Capability | null = null;
  if (input.message.trim()) {
    const level = input.proficiency ?? 'B1';
    if (input.skill === 'grammar') { specialistCapability = 'grammar'; specialistResult = await callCapability('grammar', 'analyze_grammar', { text: input.message, level }); }
    else if (input.skill === 'vocabulary') { specialistCapability = 'vocabulary'; specialistResult = await callCapability('vocabulary', 'analyze_vocabulary', { text: input.message }); }
    else if (input.skill === 'writing') { specialistCapability = 'writing'; specialistResult = await callCapability('writing', 'analyze_writing', { text: input.message, level, taskType: 'tutoring' }); }
    else if (input.skill === 'reading') { specialistCapability = 'reading'; specialistResult = await callCapability('reading', 'explain_reading', { text: input.message, question: 'What is the learner asking about in this passage?', level }); }
  }
  const specialist = parseSpecialist(specialistResult);
  const lesson = buildAdaptiveLesson(input.skill, input.proficiency ?? 'B1', decision.action, decision.recommendedDifficulty, tutor.getLearner(input.learnerId)?.recurringErrors.at(-1));
  return {
    ...decision,
    coachMessage: buildTutorMessage(input, decision.action, specialist),
    lesson,
    learnerState: tutor.getLearner(input.learnerId)?.skills[input.skill] ?? null,
    ...(specialistCapability ? { specialistCapability } : {}),
    ...(specialist ? { specialist } : {})
  };
}

function buildServer() {
  const server = new McpServer({ name: 'englishai-mcp-gateway', version: '1.4.0' }, { instructions: 'Use tutor_turn for one-to-one adaptive tutoring and call_capability for specialist MCP work.' });
  server.registerTool('list_capabilities', { description: 'List approved EnglishAI MCP capability servers plus the tutor orchestrator.' }, async () => ({ content: [{ type: 'text', text: JSON.stringify({ ...capabilityConfig, tutor: { tools: ['tutor_turn'] } }) }] }));
  server.registerTool('tutor_turn', { description: 'Run one adaptive one-to-one tutoring turn, including learner state, specialist analysis and the next lesson.', inputSchema: tutorTurnSchema }, async input => ({ content: [{ type: 'text', text: JSON.stringify(await runTutorTurn(tutorTurnSchema.parse(input))) }] }));
  server.registerTool('call_capability', { description: 'Execute an approved specialist MCP tool or the stateful tutor orchestrator.', inputSchema: z.object({ capability: z.enum(['english-content', 'grammar', 'vocabulary', 'reading', 'writing', 'assessment', 'citation', 'tutor']), tool: z.string().min(1), arguments: z.record(z.string(), z.unknown()).default({}) }) }, async ({ capability, tool, arguments: args }) => {
    if (capability === 'tutor') {
      if (tool !== 'tutor_turn') throw new Error(`Tool '${tool}' is not allowed for capability 'tutor'.`);
      const value = await runTutorTurn(tutorTurnSchema.parse(args));
      return { content: [{ type: 'text', text: JSON.stringify(value) }] };
    }
    const result = await callCapability(capability, tool, args);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  });
  return server;
}

const handler = createMcpHandler(() => buildServer(), { responseMode: 'json' });
function send(res: any, response: Response) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  if (!response.body) { res.end(); return; }
  const reader = response.body.getReader();
  const pump = async () => { const { done, value } = await reader.read(); if (done) { res.end(); return; } res.write(Buffer.from(value)); await pump(); };
  void pump().catch(() => res.end());
}

createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.has(origin)) { res.writeHead(403); res.end('Forbidden origin'); return; }
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin); else res.setHeader('Access-Control-Allow-Origin', DEFAULT_WEB_ORIGINS[0]!);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, accept');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  if (url.pathname === '/healthz') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, service: 'englishai-mcp-gateway', version: '1.4.0', capabilities: Object.keys(capabilityConfig), tutor: true, allowedWebOrigins: [...ALLOWED_ORIGINS] }));
    return;
  }
  if (url.pathname === '/readyz') {
    const checks = await Promise.all(Object.keys(capabilityConfig).map(async capability => {
      try { await getClient(capability as Capability); return { capability, ok: true }; }
      catch (error) { return { capability, ok: false, error: error instanceof Error ? error.message : String(error) }; }
    }));
    const ok = checks.every(item => item.ok);
    res.writeHead(ok ? 200 : 503, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok, service: 'englishai-mcp-gateway', checks }));
    return;
  }
  if (url.pathname !== '/mcp') { res.writeHead(404); res.end('Not found'); return; }
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const body = Buffer.concat(chunks);
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) if (value !== undefined) headers[key] = Array.isArray(value) ? value.join(', ') : value;
  const request = new Request(`https://${req.headers.host ?? 'localhost'}${url.pathname}${url.search}`, { method: req.method, headers, body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body });
  try { const response = await handler.fetch(request); send(res, response); }
  catch (error) { res.writeHead(500, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) })); }
}).listen(PORT, '0.0.0.0', () => console.log(`EnglishAI MCP gateway listening on ${PORT}; allowed origins=${[...ALLOWED_ORIGINS].join(',')}`));

process.on('SIGTERM', async () => { await handler.close(); for (const { client } of clients.values()) await client.close(); process.exit(0); });
export { handler, capabilityConfig, callCapability, randomUUID };
