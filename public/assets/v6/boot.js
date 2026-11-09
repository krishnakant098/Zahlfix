import { initContactForm } from './contact.js';
import { initLocaleSwitcher } from './locale-ui.js';
const root=document.documentElement;
const params=new URLSearchParams(location.search);
const motion=matchMedia('(prefers-reduced-motion: reduce)');
root.classList.add('has-js');
initLocaleSwitcher();
initContactForm();
// Reduced motion and explicit text view use the same twenty approved narrative beats.
let savedMotion='';try{savedMotion=localStorage.getItem('zahlfix-motion')||'';}catch{}
const fitLimited=innerWidth<300 || innerHeight<320 || parseFloat(getComputedStyle(root).fontSize)>=22;
const useText=params.get('view')==='text' || motion.matches || fitLimited || (params.get('view')!=='cinema'&&savedMotion==='text');
if(params.has('view'))try{localStorage.setItem('zahlfix-motion',params.get('view')==='text'?'text':'cinema');}catch{}
const switcher=document.getElementById('viewSwitch');
function textMode(error) {
  dispatchEvent(new Event('zahlfix:stop-motion'));
  window.__ZAHLFIX_LAYOUT__?.release?.();
  root.classList.remove('is-cinematic','cursor-enabled','menu-open');
  document.body.classList.remove('is-loading');
  root.dataset.mode='text';root.dataset.theme='dark';
  document.querySelectorAll('[data-p1-surface]').forEach(el=>el.removeAttribute('data-p1-surface'));
  document.querySelectorAll('[inert]').forEach(el=>el.inert=false);
  document.querySelector('.scene--contact').removeAttribute('aria-hidden');
  document.querySelectorAll('.scene--contact,.scene--contact [style]').forEach(el=>{for(const prop of ['opacity','visibility','transform','clip-path'])el.style.removeProperty(prop);});
  switcher.textContent=motion.matches?window.__ZAHLFIX_I18N__.t('site.textReduced'):window.__ZAHLFIX_I18N__.t('site.viewAnimation');
  switcher.href='?view=cinema';
  if(error)console.warn('[ZahlFix] Readable fallback active.',error);
}
if(useText)textMode();
else {
  root.classList.add('is-cinematic');root.dataset.mode='cinema';
  try { await import('./main.js'); }
  catch(error){textMode(error);}
}
motion.addEventListener('change',()=>{if(motion.matches)textMode();});
document.addEventListener('zahlfix:locale-change',()=>{
  if(root.dataset.mode==='text') switcher.textContent=motion.matches?window.__ZAHLFIX_I18N__.t('site.textReduced'):window.__ZAHLFIX_I18N__.t('site.viewAnimation');
});
addEventListener('zahlfix:flow-fallback',()=>textMode());
// Keyboard skip goes to the complete, readable text rather than an invisible animation state.
document.querySelector('.skip-link').addEventListener('click',event=>{
  if(!root.classList.contains('is-cinematic'))return;
  event.preventDefault();location.href='?view=text#story-content';
});
