const $ = (s) => document.querySelector(s);
const messages = $('#messages');
const input = $('#chatInput');
const toast = $('#toast');

const replies = {
  grammar: 'Let’s work on grammar. Send me a sentence or choose a grammar topic. I will explain the rule in simple English, show examples, and then give you practice.',
  vocabulary: 'Let’s build your vocabulary. Tell me a topic or word. I can explain meaning, pronunciation, collocations, examples, and create recall practice.',
  reading: 'Let’s practise reading. I can give you a level-appropriate passage, explain difficult vocabulary, ask comprehension questions, and discuss the evidence.',
  writing: 'Paste your writing here. I will identify useful corrections, explain why they matter, and help you revise rather than simply replacing your work.',
  assessment: 'Assessment mode is ready. I can create a short diagnostic or formative activity and explain each answer after you respond.',
  mcp: 'The MCP layer connects the tutor to approved English-learning resources and specialist capabilities such as grammar, vocabulary, reading, writing, assessment, and citation services.'
};

function showToast(text){ toast.textContent=text; toast.classList.add('show'); clearTimeout(showToast.t); showToast.t=setTimeout(()=>toast.classList.remove('show'),2200); }
function addMessage(text, role='bot', source=false){
  const wrap=document.createElement('div'); wrap.className=`message ${role}`;
  if(role==='bot') wrap.innerHTML=`<span class="avatar small">E</span><div><p>${escapeHtml(text)}</p>${source?'<div class="source-chip">English Learning Knowledge Base · MCP learning service</div>':''}</div>`;
  else wrap.innerHTML=`<div class="bubble user" style="margin-left:38px">${escapeHtml(text)}</div>`;
  messages.appendChild(wrap); messages.scrollTop=messages.scrollHeight;
}
function escapeHtml(s){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function answer(prompt){
  const p=prompt.toLowerCase();
  if(p.includes('grammar')||p.includes('tense')||p.includes('sentence')) return 'A useful way to learn this is: first identify the meaning, then identify the grammar form, then compare it with an example. Send me the exact sentence and I’ll walk through it step by step.';
  if(p.includes('vocabulary')||p.includes('word')) return 'Great. I can teach the word in context: meaning → pronunciation → common combinations → examples → recall practice. Tell me the word or topic you want to study.';
  if(p.includes('reading')) return 'Here is the learning approach: read for the main idea first, identify key evidence, then work through unfamiliar vocabulary. I can generate a B1 passage and questions when the full reading backend is connected.';
  if(p.includes('correct')) return 'Paste your sentence or paragraph. I will return the original, identify the language issue, explain the reason, and suggest a revision path.';
  if(p.includes('exercise')||p.includes('questions')) return 'Practice mode: I can create a short exercise matched to your selected level. Answer without looking at the explanation first; then I will give feedback and a targeted retry.';
  return 'I can help you understand, practise and improve your English. Ask about grammar, vocabulary, reading, writing, pronunciation or assessment. Your selected learner level is used to shape the response.';
}

$('#chatForm').addEventListener('submit', e=>{e.preventDefault(); const text=input.value.trim(); if(!text)return; addMessage(text,'user'); input.value=''; setTimeout(()=>addMessage(answer(text),'bot',true),350); incrementPractice();});

document.querySelectorAll('[data-prompt]').forEach(b=>b.addEventListener('click',()=>{input.value=b.dataset.prompt; input.focus();}));
document.querySelectorAll('.focus').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.focus').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#focusLabel').textContent=`${b.dataset.focus} practice`; input.focus();}));
$('#level').addEventListener('change',e=>{$('#levelLabel').textContent=e.target.value;showToast(`Learner level set to ${e.target.value}`);});
document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.tool;if(k==='mcp'){document.querySelector('#about').scrollIntoView({behavior:'smooth'});return;} $('#focusLabel').textContent=`${k[0].toUpperCase()+k.slice(1)} practice`; input.value=replies[k]||replies.grammar; input.focus(); document.querySelector('#tutor').scrollIntoView({behavior:'smooth'});showToast(`${k[0].toUpperCase()+k.slice(1)} tool opened`);}));

function incrementPractice(){
  const n=Number(localStorage.getItem('englishai-practice')||34)+1; localStorage.setItem('englishai-practice',n); $('#practice').textContent=n;
  const sessions=Number(localStorage.getItem('englishai-sessions')||7); $('#sessions').textContent=sessions;
}

// A privacy-friendly local page counter. It counts this browser/device, not a global site audience.
const seen=localStorage.getItem('englishai-visitor');
let count=Number(localStorage.getItem('englishai-local-visitors')||0);
if(!seen){count+=1;localStorage.setItem('englishai-local-visitors',count);localStorage.setItem('englishai-visitor','1');}
$('#userCount').textContent=Math.max(count,1); $('#plural').textContent=count===1?'':'s';

$('#themeBtn').addEventListener('click',()=>{document.body.classList.toggle('dark');localStorage.setItem('englishai-theme',document.body.classList.contains('dark')?'dark':'light');});
if(localStorage.getItem('englishai-theme')==='dark')document.body.classList.add('dark');
