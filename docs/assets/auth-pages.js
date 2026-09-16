document.addEventListener('DOMContentLoaded',async()=>{
 const form=document.getElementById('loginForm'); if(!form)return;
 const notice=document.getElementById('notice');
 const nextParam=new URLSearchParams(location.search).get('next');
 const safeNext=['learner.html','profile.html','dashboard.html'].includes(nextParam)?nextParam:'dashboard.html';
 const session=await window.ModernEnglishAuth.getSession();
 if(session.authenticated){location.replace(`./${safeNext}`);return;}
 form.addEventListener('submit',async e=>{
  e.preventDefault();
  notice.style.display='block';
  notice.textContent='Password sign-in is not enabled by the current frontend auth contract. Use the configured GitHub sign-in, or connect a backend /api/login endpoint before enabling this form.';
 });
 const github=document.querySelector('a[href*="/auth/github"]');
 if(github)github.href=`${window.ModernEnglishAuth.AUTH_API}/auth/github?next=${encodeURIComponent(safeNext)}`;
 const p=new URLSearchParams(location.search);
 const messages={'not-configured':'GitHub sign-in is not configured yet.','invalid-state':'The sign-in request expired or was invalid. Please try again.','failed':'Sign-in could not be completed. Please try again.'};
 if(messages[p.get('auth')]){notice.textContent=messages[p.get('auth')];notice.style.display='block';}
});
