import {Z_SAFE_RADIUS} from './phase1-brand.js';
import {PHASE1,Phase1Clock,phase1State,mix,ramp,clamp} from './phase1-timeline.js';
import {orbitPoint,ellipseCurve,curvePath,systemCurve,arcTable,pointAtFraction,documentPose,wipeScale} from './phase1-geometry.js';

import {observatoryDecoration} from './phase1-artwork.js';

const attr=(el,name,value)=>{const s=String(value);if(el.getAttribute(name)!==s)el.setAttribute(name,s);};
const opacity=(el,value)=>{attr(el,'opacity',value.toFixed(4));attr(el,'visibility',value>.0001?'visible':'hidden');};
const matrix=(x,y,s)=>`translate(${x.toFixed(3)} ${y.toFixed(3)}) scale(${s.toFixed(6)}) translate(-60 -60)`;

/** Only this class writes the first five scenes. All motion mathematics is DOM-free. */
export class Phase1Visuals {
  constructor(stage,{reduced=false}={}) {
    this.stage=stage;this.reduced=reduced;
    this.root=stage.querySelector('[data-phase1]');
    if(!this.root)throw new Error('Missing generated responsive vector stage');
    this.svg=this.root.querySelector('svg');this.staticSvg=this.svg.cloneNode(true);
    this.clock=new Phase1Clock();this.lastP=-1;this.lastTime=-1;this.lastOrder='';this.dirty=true;this.failed=false;
    const q=s=>this.root.querySelector(s),qa=s=>[...this.root.querySelectorAll(s)];
    this.goldField=stage.querySelector('.field--yellow');
    this.directStart=Number(new URLSearchParams(location.search).get('p'))>PHASE1.ambientEnd;
    this.space=q('[data-p1-space]');this.depth=q('[data-p1-depth]');
    this.docs=qa('[data-p1-doc]').sort((a,b)=>+a.dataset.p1Doc-+b.dataset.p1Doc);
    this.core=q('[data-p1-z-core]');this.takeover=q('[data-p1-z-takeover]');
    this.zPath=q('#p1-z-master');this.principle=q('[data-p1-principle]');
    this.orbits=qa('[data-p1-orbit]');this.aperture=q('.p1-aperture');
    this.observatory=q('[data-p1-observatory]');this.module=q('[data-p1-module]');this.moduleSignal=q('[data-p1-module-signal]');
    this.dockEdges=qa('.p1-doc-docking-edge');this.wipeMaterial=q('[data-p1-wipe-material]');this.coreHalo=q('[data-p1-z-core] [data-material-halo]');
    this.marks=qa('[data-p1-capture-mark]');this.hole=q('[data-p1-mask-hole]');this.maskBg=q('[data-p1-mask-bg]');this.mask=q('#p1-aperture-mask');
    this.tracks=qa('[data-p1-system-track]').map(el=>({el,master:el.querySelector('.p1-track-master')}));
    this.materialSegments=qa('[data-p1-material-segment]').map(el=>{
      const [track,index]=el.dataset.p1MaterialSegment.split('-').map(Number);
      return {el,track,index,paths:[...el.querySelectorAll('path')],body:el.querySelector('.p1-rail-body'),occlusion:el.querySelector('.p1-rail-occlusion')};
    });
    this.systemDepth=q('[data-p1-system-depth]');this.systemCalibration=q('[data-p1-system-calibration]');
    this.systemFramework=q('[data-p1-atom-framework]');this.registration=q('[data-p1-registration]');
    this.terminals=qa('[data-p1-terminal]');this.terminalGroup=q('[data-p1-rail-terminals]');
    this.beads=qa('[data-p1-bead]').sort((a,b)=>+a.dataset.p1Bead-+b.dataset.p1Bead).map(el=>({el,node:el.querySelector('[data-p1-node]'),
      halo:el.querySelector('[data-p1-bead-halo]'),shadow:el.querySelector('[data-p1-bead-shadow]'),highlight:el.querySelector('[data-p1-bead-highlight]')}));
    this.nodes=qa('[data-p1-node]');this.atomCore=q('.p1-atom-core');
    this.ui=[...document.querySelectorAll('.brand,.topbar__center,.topbar__right,.progress,.view-switch')];
    this.stats={updates:0,skipped:0,maxMs:0,samples:[],mode:'svg-r4-responsive-ribbon'};
    this.measure();this.render(0,0,{initial:true});this.root.classList.add('is-ready');
    window.__ZAHLFIX_PHASE1__={snapshot:()=>this.snapshot()};
    this.fontListener=()=>this.measure();
    document.fonts?.ready.then(()=>{if(!this.failed)this.measure();});
  }

  /** Measure glyph bounds with animation transforms temporarily neutralised (no paint between).
   * A shared hero panel covers all three opening states: resizing cannot move the wipe separately.
   */
  measure() {
    if(this.failed)return;
    const w=this.stage.clientWidth,h=this.stage.clientHeight,mobile=window.__ZAHLFIX_LAYOUT__?.stacked ?? (w<=800 && !(w>=600 && h<=550 && w/h>1.4));
    const stageRect=this.stage.getBoundingClientRect();
    const rects=[1,2,3,4,5].map(n=>{
      const el=this.stage.querySelector(`.story-beat--0${n}`),old=el.style.transform;
      el.style.transform='none';
      const boxes=[];
      for(const content of el.querySelectorAll('h1,h2,strong,small')){
        if(getComputedStyle(content).display==='none')continue;
        const walker=document.createTreeWalker(content,NodeFilter.SHOW_TEXT);let node;
        while((node=walker.nextNode()))if(node.textContent.trim()){
          const range=document.createRange();range.selectNodeContents(node);
          for(const r of range.getClientRects())if(r.width&&r.height)boxes.push(r);
        }
      }
      el.style.transform=old;
      if(!boxes.length)boxes.push(el.getBoundingClientRect());
      return {left:Math.min(...boxes.map(b=>b.left))-stageRect.left,right:Math.max(...boxes.map(b=>b.right))-stageRect.left,
        top:Math.min(...boxes.map(b=>b.top))-stageRect.top,bottom:Math.max(...boxes.map(b=>b.bottom))-stageRect.top};
    });
    const header=document.querySelector('.topbar').getBoundingClientRect();
    const cue=this.stage.querySelector('#continueCue');
    // Measure a stable bottom safe area even when the button is hidden in scene 20.
    const safe=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom'))||0;
    const bottom=h-(mobile?82:(h<550?76:82))-safe;
    const panel=(items)=>{
      if(mobile){const top=Math.max(header.height+24,...items.map(b=>b.bottom))+(h<=650?12:20);
        return {x:20,y:top,width:w-40,height:Math.max(130,bottom-top)};}
      const x=Math.max(w*.54,...items.map(b=>b.right))+28;
      const top=header.height+(h<550?44:66);
      return {x,y:top,width:Math.max(120,w-52-x),height:Math.max(150,bottom-top)};
    };
    const hero=panel(rects.slice(0,3)),system=panel(rects.slice(3));
    const qMobile=clamp(hero.height/hero.width,.70,.86);
    const nominal=mobile?{w:440,h:404*qMobile+40,r:[82,142,202],q:qMobile,doc:Math.min(30,34*qMobile),z:88}:(h<=550?{w:360,h:340,r:[68,127,186],q:.80,doc:24,z:64}:{w:720,h:520,r:[115,207,300],q:.72,doc:36,z:104});
    const scale=Math.min(hero.width/nominal.w,hero.height/nominal.h,1.38);
    const cx=hero.x+hero.width/2,cy=hero.y+hero.height/2;
    const docWidth=Math.max(17,nominal.doc*scale),docHeight=docWidth*88/64;
    const sink=mobile?{x:cx,y:Math.max(rects[1].bottom,rects[2].bottom)+Math.max(24,docHeight*.95)}:
      {x:Math.min(hero.x-22,rects[1].right+34),y:clamp(rects[1].top+(rects[1].bottom-rects[1].top)*.70,hero.y+30,bottom-45)};
    this.layout={w,h,mobile,hero,system,cx,cy,radii:nominal.r.map(r=>r*scale),projection:nominal.q,rotation:-Math.PI/30,
      docWidth,docHeight,zSize:mobile?Math.max(48,nominal.z*scale):nominal.z*scale,sink,grid:{x:hero.x+hero.width*.20,y:cy,gapX:docWidth*1.32,gapY:docHeight*1.18,scale:1},textBounds:rects,
      systemX:system.x+system.width/2,systemY:system.y+system.height/2,
      systemScale:Math.min((system.width-(mobile?14:0))/700,system.height/520,1.5)};
    attr(this.svg,'viewBox',`0 0 ${w} ${h}`);
    for(const el of [this.mask,this.maskBg]){attr(el,'width',w);attr(el,'height',h);}
    attr(this.hole,'cx',sink.x);attr(this.hole,'cy',sink.y);
    const apertureSize=Math.max(54,docHeight*1.8);
    attr(this.hole,'rx',14*apertureSize/120);attr(this.hole,'ry',32*apertureSize/120);
    // Tracks and material details share local scene units. Their world transform is the
    // same scalar/anchor used by the pure document orbit calculation (no independent breathing).
    const artScale=this.layout.radii[2]/300;
    const artTransform=`translate(${cx} ${cy}) scale(${artScale})`;
    this.observatory.innerHTML=observatoryDecoration({projection:nominal.q,rotation:this.layout.rotation});
    attr(this.observatory,'transform',artTransform);
    this.orbits.forEach((g,i)=>{
      const r=this.layout.radii[i]/artScale,c=ellipseCurve(r,r*nominal.q,this.layout.rotation);
      attr(g,'transform',artTransform);
      attr(g.querySelector('.p1-orbit-bed'),'d',curvePath(c));
      attr(g.querySelector('.p1-orbit-far'),'d',curvePath(c.slice(16)));
      attr(g.querySelector('.p1-orbit-near'),'d',curvePath(c.slice(0,16)));
      attr(g.querySelector('.p1-orbit-glint'),'d',curvePath(c.slice(2,6)));
    });
    this.measureModule();
    attr(this.aperture,'transform',`translate(${sink.x} ${sink.y})`);
    attr(this.aperture.querySelector('.p1-aperture-art'),'transform',`scale(${apertureSize/120}) translate(-60 -60)`);
    attr(this.core,'transform',matrix(cx,cy,this.layout.zSize/120));
    // Core and wipe are in the SAME SVG viewport. Measuring its matrix also records the screen anchor.
    const ctm=this.svg.getScreenCTM();
    this.screenAnchor=ctm?new DOMPoint(cx,cy).matrixTransform(ctm):{x:cx,y:cy};
    this.uiPoints=this.ui.map(el=>{const b=el.getBoundingClientRect();return {el,x:(b.left+b.right)/2-stageRect.left,y:(b.top+b.bottom)/2-stageRect.top};});
    this.dirty=true;
  }

  /** Assembly furniture is decorative and measured around the unchanged docking positions. */
  measureModule() {
    const L=this.layout,g=L.grid,w=L.docWidth,h=L.docHeight;
    const x=g.x-g.gapX-w*.65,y=g.y-g.gapY-h*.62,r=g.x+g.gapX+w*.65,b=g.y+g.gapY+h*.65,c=5;
    const q=sel=>this.module.querySelector(sel);
    attr(q('[data-p1-module-case]'),'d',`M${x+c} ${y}H${r-c}L${r} ${y+c}V${b-c}L${r-c} ${b}H${x+c}L${x} ${b-c}V${y+c}Z`);
    attr(q('[data-p1-module-brackets]'),'d',`M${x} ${y+13}V${y}H${x+13}M${r-13} ${y}H${r}V${y+13}M${r} ${b-13}V${b}H${r-13}M${x+13} ${b}H${x}V${b-13}`);
    let circuits='';
    for(let row=0;row<3;row++)for(let col=0;col<3;col++){
      const px=g.x+(col-1)*g.gapX,py=g.y+(row-1)*g.gapY;
      circuits+=`M${px-w*.20} ${py+h*.57}h${w*.40}`;
      if(col<2)circuits+=`M${px+w*.53} ${py}H${px+g.gapX-w*.53}`;
    }
    attr(q('[data-p1-module-circuit]'),'d',circuits);
    this.linkStart={x:r+5,y:L.cy};this.linkEnd={x:L.cx-L.zSize*.54,y:L.cy};
    const d=`M${this.linkStart.x} ${L.cy}H${Math.max(this.linkStart.x,this.linkEnd.x)}`;
    attr(q('[data-p1-module-link]'),'d',d);attr(q('[data-p1-module-link-glint]'),'d',d);
    attr(q('[data-p1-module-link-glint]'),'stroke-dasharray','2 4');
  }

  render(dt,p,{initial=false}={}) {
    if(this.failed)return;
    const active=p<PHASE1.end;
    if(!active && this.lastP>=PHASE1.end && !this.dirty){this.stats.skipped++;return;}
    const time=this.clock.tick(initial||this.directStart?0:dt,p);
    if(p>PHASE1.ambientEnd)this.directStart=false;
    if(!this.dirty && Math.abs(p-this.lastP)<1e-8 && Math.abs(time-this.lastTime)<1e-8){this.stats.skipped++;return;}
    const start=performance.now(),state=phase1State(p);
    // Atomic handoff with the wipe; do not depend on the DOM renderer's delta threshold.
    const fieldAlpha=state.gold?'1':'0';
    if(active && this.goldField.style.opacity!==fieldAlpha)this.goldField.style.opacity=fieldAlpha;
    if(p<PHASE1.wipeEnd)this.renderHero(p,time,state);
    else opacity(this.space,0);
    this.renderWipe(p,state);
    if(state.system>0)this.renderSystem(p,state);
    else opacity(this.principle,0);
    this.lastP=p;this.lastTime=time;this.dirty=false;
    const cost=performance.now()-start;this.stats.updates++;this.stats.maxMs=Math.max(this.stats.maxMs,cost);
    this.stats.samples.push(cost);if(this.stats.samples.length>720)this.stats.samples.shift();
  }

  renderHero(p,time,state) {
    const L=this.layout;
    opacity(this.space,state.hero);
    const orbitAlpha=1-ramp(p,.056,.098);
    this.orbits.forEach(g=>opacity(g,orbitAlpha));opacity(this.observatory,orbitAlpha);
    opacity(this.coreHalo,1-ramp(p,.132,PHASE1.wipeStart));
    opacity(this.module,ramp(p,.101,.120));
    const signal=ramp(p,.116,.134);
    opacity(this.moduleSignal,4*signal*(1-signal));
    attr(this.moduleSignal,'cx',mix(this.linkStart.x,this.linkEnd.x,signal).toFixed(3));
    attr(this.moduleSignal,'cy',L.cy.toFixed(3));
    opacity(this.core,p<PHASE1.wipeStart?1:0);
    attr(this.core,'transform',matrix(L.cx,L.cy,L.zSize/120));
    opacity(this.aperture,ramp(p,.053,.058)*(1-ramp(p,.110,.122)));
    const poses=this.docs.map((el,i)=>{
      const pose=documentPose(i,p,time,this.clock.departure,L),s=pose.scale;
      attr(el,'transform',`translate(${pose.x.toFixed(3)} ${pose.y.toFixed(3)}) scale(${(L.docWidth*s/64).toFixed(6)} ${(L.docHeight*s/88).toFixed(6)})`);
      opacity(el,pose.opacity);
      attr(el,'data-state',pose.state);
      // Brief deterministic edge catch while docking; no filter or independent animation loop.
      const docking=(p-(PHASE1.assemblyStart+i*PHASE1.assemblySlot))/PHASE1.assemblyDuration;
      opacity(this.dockEdges[i],pose.state==='assemble'?ramp(docking,.45,.86)*(1-ramp(docking,.90,1))*.9:0);
      // Global mask must be on an untransformed ancestor. See wrappers below.
      const wrapper=el.parentElement;
      if(wrapper.hasAttribute('data-p1-mask-wrapper')){
        if(['capture','assemble'].includes(pose.state))attr(wrapper,'mask','url(#p1-aperture-mask)');
        else wrapper.removeAttribute('mask');
      }
      return pose;
    });
    // Static generation is intentionally wrapper-free; wrap once to keep a viewport-space mask.
    if(!this.maskWrappers){
      this.maskWrappers=this.docs.map(el=>{const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.setAttribute('data-p1-mask-wrapper','');el.before(g);g.append(el);return g;});
      this.docs.forEach((el,i)=>{if(['capture','assemble'].includes(poses[i].state))attr(this.maskWrappers[i],'mask','url(#p1-aperture-mask)');});
    }
    const objects=[...poses.map((pose,i)=>({key:i,depth:pose.depth,el:this.maskWrappers[i]})),{key:'core',depth:0,el:this.core}].sort((a,b)=>a.depth-b.depth);
    const order=objects.map(o=>o.key).join(',');
    if(order!==this.lastOrder){for(const o of objects)this.depth.append(o.el);this.lastOrder=order;}
    this.marks.forEach((el,i)=>opacity(el,poses[i].state==='captured'?1:0));
    this.poses=poses;
  }

  renderWipe(p,state) {
    const L=this.layout;
    const scale=wipeScale(p,L,Z_SAFE_RADIUS);
    opacity(this.takeover,state.wipe?1:0);
    attr(this.takeover,'transform',matrix(L.cx,L.cy,L.zSize/120*scale));
    if(state.wipe){
      // Same material at handover; fine bevels disappear before they can become huge bands.
      opacity(this.wipeMaterial,1-ramp(p,PHASE1.wipeStart+.001,PHASE1.wipeReadable));
    }
    if(state.wipe){
      // Theme each control from the actual Z silhouette beneath its centre, not a global early switch.
      for(const {el,x,y} of this.uiPoints){
        const k=L.zSize/120*scale;
        const inside=this.zPath.isPointInFill(new DOMPoint((x-L.cx)/k+60,(y-L.cy)/k+60));
        el.dataset.p1Surface=inside?'gold':'dark';
      }
    } else for(const el of this.ui)el.removeAttribute('data-p1-surface');
    this.wipeInfo={active:state.wipe,scale,anchor:{x:L.cx,y:L.cy},screenAnchor:{x:this.screenAnchor.x,y:this.screenAnchor.y},
      coveredRadius:L.zSize/120*scale*Z_SAFE_RADIUS};
  }

  renderSystem(p,state) {
    const L=this.layout,atom=state.atom,unroll=state.unroll;
    opacity(this.principle,state.system);
    attr(this.principle,'transform',`translate(${L.systemX} ${L.systemY}) scale(${L.systemScale})`);
    attr(this.principle,'data-form',atom>.9?'atom':unroll>.95?'rails':'rings');
    opacity(this.systemCalibration,Math.max(1-ramp(unroll,.05,.45),ramp(atom,.78,1)*.72));
    opacity(this.systemFramework,ramp(atom,.84,1)*.20);
    opacity(this.registration,(1-ramp(unroll,.05,.6))*.6);
    opacity(this.terminalGroup,ramp(unroll,.8,1)*(1-ramp(atom,0,.18)));
    this.systemPoints=[];
    const curves=this.tracks.map((t,i)=>{
      const c=systemCurve(i,unroll,atom);attr(t.master,'d',curvePath(c));return c;
    });
    const layers=[];
    for(const part of this.materialSegments){
      const d=curvePath(curves[part.track].slice(part.index*4,part.index*4+4));
      part.paths.forEach(el=>attr(el,'d',d));
      // One projected depth model for all planes, beads and nucleus; sorted back to front.
      const z=atom*(-Math.cos((part.index+.5)/8*Math.PI*2));
      attr(part.el,'data-depth',z.toFixed(4));
      attr(part.occlusion,'opacity',ramp(atom,.6,1).toFixed(4));
      attr(part.body,'stroke-opacity',mix(1,mix(.52,1,(z+1)/2),ramp(atom,.5,1)).toFixed(4));
      layers.push({el:part.el,depth:z,key:`${part.track}-${part.index}`});
    }
    this.tracks.forEach((t,i)=>{
      const curve=curves[i],fraction=[.16,.48,.79][i]+.075*ramp(atom,0,1);
      const point=pointAtFraction(curve,fraction,arcTable(curve));
      const z=atom*(-Math.cos(point.u*Math.PI*2)),r=Math.max(7.1,3.5/L.systemScale);
      const bead=this.beads[i];
      for(const el of [bead.node,bead.halo]){attr(el,'cx',point.x.toFixed(3));attr(el,'cy',point.y.toFixed(3));}
      attr(bead.node,'r',r.toFixed(3));attr(bead.halo,'r',(r*2.3).toFixed(3));
      attr(bead.shadow,'cx',(point.x+r*.25).toFixed(3));attr(bead.shadow,'cy',(point.y+r*.5).toFixed(3));
      attr(bead.shadow,'rx',(r*1.05).toFixed(3));attr(bead.shadow,'ry',(r*.86).toFixed(3));
      attr(bead.highlight,'cx',(point.x-r*.29).toFixed(3));attr(bead.highlight,'cy',(point.y-r*.31).toFixed(3));attr(bead.highlight,'r',(r*.22).toFixed(3));
      attr(bead.el,'data-depth',z.toFixed(4));attr(bead.el,'opacity',mix(1,.82,Math.max(0,-z)).toFixed(4));
      layers.push({el:bead.el,depth:z,key:`bead${i}`});
      this.systemPoints.push({x:L.systemX+point.x*L.systemScale,y:L.systemY+point.y*L.systemScale,u:point.u,fraction});
      for(let end=0;end<2;end++){
        const pt=end?curve.at(-1)[3]:curve[0][0];
        attr(this.terminals[i*2+end],'d',`M${(pt.x-2).toFixed(3)} ${(pt.y-3.4).toFixed(3)}h4v6.8h-4Z`);
      }
    });
    opacity(this.atomCore,ramp(atom,.32,.90));layers.push({el:this.atomCore,depth:0,key:'nucleus'});
    layers.sort((a,b)=>a.depth-b.depth);
    const order=layers.map(o=>o.key).join(',');
    if(order!==this.lastSystemOrder){for(const layer of layers)this.systemDepth.append(layer.el);this.lastSystemOrder=order;}
  }

  snapshot() {
    return {p:this.lastP,time:this.lastTime,departure:this.clock.departure,layout:this.layout,poses:this.poses,
      systemPoints:this.systemPoints,wipe:this.wipeInfo,failed:this.failed,stats:{...this.stats,samples:[...this.stats.samples]}};
  }
  fallback(error) {
    if(this.failed)return;this.failed=true;
    this.root.replaceChildren(this.staticSvg);this.root.classList.remove('is-ready');this.root.classList.add('is-fallback');
    for(const el of this.ui)el.removeAttribute('data-p1-surface');
    console.warn('[ZahlFix] R3 animation stopped; static opening and readable content retained.',error);
  }
}
