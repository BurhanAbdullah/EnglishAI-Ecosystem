document.addEventListener('DOMContentLoaded',async()=>{
 const form=document.getElementById('adminForm'); if(!form)return;
 const notice=document.getElementById('notice');
 const session=await window.ModernEnglishAuth.getSession();
 if(session.authenticated){const role=String(session.user?.role||'').toUpperCase();if(role==='ADMIN'){location.href='../admin.html';return;}notice.textContent='This account is authenticated, but is not an administrator.';}
 form.addEventListener('submit',e=>{e.preventDefault();notice.textContent='Admin password authentication requires a backend endpoint. No credentials are stored or processed by this static page.';});
});
