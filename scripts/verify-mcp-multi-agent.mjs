import { spawn } from 'node:child_process';

const port = 8800;
const child = spawn(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'mcp-gateway/src/index.ts'], {
  env: { ...process.env, PORT: String(port), WEB_ORIGIN: 'http://localhost:3000' },
  stdio: ['ignore', 'pipe', 'pipe']
});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const common = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' };
const rpc = async (id, method, params = {}) => {
  const response = await fetch(`http://127.0.0.1:${port}/mcp`, { method: 'POST', headers: common, body: JSON.stringify({ jsonrpc: '2.0', id, method, params }) });
  if (!response.ok) throw new Error(`${method} failed: ${response.status}`);
  const text = await response.text();
  const jsonText = text.match(/data:\s*(\{[\s\S]*\})/)?.[1] ?? text;
  return JSON.parse(jsonText);
};
const payload = result => {
  const text = result?.result?.content?.map(item => item.text || '').join('') || '';
  try { return JSON.parse(text); } catch { return null; }
};
const call = async (id, capability, tool, args) => {
  const result = await rpc(id, 'tools/call', { name: 'call_capability', arguments: { capability, tool, arguments: args } });
  if (result?.error) throw new Error(`${capability}.${tool}: ${JSON.stringify(result.error)}`);
  return payload(result);
};

try {
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try { const response = await fetch(`http://127.0.0.1:${port}/healthz`); if (response.ok) { ready = true; break; } } catch {}
    await sleep(250);
  }
  if (!ready) throw new Error('MCP gateway did not become ready');

  const pagesOrigin = 'https://burhanabdullah.github.io';
  const preflight = await fetch(`http://127.0.0.1:${port}/mcp`, {
    method: 'OPTIONS',
    headers: { Origin: pagesOrigin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' }
  });
  if (preflight.status !== 204 || preflight.headers.get('access-control-allow-origin') !== pagesOrigin) {
    throw new Error(`GitHub Pages CORS preflight invalid: ${preflight.status} / ${preflight.headers.get('access-control-allow-origin')}`);
  }

  const readiness = await fetch(`http://127.0.0.1:${port}/readyz`);
  if (!readiness.ok) throw new Error(`MCP specialist readiness failed: ${readiness.status} ${await readiness.text()}`);
  const readinessPayload = await readiness.json();
  if (readinessPayload?.ok !== true || !Array.isArray(readinessPayload?.checks) || readinessPayload.checks.length !== 7) {
    throw new Error('MCP specialist readiness response incomplete');
  }

  await rpc(1, 'initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'multi-agent-verifier', version: '1.0.0' } });
  const registry = payload(await rpc(2, 'tools/call', { name: 'list_capabilities', arguments: {} }));
  for (const capability of ['english-content', 'grammar', 'vocabulary', 'reading', 'writing', 'assessment', 'citation', 'tutor']) {
    if (!registry?.[capability]) throw new Error(`Missing capability in gateway registry: ${capability}`);
  }

  const checks = [];
  checks.push(['english-content.search_content', await call(10, 'english-content', 'search_content', { query: 'present perfect', level: 'B1', skill: 'grammar', limit: 2 })]);
  checks.push(['grammar.analyze_grammar', await call(11, 'grammar', 'analyze_grammar', { text: 'I has worked here since 2022.', level: 'B1' })]);
  checks.push(['vocabulary.analyze_vocabulary', await call(12, 'vocabulary', 'analyze_vocabulary', { text: 'Analyze the evidence carefully.' })]);
  checks.push(['reading.explain_reading', await call(13, 'reading', 'explain_reading', { text: 'Practice with feedback improves learning.', question: 'What is the main idea?', level: 'B1' })]);
  checks.push(['writing.analyze_writing', await call(14, 'writing', 'analyze_writing', { text: 'I has a goal. I want to improve my English.', level: 'B1', taskType: 'tutoring' })]);
  checks.push(['assessment.validate_answer', await call(15, 'assessment', 'validate_answer', { answer: 'have finished', expectedAnswer: 'have finished', explain: true })]);
  checks.push(['citation.validate_citation', await call(16, 'citation', 'validate_citation', { sourceId: 'demo-1', title: 'Demo source', uri: 'https://example.org/source' })]);
  checks.push(['tutor.tutor_turn', await call(17, 'tutor', 'tutor_turn', { learnerId: 'multi-agent-verifier', name: 'Test Learner', proficiency: 'B1', skill: 'grammar', learningGoal: 'write accurate English', message: 'I has worked here since 2022.', attempts: [] })]);

  for (const [name, value] of checks) if (!value || typeof value !== 'object') throw new Error(`${name} returned no structured payload`);
  if (!Array.isArray(checks[0][1]?.results)) throw new Error('english-content response shape invalid');
  if (!Array.isArray(checks[1][1]?.issues)) throw new Error('grammar specialist response shape invalid');
  if (!Array.isArray(checks[2][1]?.unfamiliarWords)) throw new Error('vocabulary specialist response shape invalid');
  if (!Array.isArray(checks[3][1]?.keyIdeas)) throw new Error('reading specialist response shape invalid');
  if (typeof checks[4][1]?.wordCount !== 'number') throw new Error('writing specialist response shape invalid');
  if (checks[5][1]?.correct !== true) throw new Error('assessment specialist failed correct-answer validation');
  if (typeof checks[6][1]?.valid !== 'boolean') throw new Error('citation specialist response shape invalid');
  if (!checks[7][1]?.coachMessage || !checks[7][1]?.lesson) throw new Error('tutor orchestration response incomplete');

  console.log(`Multi-agent MCP verification passed: ${checks.length} specialist/orchestrator routes exercised through the gateway.`);
} finally {
  child.kill('SIGTERM');
}
