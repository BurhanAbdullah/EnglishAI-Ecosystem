const PROFILE_KEY='englishai-learner-profile-v2';
const readProfile=()=>{try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||'null')}catch{return null}};
const writeProfile=profile=>localStorage.setItem(PROFILE_KEY,JSON.stringify(profile));
async function sessionWithRetry(){for(let attempt=0;attempt<3;attempt++){const session=await window.ModernEnglishAuth.getSession();if(session.authenticated)return session;if(attempt<2)await new Promise(r=>setTimeout(r,500));}return{authenticated:false}}
document.addEventListener('DOMContentLoaded',async()=>{
 const form=document.getElementById('profileForm'); if(!form)return;
 const status=document.getElementById('status');
 const session=await sessionWithRetry();
 if(!session.authenticated){location.replace('./login.html?next=profile.html');return;}
 const profile=readProfile();
 if(profile){for(const [k,v] of Object.entries(profile)){const el=form.elements.namedItem(k);if(el&&typeof v==='string')el.value=v;}}
 form.addEventListener('submit',e=>{
  e.preventDefault();
  const d=Object.fromEntries(new FormData(form));
  const next={...(readProfile()||{}),name:String(d.name||'').trim(),language:String(d.language||'').trim(),level:d.level,skill:d.skill,goal:String(d.goal||'').trim(),updatedAt:new Date().toISOString()};
  if(!next.name||!next.level||!next.skill||!next.goal){status.textContent='Please complete all required fields.';return;}
  writeProfile(next);
  status.textContent='Profile saved. Opening your adaptive diagnostic…';
  location.assign('./learner.html?onboarding=diagnose');
 });
});
