document.addEventListener('DOMContentLoaded',async()=>{
 const session=await window.ModernEnglishAuth.getSession();
 if(!session.authenticated){location.href='./login.html?next=dashboard.html';return;}
 const profile=(()=>{try{return JSON.parse(localStorage.getItem('englishai-learner-profile-v2')||'null')}catch{return null}})();
 if(!profile){location.href='./profile.html';return;}
 const q=(id)=>document.getElementById(id);
 q('name').textContent=`${profile.name}.`;q('level').textContent=profile.level;q('skill').textContent=profile.skill;q('goal').textContent=profile.goal;q('profileGoal').textContent=profile.goal;q('language').textContent=profile.language||'Not specified';q('pathTitle').textContent=`Focus on ${profile.skill.toLowerCase()}`;
 let pct=0; try{const saved=profile.index!==undefined?profile:null; const score=Number(profile.score||0), count=Math.max(3,Number(profile.index||0)); pct=Math.round(score/count*100)}catch{}
 q('mastery').textContent=pct?`${pct}%`:'Baseline';q('progressFill').style.width=`${Math.max(16,pct||16)}%`;
 try{await window.ModernEnglishAuth.mcpCapabilities();q('mcp').textContent='Connected';q('mcp').classList.add('online')}catch{q('mcp').textContent='Local mode'}
 const next=Number(profile.score||0)>=2?'Increase challenge':'Complete your first diagnostic';q('recommendation').textContent=next;q('recommendationText').textContent=next==='Increase challenge'?'Your recent performance supports moving to more demanding tasks while continuing to monitor errors and feedback.':'Run the diagnostic in the tutor workspace; the result will establish a demonstrated baseline for future adaptation.';
});
