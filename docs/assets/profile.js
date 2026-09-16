const PROFILE_KEY='englishai-learner-profile-v2';
const readProfile=()=>{try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||'null')}catch{return null}};
const writeProfile=profile=>localStorage.setItem(PROFILE_KEY,JSON.stringify(profile));
document.addEventListener('DOMContentLoaded',async()=>{
 const form=document.getElementById('profileForm'); if(!form)return;
 const session=await window.ModernEnglishAuth.getSession();
 if(!session.authenticated){location.href='./login.html?next=profile.html';return;}
 const profile=readProfile();
 if(profile){for(const [k,v] of Object.entries(profile)){const el=form.elements.namedItem(k);if(el&&typeof v==='string')el.value=v;}}
 form.addEventListener('submit',e=>{
  e.preventDefault(); const d=Object.fromEntries(new FormData(form));
  const next={...(readProfile()||{}),name:d.name.trim(),language:(d.language||'').trim(),level:d.level,skill:d.skill,goal:d.goal.trim(),updatedAt:new Date().toISOString()};
  writeProfile(next); document.getElementById('status').textContent='Profile saved. Starting your short diagnostic…'; location.href='./learner.html?onboarding=diagnose';
 });
});
