const AUTH_API = 'https://englishai-auth-api.onrender.com';

async function getSession() {
  try {
    const response = await fetch(`${AUTH_API}/api/me`, { credentials: 'include' });
    if (!response.ok) throw new Error('auth request failed');
    return await response.json();
  } catch {
    return { authenticated: false, unavailable: true };
  }
}

function authLink(session) {
  const wrapper = document.querySelector('.nav-actions');
  if (!wrapper) return;
  if (session.authenticated) {
    const name = session.user?.name || session.user?.login || 'Account';
    wrapper.innerHTML = `<span class="nav-user">${escapeHtml(name)}</span><a class="nav-cta" href="./learner.html">My tutor →</a><button class="nav-logout" type="button" id="logout">Log out</button>`;
    document.getElementById('logout')?.addEventListener('click', async () => {
      await fetch(`${AUTH_API}/api/logout`, { credentials: 'include' });
      window.location.reload();
    });
  } else {
    wrapper.innerHTML = `<a class="nav-cta" href="./signup.html">Sign up / Log in →</a>`;
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

window.ModernEnglishAuth = { AUTH_API, getSession };

document.addEventListener('DOMContentLoaded', async () => {
  const session = await getSession();
  authLink(session);
  document.querySelectorAll('[data-auth-name]').forEach(el => {
    el.textContent = session.authenticated ? (session.user?.name || session.user?.login || 'Learner') : 'Guest';
  });
});
