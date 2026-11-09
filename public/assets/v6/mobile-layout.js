import { STORY_SCENES } from './scene-registry.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export function layoutProfile(width, height) {
  const short = height < 600 && width / height > 1.35;
  const compact = width <= 1100 || short;
  const stacked = compact && !short;
  return { compact, stacked, short, name: short ? 'landscape' : width < 375 ? 'small' : width < 600 ? 'phone' : compact ? 'tablet' : 'desktop' };
}
// Narrative progress is unchanged. Only its allocation of physical scroll distance varies.
export function makeScrollMap(height, compact, desktopRange = 1) {
  if (!compact) return [{p:0,y:0},{p:1,y:Math.max(1,desktopRange)}];
  const weights = [1.3,1.3,1.3,1.05,1.35,.9,.85,.9,1.45,1.35,1,1,1.1,1.15,1,1,.85,.9,1.45,1.3];
  let y = 0;
  const entries = STORY_SCENES.map((scene,i) => {
    const entry = { p:scene.enter, y }; y += Math.max(420,height)*weights[i]; return entry;
  });
  entries[0].p=0; entries.push({p:1,y}); return entries;
}
export function mapValue(value, points, from, to) {
  if (value <= points[0][from]) return points[0][to];
  for (let i=1;i<points.length;i++) if(value<=points[i][from]) {
    const a=points[i-1],b=points[i];return a[to]+(b[to]-a[to])*(value-a[from])/(b[from]-a[from]);
  }
  return points.at(-1)[to];
}

/** Single viewport authority. The keyboard never owns the narrative scroll position. */
export class MobileLayout {
  constructor() {
    this.root=document.documentElement;this.stage=document.getElementById('main-stage');
    this.track=document.querySelector('.scroll-track');this.app=document.getElementById('app');
    this.contact=document.querySelector('.scene--contact');this.home=document.createComment('contact home');
    this.contact.before(this.home);
    this.chrome=[this.stage.querySelector('.topbar'),this.stage.querySelector('#menuOverlay')].map(el=>{const home=document.createComment('chrome home');el.before(home);return {el,home};});
    this.width=0;this.height=0;this.map=[{p:0,y:0},{p:1,y:1}];this.lastContactOffset=0;
    this.probe=document.createElement('div');this.probe.className='viewport-probe';this.probe.setAttribute('aria-hidden','true');document.body.append(this.probe);
    this.commit(true);
    this.timer=null;
    addEventListener('resize',()=>{clearTimeout(this.timer);this.timer=setTimeout(()=>this.resize(),120);},{passive:true});
    screen.orientation?.addEventListener('change',()=>{clearTimeout(this.timer);this.timer=setTimeout(()=>this.resize(true),180);});
    window.visualViewport?.addEventListener('resize',()=>this.keyboard(),{passive:true});
    document.addEventListener('focusin',()=>this.keyboard());
    document.addEventListener('focusout',()=>setTimeout(()=>this.keyboard(),100));
    document.fonts?.ready.then(()=>{this.measureContent();dispatchEvent(new Event('zahlfix:layout'));});
  }
  get isCompact(){return this.profile.compact;}
  get stacked(){return this.profile.stacked;}
  get contactStart(){return this.map.at(-1).y;}
  progressAt(y=scrollY){return clamp(mapValue(y,this.map,'y','p'));}
  pixelsAt(p){return mapValue(clamp(p),this.map,'p','y');}
  destination(scene){return this.isCompact&&scene.id==='contact'?this.contactStart:this.pixelsAt(scene.target);}
  commit(initial=false) {
    const width=document.documentElement.clientWidth;
    const smallHeight=this.probe.getBoundingClientRect().height || innerHeight;
    this.width=width;this.height=Math.round(smallHeight);this.profile=layoutProfile(width,this.height);
    this.root.dataset.layout=this.profile.name;this.root.dataset.compact=String(this.isCompact);this.root.dataset.stacked=String(this.stacked);
    this.root.style.setProperty('--stage-h',this.height+'px');
    if(this.isCompact){
      if(this.stage.parentElement!==this.track)this.track.append(this.stage);
      this.chrome.forEach(({el})=>{if(el.parentElement!==this.app)this.app.append(el);});
      if(this.contact.parentElement!==this.app)this.app.append(this.contact);
      this.contact.classList.add('native-contact');
      this.map=makeScrollMap(this.height,true);this.track.style.height=this.contactStart+'px';
    } else {
      if(this.stage.parentElement===this.track)this.track.after(this.stage);
      this.chrome.forEach(({el,home})=>home.after(el));
      if(this.contact.parentElement!==this.stage)this.home.after(this.contact);
      this.contact.classList.remove('native-contact');this.track.style.removeProperty('height');
      this.map=makeScrollMap(this.height,false,document.documentElement.scrollHeight-innerHeight);
    }
    this.measureContent();
  }
  resize(force=false){
    if(this.root.dataset.mode!=='cinema')return;
    if(parseFloat(getComputedStyle(this.root).fontSize)>=22 || innerWidth<300 || innerHeight<320){dispatchEvent(new Event('zahlfix:flow-fallback'));return;}
    const width=document.documentElement.clientWidth;
    const editing=this.contact.contains(document.activeElement)&&document.activeElement.matches('input,textarea');
    // Toolbar-only changes on a touch device do not invalidate the cinematic geometry.
    const touch=matchMedia('(pointer:coarse)').matches;
    const newHeight=this.probe.getBoundingClientRect().height || innerHeight;
    if(editing && Math.abs(width-this.width)<3){this.keyboard();return;}
    if(!force && Math.abs(width-this.width)<3 && (touch || Math.abs(newHeight-this.height)<24)) {this.keyboard();return;}
    const p=this.progressAt(), inContact=this.isCompact&&scrollY>=this.contactStart-1;
    const contactOffset=inContact?Math.max(0,scrollY-this.contactStart):0;
    this.commit();
    scrollTo({top:inContact&&this.isCompact?this.contactStart+contactOffset:this.pixelsAt(p),behavior:'instant'});
    this.keyboard();dispatchEvent(new Event('zahlfix:layout'));
  }
  keyboard(){
    const vv=window.visualViewport;
    const focused=this.contact.contains(document.activeElement)&&document.activeElement.matches('input,textarea');
    const open=!!(focused&&vv&&vv.height<this.height-100&&vv.scale<1.1);
    this.root.classList.toggle('keyboard-open',open);
    if(open){
      // Only scroll the native document, never the scene controller or a custom fixed overlay.
      requestAnimationFrame(()=>{
        const el=document.activeElement,b=el.getBoundingClientRect();const top=vv.offsetTop+74,bottom=vv.offsetTop+vv.height-20;
        if(b.bottom>bottom)scrollBy({top:b.bottom-bottom,behavior:'instant'});
        else if(b.top<top)scrollBy({top:b.top-top,behavior:'instant'});
      });
    }
  }
  measureContent(){
    if(!this.isCompact)return;
    const stageRect=this.stage.getBoundingClientRect();
    const bounds=selector=>{
      const els=[...this.stage.querySelectorAll(selector)];
      return els.map(el=>{const old=el.style.transform;el.style.transform='none';const b=el.getBoundingClientRect();el.style.transform=old;return b.bottom-stageRect.top;});
    };
    // Each later visual gets actual copy clearance, not a separately guessed vh position.
    const nav=78;const bottom=this.height-nav;
    const position=(visual,selectors,minimum=90)=>{
      const el=this.stage.querySelector(visual);if(!el)return;
      if(!this.stacked){el.style.removeProperty('top');el.style.removeProperty('height');return;}
      const top=Math.max(150,...bounds(selectors))+22;
      el.style.top=Math.min(top,bottom-minimum)+'px';el.style.height=Math.max(minimum,bottom-top)+'px';
    };
    position('.implementation-world','.content-beat--technology',100);
    position('.principles-world','.content-beat--16,.content-beat--17,.content-beat--18',100);
    const aboutBottom=Math.max(...bounds('.content-beat--19'));
    this.root.style.setProperty('--about-art-top',(aboutBottom+22)+'px');
    this.root.style.setProperty('--about-art-height',Math.max(0,bottom-aboutBottom-22)+'px');
    this.root.classList.toggle('about-text-priority',this.stacked&&bottom-aboutBottom<155);
    this.root.style.setProperty('--workflow-status-top',(Math.max(...bounds('.workflow-copy'))+20)+'px');
  }
  release(){
    if(this.stage.parentElement===this.track)this.track.after(this.stage);
    this.chrome.forEach(({el,home})=>home.after(el));this.home.after(this.contact);
    this.contact.classList.remove('native-contact');this.track.style.removeProperty('height');
    for(const key of ['compact','stacked','layout'])delete this.root.dataset[key];
  }
  snapshot(){return {profile:this.profile,width:this.width,height:this.height,progress:this.progressAt(),contactStart:this.contactStart,map:this.map};}
}
