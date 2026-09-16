document.addEventListener('DOMContentLoaded',async()=>{
 const form=document.getElementById('loginForm'); if(!form)return;
 const notice=document.getElementById('notice');
 const session=await window.ModernEnglishAuth.getSession();
 if(session.authenticated){location.href='./dashboard.html';return;}
 form.addEventListener('submit',async e=>{
  e.preventDefault();
  notice.style.display='block';
  notice.textContent='Password sign-in is not enabled by the current frontend auth contract. Use the configured GitHub sign-in, or connect a backend /api/login endpoint before enabling this form.';
 });
 const p=new URLSearchParams(location.search);
 const messages={'not-configured':'GitHub sign-in is not configured yet.','invalid-state':'The sign-in request expired or was invalid.','failed':'Sign-in could not be completed. Please try again.'};
 if(messages[p.get('auth')]){notice.textContent=messages[p.get('auth')];notice.style.display='block';}
});
