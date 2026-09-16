const AUTH_API = 'https://englishai-auth-api.onrender.com';
const MCP_API = 'https://englishai-mcp-gateway.onrender.com/mcp';

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

async function getSession() {
  try {
    const response = await fetch(`${AUTH_API}/api/me`, { credentials: 'include' });
    if (!response.ok) throw new Error('auth request failed');
    return await response.json();
  } catch {
    return { authenticated: false, unavailable: true };
  }
}

async function mcpRequest(method, params = {}) {
  const response = await fetch(MCP_API, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'accept': 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: crypto.randomUUID(), method, params })
  });
  if (!response.ok) throw new Error(`MCP request failed: ${response.status}`);
  const text = await response.text();
  const eventData = text.match(/data:\s*(\{.*\})/s)?.[1];
  const payload = JSON.parse(eventData || text);
  if (payload.error) throw new Error(payload.error.message || 'MCP error');
  return payload.result;
}

async function mcpCall(capability, tool, args = {}) {
  await mcpRequest('initialize', {
    protocolVersion: '2025-11-25',
    capabilities: {},
    clientInfo: { name: 'modern-english-web', version: '1.0.0' }
  });
  return mcpRequest('tools/call', {
    name: 'call_capability',
    arguments: { capability, tool, arguments: args }
  });
}

async function mcpCapabilities() {
  await mcpRequest('initialize', {
    protocolVersion: '2025-11-25',
    capabilities: {},
    clientInfo: { name: 'modern-english-web', version: '1.0.0' }
  });
  return mcpRequest('tools/call', { name: 'list_capabilities', arguments: {} });
}

function standardizeNavigation(session) {
  const header = document.querySelector('.nav');
  if (!header) return;
  const nav = header.querySelector('.desktop-nav');
  if (!nav) return;
  const links = [
    ['Home','./index.html'], ['Platform','./platform.html'], ['Tutor','./learner.html'],
    ['Capabilities','./capabilities.html'], ['Architecture','./architecture.html'],
    ['Research','./research.html'], ['Docs','./docs.html'], ['Community','./join.html']
  ];
  const current = location.pathname.split('/').pop() || 'index.html';
  nav.innerHTML = links.map(([label, href]) => `<a${href.endsWith(current) ? ' class="active"' : ''} href="${href}">${label}</a>`).join('');
  let actions = header.querySelector('.nav-actions');
  if (!actions) { actions = document.createElement('div'); actions.className = 'nav-actions'; header.appendChild(actions); }
  if (session.authenticated) {
    const name = session.user?.name || session.user?.login || 'Account';
    actions.innerHTML = `<span class="nav-user">${escapeHtml(name)}</span><a class="nav-cta" href="./learner.html">My tutor →</a><button class="nav-logout" type="button" id="logout">Log out</button>`;
    document.getElementById('logout')?.addEventListener('click', async () => { await fetch(`${AUTH_API}/api/logout`, { credentials: 'include' }); window.location.href = './index.html'; });
  } else actions.innerHTML = `<a class="nav-cta" href="./signup.html">Sign up / Log in →</a>`;
}

function injectAuthStyles() {
  if (document.getElementById('modern-english-auth-styles')) return;
  const style = document.createElement('style'); style.id = 'modern-english-auth-styles';
  style.textContent = `.nav-user{max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;font-weight:800;color:#555}.nav-logout{height:40px;padding:0 11px;border:1px solid #dedee2;border-radius:11px;background:#fff;color:#555;font:700 11px inherit;cursor:pointer}.nav-logout:hover{border-color:#e10600;color:#e10600}.auth-gate{padding:28px;border:1px solid #e8e8ec;border-radius:18px;background:#fff;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.06)}.auth-gate h2{font-size:32px}.auth-gate p{color:#666}.auth-gate .actions{justify-content:center}`;
  document.head.appendChild(style);
}

window.ModernEnglishAuth = { AUTH_API, MCP_API, getSession, mcpRequest, mcpCall, mcpCapabilities };

document.addEventListener('DOMContentLoaded', async () => {
  injectAuthStyles();
  const session = await getSession();
  standardizeNavigation(session);
  document.querySelectorAll('[data-auth-name]').forEach(el => { el.textContent = session.authenticated ? (session.user?.name || session.user?.login || 'Learner') : 'Guest'; });
});
