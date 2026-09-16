const PROFILE_KEY='englishai-learner-profile-v2';
const readProfile=async()=>window.EnglishAISecureStore?.get(PROFILE_KEY)||null;
const writeProfile=profile=>window.EnglishAISecureStore?.set(PROFILE_KEY,profile);
async function sessionWithRetry(){for(let attempt=0;attempt<3;attempt++){const session=await window.ModernEnglishAuth.getSession();if(session.authenticated)return session;if(attempt<2)await new Promise(r=>setTimeout(r,500));}return{authenticated:false}}
document.addEventListener('DOMContentLoaded',async()=>{
 const form=document.getElementById('profileForm'); if(!form)return;
 const status=document.getElementById('status');
 const session=await sessionWithRetry();
 if(!session.authenticated){location.replace('./login.html?next=profile.html');return;}
 const profile=await readProfile();
 if(profile){for(const [k,v] of Object.entries(profile)){const el=form.elements.namedItem(k);if(el&&typeof v==='string')el.value=v;}}
 form.addEventListener('submit',async e=>{
  e.preventDefault();
  const d=Object.fromEntries(new FormData(form));
  const next={...(await readProfile()||{}),name:String(d.name||'').trim(),language:String(d.language||'').trim(),level:d.level,skill:d.skill,goal:String(d.goal||'').trim(),updatedAt:new Date().toISOString()};
  if(!next.name||!next.level||!next.skill||!next.goal){status.textContent='Please complete all required fields.';return;}
  await writeProfile(next);
  status.textContent='Profile saved securely on this device. Opening your adaptive diagnostic…';
  location.assign('./learner.html?onboarding=diagnose');
 });
});
