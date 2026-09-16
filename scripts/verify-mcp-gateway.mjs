import { spawn } from 'node:child_process';

const port = 8799;
const child = spawn(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'mcp-gateway/src/index.ts'], {
  env: { ...process.env, PORT: String(port), WEB_ORIGIN: 'http://localhost:3000' },
  stdio: ['ignore', 'pipe', 'pipe']
});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
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

  const common = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' };
  const initialize = await fetch(`http://127.0.0.1:${port}/mcp`, {
    method: 'POST', headers: common,
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {
      protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'gateway-verifier', version: '1.0.0' }
    } })
  });
  if (!initialize.ok) throw new Error(`initialize failed: ${initialize.status}`);

  const list = await fetch(`http://127.0.0.1:${port}/mcp`, {
    method: 'POST', headers: common,
    body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} })
  });
  if (!list.ok) throw new Error(`tools/list failed: ${list.status}`);
  const text = await list.text();
  if (!text.includes('list_capabilities') || !text.includes('call_capability')) throw new Error('Gateway tool registry is incomplete');

  console.log('MCP gateway verification passed: health, initialize and tools/list.');
} finally {
  child.kill('SIGTERM');
}
