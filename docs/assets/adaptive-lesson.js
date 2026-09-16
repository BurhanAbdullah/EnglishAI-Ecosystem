(() => {
  function parse(r) { const t = (r?.content || []).map(x => x.text || '').join(''); try { return JSON.parse(t); } catch { return null; } }
  function profile() { try { return JSON.parse(localStorage.getItem('englishai-learner-profile-v2') || '{}'); } catch { return {}; } }
  function show(data) {
    if (!data?.lesson) return;
    const result = document.getElementById('result'); if (!result) return;
    let panel = document.getElementById('adaptiveLesson');
    if (!panel) { panel = document.createElement('section'); panel.id = 'adaptiveLesson'; panel.className = 'panel'; panel.style.marginTop = '18px'; result.insertAdjacentElement('afterend', panel); }
    const lesson = data.lesson, ex = lesson.exercise || {};
    panel.innerHTML = `<div class="eyebrow">YOUR NEXT LESSON · ${String(lesson.nextAction || 'practice').toUpperCase()}</div><h2>${safe(lesson.objective || 'Your next step')}</h2><p class="muted">${safe(lesson.microLesson || '')}</p><div class="feedback"><strong>${safe(ex.prompt || '')}</strong><div id="adaptiveChoices" class="choices"></div><p id="adaptiveHint" class="muted">Hint: ${safe(ex.hint || '')}</p></div>`;
    const choices = document.getElementById('adaptiveChoices');
    if (Array.isArray(ex.choices)) { choices.innerHTML = ex.choices.map((x, i) => `<label class="choice"><input type="radio" name="adaptive-choice" value="${i}"> ${safe(x)}</label>`).join(''); const b = document.createElement('button'); b.className = 'btn primary'; b.textContent = 'Check answer →'; b.type = 'button'; choices.after(b); b.onclick = () => check(data); }
    else { const ta = document.createElement('textarea'); ta.id = 'adaptiveAnswer'; ta.rows = 4; ta.placeholder = 'Write your answer…'; ta.style.cssText = 'width:100%;margin-top:12px;padding:14px;border:1px solid var(--color-border-strong);border-radius:14px;font:inherit'; choices.replaceWith(ta); const b = document.createElement('button'); b.className = 'btn primary'; b.textContent = 'Check answer →'; b.type = 'button'; ta.after(b); b.onclick = () => check(data); }
  }
  async function check(data) {
    const ex = data.lesson.exercise || {}, picked = Array.isArray(ex.choices) ? document.querySelector('input[name="adaptive-choice"]:checked')?.value : document.getElementById('adaptiveAnswer')?.value;
    if (picked == null || picked === '') return;
    const answer = Array.isArray(ex.choices) ? ex.choices[Number(picked)] : picked, expected = ex.expectedAnswer || answer, out = document.getElementById('adaptiveHint');
    try {
      const r = await window.ModernEnglishAuth.mcpCall('assessment', 'validate_answer', { answer: String(answer), expectedAnswer: String(expected), explain: true });
      const p = parse(r); out.textContent = p?.feedback || 'Response recorded.';
      const learner = profile();
      if (learner.learnerId && learner.skill) {
        const next = await window.ModernEnglishAuth.mcpCall('tutor', 'tutor_turn', { learnerId: learner.learnerId, proficiency: learner.level === 'Not sure' ? 'B1' : learner.level, firstLanguage: learner.language || undefined, skill: String(learner.skill).toLowerCase(), learningGoal: learner.goal || 'Improve English', message: String(answer), attempts: [{ correct: Boolean(p?.correct), difficulty: Number(data.lesson.difficulty || 0.5), confidence: Boolean(p?.correct) ? 0.9 : 0.5, errorType: Boolean(p?.correct) ? undefined : `${String(learner.skill).toLowerCase()}-item-error`, timestamp: new Date().toISOString() }] });
        const nextData = parse(next); if (nextData?.lesson) show(nextData);
      }
    } catch { out.textContent = 'Assessment service is temporarily unavailable.'; }
  }
  function safe(v) { return String(v).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
  function install() { if (!window.ModernEnglishAuth?.mcpCall || window.__adaptiveLessonInstalled) return; const original = window.ModernEnglishAuth.mcpCall.bind(window.ModernEnglishAuth); window.ModernEnglishAuth.mcpCall = async (...args) => { const r = await original(...args); if (args[0] === 'tutor' && args[1] === 'tutor_turn') show(parse(r)); return r; }; window.__adaptiveLessonInstalled = true; }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();
