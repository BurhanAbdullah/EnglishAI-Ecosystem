const PROFILE_KEY = 'englishai-learner-profile-v1';

const skillToQuestion = {
  Grammar: {
    prompt: 'Choose the correct sentence:',
    options: ['She has worked here since 2022.', 'She work here since 2022.', 'She is work here since 2022.'],
    answer: 0,
    explanation: 'Use present perfect with “since” for an action that started in the past and continues now.'
  },
  Vocabulary: {
    prompt: 'Which word is closest to “substantial”?',
    options: ['minor', 'significant', 'uncertain'],
    answer: 1,
    explanation: '“Substantial” commonly means large, important, or significant.'
  },
  Reading: {
    prompt: 'A text says: “The proposal was rejected because the evidence was insufficient.” Why was it rejected?',
    options: ['The evidence was too weak.', 'The proposal was too long.', 'The evidence was confidential.'],
    answer: 0,
    explanation: '“Insufficient” means not enough for the purpose required.'
  },
  Writing: {
    prompt: 'Which opening is most appropriate for an academic paragraph?',
    options: ['This thing is really cool.', 'The findings indicate a clear relationship between the variables.', 'You know, the results are pretty good.'],
    answer: 1,
    explanation: 'Academic writing benefits from precise, neutral and evidence-oriented language.'
  },
  Speaking: {
    prompt: 'Which phrase is best for politely asking for clarification?',
    options: ['What?', 'Could you clarify what you mean by that?', 'Say it again.'],
    answer: 1,
    explanation: '“Could you clarify…” is a natural, polite request for clarification.'
  },
  Listening: {
    prompt: 'In conversation, “I’ll get back to you” usually means:',
    options: ['I will contact you later.', 'I am leaving permanently.', 'I disagree with you.'],
    answer: 0,
    explanation: 'The phrase normally means the speaker will respond or provide an update later.'
  }
};

function $(id) { return document.getElementById(id); }

function recommendation(profile) {
  const level = profile.level === 'Not sure' ? 'your current level' : profile.level;
  return `For ${level} ${profile.skill.toLowerCase()} practice, the tutor will start with a short diagnostic, then adapt the next activity from your answers. Goal: ${profile.goal}`;
}

function renderProfile(profile) {
  $('profile-card').hidden = false;
  $('profile-name').textContent = profile.name;
  $('profile-meta').textContent = `${profile.level} · ${profile.skill}`;
  $('profile-goal').textContent = profile.goal;
  $('recommendation').textContent = recommendation(profile);
  $('profile-form').hidden = true;
  $('practice-card').hidden = false;
  renderQuestion(profile.skill);
}

function renderQuestion(skill) {
  const q = skillToQuestion[skill] || skillToQuestion.Grammar;
  $('question').textContent = q.prompt;
  $('options').innerHTML = '';
  q.options.forEach((option, index) => {
    const label = document.createElement('label');
    label.className = 'option';
    label.innerHTML = `<input type="radio" name="answer" value="${index}"> <span>${option}</span>`;
    $('options').appendChild(label);
  });
  $('feedback').hidden = true;
}

$('profile-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const profile = {
    name: data.name.trim(),
    level: data.level,
    skill: data.skill,
    goal: data.goal.trim(),
    preferences: data.preferences.trim(),
    createdAt: new Date().toISOString()
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  renderProfile(profile);
});

$('practice-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
  const q = skillToQuestion[profile.skill] || skillToQuestion.Grammar;
  const selected = Number(new FormData(event.currentTarget).get('answer'));
  $('feedback').hidden = false;
  $('feedback').textContent = selected === q.answer
    ? `Correct. ${q.explanation}`
    : `Not quite. ${q.explanation}`;
});

$('reset-profile').addEventListener('click', () => {
  localStorage.removeItem(PROFILE_KEY);
  location.reload();
});

try {
  const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
  if (saved?.name) renderProfile(saved);
} catch (_) {
  localStorage.removeItem(PROFILE_KEY);
}
