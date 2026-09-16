(function(){'use strict';
const LOGO='<img src="assets/logo.svg" alt="EnglishAI" width="42" height="42">';
function init(){document.querySelectorAll('[data-eai-brand]').forEach(el=>{if(!el.innerHTML.trim())el.innerHTML='<span class="eai-logo">'+LOGO+'</span><span class="eai-wordmark">EnglishAI<small>Adaptive English Teacher</small></span>';});
 document.querySelectorAll('[data-eai-year]').forEach(el=>el.textContent=new Date().getFullYear());
 const path=location.pathname.split('/').pop()||'index.html';document.querySelectorAll('a[data-page]').forEach(a=>{if(a.getAttribute('href')===path)a.setAttribute('aria-current','page');});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();window.EnglishAIBrand={init};})();
