import { spawn } from 'node:child_process';

const port = 8799;
const child = spawn(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'mcp-gateway/src/index.ts'], {
  env: { ...process.env, PORT: String(port), WEB_ORIGIN: 'http://localhost:3000' },
  stdio: ['ignore', 'pipe', 'pipe']
});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const common = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' };
const rpc = async (id, method, params = {}) => {
  const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
    method: 'POST', headers: common,
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params })
  });
  if (!response.ok) throw new Error(`${method} failed: ${response.status}`);
  const text = await response.text();
  const jsonText = text.match(/data:\s*(\{[\s\S]*\})/)?.[1] ?? text;
  return JSON.parse(jsonText);
};

try {
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      const health = await fetch(`http://127.0.0.1:${port}/healthz`);
      if (health.ok) { ready = true; break; }
    } catch {}
    await sleep(250);
  }
  if (!ready) throw new Error('MCP gateway did not become ready');

  await rpc(1, 'initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'gateway-verifier', version: '1.0.0' } });
  const list = await rpc(2, 'tools/list');
  const toolsText = JSON.stringify(list);
  if (!toolsText.includes('list_capabilities') || !toolsText.includes('call_capability') || !toolsText.includes('tutor_turn')) throw new Error('Gateway tool registry is incomplete');

  const first = await rpc(3, 'tools/call', { name: 'call_capability', arguments: {
    capability: 'tutor', tool: 'tutor_turn', arguments: {
      learnerId: 'verify-learner', name: 'Test Learner', proficiency: 'B1', skill: 'grammar', learningGoal: 'write accurate English',
      message: 'I has worked here since 2022.', attempts: []
    }
  } });
  const firstText = JSON.stringify(first);
  if (!firstText.includes('coachMessage') || !firstText.includes('grammar')) throw new Error('Tutor turn did not return learner-facing guidance');

  const second = await rpc(4, 'tools/call', { name: 'call_capability', arguments: {
    capability: 'tutor', tool: 'tutor_turn', arguments: {
      learnerId: 'verify-learner', name: 'Test Learner', proficiency: 'B1', skill: 'grammar', learningGoal: 'write accurate English',
      message: 'I has worked here since 2022.', attempts: [
        { correct: false, difficulty: 0.3, confidence: 0.2, errorType: 'agreement', timestamp: new Date().toISOString() },
        { correct: false, difficulty: 0.3, confidence: 0.2, errorType: 'agreement', timestamp: new Date(Date.now() + 1).toISOString() }
      ]
    }
  } });
  const secondText = JSON.stringify(second);
  if (!secondText.includes('"action":"teach"')) throw new Error('Tutor did not adapt to repeated errors');

  console.log('MCP gateway verification passed: health, initialize, tools/list, tutor routing and adaptive teaching.');
} finally {
  child.kill('SIGTERM');
}
